# 3Dモデル管理システム — 設計ドキュメント

> **最終更新**: 2026-04-06
> **管理方式**: ボクセル（立方体）構成 + .glb ファイル + PostgreSQL マスタ管理

---

## 絶対ルール

> **すべての3Dモデルはボクセル（立方体ピクセル）で構成する**
>
> 食べ物・植物・人・フィールド・建造物・家具、すべてが **0.1 unit の立方体の集まり**で表現される。
> フィールドも凸凹した地面もボクセルで表現（平板ではない）。
> ファイル形式は `.glb` (GLTF 2.0 Binary)。

---

## ボクセル仕様

| 項目 | 仕様 |
|------|------|
| 単位 | 1ボクセル = Three.js 座標系で **0.1 unit** の立方体 |
| 座標系 | X: 横, Y: 上（高さ）, Z: 奥行き |
| 色形式 | `#RRGGBB` 16進数カラー |
| データ構造 | `[{x: int, y: int, z: int, colorHex: "#RRGGBB"}, ...]` |
| レンダリング | 色ごとにグループ化 → GLBプリミティブで描画 |

### カテゴリ別最大ボクセル数

| カテゴリ | カタログID | W | H | D | 備考 |
|--------|-----------|---|---|---|------|
| 食べ物  | F001〜    | 32 | 32 | 32 | 食材・料理 |
| 植物    | P001〜    | 24 | 32 | 24 | 木・花・草 |
| 人      | C001〜    | 24 | 40 | 24 | キャラクター |
| 家具    | I001〜    | 32 | 32 | 32 | テーブル・棚など |
| 建造物  | B001〜    | 64 | 64 | 64 | 家・構造物 |
| フィールド | L001〜  | 64 | 8  | 64 | 地面タイル（凸凹必須） |
| 特別    | SP001〜   | 32 | 32 | 32 | ゲームソフト・本・食材仕分け |

---

## カタログID 体系

```
F   = food       食べ物
P   = plant      植物
C   = person     人（Character）
I   = furniture  家具（Interior）
B   = building   建造物
L   = field      フィールド（Land）
SP  = special    特別
```

---

## DB スキーマ

### `hakoniwa_objects` テーブル

```sql
create table hakoniwa_objects (
  -- PK
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamp default now(),
  updated_at    timestamp default now(),

  -- =====================
  -- 図鑑情報
  -- =====================
  catalog_id    text unique not null,   -- "F001", "P001", "SP001"
  name          text not null,           -- "にんじん"
  name_en       text,                    -- "Carrot"

  -- 分類
  category      text not null,          -- food/plant/person/furniture/building/field/special
  subcategory   text,                   -- game_software/book/food_label (specialのみ)

  -- =====================
  -- テキスト
  -- =====================
  description   text,                   -- "土の中で育つオレンジの根菜。"
  flavor_text   text,                   -- "β-カロテンたっぷり。一日一本で..." (ゲームっぽいフレーバー)

  -- =====================
  -- レアリティ
  -- =====================
  rarity        text default 'common',  -- common/uncommon/rare/legendary

  -- =====================
  -- 出現・入手情報
  -- =====================
  locations     text[],                 -- ["kitchen", "garden", "grocery"]
  seasons       text[],                 -- ["spring", "autumn"]
  obtain_method text,                   -- "食材を登録する / 畑から収穫する"

  -- =====================
  -- 3Dモデル
  -- =====================
  model_path    text,                   -- "/models/food/carrot.glb"
  thumbnail_url text,

  -- サイズ（参考）
  size_w        integer,                -- ボクセル数（横）
  size_h        integer,                -- ボクセル数（上）
  size_d        integer,                -- ボクセル数（奥行き）

  -- =====================
  -- ソーシャル
  -- =====================
  like_count    integer default 0,
  view_count    integer default 0,
  uploaded_by   uuid references users(id) on delete set null
);

create index ix_hakoniwa_objects_category  on hakoniwa_objects (category);
create index ix_hakoniwa_objects_catalog_id on hakoniwa_objects (catalog_id);
```

### `hakoniwa_object_likes` テーブル

```sql
create table hakoniwa_object_likes (
  user_id    uuid references users(id) on delete cascade,
  object_id  uuid references hakoniwa_objects(id) on delete cascade,
  created_at timestamp default now(),
  primary key (user_id, object_id),
  constraint uq_object_likes unique (user_id, object_id)
);
```

---

## TypeScript 型定義

