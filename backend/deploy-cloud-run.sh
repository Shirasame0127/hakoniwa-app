#!/bin/bash
# Google Cloud Run にデプロイするスクリプト

set -e

# 📋 セットアップチェック
echo "=== Google Cloud Run デプロイ スクリプト ==="
echo ""

# 1. 環境変数確認
if [ ! -f ../.env ]; then
    echo "❌ エラー: ../.env が見つかりません"
    exit 1
fi

echo "✅ .env ファイルを確認しました"

# DATABASE_URL を取得
DATABASE_URL=$(grep '^DATABASE_URL=' ../.env | cut -d'=' -f2-)
SUPABASE_URL=$(grep '^SUPABASE_URL=' ../.env | cut -d'=' -f2-)
SUPABASE_ANON_KEY=$(grep '^SUPABASE_ANON_KEY=' ../.env | cut -d'=' -f2-)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ エラー: DATABASE_URL が設定されていません"
    exit 1
fi

echo "✅ 環境変数を取得しました:"
echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "   SUPABASE_URL: ${SUPABASE_URL:0:50}..."
echo ""

# 2. gcloud 認証確認
echo "=== Step 1: Google Cloud セットアップ ==="
echo ""
echo "ℹ️  以下の手順を実行してください（ブラウザで Google Cloud プロジェクトを作成）:"
echo ""
echo "1. ブラウザで https://console.cloud.google.com/ を開く"
echo "2. 左上 'Google Cloud' ロゴをクリック → 'プロジェクトを作成'"
echo "3. プロジェクト名: hakoniwa-app"
echo "4. リージョン: asia-northeast1（東京）"
echo "5. 'Create' をクリック"
echo ""
echo "完了したら 'Enter' を押してください..."
read

# 3. gcloud 認証
echo ""
echo "=== Step 2: gcloud 認証 ==="
echo ""
gcloud auth login
gcloud auth application-default login

# 4. Google Cloud プロジェクト設定
echo ""
echo "=== Step 3: プロジェクト設定 ==="
echo ""
echo "ℹ️  プロジェクト ID を確認する:"
gcloud projects list

echo ""
echo "? プロジェクト ID を入力してください (例: hakoniwa-app-123456):"
read PROJECT_ID

gcloud config set project "$PROJECT_ID"

echo "✅ プロジェクトを設定しました: $PROJECT_ID"

# 5. API を有効化
echo ""
echo "=== Step 4: Google Cloud API を有効化 ==="
echo ""
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

echo "✅ API を有効化しました"

# 6. Cloud Run にデプロイ
echo ""
echo "=== Step 5: Cloud Run にデプロイ ==="
echo ""

SERVICE_NAME="hakoniwa-api"
REGION="asia-northeast1"
MEMORY="512Mi"
CPU="1"

echo "ℹ️  デプロイ設定:"
echo "   サービス名: $SERVICE_NAME"
echo "   リージョン: $REGION"
echo "   メモリ: $MEMORY"
echo "   CPU: $CPU"
echo ""

gcloud run deploy "$SERVICE_NAME" \
  --region "$REGION" \
  --source . \
  --port 8000 \
  --memory "$MEMORY" \
  --cpu "$CPU" \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=$DATABASE_URL" \
  --set-env-vars "SUPABASE_URL=$SUPABASE_URL" \
  --set-env-vars "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" \
  --platform managed

echo ""
echo "✅ Cloud Run デプロイが完了しました！"
echo ""
echo "📍 サービスURL を確認:"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)'

echo ""
echo "=== 次のステップ ==="
echo ""
echo "1. Pages 環境変数を更新:"
echo "   Cloudflare Dashboard → Pages → hakoniwa-app → Settings → Environment variables"
echo "   NEXT_PUBLIC_API_URL = <上記のサービスURL>"
echo ""
echo "2. Pages を再デプロイ:"
echo "   Deployments タブで 'Retry deployment' をクリック"
echo ""
echo "3. 動作確認:"
echo "   https://hakoniwa-app.pages.dev にアクセス"
