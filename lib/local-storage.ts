import { ulid } from 'ulid';

const STORAGE_KEY = 'lifelog_draft';

export interface LocalTodo {
  id: string;
  content: string;
  isCompleted: boolean;
  note: string | null;
  sortOrder: number;
}

export interface LocalNote {
  id: string;
  categoryId: string | null;
  content: string;
}

export interface LocalLink {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
}

export interface LocalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  score: number | null;
  scoreReason: string | null;
  todos: LocalTodo[];
  notes: LocalNote[];
  links: LocalLink[];
  createdAt: number;
  updatedAt: number;
}

export interface LocalStorageData {
  entries: LocalEntry[];
  categories: { id: string; name: string; color: string | null; sortOrder: number }[];
}

function getStorage(): LocalStorageData {
  if (typeof window === 'undefined') {
    return { entries: [], categories: [] };
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { entries: [], categories: [] };
    }
    return JSON.parse(data);
  } catch {
    return { entries: [], categories: [] };
  }
}

function setStorage(data: LocalStorageData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Entry operations
export function getLocalEntry(date: string): LocalEntry | null {
  const data = getStorage();
  return data.entries.find((e) => e.date === date) ?? null;
}

export function getAllLocalEntries(): LocalEntry[] {
  const data = getStorage();
  return data.entries;
}

export function saveLocalEntry(entry: Omit<LocalEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): LocalEntry {
  const data = getStorage();
  const now = Date.now();

  const existingIndex = data.entries.findIndex((e) => e.date === entry.date);

  if (existingIndex >= 0) {
    const existing = data.entries[existingIndex];
    const updated: LocalEntry = {
      ...existing,
      ...entry,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
    data.entries[existingIndex] = updated;
    setStorage(data);
    return updated;
  }

  const newEntry: LocalEntry = {
    id: entry.id || ulid(),
    date: entry.date,
    score: entry.score,
    scoreReason: entry.scoreReason,
    todos: entry.todos,
    notes: entry.notes,
    links: entry.links,
    createdAt: now,
    updatedAt: now,
  };
  data.entries.push(newEntry);
  setStorage(data);
  return newEntry;
}

export function deleteLocalEntry(date: string): void {
  const data = getStorage();
  data.entries = data.entries.filter((e) => e.date !== date);
  setStorage(data);
}

// Category operations
export function getLocalCategories(): LocalStorageData['categories'] {
  const data = getStorage();
  return data.categories;
}

export function saveLocalCategory(category: { name: string; color?: string | null }): { id: string; name: string; color: string | null; sortOrder: number } {
  const data = getStorage();
  const existing = data.categories.find((c) => c.name === category.name);

  if (existing) {
    existing.color = category.color ?? existing.color;
    setStorage(data);
    return existing;
  }

  const newCategory = {
    id: ulid(),
    name: category.name,
    color: category.color ?? null,
    sortOrder: data.categories.length,
  };
  data.categories.push(newCategory);
  setStorage(data);
  return newCategory;
}

export function deleteLocalCategory(id: string): void {
  const data = getStorage();
  data.categories = data.categories.filter((c) => c.id !== id);
  // Remove category from notes
  data.entries.forEach((entry) => {
    entry.notes.forEach((note) => {
      if (note.categoryId === id) {
        note.categoryId = null;
      }
    });
  });
  setStorage(data);
}

// Helper to create empty entry
export function createEmptyLocalEntry(date: string): LocalEntry {
  return {
    id: ulid(),
    date,
    score: null,
    scoreReason: null,
    todos: [],
    notes: [],
    links: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Get data for migration
export function getDataForMigration(): LocalStorageData {
  return getStorage();
}
