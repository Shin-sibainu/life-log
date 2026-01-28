import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/get-session';
import { createApiKey, listApiKeys } from '@/lib/api-key';
import { z } from 'zod';

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/settings/api-keys - List API keys
export async function GET() {
  try {
    const session = await requireAuth();
    const keys = await listApiKeys(session.user.id);

    return NextResponse.json({ apiKeys: keys });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error listing API keys:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

// POST /api/settings/api-keys - Create new API key
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: parsed.error.issues,
        },
      }, { status: 400 });
    }

    const { name } = parsed.data;
    const result = await createApiKey(session.user.id, name);

    return NextResponse.json({
      apiKey: result,
      message: 'このキーは一度しか表示されません',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
