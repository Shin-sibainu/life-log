import { NextRequest, NextResponse } from 'next/server';
import { db, entries, categories } from '@/lib/db';
import { mcpAuth } from '@/lib/mcp-auth';
import { eq } from 'drizzle-orm';

// GET /api/v1/categories - Get categories with note counts
export async function GET(req: NextRequest) {
  const authResult = await mcpAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
    });

    // Get note counts per category
    const userEntries = await db.query.entries.findMany({
      where: eq(entries.userId, userId),
      with: {
        notes: true,
      },
    });

    const allNotes = userEntries.flatMap((e) => e.notes);

    const result = userCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      noteCount: allNotes.filter((n) => n.categoryId === cat.id).length,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
