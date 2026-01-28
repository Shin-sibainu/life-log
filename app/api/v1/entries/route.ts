import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

// GET /api/v1/entries - Get entries with pagination
export async function GET(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const conditions = [eq(entries.userId, userId)];

    if (from) {
      conditions.push(gte(entries.date, from));
    }
    if (to) {
      conditions.push(lte(entries.date, to));
    }

    const userEntries = await db.query.entries.findMany({
      where: and(...conditions),
      orderBy: [desc(entries.date)],
      limit,
      offset,
      with: {
        todos: true,
        notes: true,
        links: true,
      },
    });

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(and(...conditions));

    const total = countResult[0]?.count ?? 0;

    const formattedEntries = userEntries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      score: entry.score,
      todoCount: entry.todos.length,
      completedTodoCount: entry.todos.filter((t) => t.isCompleted).length,
      noteCount: entry.notes.length,
      linkCount: entry.links.length,
    }));

    return NextResponse.json({
      entries: formattedEntries,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
