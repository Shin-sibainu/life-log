import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { requireAuth } from '@/lib/get-session';
import { eq, and } from 'drizzle-orm';

// GET /api/entries/:date - Get entry for specific date
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { date } = await params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '日付はYYYY-MM-DD形式で入力してください',
        },
      }, { status: 400 });
    }

    const entry = await db.query.entries.findFirst({
      where: and(eq(entries.userId, userId), eq(entries.date, date)),
      with: {
        todos: { orderBy: (todos, { asc }) => [asc(todos.sortOrder)] },
        notes: true,
        links: true,
      },
    });

    if (!entry) {
      return NextResponse.json({
        entry: null,
        date,
      });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
