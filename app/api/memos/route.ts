import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { memos, memoCategories } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  let query = db
    .select({
      id: memos.id,
      title: memos.title,
      content: memos.content,
      date: memos.date,
      categoryId: memos.categoryId,
      createdAt: memos.createdAt,
      updatedAt: memos.updatedAt,
      categoryName: memoCategories.name,
      categoryColor: memoCategories.color,
    })
    .from(memos)
    .leftJoin(memoCategories, eq(memos.categoryId, memoCategories.id))
    .where(eq(memos.userId, session.user.id))
    .orderBy(desc(memos.updatedAt));

  if (categoryId) {
    query = db
      .select({
        id: memos.id,
        title: memos.title,
        content: memos.content,
        date: memos.date,
        categoryId: memos.categoryId,
        createdAt: memos.createdAt,
        updatedAt: memos.updatedAt,
        categoryName: memoCategories.name,
        categoryColor: memoCategories.color,
      })
      .from(memos)
      .leftJoin(memoCategories, eq(memos.categoryId, memoCategories.id))
      .where(and(eq(memos.userId, session.user.id), eq(memos.categoryId, categoryId)))
      .orderBy(desc(memos.updatedAt));
  }

  const result = await query;

  return NextResponse.json({ memos: result });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, categoryId, date } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  const newMemo = {
    id: nanoid(),
    userId: session.user.id,
    title,
    content: content || '',
    categoryId: categoryId || null,
    date: date || today,
  };

  await db.insert(memos).values(newMemo);

  return NextResponse.json({ memo: newMemo }, { status: 201 });
}
