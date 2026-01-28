# LifeLog 要件定義書

## 1. サービス概要

**コンセプト**: 1日の行動・学び・気づきを記録し、AIが活用できる「資産としての日記」

**コアバリュー**:
- 毎日のTo Doと振り返りを1箇所に集約
- MCP連携でAIが過去のライフログを分析・活用可能
- 定量的な自己評価（スコア）による行動分析

---

## 2. 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) |
| CSS | TASO |
| 認証 | BetterAuth |
| 決済 | Stripe |
| ORM | Drizzle ORM |
| DB | Turso (SQLite) |
| グラフ | Recharts or Chart.js |
| API | Next.js Route Handlers (MCP用) |

---

## 3. ユーザーフロー

```
LP → 新規作成（認証なし、ローカル保存）→ 保存時に認証促す → アカウント作成 → ローカルデータをDBへ移行 → ダッシュボード
```

**ポイント**:
- 認証なしで即座に体験可能
- ローカルストレージに一時保存
- 認証後、書いた内容をそのままDBへマイグレーション

---

## 4. 画面構成

### 4.1 LP（ランディングページ）
- サービス紹介
- 特徴説明（MCP連携、AI活用など）
- 「今すぐ始める」CTA → 認証なしでエントリ作成画面へ

### 4.2 ダッシュボード（メイン画面）

**レイアウト**: サイドバー + メインコンテンツ

**サイドバー**:
- ミニカレンダー（日付選択）
- ナビゲーション
  - 今日のログ
  - カレンダー（全体表示）
  - 分析・グラフ
  - 設定
  - （将来）MCP設定

**メインコンテンツ（今日のログ）**:
- 日付表示
- To Doリスト
  - To Do追加
  - 完了/未完了チェックボックス
  - 各To Doの横に自由記述エリア
- 自由記述セクション
  - カテゴリ選択（ユーザーがカテゴリ追加可能）
  - テキストエリア
  - リンク追加機能（技術記事、参考URLなど）
- 1日の総合満足度スコア（1〜10）
- 保存ボタン

### 4.3 カレンダー画面
- 月表示カレンダー
- 各日付クリックで該当日のログへ遷移
- スコアに応じた色分け表示（オプション）

### 4.4 分析・グラフ画面
- スコア推移グラフ（日次）
- 週平均・月平均
- カテゴリ別の記述頻度（オプション）

### 4.5 設定画面
- プロフィール編集
- カテゴリ管理（追加・編集・削除）
- アカウント削除
- （将来）Stripe連携、プラン管理

---

## 5. データモデル

### users
| カラム | 型 | 説明 |
|--------|-----|------|
| id | TEXT (ULID) | PK |
| email | TEXT | メールアドレス |
| name | TEXT | 表示名 |
| created_at | INTEGER | 作成日時 |
| updated_at | INTEGER | 更新日時 |

### entries（1日のログ）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | TEXT (ULID) | PK |
| user_id | TEXT | FK → users |
| date | TEXT | 日付 (YYYY-MM-DD) |
| score | INTEGER | 満足度スコア (1-10) |
| created_at | INTEGER | 作成日時 |
| updated_at | INTEGER | 更新日時 |

**UNIQUE制約**: (user_id, date)

### todos
| カラム | 型 | 説明 |
|--------|-----|------|
| id | TEXT (ULID) | PK |
| entry_id | TEXT | FK → entries |
| content | TEXT | To Do内容 |
| is_completed | INTEGER | 完了フラグ (0/1) |
| note | TEXT | 自由記述（学び、困ったことなど） |
| sort_order | INTEGER | 並び順 |
| created_at | INTEGER | 作成日時 |
| updated_at | INTEGER | 更新日時 |

### categories
| カラム | 型 | 説明 |
|--------|-----|------|
| id | TEXT (ULID) | PK |
| user_id | TEXT | FK → users |
| name | TEXT | カテゴリ名 |
| color | TEXT | 表示色（オプション） |
| sort_order | INTEGER | 並び順 |
| created_at | INTEGER | 作成日時 |

### notes（自由記述）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | TEXT (ULID) | PK |
| entry_id | TEXT | FK → entries |
| category_id | TEXT | FK → categories (nullable) |
| content | TEXT | 記述内容 |
| created_at | INTEGER | 作成日時 |
| updated_at | INTEGER | 更新日時 |

### links（参考リンク）
| カラム | 型 | 説明 |
|--------|-----|------|
| id | TEXT (ULID) | PK |
| entry_id | TEXT | FK → entries |
| url | TEXT | URL |
| title | TEXT | リンクタイトル（オプション） |
| description | TEXT | 説明（オプション） |
| created_at | INTEGER | 作成日時 |

---

## 6. API設計（MCP用）

### 認証
- APIキー認証（ユーザーごとに発行）

### エンドポイント

```
GET  /api/v1/entries
     ?from=YYYY-MM-DD&to=YYYY-MM-DD
     → 指定期間のエントリ一覧

GET  /api/v1/entries/:date
     → 特定日のエントリ詳細（todos, notes, links含む）

GET  /api/v1/entries/search
     ?q=検索キーワード
     → 全文検索

GET  /api/v1/stats
     ?from=YYYY-MM-DD&to=YYYY-MM-DD
     → 期間内のスコア統計（平均、最高、最低、推移）

GET  /api/v1/categories
     → カテゴリ一覧

GET  /api/v1/notes
     ?category_id=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
     → カテゴリ別ノート取得
```

### MCPサーバー実装
- 上記APIをラップするMCPサーバーを提供
- ユーザーが自分のAPIキーを設定して利用
- ツール例:
  - `get_entries`: 期間指定でエントリ取得
  - `search_logs`: キーワード検索
  - `get_stats`: 統計情報取得
  - `get_notes_by_category`: カテゴリ別ノート取得

---

## 7. 認証フロー詳細

### 未認証状態
1. ローカルストレージにエントリデータを保存
2. 構造はDBスキーマと同一（マイグレーション容易化）
3. 保存ボタン押下時 or 一定時間経過で認証モーダル表示

### 認証時
1. BetterAuthでサインアップ/ログイン
2. ローカルストレージのデータを取得
3. APIでDBへ一括保存
4. ローカルストレージをクリア
5. ダッシュボードへリダイレクト

---

## 8. 将来の拡張（Phase 2以降）

- **Stripe決済**: プレミアムプラン（長期データ保持、高度な分析）
- **エクスポート機能**: JSON/CSV/Markdownでのデータエクスポート
- **インポート機能**: 他サービスからのマイグレーション
- **リマインダー**: 毎日の記録を促す通知
- **テンプレート**: よく使うTo Doセットの保存
- **タグ機能**: エントリ横断でのタグ付け
- **AI分析ダッシュボード**: MCP経由ではなくアプリ内でAI分析

---

## 9. MVP スコープ

### 含む
- LP
- 認証（BetterAuth）
- ローカル保存 → DB移行フロー
- ダッシュボード（To Do、自由記述、リンク、スコア）
- カレンダー画面
- 基本的なグラフ（スコア推移）
- カテゴリ管理
- MCP用API
- MCPサーバー（基本機能）

### 含まない（Phase 2）
- Stripe決済
- エクスポート/インポート
- リマインダー
- テンプレート
- タグ機能

---

## 10. 非機能要件

- **レスポンシブ**: モバイル対応（ただしデスクトップ優先）
- **パフォーマンス**: エントリ取得は100ms以内目標
- **セキュリティ**: APIキーはハッシュ化して保存、HTTPS必須
- **データ保持**: 無料プランでも無期限保持（MVP時点）