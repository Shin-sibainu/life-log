# API設計

## 概要

LifeLogのAPIは2種類のエンドポイントを提供します：

1. **内部API** (`/api/*`) - フロントエンドから使用
2. **MCP用API** (`/api/v1/*`) - 外部AIクライアントから使用

## 認証

### 内部API

- BetterAuthのセッション認証を使用
- HTTPOnly Cookieでセッション管理
- 未認証の場合は401を返却

### MCP用API

- APIキー認証
- `Authorization: Bearer <api_key>` ヘッダーで送信
- 無効なキーの場合は401を返却
- レート制限: 100 req/min

---

## 内部API

### エントリ操作

#### GET /api/entries

今日のエントリを取得。存在しない場合は空のエントリを返却。

**Response**
```json
{
  "entry": {
    "id": "01HXYZ...",
    "date": "2024-01-15",
    "score": 7,
    "todos": [
      {
        "id": "01HXYZ...",
        "content": "設計書を書く",
        "isCompleted": true,
        "note": "Drizzleの使い方を学んだ",
        "sortOrder": 0
      }
    ],
    "notes": [
      {
        "id": "01HXYZ...",
        "categoryId": "01HXYZ...",
        "categoryName": "学び",
        "content": "SQLiteのインデックス設計について調査した"
      }
    ],
    "links": [
      {
        "id": "01HXYZ...",
        "url": "https://example.com/article",
        "title": "参考記事",
        "description": null
      }
    ],
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T18:30:00Z"
  }
}
```

#### GET /api/entries/:date

指定日のエントリを取得。

**Parameters**
- `date`: YYYY-MM-DD形式

**Response**: 上記と同じ

#### POST /api/entries

エントリを作成または更新（upsert）。

**Request**
```json
{
  "date": "2024-01-15",
  "score": 7,
  "todos": [
    {
      "id": "01HXYZ...",
      "content": "設計書を書く",
      "isCompleted": true,
      "note": "Drizzleの使い方を学んだ",
      "sortOrder": 0
    }
  ],
  "notes": [
    {
      "categoryId": "01HXYZ...",
      "content": "SQLiteのインデックス設計について調査した"
    }
  ],
  "links": [
    {
      "url": "https://example.com/article",
      "title": "参考記事"
    }
  ]
}
```

**Response**
```json
{
  "entry": { ... },
  "message": "保存しました"
}
```

### カテゴリ操作

#### GET /api/categories

カテゴリ一覧を取得。

**Response**
```json
{
  "categories": [
    {
      "id": "01HXYZ...",
      "name": "学び",
      "color": "#3B82F6",
      "sortOrder": 0
    },
    {
      "id": "01HXYZ...",
      "name": "気づき",
      "color": "#10B981",
      "sortOrder": 1
    }
  ]
}
```

#### POST /api/categories

カテゴリを作成。

**Request**
```json
{
  "name": "読書",
  "color": "#8B5CF6"
}
```

**Response**
```json
{
  "category": {
    "id": "01HXYZ...",
    "name": "読書",
    "color": "#8B5CF6",
    "sortOrder": 2
  }
}
```

#### PATCH /api/categories/:id

カテゴリを更新。

**Request**
```json
{
  "name": "読書メモ",
  "color": "#A855F7"
}
```

#### DELETE /api/categories/:id

カテゴリを削除。関連ノートの`categoryId`はnullになる。

### ローカルデータ移行

#### POST /api/entries/migrate

LocalStorageのデータをDBに移行。

**Request**
```json
{
  "entries": [
    {
      "date": "2024-01-15",
      "score": 7,
      "todos": [...],
      "notes": [...],
      "links": [...]
    }
  ]
}
```

**Response**
```json
{
  "migratedCount": 3,
  "message": "3件のエントリを移行しました"
}
```

### APIキー管理

#### GET /api/settings/api-keys

APIキー一覧を取得（キー本体は返さない）。

