'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Todo {
  id: string;
  content: string;
  isCompleted: boolean;
  note: string | null;
  sortOrder: number;
}

interface TodoListProps {
  todos: Todo[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onReorder?: (todos: Todo[]) => void;
}

interface SortableTodoItemProps {
  todo: Todo;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

function SortableTodoItem({ todo, onUpdate, onDelete }: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 px-4 py-3 group hover:bg-slate-50/50 bg-white"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab active:cursor-grabbing touch-none"
        aria-label="ドラッグして並び替え"
      >
        <span className="material-symbols-outlined text-slate-300 hover:text-slate-400 !text-base">drag_indicator</span>
      </button>
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
  );
}

export function TodoList({ todos, onAdd, onUpdate, onDelete, onReorder }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);
      const reorderedTodos = arrayMove(todos, oldIndex, newIndex);
      onReorder?.(reorderedTodos);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 min-h-[34px]">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <span className="size-4 border-b border-slate-300" />
          ToDo リスト
        </h3>
      </div>
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
        {todos.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {todos.map((todo) => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-slate-50 mb-3">
              <span className="material-symbols-outlined text-slate-300 !text-2xl">checklist</span>
            </div>
            <p className="text-sm text-slate-500 mb-1">今日のタスクを追加しよう</p>
            <p className="text-xs text-slate-400">小さな一歩が大きな成果につながります</p>
          </div>
        )}
        <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 cursor-text">
          <span className="material-symbols-outlined text-slate-400 mt-0.5 ml-6">add</span>
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
