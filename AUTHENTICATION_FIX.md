# ログイン機能 - next-auth v5 API 互換性バグ修正報告書

**修正完了日**: 2026-04-07
**ステータス**: ✅ 完了・検証済み

## 🔴 問題の詳細

### エラーメッセージ
```
TypeError: r is not a function
```
このエラーは以下のエンドポイント呼び出し時に発生していました:
- `GET /api/auth/session` → 500 Internal Server Error
- `GET /api/auth/providers` → 500 Internal Server Error
- `GET /api/auth/error` → 500 Internal Server Error

### 根本原因

**next-auth v5 beta API の誤用**

next-auth v5 beta の API は以下のような戻り値を持ちます:
```typescript
NextAuth(config) → {
  handlers: {
    GET: Function,
    POST: Function
  },
  auth: Function
}
```

誤った実装:
```typescript
// ❌ 誤り
export const { handlers, auth } = NextAuth(authConfig);
export { handlers as GET, handlers as POST } from "@/auth";
// これは handlers（オブジェクト）を GET という名前でエクスポート
// → フロント側が関数として呼び出すと TypeError が発生
```

## ✅ 修正内容

### コード変更

#### ファイル 1: `frontend/src/auth.ts`

**修正前**:
```typescript
export const { handlers, auth } = NextAuth(authConfig);
```

**修正後**:
```typescript
export const { handlers: { GET, POST }, auth } = NextAuth(authConfig);
```

#### ファイル 2: `frontend/src/app/api/auth/[...nextauth]/route.ts`

**修正前**:
```typescript
export { handlers as GET, handlers as POST } from "@/auth";
```

**修正後**:
```typescript
export { GET, POST } from "@/auth";
```

### 修正の理由

next-auth v5 beta の正式なドキュメント（`node_modules/next-auth/index.d.ts` より）:

```typescript
/**
 * auth.ts - NextAuth 初期化
 */
export const { handlers: { GET, POST }, auth } = NextAuth({...})

/**
 * app/api/auth/[...nextauth]/route.ts - ルートハンドラ
 */
export { GET, POST } from "../../../../auth"
```

構造化アンパック（destructuring assignment）により:
- `handlers` オブジェクトから直接 `GET` と `POST` **関数** を取り出す
- ルートハンドラがそれらの**関数**を直接エクスポートできる

## 🧪 検証結果

Docker コンテナ再起動後、すべての認証エンドポイントが正常に動作:

### エンドポイント検証

```bash
# 1. プロバイダー確認
$ curl -s http://localhost:3000/api/auth/providers
{
  "credentials": {
    "id": "credentials",
    "name": "Credentials",
    "type": "credentials",
    ...
  },
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oidc",
    ...
  }
}
✅ 成功

# 2. セッション確認（未認証時）
$ curl -s http://localhost:3000/api/auth/session
null
✅ 成功

# 3. FastAPI バックエンド確認
$ curl -s http://localhost:8000/docs | grep -i "swagger"
✅ 成功
```

### Docker コンテナ状態

```
NAME              SERVICE    STATUS
hakoniwa-frontend node       Up ✅
hakoniwa-backend  python     Up ✅
hakoniwa-db       postgres   Up (healthy) ✅
```

### ログ確認

```bash
$ docker-compose logs frontend 2>&1 | grep -i "error\|warning\|fail"
< エラーなし - 正常に起動 >

$ docker-compose logs frontend | tail -5
Ready in 1805ms  ✅
```

## 📚 技術的解説

### なぜこのバグが起きたのか?

1. **API の構造理解不足**: `handlers` がオブジェクトであることを看過
2. **型定義の確認不足**: TypeScript の型定義ファイルをちゃんと読まなかった
3. **早期修正の試み**: ルートハンドラの構造を修正しようとしたが、根本が auth.ts にあった

### 修正前後の処理フロー

#### ❌ 修正前（バグあり）
```
フロント (localhost:3000)
  ↓
GET /api/auth/session
  ↓
app/api/auth/[...nextauth]/route.ts
  ↓
import { handlers } from "@/auth"  // handlers = { GET, POST }
  ↓
export { handlers as GET, handlers as POST }  // オブジェクトを関数名で再エクスポート
  ↓
next-auth v5 内部で handlers を関数として呼び出し試行
  ↓
TypeError: r is not a function ❌
```

#### ✅ 修正後（正常）
```
フロント (localhost:3000)
  ↓
GET /api/auth/session
  ↓
app/api/auth/[...nextauth]/route.ts
  ↓
import { GET, POST } from "@/auth"  // 直接関数をインポート
  ↓
export { GET, POST }  // 関数を関数としてエクスポート
  ↓
next-auth v5 内部で GET/POST を関数として呼び出し
  ↓
正常にセッション情報を返す ✅
```

## 🎯 次ステップ

1. ✅ 修正完了・ローカル検証完了
2. 📋 ログイン/登録フロー E2E テスト
3. 🚀 Pages & Cloud Run 本番デプロイ

## 参考資料

- `node_modules/next-auth/package.json` - version 5.0.0-beta.19
- `node_modules/next-auth/index.d.ts` - 公式型定義
- `@auth/core` - 0.32.0 (next-auth の依存パッケージ)

---

**修正者**: Claude
**レビュー**: 未実施
**デプロイ予定**: 本番テスト後
