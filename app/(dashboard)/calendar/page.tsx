'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import { getAllLocalEntries } from '@/lib/local-storage';
import { ContributionGraph } from '@/components/dashboard/contribution-graph';
import { CumulativeChart } from '@/components/dashboard/cumulative-chart';

interface EntryPreview {
  date: string;
  score: number | null;
  todoCount: number;
  completedTodoCount: number;
}

export default function ProgressPage() {
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

  // Calculate stats
  const stats = useMemo(() => {
    const entryMap = new Map<string, EntryPreview>();
    entries.forEach((e) => entryMap.set(e.date, e));

    // Current streak
    let currentStreak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entryMap.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1].date);
        const currDate = new Date(sortedDates[i].date);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Total completed todos
    const totalCompleted = entries.reduce((sum, e) => sum + e.completedTodoCount, 0);

    // Total days
    const totalDays = entries.length;

    // Average score
    const scoresWithValue = entries.filter((e) => e.score !== null);
    const avgScore = scoresWithValue.length > 0
      ? scoresWithValue.reduce((sum, e) => sum + (e.score || 0), 0) / scoresWithValue.length
      : null;

    return {
      currentStreak,
      longestStreak,
      totalCompleted,
      totalDays,
      avgScore,
    };
  }, [entries]);

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
          Your Progress
        </p>
        <h1 className="text-2xl font-light text-slate-800">積み重ね</h1>
      </header>

      {/* Streak Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full mb-4">
          <span className="material-symbols-outlined text-emerald-600 text-lg">local_fire_department</span>
          <span className="text-sm font-medium text-emerald-700">現在のストリーク</span>
        </div>
        <p className="text-7xl font-light text-slate-900 tabular-nums mb-2">
          {stats.currentStreak}
          <span className="text-2xl text-slate-400 ml-2">日</span>
        </p>
        {stats.longestStreak > stats.currentStreak && (
          <p className="text-sm text-slate-500">
            最長記録: <span className="font-medium text-slate-700">{stats.longestStreak}日</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="border border-slate-200 rounded-lg bg-white p-4 text-center">
          <p className="text-3xl font-light text-slate-900 tabular-nums">{stats.totalDays}</p>
          <p className="text-[10px] text-slate-500 uppercase mt-1">記録日数</p>
        </div>
        <div className="border border-slate-200 rounded-lg bg-white p-4 text-center">
          <p className="text-3xl font-light text-slate-900 tabular-nums">{stats.totalCompleted}</p>
          <p className="text-[10px] text-slate-500 uppercase mt-1">完了Todo</p>
        </div>
        <div className="border border-slate-200 rounded-lg bg-white p-4 text-center">
          <p className="text-3xl font-light text-slate-900 tabular-nums">{stats.longestStreak}</p>
          <p className="text-[10px] text-slate-500 uppercase mt-1">最長連続</p>
        </div>
        <div className="border border-slate-200 rounded-lg bg-white p-4 text-center">
          <p className="text-3xl font-light text-slate-900 tabular-nums">
            {stats.avgScore !== null ? stats.avgScore.toFixed(1) : '-'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase mt-1">平均スコア</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <ContributionGraph entries={entries} />
        <CumulativeChart entries={entries} />
      </div>
    </div>
  );
}
