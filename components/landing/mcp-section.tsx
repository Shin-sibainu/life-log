export function McpSection() {
  return (
    <section id="mcp" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">MCP連携</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            AIがあなたの記録を活用
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Model Context Protocol (MCP) に対応。Claude などのAIクライアントから、
            あなたのライフログに直接アクセスできます。
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">検索</h3>
              <p className="mt-4 text-gray-600">
                「先週Drizzleについて何を学んだ？」<br />
                AIが過去の記録から関連する情報を検索。
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">分析</h3>
              <p className="mt-4 text-gray-600">
                「最近の傾向を教えて」<br />
                スコア推移やカテゴリ別の統計情報を取得。
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">コンテキスト</h3>
              <p className="mt-4 text-gray-600">
                「今日何をすべき？」<br />
                過去の行動パターンから最適な提案を生成。
              </p>
            </div>
          </div>
        </div>
        <div className="mt-16 rounded-2xl bg-gray-900 p-8 text-gray-100">
          <h3 className="text-lg font-semibold">使い方</h3>
          <pre className="mt-4 overflow-x-auto text-sm">
{`// MCP設定 (.mcp.json)
{
  "mcpServers": {
    "lifelog": {
      "type": "http",
      "url": "https://your-lifelog.vercel.app/api/v1",
      "headers": {
        "Authorization": "Bearer ll_your_api_key"
      }
    }
  }
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}
