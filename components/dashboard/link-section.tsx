'use client';

import { useState } from 'react';

interface Link {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
}

interface LinkSectionProps {
  links: Link[];
  onAdd: (url: string, title?: string, description?: string) => void;
  onUpdate: (id: string, updates: Partial<Link>) => void;
  onDelete: (id: string) => void;
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}

export function LinkSection({ links, onAdd, onUpdate, onDelete }: LinkSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    onAdd(newUrl.trim(), newTitle.trim() || undefined);
    setNewUrl('');
    setNewTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewUrl('');
      setNewTitle('');
    }
  };

  return (
    <section>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <span className="size-4 border-b border-slate-300" />
        参考リンク
      </h3>
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
        {links.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50/50"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <span className="material-symbols-outlined text-slate-400">link</span>
              <span className="text-sm text-slate-700 truncate hover:text-slate-900">
                {link.title || link.url}
              </span>
            </a>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {extractDomain(link.url)}
              </span>
              <button
                onClick={() => onDelete(link.id)}
                aria-label="リンクを削除"
                className="opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-slate-400 hover:text-slate-600 !text-base">close</span>
              </button>
            </div>
          </div>
        ))}

        {links.length === 0 && !isAdding && (
          <div className="px-4 py-8 text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-slate-50 mb-3">
              <span className="material-symbols-outlined text-slate-300 !text-2xl">bookmark</span>
            </div>
            <p className="text-sm text-slate-500 mb-1">参考になったリンクを保存</p>
            <p className="text-xs text-slate-400">記事や動画などを記録しておこう</p>
          </div>
        )}

        {isAdding ? (
          <div className="px-4 py-3 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="タイトル（任意）"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus:border-slate-400"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              autoFocus
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:outline-none focus:border-slate-400"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewUrl('');
                  setNewTitle('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1"
              >
                キャンセル
              </button>
              <button
                onClick={handleAdd}
                className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800"
              >
                追加
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
          >
            <span className="material-symbols-outlined">add_link</span>
            <span className="text-sm">リンクを追加</span>
          </button>
        )}
      </div>
    </section>
  );
}
