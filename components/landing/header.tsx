'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              LifeLog
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              機能
            </Link>
            <Link href="#mcp" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              MCP連携
            </Link>
            <Link href="#privacy" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              プライバシー
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/try">
              <Button size="sm">
                始める
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
