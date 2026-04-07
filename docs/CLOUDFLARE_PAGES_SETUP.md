# Cloudflare Pages ビルド設定確認（デプロイ失敗対応）

デプロイ失敗時のエラー：
```
Error: No Next.js version detected.
Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

## 原因
Cloudflare Pages の **Build settings** が正しく設定されていない

## 解決方法（手動）

### ステップ 1: ダッシュボールにアクセス
1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) を開く
2. **Workers & Pages** → **Pages** をクリック
3. **hakoniwa-app** プロジェクトをクリック

### ステップ 2: Build settings を確認・修正
1. **Settings** タブをクリック
2. **Build settings** セクション

**以下の値を確認：**

| フィールド | 現在の値 | 修正後の値 |
|-----------|---------|----------|
| **Build command** | （空白または不正） | `npm run build:pages` |
| **Build output directory** | （空白） | `frontend/.vercel/output/static` |
| **Root directory** | （不明） | （空白のままでOK） |

### ステップ 3: 環境変数を確認
**Environment variables** セクションで以下が設定されているか確認：
```
NEXT_PUBLIC_API_URL = http://localhost:8000
（または Tunnel URL: https://hakoniwa-api.cfargotunnel.com）
```

### ステップ 4: 再デプロイ
1. **Settings** を保存
2. **Deployments** タブで **Retry deployment** をクリック

---

## 解決方法（API自動化 - Cloudflare API トークン利用）

ユーザーが Cloudflare Account ID と API トークンがあれば、Claude から自動修正可能です。

以下の情報を用意して、「API で修正してください」と指示してください：
- Cloudflare Account ID
- Cloudflare API Token（Workers & Pages 権限付き）
