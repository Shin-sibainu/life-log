'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { MarkdownEditor } from '@/components/memo/markdown-editor';

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
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [addingMemoToCategoryId, setAddingMemoToCategoryId] = useState<string | null | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<Memo>>({});

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

  // Fetch all memos
  const fetchMemos = useCallback(async () => {
    try {
      const res = await fetch('/api/memos');
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
  const handleCreateMemo = async (categoryId?: string | null) => {
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '無題のメモ',
          content: '',
          categoryId: categoryId ?? null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newMemo = {
          ...data.memo,
          categoryName: categories.find((c) => c.id === categoryId)?.name || null,
          categoryColor: categories.find((c) => c.id === categoryId)?.color || null,
        };
        setMemos((prev) => [newMemo, ...prev]);
        setSelectedMemo(newMemo);
        // Expand the category if adding to one
        if (categoryId) {
          setExpandedCategories((prev) => new Set([...prev, categoryId]));
        }
      }
    } catch (error) {
      console.error('Failed to create memo:', error);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Get memos for a category
  const getMemosByCategory = (categoryId: string | null) => {
    return memos.filter((m) => m.categoryId === categoryId);
  };

  // Update memo (immediate)
  const saveUpdates = useCallback(async (memoId: string, updates: Partial<Memo>, showStatus = true) => {
    setIsSaving(true);
    if (showStatus) setSaveStatus('saving');
    try {
      const res = await fetch(`/api/memos/${memoId}`, {
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
          prev.map((m) => (m.id === memoId ? updatedMemo : m))
        );
        // Expand the new category if category changed
        if (updates.categoryId) {
          setExpandedCategories((prev) => new Set([...prev, updates.categoryId as string]));
        }
        if (showStatus) {
          setSaveStatus('saved');
          // Hide after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to update memo:', error);
      if (showStatus) setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  }, [categories]);

  // Debounced auto-save for content and title
  const handleAutoSave = useCallback((updates: Partial<Memo>) => {
    if (!selectedMemo) return;

    // Show pending status
    setSaveStatus('pending');

    // Merge with pending updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer (1 second debounce)
    saveTimerRef.current = setTimeout(() => {
      if (selectedMemo && Object.keys(pendingUpdatesRef.current).length > 0) {
        saveUpdates(selectedMemo.id, pendingUpdatesRef.current, true);
        pendingUpdatesRef.current = {};
      }
    }, 1000);
  }, [selectedMemo, saveUpdates]);

  // Immediate save (for category/date changes)
  const handleUpdateMemo = async (updates: Partial<Memo>) => {
    if (!selectedMemo) return;

    // Clear any pending auto-save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingUpdatesRef.current = {};

    await saveUpdates(selectedMemo.id, updates);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

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

  // Get uncategorized memos
  const uncategorizedMemos = getMemosByCategory(null);

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

  // Handle memo selection on mobile (close sidebar)
  const handleMemoSelect = (memo: Memo) => {
    setSelectedMemo(memo);
    setShowSidebar(false);
  };

  return (
    <div className="flex h-full relative">
      {/* Mobile overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Tree Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-30
        w-72 border-r border-slate-200 bg-slate-50 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">メモ</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                handleCreateMemo(null);
                setShowSidebar(false);
              }}
              className="p-1 rounded hover:bg-slate-100"
              title="新規メモ"
            >
              <span className="material-symbols-outlined text-slate-500 !text-lg">add</span>
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 rounded hover:bg-slate-100 lg:hidden"
            >
              <span className="material-symbols-outlined text-slate-500 !text-lg">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Categories with memos */}
          {categories.map((category) => {
            const categoryMemos = getMemosByCategory(category.id);
            const isExpanded = expandedCategories.has(category.id);
            return (
              <div key={category.id} className="mb-1">
                {/* Category header */}
                <div className="flex items-center group">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 flex-1 text-left"
                  >
                    <span className="material-symbols-outlined !text-base text-slate-400">
                      {isExpanded ? 'expand_more' : 'chevron_right'}
                    </span>
                    <span className="material-symbols-outlined !text-base text-slate-400">folder</span>
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{categoryMemos.length}</span>
                  </button>
                  <button
                    onClick={() => handleCreateMemo(category.id)}
                    className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="このカテゴリにメモを追加"
                  >
                    <span className="material-symbols-outlined text-slate-400 !text-base">add</span>
                  </button>
                </div>
                {/* Memos in category */}
                {isExpanded && (
                  <div className="ml-4 border-l border-slate-200 pl-2">
                    {categoryMemos.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 pl-2">メモがありません</p>
                    ) : (
                      categoryMemos.map((memo) => (
                        <button
                          key={memo.id}
                          onClick={() => handleMemoSelect(memo)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                            selectedMemo?.id === memo.id
                              ? 'bg-slate-200 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined !text-base text-slate-400">description</span>
                          <span className="truncate">{memo.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized memos */}
          {uncategorizedMemos.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-400 px-2 mb-1">未分類</p>
              {uncategorizedMemos.map((memo) => (
                <button
                  key={memo.id}
                  onClick={() => setSelectedMemo(memo)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedMemo?.id === memo.id
                      ? 'bg-slate-200 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined !text-base text-slate-400">description</span>
                  <span className="truncate">{memo.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Add category button */}
          <div className="mt-2 pt-2 border-t border-slate-200">
            {isAddingCategory ? (
              <div className="px-1">
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
                className="w-full text-left px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600 flex items-center gap-2"
              >
                <span className="material-symbols-outlined !text-base">create_new_folder</span>
                カテゴリを追加
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Memo Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedMemo ? (
          <>
            <div className="p-3 md:p-4 border-b border-slate-200 flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-1.5 rounded hover:bg-slate-100 lg:hidden flex-shrink-0"
                title="メモ一覧"
              >
                <span className="material-symbols-outlined text-slate-500 !text-xl">menu</span>
              </button>
              <input
                type="text"
                value={selectedMemo.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setSelectedMemo({ ...selectedMemo, title: newTitle });
                  handleAutoSave({ title: newTitle });
                }}
                className="text-base md:text-lg font-medium text-slate-900 bg-transparent border-none outline-none flex-1 min-w-0"
                placeholder="タイトル"
              />
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-xs text-slate-400">保存中...</span>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                    className={`p-1.5 rounded transition-colors ${
                      showMarkdownHelp
                        ? 'bg-slate-200 text-slate-700'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                    }`}
                    title="マークダウンの書き方"
                  >
                    <span className="material-symbols-outlined !text-xl">help_outline</span>
                  </button>
                  {showMarkdownHelp && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4">
                      <h4 className="font-medium text-slate-900 mb-3 text-sm">マークダウンの書き方</h4>
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded"># 見出し1</code>
                          <span className="text-slate-400">大見出し</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">## 見出し2</code>
                          <span className="text-slate-400">中見出し</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">### 見出し3</code>
                          <span className="text-slate-400">小見出し</span>
                        </div>
                        <div className="border-t border-slate-100 my-2" />
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">**太字**</code>
                          <span className="text-slate-400">太字</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">*斜体*</code>
                          <span className="text-slate-400">斜体</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">~~取消~~</code>
                          <span className="text-slate-400">取り消し線</span>
                        </div>
                        <div className="border-t border-slate-100 my-2" />
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">- リスト</code>
                          <span className="text-slate-400">箇条書き</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">1. 番号</code>
                          <span className="text-slate-400">番号付き</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">&gt; 引用</code>
                          <span className="text-slate-400">引用</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">`コード`</code>
                          <span className="text-slate-400">コード</span>
                        </div>
                        <div className="flex justify-between">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">---</code>
                          <span className="text-slate-400">水平線</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 hidden md:block"
                  title="拡大表示"
                >
                  <span className="material-symbols-outlined !text-xl">zoom_out_map</span>
                </button>
                <button
                  onClick={() => handleDeleteMemo(selectedMemo.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                  title="削除"
                >
                  <span className="material-symbols-outlined !text-xl">delete</span>
                </button>
              </div>
            </div>
            <div className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 md:gap-4">
              <select
                value={selectedMemo.categoryId || ''}
                onChange={(e) => {
                  const newCategoryId = e.target.value || null;
                  setSelectedMemo({ ...selectedMemo, categoryId: newCategoryId });
                  handleUpdateMemo({ categoryId: newCategoryId });
                }}
                className="text-sm text-slate-600 border border-slate-200 rounded px-2 py-1.5 bg-white"
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
                className="text-sm text-slate-600 border border-slate-200 rounded px-2 py-1.5"
              />
            </div>
            <div className="flex-1 p-3 md:p-4 overflow-auto">
              <MarkdownEditor
                content={selectedMemo.content}
                onChange={(content) => {
                  setSelectedMemo({ ...selectedMemo, content });
                  handleAutoSave({ content });
                }}
                placeholder="メモを入力... (見出しは # や ## で始めます)"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile header */}
            <div className="p-3 border-b border-slate-200 lg:hidden">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-1.5 rounded hover:bg-slate-100"
                title="メモ一覧"
              >
                <span className="material-symbols-outlined text-slate-500 !text-xl">menu</span>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <span className="material-symbols-outlined text-slate-200 !text-6xl">edit_note</span>
                <p className="mt-4 text-sm text-slate-400">メモを選択または作成してください</p>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline lg:hidden"
                >
                  メモ一覧を開く
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Editor Modal */}
      {isExpanded && selectedMemo && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <input
              type="text"
              value={selectedMemo.title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setSelectedMemo({ ...selectedMemo, title: newTitle });
                handleAutoSave({ title: newTitle });
              }}
              className="text-xl font-medium text-slate-900 bg-transparent border-none outline-none flex-1"
              placeholder="タイトル"
            />
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-slate-400">保存中...</span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                  className={`p-2 rounded transition-colors ${
                    showMarkdownHelp
                      ? 'bg-slate-200 text-slate-700'
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                  title="マークダウンの書き方"
                >
                  <span className="material-symbols-outlined !text-xl">help_outline</span>
                </button>
                {showMarkdownHelp && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4">
                    <h4 className="font-medium text-slate-900 mb-3 text-sm">マークダウンの書き方</h4>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded"># 見出し1</code>
                        <span className="text-slate-400">大見出し</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">## 見出し2</code>
                        <span className="text-slate-400">中見出し</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">### 見出し3</code>
                        <span className="text-slate-400">小見出し</span>
                      </div>
                      <div className="border-t border-slate-100 my-2" />
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">**太字**</code>
                        <span className="text-slate-400">太字</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">*斜体*</code>
                        <span className="text-slate-400">斜体</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">~~取消~~</code>
                        <span className="text-slate-400">取り消し線</span>
                      </div>
                      <div className="border-t border-slate-100 my-2" />
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">- リスト</code>
                        <span className="text-slate-400">箇条書き</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">1. 番号</code>
                        <span className="text-slate-400">番号付き</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">&gt; 引用</code>
                        <span className="text-slate-400">引用</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">`コード`</code>
                        <span className="text-slate-400">コード</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">---</code>
                        <span className="text-slate-400">水平線</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="縮小"
              >
                <span className="material-symbols-outlined !text-xl">zoom_in_map</span>
              </button>
            </div>
          </div>
          <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <MarkdownEditor
              content={selectedMemo.content}
              onChange={(content) => {
                setSelectedMemo({ ...selectedMemo, content });
                handleAutoSave({ content });
              }}
              placeholder="メモを入力... (見出しは # や ## で始めます)"
            />
          </div>
        </div>
      )}

      {/* Auto-save toast notification */}
      {saveStatus !== 'idle' && (
        <div className={`
          fixed bottom-4 right-4 z-50
          px-4 py-2 rounded-lg shadow-lg
          flex items-center gap-2
          transition-all duration-300 ease-in-out
          ${saveStatus === 'saved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-slate-600 border border-slate-200'}
        `}>
          {saveStatus === 'pending' && (
            <>
              <span className="material-symbols-outlined !text-lg text-slate-400">edit</span>
              <span className="text-sm">編集中...</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <span className="material-symbols-outlined !text-lg animate-spin">sync</span>
              <span className="text-sm">保存中...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <span className="material-symbols-outlined !text-lg text-green-600">check_circle</span>
              <span className="text-sm">保存しました</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
