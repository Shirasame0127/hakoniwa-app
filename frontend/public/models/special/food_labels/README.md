# food_labels

食材仕分け用の識別画像・ラベルデータを格納するフォルダ。

## 用途

- バーコードスキャン時の食材名照合画像
- カメラ撮影による食材認識のリファレンス画像
- 各食材の栄養成分ラベル画像 (v2 予定)

## ファイル命名規則

```
{barcode_or_name}_{side}.png
例: 4901085016541_front.png
    carrot_reference.png
```

## ディレクトリ構成

```
food_labels/
├── README.md         ← このファイル
├── vegetables/       ← 野菜
├── meats/            ← 肉・魚
├── dairy/            ← 乳製品
├── grains/           ← 穀物・パン類
└── packaged/         ← 加工食品（バーコード付き）
```
