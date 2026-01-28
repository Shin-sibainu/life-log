import { NextRequest, NextResponse } from 'next/server';
import { db, entries, todos, notes, links, categories } from '@/lib/db';
import { requireAuth } from '@/lib/get-session';
import { migrateSchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';

// POST /api/entries/migrate - Migrate LocalStorage data to DB
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = migrateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: parsed.error.issues,
        },
      }, { status: 400 });
    }

    const { entries: entriesData, categories: categoriesData } = parsed.data;
    const now = new Date();
    let migratedCount = 0;

    // Migrate categories first
    const categoryMap = new Map<string, string>(); // old name -> new id

    for (const cat of categoriesData) {
      // Check if category exists
      const existing = await db.query.categories.findFirst({
        where: and(eq(categories.userId, userId), eq(categories.name, cat.name)),
      });

      if (existing) {
        categoryMap.set(cat.name, existing.id);
      } else {
        const newId = ulid();
        await db.insert(categories).values({
          id: newId,
          userId,
          name: cat.name,
          color: cat.color ?? null,
          sortOrder: categoryMap.size,
          createdAt: now,
        });
        categoryMap.set(cat.name, newId);
      }
    }

    // Migrate entries
    for (const entryData of entriesData) {
      // Check if entry exists for this date
      const existing = await db.query.entries.findFirst({
        where: and(eq(entries.userId, userId), eq(entries.date, entryData.date)),
      });

      if (existing) {
        // Skip if entry already exists
        continue;
      }

      const entryId = ulid();

      // Create entry
      await db.insert(entries).values({
        id: entryId,
        userId,
        date: entryData.date,
        score: entryData.score ?? null,
        createdAt: now,
        updatedAt: now,
      });

      // Create todos
      if (entryData.todos.length > 0) {
        await db.insert(todos).values(
          entryData.todos.map((todo, index) => ({
            id: ulid(),
            entryId,
            content: todo.content,
            isCompleted: todo.isCompleted,
            note: todo.note ?? null,
            sortOrder: todo.sortOrder ?? index,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      // Create notes
      if (entryData.notes.length > 0) {
        await db.insert(notes).values(
          entryData.notes.map((note) => ({
            id: ulid(),
            entryId,
            categoryId: note.categoryId ?? null,
            content: note.content,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      // Create links
      if (entryData.links.length > 0) {
        await db.insert(links).values(
          entryData.links.map((link) => ({
            id: ulid(),
            entryId,
            url: link.url,
            title: link.title ?? null,
            description: link.description ?? null,
            createdAt: now,
          }))
        );
      }

      migratedCount++;
    }

    return NextResponse.json({
      migratedCount,
      message: `${migratedCount}件のエントリを移行しました`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error migrating entries:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
