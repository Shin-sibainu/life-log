import { NextRequest, NextResponse } from 'next/server';
import { db, entries, todos, notes, links } from '@/lib/db';
import { requireAuth } from '@/lib/get-session';
import { entrySchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/entries - Get all entries for the user
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const allEntries = await db.query.entries.findMany({
      where: eq(entries.userId, userId),
      with: {
        todos: { orderBy: (todos, { asc }) => [asc(todos.sortOrder)] },
        notes: true,
        links: true,
      },
      orderBy: (entries, { desc }) => [desc(entries.date)],
    });

    return NextResponse.json({ entries: allEntries });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

// POST /api/entries - Create or update entry (upsert)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = entrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: parsed.error.issues,
        },
      }, { status: 400 });
    }

    const { date, score, scoreReason, todos: todosData, notes: notesData, links: linksData } = parsed.data;

    // Check if entry exists
    let entry = await db.query.entries.findFirst({
      where: and(eq(entries.userId, userId), eq(entries.date, date)),
    });

    const now = new Date();

    if (entry) {
      // Update existing entry
      await db.update(entries)
        .set({ score, scoreReason: scoreReason ?? null, updatedAt: now })
        .where(eq(entries.id, entry.id));

      // Delete existing todos, notes, links
      await db.delete(todos).where(eq(todos.entryId, entry.id));
      await db.delete(notes).where(eq(notes.entryId, entry.id));
      await db.delete(links).where(eq(links.entryId, entry.id));
    } else {
      // Create new entry
      const entryId = ulid();
      await db.insert(entries).values({
        id: entryId,
        userId,
        date,
        score,
        scoreReason: scoreReason ?? null,
        createdAt: now,
        updatedAt: now,
      });
      entry = { id: entryId, userId, date, score: score ?? null, scoreReason: scoreReason ?? null, createdAt: now, updatedAt: now };
    }

    // Insert todos
    if (todosData.length > 0) {
      await db.insert(todos).values(
        todosData.map((todo, index) => ({
          id: todo.id || ulid(),
          entryId: entry!.id,
          content: todo.content,
          isCompleted: todo.isCompleted,
          note: todo.note ?? null,
          sortOrder: todo.sortOrder ?? index,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    // Insert notes
    if (notesData.length > 0) {
      await db.insert(notes).values(
        notesData.map((note) => ({
          id: note.id || ulid(),
          entryId: entry!.id,
          categoryId: note.categoryId ?? null,
          content: note.content,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    // Insert links
    if (linksData.length > 0) {
      await db.insert(links).values(
        linksData.map((link) => ({
          id: link.id || ulid(),
          entryId: entry!.id,
          url: link.url,
          title: link.title ?? null,
          description: link.description ?? null,
          createdAt: now,
        }))
      );
    }

    // Fetch updated entry
    const updatedEntry = await db.query.entries.findFirst({
      where: eq(entries.id, entry!.id),
      with: {
        todos: { orderBy: (todos, { asc }) => [asc(todos.sortOrder)] },
        notes: true,
        links: true,
      },
    });

    return NextResponse.json({
      entry: updatedEntry,
      message: '保存しました',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error saving entry:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
