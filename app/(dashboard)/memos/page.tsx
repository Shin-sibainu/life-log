'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';

interface MemoCategory {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

interface Memo {
  id: string;
  title: string;
  content: string;
  date: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  createdAt: number;
  updatedAt: number;
}

export default function MemosPage() {
  const { data: session, isPending } = useSession();
  const [categories, setCategories] = useState<MemoCategory[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/memo-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Fetch memos
  const fetchMemos = useCallback(async (categoryId?: string | null) => {
    try {
      const url = categoryId
        ? `/api/memos?categoryId=${categoryId}`
        : '/api/memos';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMemos(data.memos);
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    }
  }, []);

  useEffect(() => {
    if (!isPending && session?.user) {
      Promise.all([fetchCategories(), fetchMemos()]).then(() => {
        setIsLoading(false);
      });
    } else if (!isPending && !session?.user) {
      setIsLoading(false);
    }
  }, [isPending, session, fetchCategories, fetchMemos]);

  // Add category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/memo-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [...prev, data.category]);
        setNewCategoryName('');
        setIsAddingCategory(false);
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  // Create new memo
  const handleCreateMemo = async () => {
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '無題のメモ',
          content: '',
          categoryId: selectedCategoryId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newMemo = {
          ...data.memo,
          categoryName: categories.find((c) => c.id === selectedCategoryId)?.name || null,
          categoryColor: categories.find((c) => c.id === selectedCategoryId)?.color || null,
        };
        setMemos((prev) => [newMemo, ...prev]);
        setSelectedMemo(newMemo);
      }
    } catch (error) {
      console.error('Failed to create memo:', error);
    }
  };

  // Update memo
  const handleUpdateMemo = async (updates: Partial<Memo>) => {
    if (!selectedMemo) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/memos/${selectedMemo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedMemo = {
          ...data.memo,
          categoryName: categories.find((c) => c.id === data.memo.categoryId)?.name || null,
          categoryColor: categories.find((c) => c.id === data.memo.categoryId)?.color || null,
        };
        setMemos((prev) =>
          prev.map((m) => (m.id === selectedMemo.id ? updatedMemo : m))
        );
        setSelectedMemo(updatedMemo);
      }
    } catch (error) {
      console.error('Failed to update memo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete memo
  const handleDeleteMemo = async (id: string) => {
    try {
      const res = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMemos((prev) => prev.filter((m) => m.id !== id));
        if (selectedMemo?.id === id) {
          setSelectedMemo(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  // Filter memos by category
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedMemo(null);
    fetchMemos(categoryId);
  };

  if (isPending || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400 text-sm">ログインしてください</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Categories Sidebar */}
      <div className="w-48 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">カテゴリ</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategoryId === null
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selectedCategoryId === category.id
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {category.color && (
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              )}
              {category.name}
            </button>
          ))}
          {isAddingCategory ? (
            <div className="mt-2 px-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }
                }}
                placeholder="カテゴリ名"
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined !text-base">add</span>
              カテゴリを追加
            </button>
          )}
        </div>
      </div>

      {/* Memos List */}
      <div className="w-64 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">メモ</h2>
          <button
            onClick={handleCreateMemo}
            className="p-1 rounded hover:bg-slate-100"
            title="新規メモ"
          >
            <span className="material-symbols-outlined text-slate-500 !text-xl">add</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {memos.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-slate-400">メモがありません</p>
              <button
                onClick={handleCreateMemo}
                className="mt-2 text-sm text-slate-600 hover:text-slate-900 underline"
              >
                新規作成
              </button>
            </div>
          ) : (
            memos.map((memo) => (
              <button
                key={memo.id}
                onClick={() => setSelectedMemo(memo)}
                className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedMemo?.id === memo.id ? 'bg-slate-100' : ''
                }`}
              >
                <p className="text-sm font-medium text-slate-900 truncate">{memo.title}</p>
                <p className="text-xs text-slate-400 mt-1">{memo.date}</p>
                {memo.categoryName && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-slate-500">
                    {memo.categoryColor && (
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: memo.categoryColor }}
                      />
                    )}
                    {memo.categoryName}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Memo Editor */}
      <div className="flex-1 flex flex-col">
        {selectedMemo ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <input
                type="text"
                value={selectedMemo.title}
                onChange={(e) => {
                  setSelectedMemo({ ...selectedMemo, title: e.target.value });
                }}
                onBlur={() => handleUpdateMemo({ title: selectedMemo.title })}
                className="text-lg font-medium text-slate-900 bg-transparent border-none outline-none flex-1"
                placeholder="タイトル"
              />
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-xs text-slate-400">保存中...</span>
                )}
                <button
                  onClick={() => handleDeleteMemo(selectedMemo.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                  title="削除"
                >
                  <span className="material-symbols-outlined !text-xl">delete</span>
                </button>
              </div>
            </div>
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <select
                value={selectedMemo.categoryId || ''}
                onChange={(e) => {
                  const newCategoryId = e.target.value || null;
                  setSelectedMemo({ ...selectedMemo, categoryId: newCategoryId });
                  handleUpdateMemo({ categoryId: newCategoryId });
                }}
                className="text-sm text-slate-600 border border-slate-200 rounded px-2 py-1 bg-white"
              >
                <option value="">カテゴリなし</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={selectedMemo.date}
                onChange={(e) => {
                  setSelectedMemo({ ...selectedMemo, date: e.target.value });
                  handleUpdateMemo({ date: e.target.value });
                }}
                className="text-sm text-slate-600 border border-slate-200 rounded px-2 py-1"
              />
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={selectedMemo.content}
                onChange={(e) => {
                  setSelectedMemo({ ...selectedMemo, content: e.target.value });
                }}
                onBlur={() => handleUpdateMemo({ content: selectedMemo.content })}
                className="w-full h-full resize-none border-none outline-none text-sm text-slate-700 leading-relaxed"
                placeholder="メモを入力..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-slate-200 !text-6xl">edit_note</span>
              <p className="mt-4 text-sm text-slate-400">メモを選択または作成してください</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
