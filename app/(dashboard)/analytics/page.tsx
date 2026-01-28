'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import { getAllLocalEntries, LocalEntry } from '@/lib/local-storage';
import { ScoreChart } from '@/components/dashboard/score-chart';
import { StatsCard } from '@/components/dashboard/stats-card';

export default function AnalyticsPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [entries, setEntries] = useState<LocalEntry[]>([]);
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
            const apiEntries: LocalEntry[] = entriesArray.map((e: {
              id: string;
              date: string;
              score: number | null;
              scoreReason: string | null;
              todos: { id: string; content: string; isCompleted: boolean; note: string | null; sortOrder: number }[];
              notes: { id: string; content: string; categoryId: string | null }[];
              links: { id: string; url: string; title: string | null; description: string | null }[];
            }) => ({
              id: e.id,
              date: e.date,
              score: e.score,
              scoreReason: e.scoreReason,
              todos: e.todos || [],
              notes: e.notes || [],
              links: e.links || [],
            }));
            apiEntries.sort((a, b) => a.date.localeCompare(b.date));
            setEntries(apiEntries);
          }
        } catch (error) {
          console.error('Failed to fetch entries:', error);
        }
      } else {
        const localEntries = getAllLocalEntries();
        localEntries.sort((a, b) => a.date.localeCompare(b.date));
        setEntries(localEntries);
      }

      setIsLoading(false);
    };

    fetchEntries();
  }, [isAuthenticated, isSessionPending]);

  const stats = useMemo(() => {
    const scoresWithDates = entries
      .filter((e) => e.score !== null)
      .map((e) => ({ date: e.date, score: e.score! }));

    const scores = scoresWithDates.map((s) => s.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const allTodos = entries.flatMap((e) => e.todos);
    const totalTodos = allTodos.length;
    const completedTodos = allTodos.filter((t) => t.isCompleted).length;
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    const totalNotes = entries.reduce((sum, e) => sum + e.notes.length, 0);
    const totalLinks = entries.reduce((sum, e) => sum + e.links.length, 0);

    const lastWeekEntries = entries.filter((e) => {
      const entryDate = new Date(e.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    const weeklyScores = lastWeekEntries
      .filter((e) => e.score !== null)
      .map((e) => e.score!);

    const weeklyAvg = weeklyScores.length > 0
      ? weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length
      : null;

    return {
      totalEntries: entries.length,
      avgScore,
      weeklyAvg,
      totalTodos,
      completedTodos,
      completionRate,
      totalNotes,
      totalLinks,
      scoreData: scoresWithDates,
    };
  }, [entries]);

  if (isSessionPending || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-12 text-center">
        <p className="text-xs text-slate-500 uppercase mb-1">
          Insights
        </p>
        <h1 className="text-2xl font-light text-slate-800 text-balance">分析レポート</h1>
      </header>

      <div className="space-y-12">
        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-lg divide-x divide-y lg:divide-y-0 divide-slate-200 bg-white">
            <StatsCard
              title="記録日数"
              value={stats.totalEntries}
              description="Total entries"
              icon="calendar_today"
            />
            <StatsCard
              title="平均スコア"
              value={stats.avgScore !== null ? stats.avgScore.toFixed(1) : '-'}
              description="All time"
              icon="favorite"
            />
            <StatsCard
              title="週間平均"
              value={stats.weeklyAvg !== null ? stats.weeklyAvg.toFixed(1) : '-'}
              description="Last 7 days"
              trend={
                stats.weeklyAvg !== null && stats.avgScore !== null
                  ? stats.weeklyAvg > stats.avgScore
                    ? 'up'
                    : stats.weeklyAvg < stats.avgScore
                      ? 'down'
                      : 'neutral'
                  : undefined
              }
              icon="trending_up"
            />
            <StatsCard
              title="完了率"
              value={`${stats.completionRate.toFixed(0)}%`}
              description={`${stats.completedTodos}/${stats.totalTodos} tasks`}
              icon="task_alt"
            />
          </div>
        </section>

        {/* Score Chart */}
        <section>
          <ScoreChart data={stats.scoreData} />
        </section>

        {/* Two Column Stats */}
        <section className="grid lg:grid-cols-2 gap-10">
          {/* Activity Summary */}
          <div>
            <h3 className="text-xs font-medium text-slate-600 uppercase mb-4 flex items-center gap-2">
              <span className="w-3 h-px bg-slate-300" /> 活動サマリー
            </h3>
            <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
              {[
                { label: 'タスク総数', value: stats.totalTodos, icon: 'checklist' },
                { label: '完了タスク', value: stats.completedTodos, icon: 'done_all' },
                { label: 'ノート数', value: stats.totalNotes, icon: 'description' },
                { label: 'リンク数', value: stats.totalLinks, icon: 'link' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg">{icon}</span>
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className="text-lg text-slate-800 tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Distribution */}
          <div>
            <h3 className="text-xs font-medium text-slate-600 uppercase mb-4 flex items-center gap-2">
              <span className="w-3 h-px bg-slate-300" /> スコア分布
            </h3>
            <div className="border border-slate-200 rounded-lg bg-white p-4 space-y-5">
              {[
                { label: 'Good', range: '8-10', min: 8, max: 10, color: 'bg-emerald-500' },
                { label: 'Neutral', range: '5-7', min: 5, max: 7, color: 'bg-amber-500' },
                { label: 'Low', range: '1-4', min: 1, max: 4, color: 'bg-rose-500' },
              ].map(({ label, range, min, max, color }) => {
                const count = stats.scoreData.filter(
                  (d) => d.score >= min && d.score <= max
                ).length;
                const percentage = stats.scoreData.length > 0
                  ? (count / stats.scoreData.length) * 100
                  : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${color}`} />
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className="text-xs text-slate-400">({range})</span>
                      </div>
                      <span className="text-sm text-slate-700 tabular-nums">{count}<span className="text-slate-400 text-xs ml-1">days</span></span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${color} transition-transform origin-left`}
                        style={{ transform: `scaleX(${percentage / 100})` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {stats.scoreData.length === 0 && (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-slate-300 text-3xl mb-2 block">pie_chart</span>
                  <p className="text-sm text-slate-500">データがありません</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