```typescript
// frontend/src/features/voxel_models/types.ts

export type ObjectCategory =
  | "food" | "plant" | "person" | "furniture"
  | "building" | "field" | "special";

export type ObjectRarity = "common" | "uncommon" | "rare" | "legendary";

export type ObjectSubcategory = "game_software" | "book" | "food_label";

/** 図鑑一覧用（軽量） */
export interface HakoniwaObjectSummary {
  id: string;
  catalog_id: string;       // "F001"
  name: string;             // "にんじん"
  name_en?: string;         // "Carrot"
  category: ObjectCategory;
  subcategory?: ObjectSubcategory;
  rarity: ObjectRarity;
  model_path?: string;      // "/models/food/carrot.glb"
  thumbnail_url?: string;
  like_count: number;
  view_count: number;
  is_liked: boolean;
  created_at: string;
}

/** 図鑑詳細（フルデータ） */
export interface HakoniwaObjectDetail extends HakoniwaObjectSummary {
  description?: string;
  flavor_text?: string;     // 図鑑フレーバーテキスト
  locations?: string[];     // ["kitchen", "garden"]
  seasons?: string[];       // ["spring", "autumn"]
  obtain_method?: string;   // "食材を登録する"
  size_w?: number;
  size_h?: number;
  size_d?: number;
}
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|--------|------|------|
| GET | `/api/objects` | 図鑑一覧（フィルタ・ソート対応） |
| GET | `/api/objects/{id}` | 図鑑詳細 |
| GET | `/api/objects/catalog/{catalog_id}` | カタログIDで取得 |
| POST | `/api/objects/upload` | .glb アップロード（認証必須） |
| POST | `/api/objects/{id}/like` | いいね切り替え |

### クエリパラメータ（一覧）

```
category    = food / plant / person / furniture / building / field / special
subcategory = game_software / book / food_label
rarity      = common / uncommon / rare / legendary
sort        = recent（新着）/ popular（人気）
page        = 1〜
limit       = 1〜100（デフォルト20）
token       = ユーザートークン（いいね状態取得用・任意）
```

---

## テストデータ（`just seed` で投入）

### 食べ物 (food)

| 図鑑ID | 名前 | レアリティ | フレーバーテキスト |
|--------|------|----------|----------------|
| F001 | にんじん | common | β-カロテンたっぷりのにんじん。食べると目が良くなると言われている。 |
| F002 | トマト | common | 夏の太陽をたっぷり浴びて育ったトマト。サラダにもスープにも。 |
| F003 | りんご | common | 「医者いらず」とも呼ばれる。一日一個のりんごは健康の秘訣。 |
| F004 | 鶏肉 | uncommon | 焼き色がついてジューシーな鶏肉。どんな料理にも合う万能食材。 |
| F005 | お弁当 | uncommon | 誰かが手間暇かけて作ってくれたお弁当。食べると元気が出る。 |

### 植物 (plant)

| 図鑑ID | 名前 | レアリティ | 入手方法 |
|--------|------|----------|--------|
| P001 | 大きなオーク | uncommon | 箱庭レベル2に到達する |
| P002 | 赤いバラ | rare | 7日間連続で運動を記録する |
| P003 | サボテン | common | 最初から所持している |

### 人 (person)

| 図鑑ID | 名前 | レアリティ | 説明 |
|--------|------|----------|------|
| C001 | プレイヤー | **legendary** | 箱庭の主人公。アカウント作成で入手。 |
| C002 | 農家のおじさん | rare | 野菜を10種類登録すると出現。 |

### 家具 (furniture)

| 図鑑ID | 名前 | レアリティ |
|--------|------|----------|
| I001 | 木のテーブル | common |
| I002 | キャンプファイヤー | uncommon |
| I003 | 本棚 | common |

### 建造物 (building)

| 図鑑ID | 名前 | レアリティ |
|--------|------|----------|
| B001 | 小さな小屋 | uncommon |
| B002 | 風車 | rare |

### フィールド (field)

| 図鑑ID | 名前 | 特徴 |
|--------|------|------|
| L001 | 草原タイル | 凸凹した地面。草の穂がランダムに生える。 |
| L002 | 川のタイル | 石・砂の川床 + 水面ボクセル。 |
| L003 | 石畳タイル | 目地（JOINT）が入り凹凸のある石畳。 |

### 特別 (special)

| 図鑑ID | 名前 | サブカテゴリ | レアリティ |
|--------|------|-----------|----------|
| SP001 | スーファミカートリッジ | game_software | rare |
| SP002 | 技術書 | book | common |
| — | 食材仕分けフォルダ | food_label | — |

---

## フォルダ構成

```
frontend/public/models/
├── food/
│   ├── carrot.glb, tomato.glb, apple.glb, chicken.glb, bento.glb
├── plant/
│   ├── oak_large.glb, rose_red.glb, cactus.glb
├── person/
│   ├── avatar_default.glb, farmer_man.glb
├── furniture/
│   ├── table_wood.glb, campfire.glb, bookshelf.glb
├── building/
│   ├── cabin_small.glb, windmill.glb
├── field/
│   ├── grass_tile.glb, river_tile.glb, stone_tile.glb
└── special/
    ├── game_software/
    │   └── sfc_cart.glb
    ├── books/
    │   └── tech_book.glb
    └── food_labels/               ← 食材仕分け用画像フォルダ
        └── README.md              ← バーコード/参照画像の格納先
