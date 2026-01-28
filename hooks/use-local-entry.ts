'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LocalEntry,
  LocalTodo,
  LocalNote,
  LocalLink,
  getLocalEntry,
  saveLocalEntry,
  createEmptyLocalEntry,
} from '@/lib/local-storage';
import { ulid } from 'ulid';

export function useLocalEntry(date: string) {
  const [entry, setEntry] = useState<LocalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getLocalEntry(date);
    if (stored) {
      setEntry(stored);
    } else {
      setEntry(createEmptyLocalEntry(date));
    }
    setIsLoading(false);
  }, [date]);

  const save = useCallback(() => {
    if (!entry) return;
    saveLocalEntry(entry);
  }, [entry]);

  const setScore = useCallback((score: number | null) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, score, updatedAt: Date.now() };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const setScoreReason = useCallback((scoreReason: string | null) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, scoreReason, updatedAt: Date.now() };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  // Todo operations
  const addTodo = useCallback((content: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const newTodo: LocalTodo = {
        id: ulid(),
        content,
        isCompleted: false,
        note: null,
        sortOrder: prev.todos.length,
      };
      const updated = {
        ...prev,
        todos: [...prev.todos, newTodo],
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<LocalTodo>) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        todos: prev.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        todos: prev.todos.filter((t) => t.id !== id),
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  // Note operations
  const addNote = useCallback((content: string, categoryId: string | null = null) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const newNote: LocalNote = {
        id: ulid(),
        content,
        categoryId,
      };
      const updated = {
        ...prev,
        notes: [...prev.notes, newNote],
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<LocalNote>) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        notes: prev.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  // Link operations
  const addLink = useCallback((url: string, title?: string, description?: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const newLink: LocalLink = {
        id: ulid(),
        url,
        title: title ?? null,
        description: description ?? null,
      };
      const updated = {
        ...prev,
        links: [...prev.links, newLink],
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const updateLink = useCallback((id: string, updates: Partial<LocalLink>) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        links: prev.links.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  const deleteLink = useCallback((id: string) => {
    setEntry((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        links: prev.links.filter((l) => l.id !== id),
        updatedAt: Date.now(),
      };
      saveLocalEntry(updated);
      return updated;
    });
  }, []);

  return {
    entry,
    isLoading,
    save,
    setScore,
    setScoreReason,
    addTodo,
    updateTodo,
    deleteTodo,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    updateLink,
    deleteLink,
  };
}
