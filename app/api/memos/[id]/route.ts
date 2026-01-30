import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [memo] = await db
    .select()
    .from(memos)
    .where(and(eq(memos.id, id), eq(memos.userId, session.user.id)));

  if (!memo) {
    return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  }

  return NextResponse.json({ memo });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, content, categoryId, date } = body;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(memos)
    .where(and(eq(memos.id, id), eq(memos.userId, session.user.id)));

  if (!existing) {
    return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (categoryId !== undefined) updates.categoryId = categoryId || null;
  if (date !== undefined) updates.date = date;

  await db
    .update(memos)
    .set(updates)
    .where(eq(memos.id, id));

  const [updated] = await db
    .select()
    .from(memos)
    .where(eq(memos.id, id));

  return NextResponse.json({ memo: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const [existing] = await db
    .select()
    .from(memos)
    .where(and(eq(memos.id, id), eq(memos.userId, session.user.id)));

  if (!existing) {
    return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
  }

  await db.delete(memos).where(eq(memos.id, id));

  return NextResponse.json({ success: true });
}
