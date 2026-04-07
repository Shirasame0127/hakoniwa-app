# インフラセットアップガイド v2.0 - Supabase + Cloudflare + Google Cloud Run

**更新日:** 2026-04-07
**方針変更:** FastAPI は Google Cloud Run に置く（Tunnel 不要、無料、高可用性）

このガイドは、Notion の「デプロイ・インフラ戦略」に基づく本番インフラ構築手順です。

---

## 🏗️ インフラ構成

```
[ Cloudflare Pages ]  ← フロント（Next.js）
      ↓ API呼び出し
[ Google Cloud Run ]  ← FastAPI バックエンド（無料、高可用性）
      ↓
[ Supabase ]          ← DB（PostgreSQL + pgvector）
[ Cloudflare R2 ]     ← 3Dモデルファイル
```

---

## 現状

- ✅ Supabase プロジェクト作成済み：`ikullmeduhcwspjwonmu`（Tokyo）
- ✅ Cloudflare R2 バケット作成済み：`hakoniwa-models`
- ✅ 全DBテーブル作成済み（pgvector 有効化）
- ✅ Cloudflare Pages デプロイ設定済み
- ⏳ **Google Cloud Run 設定：次のステップ**

---

## ステップ 1-4: 基本設定（既存、スキップ可）

前のドキュメント `INFRASTRUCTURE_SETUP.md` を参照：
- ステップ 1: Supabase パスワード確認
- ステップ 2: Cloudflare R2 API トークン
- ステップ 3: Cloudflare R2 公開 URL
- ステップ 4: Cloudflare Pages デプロイ設定

すべて **完了済み** なら続行してください。

---

## ステップ 5: Google Cloud Run に FastAPI をデプロイ

### 前提条件
- Google アカウント（Gmail等）
- Docker がローカルにインストール（または Cloud Shell で代用）
- FastAPI が `backend/` ディレクトリにある

### やり方

#### 5-1. Google Cloud プロジェクト作成 & 有効化

```bash
# 1. Google Cloud Console にアクセス
# https://console.cloud.google.com/

# 2. 左上 "Google Cloud" をクリック → "プロジェクトを作成"
# プロジェクト名: hakoniwa-app
# リージョン: asia-northeast1（東京）

# 3. gcloud CLI をインストール
# https://cloud.google.com/sdk/docs/install

# 4. ローカルで gcloud を認証
gcloud auth login
```

#### 5-2. FastAPI を Dockerfile でコンテナ化

`backend/Dockerfile` を作成：

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 依存関係をコピー・インストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードをコピー
COPY . .

# ポート 8000 で公開
EXPOSE 8000

# FastAPI サーバー起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**requirements.txt を確認:**

```bash
cd backend
cat requirements.txt
```

#### 5-3. Cloud Run へデプロイ

```bash
# 1. Google Cloud プロジェクトを設定
gcloud config set project hakoniwa-app

# 2. Cloud Build でイメージをビルド & Cloud Run にデプロイ
gcloud run deploy hakoniwa-api \
  --source backend/ \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --set-env-vars "SUPABASE_URL=https://..." \
  --set-env-vars "SUPABASE_ANON_KEY=..." \
  --memory 512Mi \
  --cpu 1

# 3. デプロイ完了後、サービスURLが表示されます
# 例: https://hakoniwa-api-xxx.run.app
```

**環境変数の設定:**

```bash
# .env から値をコピー
cat ../.env | grep DATABASE_URL
cat ../.env | grep SUPABASE_URL

# 上記のコマンドで --set-env-vars に代入
```

#### 5-4. デプロイ完了を確認

```bash
# サービスの状態確認
gcloud run services describe hakoniwa-api --region asia-northeast1

# ログ確認
gcloud run services logs read hakoniwa-api --region asia-northeast1 --limit 50
```

---

## ステップ 6: Cloudflare Pages 環境変数を更新

Cloudflare ダッシュボード → **Pages** → **hakoniwa-app** → **Settings** → **Environment variables**

**`NEXT_PUBLIC_API_URL` を更新:**
```
NEXT_PUBLIC_API_URL = https://hakoniwa-api-xxx.run.app
```

**Deploy** をクリックして再デプロイ

---

## ステップ 7: 動作確認

### フロントエンド

ブラウザで確認：
```
https://hakoniwa-app.pages.dev
```

### バックエンド API

テスト：
```bash
# 食材一覧を取得できるか確認
curl -X GET "https://hakoniwa-api-xxx.run.app/api/food" \
  -H "Authorization: Bearer YOUR_TOKEN"

# または Garden データ取得
curl -X GET "https://hakoniwa-api-xxx.run.app/api/garden?user_id=test-user"
```

### 統合テスト

1. Pages で食材登録ボタンをクリック
2. ブラウザの DevTools → Network タブで API コールを確認
3. 正常に Supabase に保存されたか確認

---

## トラブルシューティング

### Cloud Run デプロイが失敗する

```bash
# ログ確認
gcloud run services logs read hakoniwa-api --region asia-northeast1 --limit 100

# 一般的な原因：
# - requirements.txt が見つからない
# - Python バージョンが不一致
# - 環境変数が不正
```

### Pages ビルドが失敗する

Cloudflare ダッシュボード → **Pages** → **akoniwa-app** → **Deployments** → **Latest** → **Build logs** を確認

### API が 403/401 を返す

```bash
# 認証トークンを確認
grep -i "token" ../.env

# または、一時的に認証を無効化してテスト（本番は絶対NG）
```

---

## .env チェックリスト

```bash
# 以下の値がすべて埋まっているか確認
grep -E '^(DATABASE_URL|SUPABASE_URL|CLOUDFLARE|NEXT_PUBLIC_API_URL)' ../.env
```

すべて表示されていれば OK。

---

## 次のステップ

- [ ] Google Cloud Run デプロイ完了
- [ ] Pages ← Cloud Run 統合テスト完了
- [ ] Supabase データベース動作確認
- [ ] API エンドポイント動作確認
- [ ] **本番テスト開始**

---

## AIエージェント（Phase 2 - 後回し）

現在は FastAPI による基本 API が完成します。
AIエージェント（提案生成、スクレイピング等）は **Phase 2** で実装予定です。

実装時：
- ミニPC で LangGraph ワーカーを実行
- Cloud Tasks または Cloud Scheduler で定期実行スケジュール
- 詳細は別ドキュメント参照

---

## 参考リンク

- Notion: [☁️ デプロイ・インフラ戦略](https://www.notion.so/33a2eb5294478108a723fe8c484abdc3)
- Google Cloud Run ドキュメント: https://cloud.google.com/run/docs
- FastAPI on Cloud Run: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/python
