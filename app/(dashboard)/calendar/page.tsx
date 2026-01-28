'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { getAllLocalEntries } from '@/lib/local-storage';
import { CalendarView } from '@/components/dashboard/calendar-view';
import { ContributionGraph } from '@/components/dashboard/contribution-graph';

interface EntryPreview {
  date: string;
  score: number | null;
  todoCount: number;
  completedTodoCount: number;
}

export default function CalendarPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (isSessionPending) return;

    const fetchEntries = async () => {
      setIsLoading(true);

      if (isAuthenticated) {
        try {
          const res = await fetch('/api/entries');
          if (res.ok) {
            const data = await res.json();
            const entriesArray = data.entries || [];
            const previews: EntryPreview[] = entriesArray.map((e: {
              date: string;
              score: number | null;
              todos: { isCompleted: boolean }[];
            }) => ({
              date: e.date,
              score: e.score,
              todoCount: e.todos?.length || 0,
              completedTodoCount: e.todos?.filter((t: { isCompleted: boolean }) => t.isCompleted).length || 0,
            }));
            setEntries(previews);
          }
        } catch (error) {
          console.error('Failed to fetch entries:', error);
        }
      } else {
        const localEntries = getAllLocalEntries();
        const previews: EntryPreview[] = localEntries.map((entry) => ({
          date: entry.date,
          score: entry.score,
          todoCount: entry.todos.length,
          completedTodoCount: entry.todos.filter((t) => t.isCompleted).length,
        }));
        setEntries(previews);
      }

      setIsLoading(false);
    };

    fetchEntries();
  }, [isAuthenticated, isSessionPending]);

  if (isSessionPending || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400 text-sm font-light">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <header className="mb-12 text-center">
        <p className="text-[10px] text-slate-400 uppercase mb-2">
          Your Journey
        </p>
        <h1 className="text-2xl font-light text-slate-800">カレンダー</h1>
      </header>

      <div className="space-y-12">
        <ContributionGraph entries={entries} />
        <CalendarView entries={entries} />
      </div>
    </div>
  );
}
