# インフラセットアップガイド - Supabase + Cloudflare + ミニPC

このガイドは、Notion の「デプロイ・インフラ戦略」に基づく本番インフラ構築手順です。

## 現状

- Supabase プロジェクト作成済み：`ikullmeduhcwspjwonmu`（Tokyo）
- Cloudflare R2 バケット作成済み：`hakoniwa-models`
- 全DBテーブル作成済み（pgvector 有効化）
- `.env` テンプレート記入済み

**残りの手動作業：約15分**

---

## ステップ 1: Supabase パスワード確認

### 何をするのか
Supabase の DB 接続文字列パスワードを `.env` に埋める

### やり方

1. ブラウザで [Supabase ダッシュボード](https://supabase.com/dashboard) を開く
2. 左サイドバー → `shirasame` → `hakoniwa-app` プロジェクトを選択
3. **Settings** → **Database**
4. **Connection string** セクションを探す
5. **Connection mode** を `Session` のままにして、**URI** タブをクリック
6. 表示される接続文字列をコピー例：`postgresql://postgres:PASSWORD@db.ikullmeduhcwspjwonmu.supabase.co:5432/postgres`
7. `.env` ファイルを開く
   ```bash
   # プロジェクトルートで
   nano .env
   ```
8. **DATABASE_URL** 行を上記の接続文字列で置き換え（既に形式は合ってる、PASSWORD を実際の値に変更するだけ）
   ```bash
   DATABASE_URL=postgresql://postgres:[実際のパスワード]@db.ikullmeduhcwspjwonmu.supabase.co:5432/postgres
   ```
9. Ctrl+O, Enter, Ctrl+X で保存

### 確認方法
```bash
# ローカルから DB に接続できるか試す
psql $(grep '^DATABASE_URL' .env | cut -d'=' -f2-)
# コマンドが実行され、postgres=# プロンプトが出たら成功
# \q で終了
```

---

## ステップ 2: Cloudflare R2 API トークン発行

### 何をするのか
R2 へのモデルファイルアップロード用の API トークンを発行する

### やり方

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) を開く
2. **R2** → **Settings** → **API tokens** を開く
3. **Create API token** をクリック
4. 設定：
   - **Token name**: `hakoniwa-model-upload`
   - **Permissions**: `Admin` を選択（または `Object.List, Object.Read, Object.Write` を個別選択）
   - **TTL**: 無期限でOK
5. **Create API Token** をクリック
6. **Access Key ID** と **Secret Access Key** が表示される → **コピー**（こっぱっきりしたら二度と見られないので注意）

### .env に記入

`.env` ファイルを開いて下記を埋める：

```bash
CLOUDFLARE_R2_ACCESS_KEY_ID=あなたの_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=あなたの_SECRET_ACCESS_KEY
```

---

## ステップ 3: Cloudflare R2 公開 URL 設定

### 何をするのか
R2 バケットを公開し、モデルファイルへのアクセス URL を取得する

### やり方

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) → **R2** を開く
2. `hakoniwa-models` バケットをクリック
3. **Settings** → **Public access** セクションを探す
4. **Allow public access** の切り替えをオン（有効にする）
5. **Public access URL** が表示される → コピー例：`https://pub-xxxxxxxxxxxxx.r2.dev`

### .env に記入

```bash
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

---

## ステップ 4: Cloudflare Pages デプロイ設定

### 前提条件
- GitHub にこのリポジトリがプッシュ済み（または public でなくても OK、後で連携）
- GitHub アカウント（ない場合は先に作成）

### やり方

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) を開く
2. 左サイドバー → **Workers & Pages** をクリック
3. **Pages** タブ → **Create application** をクリック
4. **Pages** → **Connect to Git** を選択
5. GitHub 認証：
   - **Connect GitHub** をクリック
   - GitHub アカウントでログイン
   - `shira-home-work-ai/hakoniwa-app` リポジトリを選択
6. **Build settings** を設定：
   - **Framework preset**: `Next.js` を選択
   - **Build command**: 下記に変更
     ```
     cd frontend && pnpm install && pnpm build:pages
     ```
   - **Build output directory**: `frontend/.vercel/output/static`
   - **Root directory**: 空白のままでOK
7. **Environment variables** を追加：
   - クリック「Add environment variables」
   - **Variable name**: `NEXT_PUBLIC_API_URL`
   - **Value**: 後で追加（今は `http://localhost:8000` で一旦デプロイ、Tunnel 完成後に更新）

