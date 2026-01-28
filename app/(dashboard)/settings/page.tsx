'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { getLocalCategories, saveLocalCategory, deleteLocalCategory } from '@/lib/local-storage';

interface ApiKey {
  id: string;
  name: string;
  key?: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthenticated = !!session?.user;

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Fetch categories from API (authenticated) or localStorage
  const fetchCategories = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoadingCategories(true);
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    } else {
      setCategories(getLocalCategories());
    }
  }, [isAuthenticated]);

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
    fetchApiKeys();
  }, [fetchCategories, fetchApiKeys]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    if (isAuthenticated) {
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setCategories([...categories, data.category]);
        }
      } catch (error) {
        console.error('Error creating category:', error);
      }
    } else {
      const newCat = saveLocalCategory({ name: newCategoryName.trim() });
      setCategories([...categories, newCat]);
    }
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (id: string) => {
    if (isAuthenticated) {
      try {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setCategories(categories.filter((c) => c.id !== id));
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    } else {
      deleteLocalCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim() || !session) return;

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to create API key');

      const data = await res.json();
      setApiKeys([...apiKeys, { ...data.apiKey, createdAt: new Date() }]);
      setNewlyCreatedKey(data.apiKey.key);
      setNewKeyName('');
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete API key');

      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      <header className="mb-16 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
          Preferences
        </p>
        <h1 className="text-2xl font-light text-slate-900 text-balance">設定</h1>
      </header>

      <div className="space-y-16">
        {/* Profile Section */}
        {session && (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="size-4 border-b border-slate-300"></span> プロフィール
            </h2>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              <div className="p-5 flex items-center gap-4">
                <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="size-12 rounded-full" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-400">person</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{session.user.name || '名前未設定'}</p>
                  <p className="text-xs text-slate-500">{session.user.email}</p>
                </div>
              </div>
              <div className="p-5">
                <button
                  onClick={handleSignOut}
                  className="text-xs text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-sm">logout</span>
                  ログアウト
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-6 flex items-center gap-2">
            <span className="size-4 border-b border-slate-300"></span> カテゴリ管理
          </h2>
          <p className="text-xs text-slate-500 mb-6 text-pretty">
            ノートを分類するカテゴリを管理します
          </p>

          <div className="border border-slate-200 rounded-lg">
            <div className="p-4 border-b border-slate-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="新しいカテゴリ名..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1 border-none p-0 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                />
                <button
                  onClick={handleAddCategory}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="カテゴリを追加"
                >
                  <span className="material-symbols-outlined !text-lg">add</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 !text-lg">label</span>
                    <span className="text-sm text-slate-800">{category.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                    aria-label="カテゴリを削除"
                  >
                    <span className="material-symbols-outlined !text-lg">delete</span>
                  </button>
                </div>
              ))}
              {isLoadingCategories ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 !text-2xl mb-2 block animate-spin">progress_activity</span>
                  <p className="text-xs text-slate-500">読み込み中...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 !text-2xl mb-2 block">category</span>
                  <p className="text-xs text-slate-500">カテゴリがありません</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* API Keys Section */}
        {session && (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="size-4 border-b border-slate-300"></span> APIキー
            </h2>
            <p className="text-xs text-slate-500 mb-6 text-pretty">
              MCP連携用のAPIキーを管理します
            </p>

            <div className="border border-slate-200 rounded-lg">
              <div className="p-4 border-b border-slate-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="キー名（例：Claude用）..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateApiKey()}
                    className="flex-1 border-none p-0 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                  />
                  <button
                    onClick={handleCreateApiKey}
                    className="text-xs text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors"
                  >
                    生成
                  </button>
                </div>
              </div>

              {newlyCreatedKey && (
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                  <p className="text-xs text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-sm">warning</span>
                    このキーは一度しか表示されません
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white rounded px-3 py-2 font-mono text-xs text-slate-700 border border-amber-200">
                      {showKey ? newlyCreatedKey : '•'.repeat(40)}
                    </code>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-amber-700 hover:text-amber-800 transition-colors"
                      aria-label={showKey ? 'キーを隠す' : 'キーを表示'}
                    >
                      <span className="material-symbols-outlined !text-lg">
                        {showKey ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="text-amber-700 hover:text-amber-800 transition-colors"
                      aria-label="キーをコピー"
                    >
                      <span className="material-symbols-outlined !text-lg">content_copy</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm text-slate-800">{key.name}</p>
                      <p className="text-xs text-slate-500">
                        {key.lastUsedAt
                          ? `最終使用: ${new Date(key.lastUsedAt).toLocaleDateString('ja-JP')}`
                          : '未使用'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                      aria-label="キーを削除"
                    >
                      <span className="material-symbols-outlined !text-lg">delete</span>
                    </button>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="py-8 text-center">
                    <span className="material-symbols-outlined text-slate-300 !text-2xl mb-2 block">key</span>
                    <p className="text-xs text-slate-500">APIキーがありません</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MCP Setup Guide */}
        {session && (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="size-4 border-b border-slate-300"></span> MCP設定方法
            </h2>
            <p className="text-xs text-slate-500 mb-6 text-pretty">
              Claude CodeやClaude DesktopでLifeLogのデータにアクセスするための設定
            </p>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              <div className="p-5">
                <h3 className="text-sm text-slate-800 font-medium mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 !text-lg">looks_one</span>
                  APIキーを生成
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed text-pretty">
                  上の「APIキー」セクションで新しいキーを生成してコピーしてください。
                </p>
              </div>

              <div className="p-5">
                <h3 className="text-sm text-slate-800 font-medium mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 !text-lg">looks_two</span>
                  .mcp.json に追加
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3 text-pretty">
                  プロジェクトルートの <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.mcp.json</code> に以下を追加:
                </p>
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "lifelog": {
      "command": "npx",
      "args": ["tsx", "mcp/index.ts"],
      "env": {
        "LIFELOG_API_KEY": "YOUR_API_KEY",
        "LIFELOG_API_URL": "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}"
      }
    }
  }
}`}
                </pre>
              </div>

              <div className="p-5">
                <h3 className="text-sm text-slate-800 font-medium mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 !text-lg">looks_3</span>
                  利用可能なツール
                </h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="text-slate-500 font-medium">読み取り</p>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">get_entries</code>
                    <span>日記エントリーを取得（日付範囲指定可能）</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">get_entry</code>
                    <span>特定の日付のエントリーを取得</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">search_logs</code>
                    <span>キーワードでエントリーを検索</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">get_stats</code>
                    <span>統計情報を取得</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">get_mood_trend</code>
                    <span>満足度の推移を取得</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">get_incomplete_todos</code>
                    <span>未完了のTodo一覧を取得</span>
                  </div>
                  <p className="text-slate-500 font-medium pt-2">書き込み</p>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">add_todo</code>
                    <span>Todoを追加</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs shrink-0">add_note</code>
                    <span>メモを追加（カテゴリ指定可能）</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-blue-50">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 !text-lg">info</span>
                  <div className="text-xs text-blue-800 leading-relaxed">
                    <p className="font-medium mb-1">使用例</p>
                    <p className="text-pretty">「今週の満足度の推移を分析して」「買い物リストをTodoに追加して」「今日のミーティングメモを仕事カテゴリに追加して」などとClaudeに指示できます。</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Data Export Section */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-6 flex items-center gap-2">
            <span className="size-4 border-b border-slate-300"></span> データ管理
          </h2>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
            <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-slate-400">download</span>
                <div>
                  <p className="text-sm text-slate-800">データをエクスポート</p>
                  <p className="text-xs text-slate-500">JSON形式でダウンロード</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 !text-lg">chevron_right</span>
            </div>
            <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-slate-400">upload</span>
                <div>
                  <p className="text-sm text-slate-800">データをインポート</p>
                  <p className="text-xs text-slate-500">JSONファイルから復元</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 !text-lg">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        {session && (
          <section>
            <h2 className="text-xs font-medium text-rose-500 uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="size-4 border-b border-rose-300"></span> 危険な操作
            </h2>

            <div className="border border-rose-200 rounded-lg bg-rose-50 p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-rose-500">warning</span>
                <div className="flex-1">
                  <p className="text-sm text-rose-800">アカウントを削除</p>
                  <p className="text-xs text-rose-600 mt-1 text-pretty">
                    すべてのデータが完全に削除されます。この操作は取り消せません。
                  </p>
                  <button className="mt-4 text-xs text-rose-700 uppercase tracking-wide border border-rose-300 px-4 py-2 rounded hover:bg-rose-100 transition-colors">
                    アカウントを削除
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Version Info */}
        <footer className="text-center pt-8 border-t border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            LifeLog v1.0.0
          </p>
        </footer>
      </div>
    </div>
  );
}
