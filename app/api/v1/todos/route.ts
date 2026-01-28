import { NextRequest, NextResponse } from 'next/server';
import { db, entries, todos } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

const addTodoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().min(1),
  note: z.string().optional(),
});

// POST /api/v1/todos - Add a todo
export async function POST(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const parsed = addTodoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: { code: 'VALIDATION_ERROR', message: '入力値が不正です', details: parsed.error.issues },
      }, { status: 400 });
    }

    const { date, content, note } = parsed.data;
    const now = new Date();

    // Find or create entry for the date
    let entry = await db.query.entries.findFirst({
      where: and(eq(entries.userId, userId), eq(entries.date, date)),
    });

    if (!entry) {
      const entryId = ulid();
      await db.insert(entries).values({
        id: entryId,
        userId,
        date,
        score: null,
        createdAt: now,
        updatedAt: now,
      });
      entry = { id: entryId, userId, date, score: null, scoreReason: null, createdAt: now, updatedAt: now };
    }

    // Get current max sortOrder
    const existingTodos = await db.query.todos.findMany({
      where: eq(todos.entryId, entry.id),
    });
    const maxSortOrder = existingTodos.length > 0
      ? Math.max(...existingTodos.map(t => t.sortOrder))
      : -1;

    // Add new todo
    const todoId = ulid();
    await db.insert(todos).values({
      id: todoId,
      entryId: entry.id,
      content,
      isCompleted: false,
      note: note ?? null,
      sortOrder: maxSortOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      todo: { id: todoId, content, isCompleted: false, note: note ?? null },
      message: 'Todoを追加しました',
    });
  } catch (error) {
    console.error('Error adding todo:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

// GET /api/v1/todos - Get incomplete todos
export async function GET(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    const userEntries = await db.query.entries.findMany({
      where: eq(entries.userId, userId),
      with: {
        todos: true,
      },
      orderBy: (entries, { desc }) => [desc(entries.date)],
    });

    const incompleteTodos = userEntries
      .flatMap(entry =>
        entry.todos
          .filter(t => !t.isCompleted)
          .map(t => ({ ...t, date: entry.date }))
      )
      .slice(0, limit);

    return NextResponse.json({ todos: incompleteTodos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
