#!/bin/bash
# GLBモデルを Cloudflare R2 に一括アップロード
# 使用: bash scripts/upload_models_to_r2.sh

BUCKET="hakoniwa-models"
MODELS_DIR="frontend/public/models"

echo "📦 Uploading GLB models to R2 bucket: $BUCKET"
echo ""

find "$MODELS_DIR" -name "*.glb" | while read -r file; do
  # frontend/public/ を取り除いてパスを取得
  key="${file#frontend/public/}"
  echo "⬆️  $key"
  npx wrangler r2 object put "$BUCKET/$key" --file "$file" --content-type "model/gltf-binary" --remote
done

echo ""
echo "✅ Done!"
echo "🌐 Public URL: https://pub-3d2cb29655f24080824240e6b23ebbe4.r2.dev"
