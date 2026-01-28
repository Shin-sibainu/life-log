'use client';

import { useState, useEffect, useCallback } from 'react';
import { ulid } from 'ulid';

interface Category {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

const DEFAULT_CATEGORIES = [
  { id: 'default-1', name: '仕事', color: null, sortOrder: 0 },
  { id: 'default-2', name: '学習', color: null, sortOrder: 1 },
  { id: 'default-3', name: '生活', color: null, sortOrder: 2 },
];

export function useCategories(isAuthenticated: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) {
      setCategories(DEFAULT_CATEGORIES);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/categories');
      const data = await res.json();

      if (data.error) {
        console.error('Error fetching categories:', data.error);
        setCategories(DEFAULT_CATEGORIES);
      } else if (data.categories.length === 0) {
        // Create default categories for new users
        await createDefaultCategories();
      } else {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const createDefaultCategories = async () => {
    const created: Category[] = [];
    for (const cat of DEFAULT_CATEGORIES) {
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, color: cat.color }),
        });
        const data = await res.json();
        if (data.category) {
          created.push(data.category);
        }
      } catch (err) {
        console.error('Error creating default category:', err);
      }
    }
    setCategories(created.length > 0 ? created : DEFAULT_CATEGORIES);
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name: string, color?: string) => {
    if (!isAuthenticated) {
      const newCat: Category = {
        id: ulid(),
        name,
        color: color ?? null,
        sortOrder: categories.length,
      };
      setCategories(prev => [...prev, newCat]);
      return newCat;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      const data = await res.json();
      if (data.category) {
        setCategories(prev => [...prev, data.category]);
        return data.category;
      }
    } catch (err) {
      console.error('Error adding category:', err);
    }
    return null;
  }, [isAuthenticated, categories.length]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
        return true;
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
    return false;
  }, [isAuthenticated]);

  return {
    categories,
    isLoading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
