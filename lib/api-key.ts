import { db, apiKeys } from './db';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

const API_KEY_PREFIX = 'll_';

export function generateApiKey(): string {
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${API_KEY_PREFIX}${randomPart}`;
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyApiKey(key: string): Promise<{ userId: string } | null> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = await hashApiKey(key);

  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });

  if (!apiKey) {
    return null;
  }

  // Update last used time
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return { userId: apiKey.userId };
}

export async function createApiKey(userId: string, name: string): Promise<{ id: string; key: string; name: string }> {
  const key = generateApiKey();
  const keyHash = await hashApiKey(key);
  const id = ulid();

  await db.insert(apiKeys).values({
    id,
    userId,
    keyHash,
    name,
    createdAt: new Date(),
  });

  return { id, key, name };
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  const existing = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, id),
  });

  if (!existing || existing.userId !== userId) {
    return false;
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, id));
  return true;
}

export async function listApiKeys(userId: string) {
  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    columns: {
      id: true,
      name: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return keys;
}