8. **Save and Deploy** をクリック
9. デプロイが開始される（5-10分待つ）
10. 完了すると `xxx.pages.dev` という URL が表示される → これが本番フロント URL

### 今後の更新
GitHub にプッシュするたびに自動デプロイされます。

---

## ステップ 5: Cloudflare Tunnel セットアップ（ミニPC 上）

### 何をするのか
自宅ミニ PC の FastAPI をインターネットに公開する

### 前提条件
- ミニPC に SSH アクセス可能
- Linux/macOS が動いている

### やり方

#### 5-1. cloudflared インストール

```bash
# ミニPC上で実行
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

#### 5-2. Cloudflare ログイン & トンネル作成

```bash
# トンネルログイン（ブラウザが開くので Cloudflare 認証する）
cloudflared tunnel login

# トンネル作成
cloudflared tunnel create hakoniwa-tunnel
```

出力から **Tunnel ID** をメモ：
```
Tunnel credentials written to /home/user/.cloudflared/xxxxx.json
Tunnel xxxx-xxxx-xxxx created with name hakoniwa-tunnel
```

#### 5-3. Tunnel 設定ファイル作成

```bash
# 設定ファイル編集
nano ~/.cloudflared/config.yml
```

下記の内容を入力（`TUNNEL_ID` は上でメモした ID に置き換える）：

```yaml
tunnel: TUNNEL_ID
credentials-file: /home/user/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: hakoniwa-api.cfargotunnel.com
    service: http://localhost:8000
  - service: http_status:404
```

保存：Ctrl+O, Enter, Ctrl+X

#### 5-4. Tunnel を常駐させる

```bash
# systemd サービスに登録
sudo cloudflared service install

# 自動起動を有効にして開始
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 状態確認
sudo systemctl status cloudflared
```

#### 5-5. アクセス URL 確認

```bash
# Tunnel のステータスを確認
cloudflared tunnel list

# 出力から以下の情報を取得：
# - Status: HEALTHY ならOK
# - CNAME: xxxx.cfargotunnel.com がアクセス URL
```

### .env に Tunnel URL を記入

ローカルマシンの `.env` に追加：

```bash
# Cloudflare Tunnel の URL（上で確認したもの）
NEXT_PUBLIC_API_URL=https://hakoniwa-api.cfargotunnel.com
```

---

## ステップ 6: Cloudflare Pages 環境変数を更新

### やり方

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) → **Pages** → `hakoniwa-app` をクリック
2. **Settings** → **Environment variables**
3. `NEXT_PUBLIC_API_URL` を編集：
   - **Value**: `https://hakoniwa-api.cfargotunnel.com`（Tunnel URL）

4. **Deploy** ボタンをクリックして再デプロイ

---

## 動作確認

### フロントエンド

```bash
# ブラウザで確認
https://hakoniwa-app.pages.dev
```

### バックエンド API

```bash
# Tunnel 経由でアクセス可能か確認
curl https://hakoniwa-api.cfargotunnel.com/api/garden
```

### DB 接続

```bash
# ローカルから Supabase DB に接続可能か確認
psql $(grep '^DATABASE_URL' .env | cut -d'=' -f2-)
\dt  # 全テーブル表示
\q   # 終了
```

---

## トラブルシューティング

### Tunnel が接続できない
```bash
# ミニPC上で確認
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 20
```

### Pages デプロイが失敗する
```
Cloudflare Dashboard → Pages → デプロイ履歴 → FailLog を確認
通常は build command の typo か、環境変数未設定が原因
```

### DB が遅い / 接続リセット
```bash
# Supabase ダッシュボード → Database → Network を確認
# IP whitelist がある場合はミニPC の IP を追加するか、Allow all に
```

---

## .env チェックリスト

```bash
# 以下の値がすべて埋まっているか確認
grep -E '^(DATABASE_URL|SUPABASE_URL|CLOUDFLARE|NEXT_PUBLIC_API_URL)' .env
```

すべて表示されていれば OK。

---

## 次のステップ

- [x] インフラセットアップ完了
- [ ] テストデータ投入：`just seed` または `just seed-prod`
- [ ] ローカル開発開始：`just up`
- [ ] 本番デプロイテスト
