# [05] エントリAPI実装

## Description
エントリのCRUD操作用APIを実装する。

## Acceptance Criteria
- [ ] GET /api/entries - 今日のエントリ取得
- [ ] GET /api/entries/:date - 指定日のエントリ取得
- [ ] POST /api/entries - エントリ作成/更新 (upsert)
- [ ] POST /api/entries/migrate - LocalStorageデータ移行
- [ ] Zodによるバリデーション

## Technical Notes
- todos, notes, linksも一括で操作
- トランザクション使用
- user_id + dateでupsert

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Review
- [ ] Done