**Response**
```json
{
  "apiKeys": [
    {
      "id": "01HXYZ...",
      "name": "Claude用",
      "lastUsedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings/api-keys

新しいAPIキーを生成。

**Request**
```json
{
  "name": "開発用"
}
```

**Response**
```json
{
  "apiKey": {
    "id": "01HXYZ...",
    "name": "開発用",
    "key": "ll_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "message": "このキーは一度しか表示されません"
}
```

#### DELETE /api/settings/api-keys/:id

APIキーを削除。

---

## MCP用API (v1)

全てのエンドポイントで`Authorization: Bearer <api_key>`が必要。

### GET /api/v1/entries

期間指定でエントリ一覧を取得。

**Query Parameters**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| from | string | No | 開始日 (YYYY-MM-DD) |
| to | string | No | 終了日 (YYYY-MM-DD) |
| limit | number | No | 取得件数 (default: 30, max: 100) |
| offset | number | No | オフセット (default: 0) |

**Response**
```json
{
  "entries": [
    {
      "id": "01HXYZ...",
      "date": "2024-01-15",
      "score": 7,
      "todoCount": 5,
      "completedTodoCount": 3,
      "noteCount": 2,
      "linkCount": 1
    }
  ],
  "total": 100,
  "hasMore": true
}
```

### GET /api/v1/entries/:date

特定日のエントリ詳細を取得。

**Response**
```json
{
  "entry": {
    "id": "01HXYZ...",
    "date": "2024-01-15",
    "score": 7,
    "todos": [
      {
        "content": "設計書を書く",
        "isCompleted": true,
        "note": "Drizzleの使い方を学んだ"
      }
    ],
    "notes": [
      {
        "category": "学び",
        "content": "SQLiteのインデックス設計について調査した"
      }
    ],
    "links": [
      {
        "url": "https://example.com/article",
        "title": "参考記事"
      }
    ]
  }
}
```

### GET /api/v1/entries/search

全文検索。

**Query Parameters**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| q | string | Yes | 検索キーワード |
| from | string | No | 開始日 |
| to | string | No | 終了日 |
| limit | number | No | 取得件数 (default: 20) |

**Response**
```json
{
  "results": [
    {
      "date": "2024-01-15",
      "matches": [
        {
          "type": "todo",
          "content": "設計書を書く",
          "highlight": "**設計**書を書く"
        },
        {
          "type": "note",
          "category": "学び",
          "content": "SQLiteの設計について...",
          "highlight": "SQLiteの**設計**について..."
        }
      ]
    }
  ],
  "total": 5
}
```

### GET /api/v1/stats

統計情報を取得。

**Query Parameters**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| from | string | No | 開始日 |
| to | string | No | 終了日 |

**Response**
```json
{
  "stats": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "score": {
      "average": 6.8,
      "min": 3,
      "max": 10,
      "trend": [
        { "date": "2024-01-01", "score": 7 },
        { "date": "2024-01-02", "score": 6 }
      ]
    },
    "activity": {
      "totalEntries": 25,
      "totalTodos": 120,
      "completedTodos": 95,
      "completionRate": 0.79,
      "totalNotes": 50,
      "totalLinks": 30
    },
    "categories": [
      {
        "name": "学び",
        "noteCount": 25
      },
      {
        "name": "気づき",
        "noteCount": 15
      }
    ]
  }
}
```

### GET /api/v1/categories

カテゴリ一覧を取得。

**Response**
```json
{
  "categories": [
    {
      "id": "01HXYZ...",
      "name": "学び",
      "noteCount": 25
    }
  ]
}
```

### GET /api/v1/notes

カテゴリ別ノートを取得。

**Query Parameters**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| category_id | string | No | カテゴリID |
| from | string | No | 開始日 |
| to | string | No | 終了日 |
| limit | number | No | 取得件数 (default: 50) |

**Response**
```json
{
  "notes": [
    {
      "date": "2024-01-15",
      "category": "学び",
      "content": "SQLiteのインデックス設計について調査した"
    }
  ],
  "total": 25
}
```

---

## MCPサーバー

### ツール定義

```typescript
// mcp/server.ts
const tools = [
  {
    name: "get_entries",
    description: "指定期間のライフログエントリを取得します",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "開始日 (YYYY-MM-DD)" },
        to: { type: "string", description: "終了日 (YYYY-MM-DD)" },
        limit: { type: "number", description: "取得件数" }
      }
    }
  },
  {
    name: "get_entry",
    description: "特定日のライフログ詳細を取得します",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "日付 (YYYY-MM-DD)" }
      },
      required: ["date"]
    }
  },
  {
    name: "search_logs",
    description: "ライフログを全文検索します",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "検索キーワード" },
        from: { type: "string", description: "開始日" },
        to: { type: "string", description: "終了日" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_stats",
    description: "スコアや活動の統計情報を取得します",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "開始日" },
        to: { type: "string", description: "終了日" }
      }
    }
  },
  {
    name: "get_notes_by_category",
    description: "カテゴリ別のノートを取得します",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "カテゴリ名" },
        from: { type: "string", description: "開始日" },
        to: { type: "string", description: "終了日" }
      }
    }
  }
];
```

### 使用例

```
User: 先週の学びを教えて
AI: [get_notes_by_category({ category: "学び", from: "2024-01-08", to: "2024-01-14" })]

User: 最近スコアが低い日はある？
AI: [get_stats({ from: "2024-01-01", to: "2024-01-15" })]

User: Drizzleについて何か書いた？
AI: [search_logs({ query: "Drizzle" })]
```

---

## エラーレスポンス

全てのAPIで共通のエラーフォーマットを使用。

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

### エラーコード

| コード | HTTPステータス | 説明 |
|--------|----------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | アクセス権限がない |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | バリデーションエラー |
| RATE_LIMITED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

### バリデーションエラー

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "date",
        "message": "日付はYYYY-MM-DD形式で入力してください"
      }
    ]
  }
}
```
