#!/usr/bin/env node
/**
 * LifeLog MCP Server
 *
 * This MCP server provides tools for AI clients to access LifeLog data.
 *
 * Setup:
 * 1. Generate an API key in LifeLog settings
 * 2. Add to your MCP config:
 *
 * {
 *   "mcpServers": {
 *     "lifelog": {
 *       "type": "http",
 *       "url": "https://your-lifelog.vercel.app/api/v1",
 *       "headers": {
 *         "Authorization": "Bearer ll_your_api_key"
 *       }
 *     }
 *   }
 * }
 */

interface LifeLogConfig {
  apiUrl: string;
  apiKey: string;
}

// Tool definitions for MCP
export const tools = [
  {
    name: 'get_entries',
    description: '指定期間のライフログエントリを取得します。日付範囲を指定して、その期間の記録一覧を取得できます。',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: '開始日 (YYYY-MM-DD形式)',
        },
        to: {
          type: 'string',
          description: '終了日 (YYYY-MM-DD形式)',
        },
        limit: {
          type: 'number',
          description: '取得件数 (デフォルト: 30, 最大: 100)',
        },
      },
    },
  },
  {
    name: 'get_entry',
    description: '特定日のライフログ詳細を取得します。To Do、ノート、リンク、スコアを含む完全な情報を取得できます。',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: '日付 (YYYY-MM-DD形式)',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'search_logs',
    description: 'ライフログを全文検索します。キーワードに一致するTo Doやノートを検索できます。',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '検索キーワード',
        },
        from: {
          type: 'string',
          description: '開始日 (YYYY-MM-DD形式)',
        },
        to: {
          type: 'string',
          description: '終了日 (YYYY-MM-DD形式)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_stats',
    description: 'スコアや活動の統計情報を取得します。平均スコア、To Do完了率、カテゴリ別の統計などを取得できます。',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: '開始日 (YYYY-MM-DD形式)',
        },
        to: {
          type: 'string',
          description: '終了日 (YYYY-MM-DD形式)',
        },
      },
    },
  },
  {
    name: 'get_notes_by_category',
    description: 'カテゴリ別のノートを取得します。特定のカテゴリに属するノートを期間指定で取得できます。',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'カテゴリ名',
        },
        from: {
          type: 'string',
          description: '開始日 (YYYY-MM-DD形式)',
        },
        to: {
          type: 'string',
          description: '終了日 (YYYY-MM-DD形式)',
        },
      },
    },
  },
];

// API client for LifeLog
export class LifeLogClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: LifeLogConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async fetch(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.apiUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getEntries(params: { from?: string; to?: string; limit?: number }) {
    return this.fetch('/entries', {
      from: params.from || '',
      to: params.to || '',
      limit: params.limit?.toString() || '',
    });
  }

  async getEntry(date: string) {
    return this.fetch(`/entries/${date}`);
  }

  async searchLogs(params: { query: string; from?: string; to?: string }) {
    return this.fetch('/entries/search', {
      q: params.query,
      from: params.from || '',
      to: params.to || '',
    });
  }

  async getStats(params: { from?: string; to?: string }) {
    return this.fetch('/stats', {
      from: params.from || '',
      to: params.to || '',
    });
  }

  async getCategories() {
    return this.fetch('/categories');
  }

  async getNotesByCategory(params: { categoryId?: string; from?: string; to?: string }) {
    return this.fetch('/notes', {
      category_id: params.categoryId || '',
      from: params.from || '',
      to: params.to || '',
    });
  }
}

// Tool handler
export async function handleToolCall(
  client: LifeLogClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'get_entries':
      return client.getEntries({
        from: args.from as string | undefined,
        to: args.to as string | undefined,
        limit: args.limit as number | undefined,
      });

    case 'get_entry':
      return client.getEntry(args.date as string);

    case 'search_logs':
      return client.searchLogs({
        query: args.query as string,
        from: args.from as string | undefined,
        to: args.to as string | undefined,
      });

    case 'get_stats':
      return client.getStats({
        from: args.from as string | undefined,
        to: args.to as string | undefined,
      });

    case 'get_notes_by_category': {
      // First get categories to find the ID
      const { categories } = await client.getCategories();
      const category = categories.find(
        (c: { name: string }) => c.name === args.category
      );

      return client.getNotesByCategory({
        categoryId: category?.id,
        from: args.from as string | undefined,
        to: args.to as string | undefined,
      });
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Generate MCP config for user
export function generateMcpConfig(apiUrl: string, apiKey: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        lifelog: {
          type: 'http',
          url: `${apiUrl}/api/v1`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );
}
