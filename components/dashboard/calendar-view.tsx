'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface EntryPreview {
  date: string;
  score: number | null;
  todoCount: number;
  completedTodoCount: number;
}

interface CalendarViewProps {
  entries: EntryPreview[];
  onDateClick?: (date: string) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarView({ entries, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const entryMap = useMemo(() => {
    const map = new Map<string, EntryPreview>();
    entries.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = useMemo(() => {
    const days: { day: number; dateStr: string; entry: EntryPreview | undefined; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateStr, entry: entryMap.get(dateStr), isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateStr, entry: entryMap.get(dateStr), isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateStr, entry: entryMap.get(dateStr), isCurrentMonth: false });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, entryMap]);

  const todayStr = new Date().toISOString().split('T')[0];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase mb-1 tabular-nums">
            {year}
          </p>
          <h2 className="text-3xl font-light text-slate-800 text-balance">
            {monthNames[month]}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="text-xs text-slate-500 uppercase hover:text-slate-700 transition-colors"
          >
            Today
          </button>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              aria-label="前の月"
              className="size-8 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={nextMonth}
              aria-label="次の月"
              className="size-8 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Week days header */}
        <div className="grid grid-cols-7 mb-3">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium ${
                i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-500' : 'text-slate-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          {calendarDays.map(({ day, dateStr, entry, isCurrentMonth }, index) => {
            const isToday = dateStr === todayStr;
            const hasEntry = !!entry;
            const dayOfWeek = index % 7;

            return (
              <Link
                key={dateStr}
                href={`/dashboard?date=${dateStr}`}
                onClick={() => onDateClick?.(dateStr)}
                className={`
                  group relative aspect-square p-2 sm:p-3 transition-colors
                  ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                  ${hasEntry ? 'hover:bg-amber-50' : 'hover:bg-slate-100'}
                `}
              >
                {/* Day number */}
                <span
                  className={`
                    text-sm tabular-nums
                    ${isToday
                      ? 'flex size-7 items-center justify-center rounded-full bg-slate-800 text-white font-medium'
                      : isCurrentMonth
                        ? dayOfWeek === 0
                          ? 'text-rose-600'
                          : dayOfWeek === 6
                            ? 'text-sky-600'
                            : 'text-slate-700'
                        : 'text-slate-400'
                    }
                  `}
                >
                  {day}
                </span>

                {/* Entry indicator */}
                {hasEntry && (
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`
                          size-1.5 rounded-full
                          ${entry.score && entry.score >= 7
                            ? 'bg-emerald-500'
                            : entry.score && entry.score >= 4
                              ? 'bg-amber-500'
                              : entry.score
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                          }
                        `}
                      />
                      {entry.score && (
                        <span className="text-xs text-slate-500 tabular-nums">
                          {entry.score}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Hover state - preview */}
                {hasEntry && (
                  <div className="absolute inset-0 p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white flex flex-col justify-between">
                    <span className={`text-sm tabular-nums ${isToday ? 'text-slate-800 font-medium' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {entry.score && (
                        <p className="text-xs text-slate-600">
                          満足度: <span className="font-medium text-slate-800 tabular-nums">{entry.score}</span>/10
                        </p>
                      )}
                      {entry.todoCount > 0 && (
                        <p className="text-xs text-slate-500 tabular-nums">
                          {entry.completedTodoCount}/{entry.todoCount} tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-600">Good (7-10)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-600">Neutral (4-6)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-rose-500" />
          <span className="text-xs text-slate-600">Low (1-3)</span>
        </div>
      </div>
    </div>
  );
}
