# AI箱庭ライフOS（仮）

## 概要
3D箱庭として可視化・ゲーム化するWebアプリケーション。食材管理、運動ログ、所有物管理をAIエージェントが連携して、ユーザーの日常生活を豊かにしていく。

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **React Three Fiber** + **Three.js** (3Dレンダリング)
- **Zustand** (状態管理)
- **Tailwind CSS** (スタイリング)
- **TanStack Query** (API通信)
- **TypeScript**

### バックエンド
- **FastAPI**
- **PostgreSQL 16**
- **pgvector** (Vector DB)
- **SQLAlchemy 2.0** (ORM)
- **Alembic** (マイグレーション)
- **Claude API** + **LangGraph** (AIエージェント)
- **JWT** (認証)

## ディレクトリ構成

```
hakoniwa-app/
├── frontend/                    # Next.js フロントエンド
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── (garden)/        # 箱庭エリア
│   │   │   ├── (food)/          # 食材管理エリア
│   │   │   ├── (exercise)/      # 運動エリア
│   │   │   └── layout.tsx
│   │   ├── features/            # 機能単位モジュール
│   │   │   ├── garden/
│   │   │   ├── food/
│   │   │   ├── exercise/
│   │   │   ├── inventory/
│   │   │   └── ai/
│   │   ├── pages/               # ページ層ロジック
│   │   ├── widgets/             # 共通UIコンポーネント
│   │   └── shared/              # 共通ユーティリティ
│   ├── public/models/           # 3Dモデル (.glb)
│   ├── package.json
│   └── next.config.ts
│
├── backend/                     # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py              # エントリーポイント
│   │   ├── features/            # 機能単位
│   │   │   ├── garden/
│   │   │   ├── food/
│   │   │   ├── exercise/
│   │   │   ├── inventory/
│   │   │   └── ai_agents/
│   │   ├── shared/              # 共通ユーティリティ
│   │   └── config.py
│   ├── alembic/                 # DBマイグレーション
│   ├── scripts/                 # スクリプト
│   └── requirements.txt
│
├── docker-compose.yml          # コンテナ構成
├── justfile                    # タスクランナー
├── .env.example
└── README.md
```

## 依存ルール

✅ **許可される依存**
```
features/* → shared/*
pages → features
widgets → shared
```

❌ **禁止される依存**
```
features/* → features/*  (直接依存禁止)
shared → features        (逆層禁止)
```

## 主要 API エンドポイント

### 箱庭 (Garden)
- `GET /api/garden` - 箱庭データ取得
- `PATCH /api/garden` - 箱庭状態更新
- `POST /api/garden/objects` - オブジェクト追加
- `DELETE /api/garden/objects/{id}` - オブジェクト削除

### 食材 (Food)
- `GET /api/food` - 食材一覧
- `POST /api/food` - 食材登録
- `POST /api/food/scan` - バーコードスキャン
- `POST /api/food/receipt` - レシートOCR

### 運動 (Exercise)
- `GET /api/exercise` - 運動ログ一覧
- `POST /api/exercise` - 運動記録
- `GET /api/exercise/streak` - 継続日数

### AIエージェント (AI)
- `POST /api/ai/suggest` - AI提案リクエスト
- `GET /api/ai/agents/status` - エージェント状態

## セットアップ

```bash
# 初回セットアップ
just setup

# または個別に実行
just setup-env
pnpm install
cd backend && pip install -r requirements.txt
just db-up
just migrate
just seed
```

## コマンド集

| コマンド | 説明 |
|---------|------|
| `just up` | 全サービス起動 |
| `just down` | 全サービス停止 |
| `just dev-front` | フロントのみ開発 |
| `just dev-back` | バックのみ開発 |
| `just test` | 全テスト実行 |
| `just lint` | リント実行 |
| `just format` | フォーマット |
| `just build` | 本番ビルド |
| `just logs` | ログ表示 |

詳細は [⚡ justコマンド集・起動手順書](https://www.notion.so/3392eb52944781ce9dc5c358e23eeaab) を参照。

## ドキュメント

- 📂 [ディレクトリ構成案](https://www.notion.so/3392eb5294478142922addb585aeaa13)
- ⚡ [justコマンド集・起動手順書](https://www.notion.so/3392eb52944781ce9dc5c358e23eeaab)
- 📝 [アプリ構成・機能仕様書](https://www.notion.so/3392eb52944781c5a346f6561e21e736)
