'use client';

import { useMemo } from 'react';
import Link from 'next/link';

interface EntryData {
  date: string;
  score: number | null;
  todoCount: number;
  completedTodoCount: number;
}

interface ContributionGraphProps {
  entries: EntryData[];
}

function getWeeksArray(weeksCount: number = 53) {
  const today = new Date();
  const days: { date: string; dayOfWeek: number }[] = [];

  // Start from (weeksCount * 7) days ago, aligned to Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeksCount * 7) + (7 - today.getDay()));

  for (let i = 0; i < weeksCount * 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    if (date <= today) {
      days.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
      });
    }
  }

  // Group by weeks
  const weeks: { date: string; dayOfWeek: number }[][] = [];
  let currentWeek: { date: string; dayOfWeek: number }[] = [];

  days.forEach((day) => {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getIntensityLevel(entry: EntryData | undefined): number {
  if (!entry) return 0;

  // Calculate activity score based on:
  // 1. Having an entry (base)
  // 2. Score value
  // 3. Completed todos
  let intensity = 1; // Base level for having an entry

  if (entry.score !== null) {
    if (entry.score >= 8) intensity = 4;
    else if (entry.score >= 6) intensity = 3;
    else if (entry.score >= 4) intensity = 2;
  } else if (entry.completedTodoCount > 0) {
    if (entry.completedTodoCount >= 5) intensity = 4;
    else if (entry.completedTodoCount >= 3) intensity = 3;
    else if (entry.completedTodoCount >= 1) intensity = 2;
  }

  return intensity;
}

const intensityColors = [
  'bg-slate-100',      // 0: no activity
  'bg-emerald-200',    // 1: low
  'bg-emerald-400',    // 2: medium
  'bg-emerald-500',    // 3: high
  'bg-emerald-600',    // 4: very high
];

export function ContributionGraph({ entries }: ContributionGraphProps) {
  const entryMap = useMemo(() => {
    const map = new Map<string, EntryData>();
    entries.forEach((entry) => map.set(entry.date, entry));
    return map;
  }, [entries]);

  const weeks = useMemo(() => getWeeksArray(53), []);

  const totalDays = entries.length;
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entryMap.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [entryMap]);

  // Create a map of weekIndex -> month label (only for first week of each month)
  const monthLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const date = new Date(firstDay.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          map.set(weekIndex, date.toLocaleDateString('en-US', { month: 'short' }));
          lastMonth = month;
        }
      }
    });

    return map;
  }, [weeks]);

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium text-slate-600 uppercase flex items-center gap-2">
          <span className="w-3 h-px bg-slate-300" /> 活動履歴
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span><strong className="text-slate-700 tabular-nums">{totalDays}</strong> 日記録</span>
          <span><strong className="text-slate-700 tabular-nums">{currentStreak}</strong> 日連続</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col min-w-fit">
          {/* Month labels row */}
          <div className="flex gap-[3px] mb-1">
            {/* Spacer for day labels column */}
            <div className="w-4 shrink-0" />
            {weeks.map((_, weekIndex) => (
              <div key={weekIndex} className="w-3 shrink-0 text-[10px] text-slate-400">
                {monthLabelMap.get(weekIndex) || ''}
              </div>
            ))}
          </div>

          {/* Graph grid */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] text-[10px] text-slate-400 w-4 shrink-0">
              <div className="h-3" />
              <div className="h-3 flex items-center">M</div>
              <div className="h-3" />
              <div className="h-3 flex items-center">W</div>
              <div className="h-3" />
              <div className="h-3 flex items-center">F</div>
              <div className="h-3" />
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                  const day = week.find((d) => d.dayOfWeek === dayOfWeek);
                  if (!day) {
                    return <div key={dayOfWeek} className="size-3" />;
                  }

                  const entry = entryMap.get(day.date);
                  const level = getIntensityLevel(entry);
                  const dateObj = new Date(day.date);

                  return (
                    <Link
                      key={day.date}
                      href={`/dashboard?date=${day.date}`}
                      className={`size-3 rounded-sm ${intensityColors[level]} hover:ring-1 hover:ring-slate-400 transition-shadow`}
                      title={`${dateObj.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}${entry ? ` - スコア: ${entry.score ?? '-'}` : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-400">
        <span>Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={`size-3 rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
