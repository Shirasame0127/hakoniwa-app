# Project: AI箱庭ライフOS（仮）- 開発ガイド

## プロジェクト概要
3D箱庭Webアプリケーション。ユーザーの日常生活データ（食材、運動、所有物）をAIが連携して管理し、3D箱庭環境に反映させる。

## Notion ドキュメント
- 📂 [ディレクトリ構成案](https://www.notion.so/3392eb5294478142922addb585aeaa13)
- ⚡ [justコマンド集・起動手順書](https://www.notion.so/3392eb52944781ce9dc5c358e23eeaab)
- 📝 [アプリ構成・機能仕様書](https://www.notion.so/3392eb52944781c5a346f6561e21e736)

## 開発環境セットアップ

```bash
# 1. リポジトリをクローン（済み）
# 2. 初回セットアップ
just setup

# または個別実行
just setup-env && pnpm install && cd backend && pip install -r requirements.txt
just db-up && sleep 3 && just migrate && just seed
```

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `just up` | フロント+バック全起動 |
| `just dev-front` | フロント開発サーバのみ |
| `just dev-back` | バック開発サーバのみ（DB付き） |
| `just test` | 全テスト実行 |
| `just lint` | 全リント実行 |
| `just format` | フォーマット実行 |

詳細は `justfile` または Notion の justコマンド集 を参照。

## ディレクトリ重要ルール

### 依存ルール
```
✅ OK:   features/food → shared/api
✅ OK:   pages → features
✅ OK:   widgets → shared
❌ NG:   features/food → features/garden  (直接依存禁止)
❌ NG:   shared → features                (逆層禁止)
```

### 構成の原則
- **features/**: 各機能は独立して、他機能と直接関係しない
- **pages/**: featuresを組み合わせてページを構成
- **widgets/**: 複数features が共用する UI
- **shared/**: API、型、ユーティリティなど全体共用

## 技術スタック仕様

### フロントエンド
- Next.js 14 (App Router)
- React Three Fiber + Three.js
- Zustand
- Tailwind CSS
- TanStack Query
- TypeScript

### バックエンド
- FastAPI
- PostgreSQL 16
- SQLAlchemy 2.0
- Alembic (マイグレーション)
- Claude API + LangGraph

## API エンドポイント（主要）

- `GET /api/garden` - 箱庭取得
- `POST /api/garden/objects` - オブジェクト追加
- `POST /api/food` - 食材登録
- `POST /api/exercise` - 運動記録
- `POST /api/ai/suggest` - AI提案

詳細は README.md や Notion アプリ構成・機能仕様書 を参照。

## 初期データテーブル

```sql
-- ユーザー
table users (id uuid primary key, created_at timestamp)

-- 箱庭
table garden_states (user_id uuid, level int, exp int, environment jsonb)
table garden_objects (id uuid, user_id uuid, type text, position jsonb, model_path text)

-- 食材
table food_items (id uuid, user_id uuid, name text, barcode text, expires_at date, quantity int)

-- 運動
table exercise_logs (id uuid, user_id uuid, type text, duration_min int, logged_at timestamp)
```

## Next Steps
1. フロント `package.json` 設定
2. バック `requirements.txt` 設定
3. DB マイグレーション定義
4. 各機能の router/service 実装開始
