'use client';

import { useState } from 'react';

interface Todo {
  id: string;
  content: string;
  isCompleted: boolean;
  note: string | null;
}

interface TodoListProps {
  todos: Todo[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

export function TodoList({ todos, onAdd, onUpdate, onDelete }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    onAdd(newTodo.trim());
    setNewTodo('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <section>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <span className="size-4 border-b border-slate-300" />
        ToDo リスト
      </h3>
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-start gap-4 px-4 py-3 group hover:bg-slate-50/50"
          >
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={(e) => onUpdate(todo.id, { isCompleted: e.target.checked })}
              className="mt-0.5 size-4 rounded border-slate-300 text-slate-900 cursor-pointer focus:ring-0 focus:ring-offset-0"
            />
            <div className="flex-grow">
              <input
                type="text"
                value={todo.content}
                onChange={(e) => onUpdate(todo.id, { content: e.target.value })}
                className={`w-full border-none p-0 text-sm bg-transparent outline-none focus:outline-none ${
                  todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}
              />
            </div>
            <button
              onClick={() => onDelete(todo.id)}
              aria-label="タスクを削除"
              className="opacity-0 group-hover:opacity-100"
            >
              <span className="material-symbols-outlined text-slate-400 hover:text-slate-600 !text-base">close</span>
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            タスクがありません
          </div>
        )}
        <div className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50/50 cursor-text">
          <span className="material-symbols-outlined text-slate-400 mt-0.5">add</span>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タスクを追加..."
            className="w-full border-none p-0 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
