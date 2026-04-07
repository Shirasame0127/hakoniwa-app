# 3Dモデル フォルダ

> **すべてのモデルはボクセル（立方体の集まり）で構成される**

## フォルダ構成

```
models/
├── food/              食べ物 (F001〜)
├── plant/             植物 (P001〜)
├── person/            人 (C001〜)
├── furniture/         家具 (I001〜)
├── building/          建造物 (B001〜)
├── field/             フィールド (L001〜)
└── special/
    ├── game_software/ ゲームソフト (SP001〜)
    ├── books/         本 (SP002〜)
    └── food_labels/   食材仕分け用画像フォルダ
```

## 収録モデル

| ID    | 名前                       | カテゴリ   |
|-------|--------------------------|----------|
| F001  | にんじん                   | food      |
| F002  | トマト                     | food      |
| F003  | りんご                     | food      |
| F004  | 鶏肉                       | food      |
| F005  | お弁当                     | food      |
| P001  | 大きなオーク               | plant     |
| P002  | 赤いバラ                   | plant     |
| P003  | サボテン                   | plant     |
| C001  | プレイヤー                 | person    |
| C002  | 農家のおじさん             | person    |
| I001  | 木のテーブル               | furniture |
| I002  | キャンプファイヤー         | furniture |
| I003  | 本棚                       | furniture |
| B001  | 小さな小屋                 | building  |
| B002  | 風車                       | building  |
| L001  | 草原タイル（凸凹）         | field     |
| L002  | 川のタイル（水ボクセル）   | field     |
| L003  | 石畳タイル（目地あり）     | field     |
| SP001 | スーファミカートリッジ     | special   |
| SP002 | 技術書                     | special   |

## ファイル形式

- **拡張子**: `.glb` (GLTF 2.0 Binary)
- **内容**: ボクセル（0.1 unit の立方体）の集合
- **上限**: 50MB/ファイル（APIアップロード時）

## 新しいモデルを追加する

### 開発用（Pythonボクセルデータ）

```bash
# 1. backend/scripts/voxel_data.py に make_xxx() 関数を追加
# 2. CATALOG リストにエントリを追加
# 3. GLB を生成
just generate-glb

# 4. DB に登録
just seed
```

### 本番用（MagicaVoxel）

1. MagicaVoxel でボクセルモデルを作成
2. `File > Export > glTF` で `.glb` にエクスポート
3. このフォルダの適切なサブディレクトリに配置
4. API または seed.py で DB に登録

詳細: [docs/3D_MODELS.md](../../../../docs/3D_MODELS.md)
