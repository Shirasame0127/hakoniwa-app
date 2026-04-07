# ✅ ログイン機能セットアップガイド

実装完了しました！以下のSTEPに従ってセットアップを完成させてください。

---

## 📋 あなたがやることリスト

### **STEP 1: Google OAuth クレデンシャルを取得**

> **所要時間**: 5分

1. ブラウザで [Google Cloud Console](https://console.cloud.google.com/) を開く
2. 左上の **プロジェクト選択** → **新しいプロジェクト**
   - プロジェクト名: `hakoniwa-app`
   - 作成
3. 左メニュー → **認証情報** → **認証情報を作成** → **OAuth 2.0 クライアント ID**
4. アプリケーションの種類: **ウェブアプリケーション**
5. リダイレクト URI に以下を追加:
   ```
   http://localhost:3000/api/auth/callback/google
   https://hakoniwa-app.pages.dev/api/auth/callback/google
   ```
6. 作成完了
7. **Client ID** と **Client Secret** をコピーしておく

---

### **STEP 2: .env ファイルを更新**

> **所要時間**: 2分

ローカルの `/home/shira/hakoniwa-app/.env` ファイルを編集:

```bash
# 最下部の以下の行を置き換え

# Google OAuth (STEP 1 でコピーした値)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx_xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx

# next-auth Secret（以下を実行して生成）
# openssl rand -base64 32
NEXTAUTH_SECRET=生成した値をここに貼り付け

NEXTAUTH_URL=http://localhost:3000
```

**NEXTAUTH_SECRET 生成コマンド**:
```bash
openssl rand -base64 32
```

---

### **STEP 3: ローカルでテスト**

> **所要時間**: 10分

```bash
# リポジトリのルートで実行

# 1️⃣ フロント依存パッケージをインストール
cd frontend
pnpm install
cd ..

# 2️⃣ バック依存パッケージをインストール（google-auth 追加）
cd backend
pip install -r requirements.txt
cd ..

# 3️⃣ DB マイグレーション実行（初回のみ）
just migrate

# 4️⃣ フロント + バック + DB 全起動
just up
```

**起動完了後**:
- ブラウザで `http://localhost:3000/auth/login` を開く
- ✅ **メール/パスワード ログイン画面**が表示されるか確認
- ✅ **Google ボタン**が表示されるか確認

**テストアカウント（メール/パスワード）**:
```
Email: test@example.com
Password: Password123
```

**テスト手順**:
1. `/auth/login` でメール・パスワード入力 → ロック
2. `/auth/register` で新規登録 → ロック
3. Google ボタンをクリック → Google アカウント選択 → ロック
4. ガーデンページ（`/garden`）へリダイレクト → ✅ 成功

---

### **STEP 4: GitHub に推し上げ**

> **所要時間**: 2分

```bash
# リポジトリルートで実行

git add .
git commit -m "feat: Add Google OAuth and next-auth authentication"
git push origin main
```

**Cloudflare Pages が自動デプロイを開始**（2-3分待つ）

---

### **STEP 5: Cloudflare Pages 環境変数を設定**

> **所要時間**: 3分

1. Cloudflare ダッシュボードを開く
2. **Pages** → **hakoniwa-app** → **Settings** → **Environment variables**
3. **Production** タブで以下を追加:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID = xxx_xxxxx.apps.googleusercontent.com
   NEXTAUTH_SECRET = (STEP 2 で生成した値)
   NEXTAUTH_URL = https://hakoniwa-app.pages.dev
   ```
4. **Save** をクリック
5. **Deployments** → 最新のデプロイを選択 → **Retry deployment** をクリック

**デプロイ完了後** (`https://hakoniwa-app.pages.dev` で動作確認):
- ✅ ログイン画面が表示される
- ✅ Google ボタンが表示される
- ✅ メール/パスワード入力で動作

---

### **STEP 6: Cloud Run にバックエンドをデプロイ**

> **所要時間**: 10分

ローカルで以下を実行:

```bash
cd backend
bash deploy-cloud-run.sh
```

**対話的にプロンプトが出現**:
1. **Step 1**: Google Cloud プロジェクト作成画面 → ブラウザで確認済みなら `Enter`
2. **Step 2**: gcloud 認証 → ブラウザで Google アカウント選択
3. **Step 3**: プロジェクト ID 入力 → `hakoniwa-app` 等
4. **Step 4-5**: API 有効化・デプロイ → 自動実行

**デプロイ完了メッセージ**が出たら：
- 下部に **サービス URL** が表示される
- 例: `https://hakoniwa-api-zblzygj6bq-an.a.run.app`

---

### **STEP 7: 本番環境の動作確認**

> **所要時間**: 5分

1. **Pages**: `https://hakoniwa-app.pages.dev/auth/login` を開く
   - ✅ ログイン画面表示
   - ✅ Google ボタン動作
   - ✅ ガーデンページへリダイレクト

2. **API ドキュメント**: `https://hakoniwa-api-zblzygj6bq-an.a.run.app/docs` を開く
   - ✅ Swagger UI 表示
   - ✅ `/api/auth/google/callback` が実装済み

3. **CORS 確認**: Pages のコンソール（F12）でエラーなし

---

## 🚀 あなたのタスク一覧

| # | タスク | 所要時間 | 状態 |
|----|--------|---------|------|
| 1 | Google OAuth クレデンシャル取得 | 5分 | ⏳ 待機中 |
| 2 | .env ファイル更新 | 2分 | ⏳ 待機中 |
| 3 | ローカルテスト | 10分 | ⏳ 待機中 |
| 4 | GitHub 推し上げ | 2分 | ⏳ 待機中 |
| 5 | Cloudflare Pages 環境変数設定 | 3分 | ⏳ 待機中 |
| 6 | Cloud Run デプロイ | 10分 | ⏳ 待機中 |
| 7 | 本番環境動作確認 | 5分 | ⏳ 待機中 |
| **合計** | | **37分** | |

---

## ℹ️ トラブルシューティング

### ログイン時に「Invalid credentials」エラー
- ✅ `.env` の `NEXTAUTH_SECRET` が正しく設定されているか確認
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` が正しいか確認

### Google ボタンが表示されない
- ✅ `npm install` が完了しているか確認
- ✅ ブラウザキャッシュをクリア

### Cloud Run デプロイエラー
- ✅ `.env` で `GOOGLE_OAUTH_CLIENT_SECRET` が設定されているか確認
- ✅ gcloud 認証が成功しているか確認

### Pages CORS エラー
- ✅ Cloud Run の `FRONTEND_URL` が `https://hakoniwa-app.pages.dev` に設定されているか確認
- ✅ Pages 環境変数が反映されているか確認（Retry deployment）

---

## 📞 サポート

各STEPで問題が発生した場合：
1. エラーメッセージをスクリーンショット
2. ブラウザコンソール（F12）のエラーを確認
3. Cloud Run ログを確認: `gcloud run logs read hakoniwa-api --limit 50`

---

**準備完了です！STEP 1 から開始してください🎉**
