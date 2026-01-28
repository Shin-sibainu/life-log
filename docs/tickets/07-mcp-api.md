# [07] MCP用API実装

## Description
外部AIクライアント用のREST APIを実装する。

## Acceptance Criteria
- [ ] APIキー認証ミドルウェア
- [ ] GET /api/v1/entries - 期間指定取得
- [ ] GET /api/v1/entries/:date - 詳細取得
- [ ] GET /api/v1/entries/search - 全文検索
- [ ] GET /api/v1/stats - 統計情報
- [ ] GET /api/v1/categories - カテゴリ一覧
- [ ] GET /api/v1/notes - カテゴリ別ノート

## Technical Notes
- Authorization: Bearer <api_key>
- レート制限: 100 req/min
- レスポンスはAI向けに最適化

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Review
- [ ] Done
