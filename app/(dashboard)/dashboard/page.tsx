'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useEntry } from '@/hooks/use-entry';
import { useLocalEntry } from '@/hooks/use-local-entry';
import { useCategories } from '@/hooks/use-categories';
import { EntryEditor } from '@/components/dashboard/entry-editor';
import { getAllLocalEntries } from '@/lib/local-storage';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

interface EntryPreview {
  date: string;
  completedTodoCount: number;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const dateParam = searchParams.get('date');
  const date = dateParam || getTodayDate();
  const isAuthenticated = !!session?.user;
  const [allEntries, setAllEntries] = useState<EntryPreview[]>([]);

  // Use API-backed hook for authenticated users
  const apiEntry = useEntry(date, isAuthenticated);

  // Use localStorage for unauthenticated users
  const localEntry = useLocalEntry(date);

  // Fetch categories from API or use defaults
  const { categories, isLoading: isCategoriesLoading, addCategory } = useCategories(isAuthenticated);

  // Determine which entry/handlers to use
  const entryHook = isAuthenticated ? apiEntry : localEntry;

  // Fetch all entries for streak calculation
  useEffect(() => {
    if (isSessionPending) return;

    const fetchEntries = async () => {
      if (isAuthenticated) {
        try {
          const res = await fetch('/api/entries');
          if (res.ok) {
            const data = await res.json();
            const entries = (data.entries || []).map((e: { date: string; todos?: { isCompleted: boolean }[] }) => ({
              date: e.date,
              completedTodoCount: e.todos?.filter((t) => t.isCompleted).length || 0,
            }));
            setAllEntries(entries);
          }
        } catch (error) {
          console.error('Failed to fetch entries:', error);
        }
      } else {
        const localEntries = getAllLocalEntries();
        setAllEntries(localEntries.map((e) => ({
          date: e.date,
          completedTodoCount: e.todos.filter((t) => t.isCompleted).length,
        })));
      }
    };

    fetchEntries();
  }, [isAuthenticated, isSessionPending]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    const entryDates = new Set(allEntries.map((e) => e.date));
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entryDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [allEntries]);

  // Calculate completed today count
  const completedTodayCount = useMemo(() => {
    return entryHook.entry?.todos.filter((t) => t.isCompleted).length || 0;
  }, [entryHook.entry?.todos]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    router.push(`/dashboard?date=${newDate}`);
  };

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
      isSaving={isAuthenticated ? apiEntry.isSaving : false}
      isDirty={isAuthenticated ? apiEntry.isDirty : false}
      lastSaved={isAuthenticated ? apiEntry.lastSaved : null}
      onAddCategory={addCategory}
      onDateChange={handleDateChange}
      currentStreak={currentStreak}
      completedTodayCount={completedTodayCount}
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
