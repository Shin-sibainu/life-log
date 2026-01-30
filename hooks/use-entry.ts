'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ulid } from 'ulid';

interface Todo {
  id: string;
  content: string;
  isCompleted: boolean;
  note: string | null;
  sortOrder: number;
}

interface Note {
  id: string;
  content: string;
  categoryId: string | null;
}

interface Link {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
}

interface Entry {
  id: string;
  date: string;
  score: number | null;
  scoreReason: string | null;
  todos: Todo[];
  notes: Note[];
  links: Link[];
  createdAt: number;
  updatedAt: number;
}

export function useEntry(date: string, isAuthenticated: boolean) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Entry | null>(null);

  // Fetch entry from API
  const fetchEntry = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/entries/${date}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error.message);
        return;
      }

      if (data.entry) {
        const now = Date.now();
        setEntry({
          id: data.entry.id,
          date: data.entry.date,
          score: data.entry.score,
          scoreReason: data.entry.scoreReason || null,
          todos: data.entry.todos || [],
          notes: data.entry.notes || [],
          links: data.entry.links || [],
          createdAt: data.entry.createdAt ? new Date(data.entry.createdAt).getTime() : now,
          updatedAt: data.entry.updatedAt ? new Date(data.entry.updatedAt).getTime() : now,
        });
      } else {
        // Create empty entry
        const now = Date.now();
        setEntry({
          id: ulid(),
          date,
          score: null,
          scoreReason: null,
          todos: [],
          notes: [],
          links: [],
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Error fetching entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [date, isAuthenticated]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  // Auto-save to API with debounce
  const saveToApi = useCallback(async (entryData: Entry) => {
    if (!isAuthenticated) return;

    setIsSaving(true);
    try {
      // Filter out empty content before saving
      const filteredTodos = entryData.todos.filter(t => t.content.trim());
      const filteredNotes = entryData.notes.filter(n => n.content.trim());
      const filteredLinks = entryData.links.filter(l => l.url.trim());

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: entryData.date,
          score: entryData.score,
          scoreReason: entryData.scoreReason,
          todos: filteredTodos,
          notes: filteredNotes,
          links: filteredLinks,
        }),
      });

      const data = await res.json();
      if (data.error) {
        console.error('Save error:', data.error);
      } else {
        setLastSaved(new Date());
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Error saving entry:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated]);

  // Debounced save
  const scheduleSave = useCallback((updatedEntry: Entry) => {
    pendingChangesRef.current = updatedEntry;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChangesRef.current) {
        saveToApi(pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    }, 1500); // 1.5s debounce - saves after user stops typing
  }, [saveToApi]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save any pending changes
        if (pendingChangesRef.current && isAuthenticated) {
          saveToApi(pendingChangesRef.current);
        }
      }
    };
  }, [isAuthenticated, saveToApi]);

  // Update entry and trigger auto-save
  const updateEntry = useCallback((updater: (prev: Entry) => Entry) => {
    setIsDirty(true);
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...updater(prev), updatedAt: Date.now() };
      scheduleSave(updated);
      return updated;
    });
  }, [scheduleSave]);

  // Score
  const setScore = useCallback((score: number | null) => {
    updateEntry((prev) => ({ ...prev, score }));
  }, [updateEntry]);

  const setScoreReason = useCallback((scoreReason: string | null) => {
    updateEntry((prev) => ({ ...prev, scoreReason }));
  }, [updateEntry]);

  // Todo operations
  const addTodo = useCallback((content: string) => {
    updateEntry((prev) => ({
      ...prev,
      todos: [...prev.todos, {
        id: ulid(),
        content,
        isCompleted: false,
        note: null,
        sortOrder: prev.todos.length,
      }],
    }));
  }, [updateEntry]);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    updateEntry((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, [updateEntry]);

  const deleteTodo = useCallback((id: string) => {
    updateEntry((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => t.id !== id),
    }));
  }, [updateEntry]);

  const reorderTodos = useCallback((reorderedTodos: Todo[]) => {
    updateEntry((prev) => ({
      ...prev,
      todos: reorderedTodos.map((t, index) => ({ ...t, sortOrder: index })),
    }));
  }, [updateEntry]);

  // Note operations
  const addNote = useCallback((content: string, categoryId: string | null = null) => {
    updateEntry((prev) => ({
      ...prev,
      notes: [...prev.notes, {
        id: ulid(),
        content,
        categoryId,
      }],
    }));
  }, [updateEntry]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    updateEntry((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));
  }, [updateEntry]);

  const deleteNote = useCallback((id: string) => {
    updateEntry((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
  }, [updateEntry]);

  // Link operations
  const addLink = useCallback((url: string, title?: string, description?: string) => {
    updateEntry((prev) => ({
      ...prev,
      links: [...prev.links, {
        id: ulid(),
        url,
        title: title ?? null,
        description: description ?? null,
      }],
    }));
  }, [updateEntry]);

  const updateLink = useCallback((id: string, updates: Partial<Link>) => {
    updateEntry((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  }, [updateEntry]);

  const deleteLink = useCallback((id: string) => {
    updateEntry((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id),
    }));
  }, [updateEntry]);

  // Manual save (for save button)
  const save = useCallback(() => {
    if (entry && isAuthenticated) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveToApi(entry);
    }
  }, [entry, isAuthenticated, saveToApi]);

  return {
    entry,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
    error,
    save,
    setScore,
    setScoreReason,
    addTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    updateLink,
    deleteLink,
  };
}
