import { z } from 'zod';

export const todoSchema = z.object({
  id: z.string().optional(),
  content: z.string(),
  isCompleted: z.boolean().default(false),
  note: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

export const noteSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  content: z.string(),
});

export const linkSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().min(1).max(10).nullable().optional(),
  scoreReason: z.string().nullable().optional(),
  todos: z.array(todoSchema).default([]),
  notes: z.array(noteSchema).default([]),
  links: z.array(linkSchema).default([]),
});

export const migrateSchema = z.object({
  entries: z.array(entrySchema),
  categories: z.array(z.object({
    name: z.string().min(1),
    color: z.string().nullable().optional(),
  })).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional(),
});

export type EntryInput = z.infer<typeof entrySchema>;
export type MigrateInput = z.infer<typeof migrateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
