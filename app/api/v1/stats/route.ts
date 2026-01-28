import { NextRequest, NextResponse } from 'next/server';
import { db, entries, categories } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

// GET /api/v1/stats - Get statistics
export async function GET(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const conditions = [eq(entries.userId, userId)];
    if (from) conditions.push(gte(entries.date, from));
    if (to) conditions.push(lte(entries.date, to));

    const userEntries = await db.query.entries.findMany({
      where: and(...conditions),
      with: {
        todos: true,
        notes: true,
        links: true,
      },
      orderBy: (entries, { asc }) => [asc(entries.date)],
    });

    // Calculate score statistics
    const scoresWithDates = userEntries
      .filter((e) => e.score !== null)
      .map((e) => ({ date: e.date, score: e.score! }));

    const scores = scoresWithDates.map((s) => s.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const minScore = scores.length > 0 ? Math.min(...scores) : null;
    const maxScore = scores.length > 0 ? Math.max(...scores) : null;

    // Calculate activity statistics
    const totalEntries = userEntries.length;
    const allTodos = userEntries.flatMap((e) => e.todos);
    const totalTodos = allTodos.length;
    const completedTodos = allTodos.filter((t) => t.isCompleted).length;
    const totalNotes = userEntries.reduce((sum, e) => sum + e.notes.length, 0);
    const totalLinks = userEntries.reduce((sum, e) => sum + e.links.length, 0);

    // Get category statistics
    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
    });

    const categoryStats = userCategories.map((cat) => {
      const noteCount = userEntries.reduce(
        (sum, e) => sum + e.notes.filter((n) => n.categoryId === cat.id).length,
        0
      );
      return { name: cat.name, noteCount };
    }).sort((a, b) => b.noteCount - a.noteCount);

    return NextResponse.json({
      stats: {
        period: {
          from: from ?? userEntries[0]?.date ?? null,
          to: to ?? userEntries[userEntries.length - 1]?.date ?? null,
        },
        score: {
          average: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
          min: minScore,
          max: maxScore,
          trend: scoresWithDates,
        },
        activity: {
          totalEntries,
          totalTodos,
          completedTodos,
          completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) / 100 : 0,
          totalNotes,
          totalLinks,
        },
        categories: categoryStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