```

---

## GLBファイルの作成方法

### A. 開発テスト用（自動生成ボクセル）

```bash
# ボクセルデータ(Python) → .glb を自動生成
just generate-glb
```

`backend/scripts/voxel_data.py` に定義した Python ボクセルデータを
`backend/scripts/generate_glb_placeholders.py` が GLTF 2.0 バイナリに変換する。

新しいモデルを追加する場合：
1. `voxel_data.py` に `make_xxx()` 関数を追加（`[{x,y,z,colorHex}]` のリスト）
2. `CATALOG` リストにエントリを追加
3. `just generate-glb` で GLB 生成
4. `just seed` で DB に追加

### B. MagicaVoxel + VoxAI（本番品質）

1. [MagicaVoxel](https://ephtracy.github.io/) をダウンロード
2. VoxAI のプロンプトでボクセルモデルを生成
3. カテゴリ別の最大サイズ内でデザイン
4. `File > Export > glTF` で `.glb` エクスポート
5. `frontend/public/models/{category}/{name}.glb` に配置
6. `/api/objects/upload` または `voxel_data.py` 経由で DB 登録

---

## フロントエンド表示

```
DB: model_path = "/models/food/carrot.glb"
        ↓
Next.js 静的配信: GET /models/food/carrot.glb
        ↓
GlbViewer.tsx: useGLTF("/models/food/carrot.glb")
        ↓
Three.js Canvas: ボクセルGLBを 3D 表示 + 自動回転
```

`GlbViewer` コンポーネント（`@react-three/drei` の `useGLTF` 使用）:
- モデルサイズを自動正規化（最大辺 1.5 unit）
- `autoRotate` prop でゆっくり自動回転
- フォールバック: モデル未設定時はグレーの回転立方体

---

## 実装ファイル一覧

### Backend

```
backend/app/features/objects/
├── schemas.py     HakoniwaObjectSummary / HakoniwaObjectDetail Pydantic スキーマ
├── service.py     CRUD・GLBバリデーション・いいね処理
└── router.py      FastAPI エンドポイント

backend/app/shared/models.py
    HakoniwaObject    (hakoniwa_objects テーブル ORM)
    HakoniwaObjectLike (hakoniwa_object_likes テーブル ORM)

backend/alembic/versions/005_migrate_to_glb_objects.py
    voxel_models テーブルを廃止 → hakoniwa_objects に移行

backend/scripts/
├── voxel_data.py                 全モデルのボクセルデータを Python で定義
├── generate_glb_placeholders.py  ボクセルデータ → GLB バイナリ変換
└── seed.py                       テストデータ一括投入
```

### Frontend

```
frontend/src/features/voxel_models/
├── types.ts
│   HakoniwaObjectSummary / HakoniwaObjectDetail / ObjectCategory / ObjectRarity
│   CATEGORY_LABELS / RARITY_LABELS / RARITY_COLORS / SEASON_LABELS / LOCATION_LABELS
├── hooks/useVoxelModels.ts
│   useObjects / useObject / useLikeObject
├── components/
│   GlbViewer.tsx     .glb を Three.js で表示するビューア
│   ModelGallery.tsx  図鑑グリッド + ボトムシート詳細
│   ModelUploader.tsx .glb アップロード UI

frontend/src/shared/api/voxel-models.ts
    fetchObjects / fetchObject / uploadObject / toggleObjectLike
```

---

## just コマンド

```bash
just generate-glb  # ボクセルデータ → GLB 一括生成
just seed          # 全テストデータを DB に投入
just db-reset      # DB リセット + migrate + seed
```

---

## v2 ロードマップ

- [ ] AI自動生成: Claude API + プロンプト → ボクセルデータ自動生成
- [ ] サムネイル自動生成: Three.js オフスクリーンレンダリング → PNG
- [ ] 箱庭への直接配置: 図鑑から drag & drop で座標指定配置
- [ ] 食材仕分け AI: food_labels フォルダの画像で食材認識
- [ ] LOD 最適化: 遠距離は低解像度ボクセル
- [ ] コミュニティ図鑑: ユーザー投稿モデルの公開・共有
