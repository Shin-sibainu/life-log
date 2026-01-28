# [06] カテゴリAPI実装

## Description
カテゴリのCRUD操作用APIを実装する。

## Acceptance Criteria
- [ ] GET /api/categories - 一覧取得
- [ ] POST /api/categories - 作成
- [ ] PATCH /api/categories/:id - 更新
- [ ] DELETE /api/categories/:id - 削除

## Technical Notes
- ユーザーごとにユニーク (user_id + name)
- 削除時は関連notesのcategory_idをnullに

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Review
- [ ] Done
