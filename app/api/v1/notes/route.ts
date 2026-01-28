import { NextRequest, NextResponse } from 'next/server';
import { db, entries, notes, categories } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq, and, gte, lte } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

const addNoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().min(1),
  category: z.string().optional(),
});

// POST /api/v1/notes - Add a note
export async function POST(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: { code: 'VALIDATION_ERROR', message: '入力値が不正です', details: parsed.error.issues },
      }, { status: 400 });
    }

    const { date, content, category } = parsed.data;
    const now = new Date();

    // Find category by name if provided
    let categoryId: string | null = null;
    if (category) {
      const cat = await db.query.categories.findFirst({
        where: and(eq(categories.userId, userId), eq(categories.name, category)),
      });
      if (cat) {
        categoryId = cat.id;
      }
    }

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

    // Add new note
    const noteId = ulid();
    await db.insert(notes).values({
      id: noteId,
      entryId: entry.id,
      categoryId,
      content,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      note: { id: noteId, content, category: category ?? null },
      message: 'ノートを追加しました',
    });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

// GET /api/v1/notes - Get notes by category
export async function GET(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    const conditions = [eq(entries.userId, userId)];
    if (from) conditions.push(gte(entries.date, from));
    if (to) conditions.push(lte(entries.date, to));

    const userEntries = await db.query.entries.findMany({
      where: and(...conditions),
      with: {
        notes: true,
      },
      orderBy: (entries, { desc }) => [desc(entries.date)],
    });

    // Get categories
    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
    });
    const categoryMap = new Map(userCategories.map((c) => [c.id, c.name]));

    // Flatten and filter notes
    let allNotes = userEntries.flatMap((e) =>
      e.notes.map((n) => ({
        date: e.date,
        categoryId: n.categoryId,
        category: n.categoryId ? categoryMap.get(n.categoryId) ?? null : null,
        content: n.content,
      }))
    );

    // Filter by category if specified
    if (categoryId) {
      allNotes = allNotes.filter((n) => n.categoryId === categoryId);
    }

    const limitedNotes = allNotes.slice(0, limit);

    return NextResponse.json({
      notes: limitedNotes.map(({ categoryId, ...rest }) => rest),
      total: allNotes.length,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
