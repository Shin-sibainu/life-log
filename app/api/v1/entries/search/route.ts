import { NextRequest, NextResponse } from 'next/server';
import { db, entries, todos, notes, categories } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq, and, gte, lte, like, or } from 'drizzle-orm';

// GET /api/v1/entries/search - Search entries
export async function GET(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  if (!query) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: '検索キーワードが必要です' },
    }, { status: 400 });
  }

  try {
    // Get user's entries
    const entryConditions = [eq(entries.userId, userId)];
    if (from) entryConditions.push(gte(entries.date, from));
    if (to) entryConditions.push(lte(entries.date, to));

    const userEntries = await db.query.entries.findMany({
      where: and(...entryConditions),
      with: {
        todos: true,
        notes: true,
      },
    });

    // Get categories for note category names
    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
    });
    const categoryMap = new Map(userCategories.map((c) => [c.id, c.name]));

    // Search within entries
    const searchTerm = query.toLowerCase();
    const results: {
      date: string;
      matches: { type: 'todo' | 'note'; content: string; category?: string | null; highlight: string }[];
    }[] = [];

    for (const entry of userEntries) {
      const matches: { type: 'todo' | 'note'; content: string; category?: string | null; highlight: string }[] = [];

      // Search in todos
      for (const todo of entry.todos) {
        if (todo.content.toLowerCase().includes(searchTerm)) {
          matches.push({
            type: 'todo',
            content: todo.content,
            highlight: highlightMatch(todo.content, query),
          });
        }
        if (todo.note && todo.note.toLowerCase().includes(searchTerm)) {
          matches.push({
            type: 'todo',
            content: todo.note,
            highlight: highlightMatch(todo.note, query),
          });
        }
      }

      // Search in notes
      for (const note of entry.notes) {
        if (note.content.toLowerCase().includes(searchTerm)) {
          matches.push({
            type: 'note',
            content: note.content,
            category: note.categoryId ? categoryMap.get(note.categoryId) ?? null : null,
            highlight: highlightMatch(note.content, query),
          });
        }
      }

      if (matches.length > 0) {
        results.push({ date: entry.date, matches });
      }
    }

    // Sort by date descending and limit
    results.sort((a, b) => b.date.localeCompare(a.date));
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching entries:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

function highlightMatch(text: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '**$1**');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
