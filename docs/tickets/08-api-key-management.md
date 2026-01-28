# [08] APIキー管理実装

## Description
MCP用APIキーの生成・管理機能を実装する。

## Acceptance Criteria
- [ ] lib/api-key.tsにキー生成・検証ロジック
- [ ] GET /api/settings/api-keys - 一覧取得
- [ ] POST /api/settings/api-keys - 新規生成
- [ ] DELETE /api/settings/api-keys/:id - 削除
- [ ] キーはSHA-256でハッシュ化して保存

## Technical Notes
- キーフォーマット: ll_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- 生成時のみ平文を返却
- last_used_atを自動更新

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Review
- [ ] Done
