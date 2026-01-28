import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/get-session';
import { deleteApiKey } from '@/lib/api-key';

// DELETE /api/settings/api-keys/:id - Delete API key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const deleted = await deleteApiKey(id, session.user.id);

    if (!deleted) {
      return NextResponse.json({
        error: { code: 'NOT_FOUND', message: 'APIキーが見つかりません' },
      }, { status: 404 });
    }

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
