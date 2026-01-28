'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useEntry } from '@/hooks/use-entry';
import { useLocalEntry } from '@/hooks/use-local-entry';
import { useCategories } from '@/hooks/use-categories';
import { EntryEditor } from '@/components/dashboard/entry-editor';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();
  const dateParam = searchParams.get('date');
  const date = dateParam || getTodayDate();
  const isAuthenticated = !!session?.user;

  // Use API-backed hook for authenticated users
  const apiEntry = useEntry(date, isAuthenticated);

  // Use localStorage for unauthenticated users
  const localEntry = useLocalEntry(date);

  // Fetch categories from API or use defaults
  const { categories, isLoading: isCategoriesLoading, addCategory } = useCategories(isAuthenticated);

  // Determine which entry/handlers to use
  const entryHook = isAuthenticated ? apiEntry : localEntry;

  if (isSessionPending || entryHook.isLoading || isCategoriesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (!entryHook.entry) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400 text-sm">エントリを読み込めませんでした</div>
      </div>
    );
  }

  return (
    <EntryEditor
      entry={entryHook.entry}
      categories={categories}
      onScoreChange={entryHook.setScore}
      onScoreReasonChange={entryHook.setScoreReason}
      onAddTodo={entryHook.addTodo}
      onUpdateTodo={entryHook.updateTodo}
      onDeleteTodo={entryHook.deleteTodo}
      onAddNote={entryHook.addNote}
      onUpdateNote={entryHook.updateNote}
      onDeleteNote={entryHook.deleteNote}
      onAddLink={entryHook.addLink}
      onUpdateLink={entryHook.updateLink}
      onDeleteLink={entryHook.deleteLink}
      onSave={entryHook.save}
      isSaving={isAuthenticated ? apiEntry.isSaving : false}
      isDirty={isAuthenticated ? apiEntry.isDirty : false}
      lastSaved={isAuthenticated ? apiEntry.lastSaved : null}
      onAddCategory={addCategory}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400 text-sm">読み込み中...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
