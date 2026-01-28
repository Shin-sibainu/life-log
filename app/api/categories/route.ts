import { NextRequest, NextResponse } from 'next/server';
import { db, categories } from '@/lib/db';
import { requireAuth } from '@/lib/get-session';
import { categorySchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
    });

    return NextResponse.json({ categories: userCategories });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

// POST /api/categories - Create category
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: parsed.error.issues,
        },
      }, { status: 400 });
    }

    const { name, color } = parsed.data;

    // Get max sort order
    const existing = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
    });

    const maxSortOrder = existing.reduce((max, cat) => Math.max(max, cat.sortOrder), -1);

    const newCategory = {
      id: ulid(),
      userId,
      name,
      color: color ?? null,
      sortOrder: maxSortOrder + 1,
      createdAt: new Date(),
    };

    await db.insert(categories).values(newCategory);

    return NextResponse.json({ category: newCategory });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error creating category:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
