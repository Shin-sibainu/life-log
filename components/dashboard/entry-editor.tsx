'use client';

import { TodoList } from './todo-list';
import { NoteSection } from './note-section';
import { LinkSection } from './link-section';
import { ScoreInput } from './score-input';
import { LocalEntry } from '@/lib/local-storage';

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Todo {
  id: string;
  content: string;
  isCompleted: boolean;
  note: string | null;
  sortOrder: number;
}

interface EntryEditorProps {
  entry: LocalEntry;
  categories: Category[];
  onScoreChange: (score: number | null) => void;
  onScoreReasonChange: (reason: string | null) => void;
  onAddTodo: (content: string) => void;
  onUpdateTodo: (id: string, updates: { content?: string; isCompleted?: boolean; note?: string | null }) => void;
  onDeleteTodo: (id: string) => void;
  onReorderTodos?: (todos: Todo[]) => void;
  onAddNote: (content: string, categoryId: string | null) => void;
  onUpdateNote: (id: string, updates: { content?: string; categoryId?: string | null }) => void;
  onDeleteNote: (id: string) => void;
  onAddLink: (url: string, title?: string, description?: string) => void;
  onUpdateLink: (id: string, updates: { url?: string; title?: string | null; description?: string | null }) => void;
  onDeleteLink: (id: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  lastSaved?: Date | null;
  onAddCategory?: (name: string, color?: string) => Promise<Category | null>;
  onDateChange?: (date: string) => void;
  currentStreak?: number;
  completedTodayCount?: number;
}

function formatLastSaved(date: Date | null | undefined): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 10) return '今保存しました';
  if (seconds < 60) return `${seconds}秒前に保存`;
  if (minutes < 60) return `${minutes}分前に保存`;
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) + 'に保存';
}

export function EntryEditor({
  entry,
  categories,
  onScoreChange,
  onScoreReasonChange,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onReorderTodos,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  isSaving,
  isDirty,
  lastSaved,
  onAddCategory,
  onDateChange,
  currentStreak = 0,
  completedTodayCount = 0,
}: EntryEditorProps) {
  const dateObj = new Date(entry.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = dateObj.getTime() === today.getTime();
  const isFuture = dateObj.getTime() > today.getTime();

  const formattedDateEn = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getSaveStatus = () => {
    if (isSaving) return { text: '保存中...', color: 'text-amber-500' };
    if (isDirty) return { text: '未保存', color: 'text-amber-500' };
    if (lastSaved) return { text: formatLastSaved(lastSaved), color: 'text-slate-400' };
    return { text: '自動保存', color: 'text-slate-300' };
  };

  const saveStatus = getSaveStatus();

  // Format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = formatDateLocal(today);

  const goToPrevDay = () => {
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    onDateChange?.(formatDateLocal(prevDate));
  };

  const goToNextDay = () => {
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = formatDateLocal(nextDate);
    // Allow navigation up to today
    if (nextDateStr <= todayStr) {
      onDateChange?.(nextDateStr);
    }
  };

  const goToToday = () => {
    onDateChange?.(todayStr);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* Date Navigation */}
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={goToPrevDay}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="前日"
          >
            <span className="material-symbols-outlined text-slate-400 !text-xl">chevron_left</span>
          </button>
          <div>
            <h2 className="text-xs text-slate-400 uppercase tracking-wide">
              {formattedDateEn}
            </h2>
            <h1 className="text-2xl font-light text-slate-900">
              {isToday ? '今日のログ' : `${dateObj.getMonth() + 1}月${dateObj.getDate()}日のログ`}
            </h1>
          </div>
          <button
            onClick={goToNextDay}
            disabled={isToday}
            className={`p-2 rounded-full transition-colors ${isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100'}`}
            aria-label="翌日"
          >
            <span className="material-symbols-outlined text-slate-400 !text-xl">chevron_right</span>
          </button>
        </div>
        {!isToday && (
          <button
            onClick={goToToday}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            今日に戻る
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Left Column - Todo & Links (1/3) */}
        <div className="space-y-12 lg:col-span-1">
          <TodoList
            todos={entry.todos}
            onAdd={onAddTodo}
            onUpdate={onUpdateTodo}
            onDelete={onDeleteTodo}
            onReorder={onReorderTodos}
          />

          <LinkSection
            links={entry.links}
            onAdd={onAddLink}
            onUpdate={onUpdateLink}
            onDelete={onDeleteLink}
          />
        </div>

        {/* Right Column - Notes & Score (2/3) */}
        <div className="space-y-12 lg:col-span-2">
          <NoteSection
            notes={entry.notes}
            categories={categories}
            onAdd={onAddNote}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onAddCategory={onAddCategory}
          />

          <ScoreInput
            score={entry.score}
            scoreReason={entry.scoreReason}
            onScoreChange={onScoreChange}
            onScoreReasonChange={onScoreReasonChange}
          />
        </div>
      </div>

    </div>
  );
}
