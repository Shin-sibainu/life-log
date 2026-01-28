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

interface EntryEditorProps {
  entry: LocalEntry;
  categories: Category[];
  onScoreChange: (score: number | null) => void;
  onScoreReasonChange: (reason: string | null) => void;
  onAddTodo: (content: string) => void;
  onUpdateTodo: (id: string, updates: { content?: string; isCompleted?: boolean; note?: string | null }) => void;
  onDeleteTodo: (id: string) => void;
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
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onSave,
  isSaving,
  isDirty,
  lastSaved,
  onAddCategory,
}: EntryEditorProps) {
  const dateObj = new Date(entry.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = dateObj.getTime() === today.getTime();

  const formattedDateEn = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getSaveStatus = () => {
    if (isSaving) return { text: '保存中...', color: 'text-amber-500' };
    if (isDirty) return { text: '未保存の変更あり', color: 'text-amber-500' };
    if (lastSaved) return { text: formatLastSaved(lastSaved), color: 'text-slate-400' };
    return null;
  };

  const saveStatus = getSaveStatus();

  return (
    <div className="max-w-5xl mx-auto px-8 py-20">
      <header className="mb-16 text-center">
        <h2 className="text-xs text-slate-500 uppercase mb-2">
          {formattedDateEn}
        </h2>
        <h1 className="text-2xl font-light text-slate-900 text-balance">
          {isToday ? '今日のログ' : `${dateObj.getMonth() + 1}月${dateObj.getDate()}日のログ`}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left Column - Todo & Links */}
        <div className="space-y-16">
          <TodoList
            todos={entry.todos}
            onAdd={onAddTodo}
            onUpdate={onUpdateTodo}
            onDelete={onDeleteTodo}
          />

          <LinkSection
            links={entry.links}
            onAdd={onAddLink}
            onUpdate={onUpdateLink}
            onDelete={onDeleteLink}
          />
        </div>

        {/* Right Column - Notes & Score */}
        <div className="space-y-16">
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

      <div className="fixed bottom-8 right-8 flex items-center gap-4">
        {saveStatus && (
          <span className={`text-xs ${saveStatus.color}`}>{saveStatus.text}</span>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="bg-slate-900 text-white text-xs font-medium px-8 py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg"
        >
          {isSaving ? '保存中...' : 'ログを保存'}
          <span className="material-symbols-outlined !text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
