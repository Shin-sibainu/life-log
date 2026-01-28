import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-900">LifeLog</span>
          </div>
          <nav className="flex gap-6">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              機能
            </Link>
            <Link href="#mcp" className="text-sm text-gray-600 hover:text-gray-900">
              MCP連携
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              利用規約
            </Link>
          </nav>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LifeLog
          </p>
        </div>
      </div>
    </footer>
  );
}
