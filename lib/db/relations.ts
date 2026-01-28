import { relations } from 'drizzle-orm';
import {
  users,
  sessions,
  accounts,
  entries,
  todos,
  categories,
  notes,
  links,
  apiKeys,
} from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  entries: many(entries),
  categories: many(categories),
  apiKeys: many(apiKeys),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  user: one(users, { fields: [entries.userId], references: [users.id] }),
  todos: many(todos),
  notes: many(notes),
  links: many(links),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  entry: one(entries, { fields: [todos.entryId], references: [entries.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  entry: one(entries, { fields: [notes.entryId], references: [entries.id] }),
  category: one(categories, { fields: [notes.categoryId], references: [categories.id] }),
}));

export const linksRelations = relations(links, ({ one }) => ({
  entry: one(entries, { fields: [links.entryId], references: [entries.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));
