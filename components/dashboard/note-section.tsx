'use client';

import { useState, useRef, useEffect } from 'react';

interface Note {
  id: string;
  content: string;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface NoteSectionProps {
  notes: Note[];
  categories: Category[];
  onAdd: (content: string, categoryId: string | null) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onAddCategory?: (name: string, color?: string) => Promise<Category | null>;
}


export function NoteSection({ notes, categories, onAdd, onUpdate, onDelete, onAddCategory }: NoteSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial active category when categories load
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (isAddingCategory && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingCategory]);

  // Find note for current category
  const currentNote = notes.find(n => n.categoryId === activeCategoryId);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    if (currentNote) {
      // Update existing note for this category
      onUpdate(currentNote.id, { content: newContent });
    } else if (newContent.trim()) {
      // Create new note for this category
      onAdd(newContent, activeCategoryId);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !onAddCategory) return;

    const newCategory = await onAddCategory(newCategoryName.trim());
    if (newCategory) {
      setActiveCategoryId(newCategory.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <span className="size-4 border-b border-slate-300" />
          自由記述
        </h3>
        <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`text-xs px-3 py-1 rounded ${
                activeCategoryId === category.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {category.name}
            </button>
          ))}
          {isAddingCategory ? (
            <input
              ref={inputRef}
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleCategoryKeyDown}
              onBlur={() => {
                if (!newCategoryName.trim()) {
                  setIsAddingCategory(false);
                }
              }}
              placeholder="カテゴリ名"
              className="text-xs px-2 py-1 w-20 border border-slate-200 rounded bg-white outline-none focus:outline-none focus:border-slate-400"
            />
          ) : onAddCategory ? (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="text-xs px-2 py-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              aria-label="カテゴリを追加"
            >
              <span className="material-symbols-outlined !text-sm">add</span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="border border-slate-200 rounded-lg p-4">
        <textarea
          value={currentNote?.content || ''}
          onChange={handleContentChange}
          placeholder="今日はどのような一日でしたか？"
          rows={8}
          className="w-full p-0 border-none text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 resize-none bg-transparent outline-none focus:outline-none text-pretty"
        />
      </div>
    </section>
  );
}
