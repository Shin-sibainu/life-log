import { NextRequest, NextResponse } from 'next/server';
import { db, categories } from '@/lib/db';
import { requireAuth } from '@/lib/get-session';
import { categorySchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';

// PATCH /api/categories/:id - Update category
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: parsed.error.issues,
        },
      }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({
        error: { code: 'NOT_FOUND', message: 'カテゴリが見つかりません' },
      }, { status: 404 });
    }

    const { name, color } = parsed.data;

    await db.update(categories)
      .set({
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      })
      .where(eq(categories.id, id));

    const updated = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error updating category:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}

// DELETE /api/categories/:id - Delete category
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    // Verify ownership
    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({
        error: { code: 'NOT_FOUND', message: 'カテゴリが見つかりません' },
      }, { status: 404 });
    }

    // Delete category (notes.category_id will be set to null by ON DELETE SET NULL)
    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
    }
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } }, { status: 500 });
  }
}
