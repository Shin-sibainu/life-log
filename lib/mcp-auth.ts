import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from './api-key';

export type McpAuthResult = {
  userId: string;
};

export async function mcpAuth(req: NextRequest): Promise<McpAuthResult | NextResponse> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'APIキーが必要です' },
    }, { status: 401 });
  }

  const apiKey = authHeader.slice(7);
  const result = await verifyApiKey(apiKey);

  if (!result) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: '無効なAPIキーです' },
    }, { status: 401 });
  }

  return result;
}
