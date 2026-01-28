# [04] LocalStorageユーティリティ

## Description
未認証ユーザー用のLocalStorageデータ管理機能を実装する。

## Acceptance Criteria
- [ ] lib/local-storage.tsにCRUD関数
- [ ] hooks/use-local-storage.tsにReactフック
- [ ] DBスキーマと同一構造で保存
- [ ] 認証後のDB移行API

## Technical Notes
- LocalStorage構造はDBと同一
- データ移行時にULIDを再生成
- 移行後はLocalStorageをクリア

## Status
- [ ] Not Started
- [ ] In Progress
- [ ] Review
- [ ] Done
