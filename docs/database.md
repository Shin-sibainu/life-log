# データベース設計

## 概要

LifeLogのデータベースはTurso（SQLite Edge）を使用し、Drizzle ORMで操作します。

## ER図

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │───────┬──────────────────────────────────┐
│ email       │       │                                  │
│ name        │       │                                  │
│ created_at  │       │                                  │
│ updated_at  │       │                                  │
└─────────────┘       │                                  │
                      │                                  │
      ┌───────────────┴───────────────┐                  │
      ↓                               ↓                  │
┌─────────────┐                ┌─────────────┐          │
│  entries    │                │ categories  │          │
├─────────────┤                ├─────────────┤          │
│ id (PK)     │──────┬────┐    │ id (PK)     │──────┐   │
│ user_id(FK) │      │    │    │ user_id(FK) │      │   │
│ date        │      │    │    │ name        │      │   │
│ score       │      │    │    │ color       │      │   │
│ created_at  │      │    │    │ sort_order  │      │   │
│ updated_at  │      │    │    │ created_at  │      │   │
└─────────────┘      │    │    └─────────────┘      │   │
                     │    │                         │   │
      ┌──────────────┤    ├────────────┐            │   │
      ↓              ↓    ↓            ↓            │   │
┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│   todos     │ │   notes     │ │   links     │    │   │
├─────────────┤ ├─────────────┤ ├─────────────┤    │   │
│ id (PK)     │ │ id (PK)     │ │ id (PK)     │    │   │
│ entry_id(FK)│ │ entry_id(FK)│ │ entry_id(FK)│    │   │
│ content     │ │ category_id │←─┘             │    │   │
│ is_completed│ │ content     │ │ url         │    │   │
│ note        │ │ created_at  │ │ title       │    │   │
│ sort_order  │ │ updated_at  │ │ description │    │   │
│ created_at  │ └─────────────┘ │ created_at  │    │   │
│ updated_at  │                 └─────────────┘    │   │
└─────────────┘                                    │   │
                                                   │   │
┌─────────────────────────────────────────────────┐│   │
│                  api_keys                       ││   │
├─────────────────────────────────────────────────┤│   │
│ id (PK)                                         ││   │
│ user_id (FK) ←───────────────────────────────────┘   │
│ key_hash                                        │    │
│ name                                            │    │
│ last_used_at                                    │    │
│ created_at                                      │    │
└─────────────────────────────────────────────────┘    │
                                                       │
┌─────────────────────────────────────────────────┐    │
│              BetterAuth Tables                  │    │
├─────────────────────────────────────────────────┤    │
│ user (認証用)            ←───────────────────────────┘
│ session                                         │
│ account                                         │
│ verification                                    │
└─────────────────────────────────────────────────┘
```

## テーブル定義

### users

アプリケーション固有のユーザー情報。BetterAuthの`user`テーブルと1:1関係。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| email | TEXT | UNIQUE, NOT NULL | メールアドレス |
| name | TEXT | | 表示名 |
| created_at | INTEGER | NOT NULL | 作成日時(Unix timestamp) |
| updated_at | INTEGER | NOT NULL | 更新日時(Unix timestamp) |

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### entries

1日のログエントリ。ユーザーごとに日付でユニーク。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| user_id | TEXT | FK, NOT NULL | ユーザーID |
| date | TEXT | NOT NULL | 日付 (YYYY-MM-DD) |
| score | INTEGER | | 満足度スコア (1-10) |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (user_id, date)
);
```

### todos

エントリに紐づくTo Doリスト。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| entry_id | TEXT | FK, NOT NULL | エントリID |
| content | TEXT | NOT NULL | To Do内容 |
| is_completed | INTEGER | NOT NULL, DEFAULT 0 | 完了フラグ (0/1) |
| note | TEXT | | メモ・学び |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 並び順 |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |

```sql
CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### categories

ユーザー定義のノートカテゴリ。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| user_id | TEXT | FK, NOT NULL | ユーザーID |
| name | TEXT | NOT NULL | カテゴリ名 |
| color | TEXT | | 表示色 (HEX) |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 並び順 |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (user_id, name)
);
```

### notes

自由記述ノート。カテゴリは任意。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| entry_id | TEXT | FK, NOT NULL | エントリID |
| category_id | TEXT | FK | カテゴリID (nullable) |
| content | TEXT | NOT NULL | 記述内容 |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### links

参考リンク。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| entry_id | TEXT | FK, NOT NULL | エントリID |
| url | TEXT | NOT NULL | URL |
| title | TEXT | | リンクタイトル |
| description | TEXT | | 説明 |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### api_keys

MCP用APIキー。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | ULID |
| user_id | TEXT | FK, NOT NULL | ユーザーID |
| key_hash | TEXT | NOT NULL | ハッシュ化キー |
| name | TEXT | NOT NULL | キー名称 |
| last_used_at | INTEGER | | 最終使用日時 |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

## インデックス

```sql
-- エントリ検索の高速化
CREATE INDEX idx_entries_user_date ON entries(user_id, date);
CREATE INDEX idx_entries_date ON entries(date);

-- To Do検索
CREATE INDEX idx_todos_entry ON todos(entry_id);

-- ノート検索
CREATE INDEX idx_notes_entry ON notes(entry_id);
CREATE INDEX idx_notes_category ON notes(category_id);

-- リンク検索
CREATE INDEX idx_links_entry ON links(entry_id);

-- カテゴリ検索
CREATE INDEX idx_categories_user ON categories(user_id);

-- APIキー検索
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

## Drizzle Schema

```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  score: integer('score'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userDateIdx: uniqueIndex('idx_entries_user_date').on(table.userId, table.date),
  dateIdx: index('idx_entries_date').on(table.date),
}));

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  note: text('note'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  entryIdx: index('idx_todos_entry').on(table.entryId),
}));

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('idx_categories_user').on(table.userId),
  userNameIdx: uniqueIndex('idx_categories_user_name').on(table.userId, table.name),
}));

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  entryIdx: index('idx_notes_entry').on(table.entryId),
  categoryIdx: index('idx_notes_category').on(table.categoryId),
}));

export const links = sqliteTable('links', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  entryIdx: index('idx_links_entry').on(table.entryId),
}));

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  name: text('name').notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('idx_api_keys_user').on(table.userId),
  hashIdx: index('idx_api_keys_hash').on(table.keyHash),
}));
```

## リレーション定義

```typescript
// lib/db/relations.ts
import { relations } from 'drizzle-orm';
import { users, entries, todos, categories, notes, links, apiKeys } from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  entries: many(entries),
  categories: many(categories),
  apiKeys: many(apiKeys),
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
```

## マイグレーション

```bash
# マイグレーション生成
pnpm drizzle-kit generate

# マイグレーション適用
pnpm drizzle-kit push

# スタジオ起動（DB確認用）
pnpm drizzle-kit studio
```

## LocalStorage構造（未認証時）

DBスキーマと同一構造で保存し、認証後のマイグレーションを容易にする。

```typescript
interface LocalStorageEntry {
  id: string;          // 一時ULID
  date: string;        // YYYY-MM-DD
  score: number | null;
  todos: {
    id: string;
    content: string;
    isCompleted: boolean;
    note: string | null;
    sortOrder: number;
  }[];
  notes: {
    id: string;
    categoryId: string | null;
    content: string;
  }[];
  links: {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
  }[];
  createdAt: number;
  updatedAt: number;
}

// LocalStorageキー
const STORAGE_KEY = 'lifelog_draft';
```
