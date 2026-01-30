'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalEntry } from '@/hooks/use-local-entry';
import { getLocalCategories, saveLocalCategory } from '@/lib/local-storage';
import { EntryEditor } from '@/components/dashboard/entry-editor';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function TryPage() {
  const router = useRouter();
  const today = getTodayDate();
  const localEntry = useLocalEntry(today);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string | null; sortOrder: number }[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    // Initialize default categories if none exist
    let cats = getLocalCategories();
    if (cats.length === 0) {
      const defaultCategories = ['学び', '気づき', 'アイデア', '振り返り'];
      defaultCategories.forEach((name) => {
        saveLocalCategory({ name });
      });
      cats = getLocalCategories();
    }
    setCategories(cats);
  }, []);

  const handleSave = () => {
    localEntry.save();
    setShowAuthPrompt(true);
  };

  if (localEntry.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!localEntry.entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">エントリを読み込めませんでした</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              LifeLog
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">お試しモード</span>
              <Link href="/signup">
                <Button size="sm">アカウント作成</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <EntryEditor
          entry={localEntry.entry}
          categories={categories}
          onScoreChange={localEntry.setScore}
          onScoreReasonChange={localEntry.setScoreReason}
          onAddTodo={localEntry.addTodo}
          onUpdateTodo={localEntry.updateTodo}
          onDeleteTodo={localEntry.deleteTodo}
          onReorderTodos={localEntry.reorderTodos}
          onAddNote={localEntry.addNote}
          onUpdateNote={localEntry.updateNote}
          onDeleteNote={localEntry.deleteNote}
          onAddLink={localEntry.addLink}
          onUpdateLink={localEntry.updateLink}
          onDeleteLink={localEntry.deleteLink}
          completedTodayCount={localEntry.entry.todos.filter(t => t.isCompleted).length}
        />
      </main>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">保存しました</h3>
            <p className="mt-2 text-sm text-gray-600">
              データはブラウザに保存されました。
              アカウントを作成すると、クラウドに同期して他のデバイスからもアクセスできます。
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setShowAuthPrompt(false)}>
                後で
              </Button>
              <Link href="/signup">
                <Button>アカウント作成</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
