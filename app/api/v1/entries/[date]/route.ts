import { NextRequest, NextResponse } from 'next/server';
import { db, entries, categories } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq, and } from 'drizzle-orm';

// GET /api/v1/entries/:date - Get entry detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;
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

  try {
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
        error: { code: 'NOT_FOUND', message: 'エントリが見つかりません' },
      }, { status: 404 });
    }

    // Get category names for notes
    const categoryIds = entry.notes
      .map((n) => n.categoryId)
      .filter((id): id is string => id !== null);

    const categoryMap = new Map<string, string>();
    if (categoryIds.length > 0) {
      const cats = await db.query.categories.findMany({
        where: eq(categories.userId, userId),
      });
      cats.forEach((cat) => categoryMap.set(cat.id, cat.name));
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        date: entry.date,
        score: entry.score,
        todos: entry.todos.map((t) => ({
          content: t.content,
          isCompleted: t.isCompleted,
          note: t.note,
        })),
        notes: entry.notes.map((n) => ({
          category: n.categoryId ? categoryMap.get(n.categoryId) ?? null : null,
          content: n.content,
        })),
        links: entry.links.map((l) => ({
          url: l.url,
          title: l.title,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
