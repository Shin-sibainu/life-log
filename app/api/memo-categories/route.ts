import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memoCategories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await db
    .select()
    .from(memoCategories)
    .where(eq(memoCategories.userId, session.user.id))
    .orderBy(memoCategories.sortOrder);

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, color } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Get max sort order
  const existing = await db
    .select()
    .from(memoCategories)
    .where(eq(memoCategories.userId, session.user.id));
  const maxSortOrder = existing.reduce((max, cat) => Math.max(max, cat.sortOrder), -1);

  const newCategory = {
    id: nanoid(),
    userId: session.user.id,
    name,
    color: color || null,
    sortOrder: maxSortOrder + 1,
  };

  await db.insert(memoCategories).values(newCategory);

  return NextResponse.json({ category: newCategory }, { status: 201 });
}
