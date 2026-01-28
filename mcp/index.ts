#!/usr/bin/env npx tsx
/**
 * LifeLog MCP Server (stdio)
 *
 * Run with: npx tsx mcp/index.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.LIFELOG_API_URL || 'http://localhost:3000';
const API_KEY = process.env.LIFELOG_API_KEY || '';

if (!API_KEY) {
  console.error('LIFELOG_API_KEY environment variable is required');
  process.exit(1);
}

async function fetchApi(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${API_URL}/api/v1${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function postApi(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

const server = new Server(
  {
    name: 'lifelog',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_entries',
      description: '指定期間のライフログエントリを取得します。日付範囲を指定して、その期間の記録一覧を取得できます。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: '開始日 (YYYY-MM-DD形式)' },
          to: { type: 'string', description: '終了日 (YYYY-MM-DD形式)' },
          limit: { type: 'number', description: '取得件数 (デフォルト: 30, 最大: 100)' },
        },
      },
    },
    {
      name: 'get_entry',
      description: '特定日のライフログ詳細を取得します。To Do、ノート、リンク、スコアを含む完全な情報を取得できます。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          date: { type: 'string', description: '日付 (YYYY-MM-DD形式)' },
        },
        required: ['date'],
      },
    },
    {
      name: 'search_logs',
      description: 'ライフログを全文検索します。キーワードに一致するTo Doやノートを検索できます。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: '検索キーワード' },
          from: { type: 'string', description: '開始日 (YYYY-MM-DD形式)' },
          to: { type: 'string', description: '終了日 (YYYY-MM-DD形式)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_stats',
      description: 'スコアや活動の統計情報を取得します。平均スコア、To Do完了率、満足度のトレンドなどを取得できます。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: '開始日 (YYYY-MM-DD形式)' },
          to: { type: 'string', description: '終了日 (YYYY-MM-DD形式)' },
        },
      },
    },
    {
      name: 'add_todo',
      description: 'ライフログにTodoを追加します。日付を省略すると今日の日付になります。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          content: { type: 'string', description: 'Todoの内容' },
          date: { type: 'string', description: '日付 (YYYY-MM-DD形式、省略可)' },
          note: { type: 'string', description: '補足メモ (省略可)' },
        },
        required: ['content'],
      },
    },
    {
      name: 'add_note',
      description: 'ライフログにメモを追加します。カテゴリを指定できます。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          content: { type: 'string', description: 'メモの内容' },
          date: { type: 'string', description: '日付 (YYYY-MM-DD形式、省略可)' },
          category: { type: 'string', description: 'カテゴリ名 (省略可)' },
        },
        required: ['content'],
      },
    },
    {
      name: 'get_incomplete_todos',
      description: '未完了のTodo一覧を取得します。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          limit: { type: 'number', description: '取得件数 (デフォルト: 50)' },
        },
      },
    },
    {
      name: 'get_mood_trend',
      description: '満足度の推移を取得します。期間を指定して、日ごとのスコア変化を分析できます。',
      inputSchema: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: '開始日 (YYYY-MM-DD形式)' },
          to: { type: 'string', description: '終了日 (YYYY-MM-DD形式)' },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'get_entries':
        result = await fetchApi('/entries', {
          from: (args?.from as string) || '',
          to: (args?.to as string) || '',
          limit: args?.limit?.toString() || '',
        });
        break;

      case 'get_entry':
        result = await fetchApi(`/entries/${args?.date}`);
        break;

      case 'search_logs':
        result = await fetchApi('/entries/search', {
          q: args?.query as string,
          from: (args?.from as string) || '',
          to: (args?.to as string) || '',
        });
        break;

      case 'get_stats':
        result = await fetchApi('/stats', {
          from: (args?.from as string) || '',
          to: (args?.to as string) || '',
        });
        break;

      case 'add_todo':
        result = await postApi('/todos', {
          date: (args?.date as string) || getTodayDate(),
          content: args?.content as string,
          note: args?.note as string | undefined,
        });
        break;

      case 'add_note':
        result = await postApi('/notes', {
          date: (args?.date as string) || getTodayDate(),
          content: args?.content as string,
          category: args?.category as string | undefined,
        });
        break;

      case 'get_incomplete_todos':
        result = await fetchApi('/todos', {
          limit: args?.limit?.toString() || '50',
        });
        break;

      case 'get_mood_trend': {
        const stats = await fetchApi('/stats', {
          from: (args?.from as string) || '',
          to: (args?.to as string) || '',
        });
        // Extract mood trend from stats
        const trend = stats.stats?.score?.trend || [];
        const avg = stats.stats?.score?.average;
        result = {
          trend,
          average: avg,
          summary: trend.length > 0
            ? `期間内の平均満足度: ${avg}/10、${trend.length}日分のデータ`
            : 'データがありません',
        };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LifeLog MCP Server running on stdio');
}

main().catch(console.error);
