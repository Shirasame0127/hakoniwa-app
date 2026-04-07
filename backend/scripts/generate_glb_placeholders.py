#!/usr/bin/env python3
"""
generate_glb_placeholders.py — ボクセルデータ → GLB変換

voxel_data.py で定義したボクセルデータ（立方体ピクセル）を
GLTF 2.0 Binary (.glb) に変換して frontend/public/models/ に保存。

すべてのモデルは 0.1 unit の立方体ボクセルの集まりで構成される。
"""
import json
import struct
import os
import sys

# voxel_data を同ディレクトリから import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voxel_data import CATALOG


def _hex_to_rgb(hex_color: str) -> tuple[float, float, float]:
    """#RRGGBB → (r, g, b) in [0.0, 1.0]"""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = h[0]*2 + h[1]*2 + h[2]*2
    r = int(h[0:2], 16) / 255.0
    g = int(h[2:4], 16) / 255.0
    b = int(h[4:6], 16) / 255.0
    return r, g, b


VOXEL_SIZE = 0.1   # 1ボクセル = 0.1 Three.js unit

# 1ボクセル（立方体）の8頂点オフセット [dx, dy, dz]
_BOX_VERTS = [
    (0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0),   # -Z face
    (0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1),   # +Z face
]
# 6面 × 2三角形 = 12三角形 = 36インデックス
_BOX_INDICES = [
    0, 2, 1, 0, 3, 2,   # -Z
    4, 5, 6, 4, 6, 7,   # +Z
    0, 1, 5, 0, 5, 4,   # -Y
    2, 3, 7, 2, 7, 6,   # +Y
    0, 4, 7, 0, 7, 3,   # -X
    1, 2, 6, 1, 6, 5,   # +X
]


def _pixels_to_glb(pixels: list[dict]) -> bytes:
    """ボクセルデータリスト [{x,y,z,colorHex}] → GLBバイナリ

    色ごとにプリミティブを分けてマルチマテリアル GLB を生成する。
    各ボクセルは VOXEL_SIZE (0.1) の立方体として表現。
    """
    # 1) 色別グルーピング
    color_groups: dict[str, list[tuple[int, int, int]]] = {}
    for p in pixels:
        c = p["colorHex"].upper()
        if c not in color_groups:
            color_groups[c] = []
        color_groups[c].append((p["x"], p["y"], p["z"]))

    if not color_groups:
        # 空モデル: 超小さい透明ボックスを1つだけ返す
        return _empty_glb()

    # 2) 各色のメッシュデータ生成
    primitives_json = []
    materials_json = []
    accessors_json = []
    buffer_views_json = []
    binary_chunks: list[bytes] = []
    byte_offset = 0

    def _pad4(data: bytes) -> bytes:
        while len(data) % 4:
            data += b"\x00"
        return data

    for color_hex, voxels in color_groups.items():
        r, g, b = _hex_to_rgb(color_hex)
        mat_idx = len(materials_json)
        materials_json.append({
            "pbrMetallicRoughness": {
                "baseColorFactor": [r, g, b, 1.0],
                "metallicFactor": 0.0,
                "roughnessFactor": 0.8,
            }
        })

        # 全ボクセルの頂点・インデックスを一つのメッシュに合成
        all_verts: list[float] = []  # [x,y,z, x,y,z, ...]
        all_indices: list[int] = []

        for (vx, vy, vz) in voxels:
            base_idx = len(all_verts) // 3  # 現在の頂点数
            # 8頂点追加
            for (dx, dy, dz) in _BOX_VERTS:
                all_verts.append((vx + dx) * VOXEL_SIZE)
                all_verts.append((vy + dy) * VOXEL_SIZE)
                all_verts.append((vz + dz) * VOXEL_SIZE)
            # 36インデックス追加
            for idx in _BOX_INDICES:
                all_indices.append(base_idx + idx)

        # バイナリ化
        vert_bytes = struct.pack(f"<{len(all_verts)}f", *all_verts)
        # インデックスはuint32（大きなモデル対応）
        idx_bytes = struct.pack(f"<{len(all_indices)}I", *all_indices)
        idx_bytes = _pad4(idx_bytes)

        # バウンディング
        xs = [all_verts[i * 3] for i in range(len(all_verts) // 3)]
        ys = [all_verts[i * 3 + 1] for i in range(len(all_verts) // 3)]
        zs = [all_verts[i * 3 + 2] for i in range(len(all_verts) // 3)]

        # バッファビュー
        vert_bv_idx = len(buffer_views_json)
        buffer_views_json.append({
            "buffer": 0,
            "byteOffset": byte_offset,
            "byteLength": len(vert_bytes),
            "target": 34962,  # ARRAY_BUFFER
        })
        byte_offset += len(vert_bytes)
        binary_chunks.append(vert_bytes)

        idx_bv_idx = len(buffer_views_json)
        buffer_views_json.append({
            "buffer": 0,
            "byteOffset": byte_offset,
            "byteLength": len(idx_bytes),
            "target": 34963,  # ELEMENT_ARRAY_BUFFER
        })
        byte_offset += len(idx_bytes)
        binary_chunks.append(idx_bytes)

        # アクセサ
        vert_acc_idx = len(accessors_json)
        accessors_json.append({
            "bufferView": vert_bv_idx,
            "componentType": 5126,   # FLOAT
            "count": len(all_verts) // 3,
            "type": "VEC3",
            "min": [min(xs), min(ys), min(zs)],
            "max": [max(xs), max(ys), max(zs)],
        })
        idx_acc_idx = len(accessors_json)
        accessors_json.append({
            "bufferView": idx_bv_idx,
            "componentType": 5125,   # UNSIGNED_INT
            "count": len(all_indices),
            "type": "SCALAR",
        })

        primitives_json.append({
            "attributes": {"POSITION": vert_acc_idx},
            "indices": idx_acc_idx,
            "material": mat_idx,
        })

    # 3) バイナリバッファ結合
    buffer_data = b"".join(binary_chunks)

    # 4) GLTF JSON組み立て
    gltf = {
        "asset": {"version": "2.0", "generator": "hakoniwa-voxel-gen"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": primitives_json}],
        "materials": materials_json,
        "accessors": accessors_json,
        "bufferViews": buffer_views_json,
        "buffers": [{"byteLength": len(buffer_data)}],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "

    total = 12 + 8 + len(json_bytes) + 8 + len(buffer_data)
    header = struct.pack("<III", 0x46546C67, 2, total)
    json_chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    bin_chunk = struct.pack("<II", len(buffer_data), 0x004E4942) + buffer_data

    return header + json_chunk + bin_chunk


def _empty_glb() -> bytes:
    """空のGLBファイル（フォールバック用）"""
    gltf = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": []}],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "
    total = 12 + 8 + len(json_bytes)
    header = struct.pack("<III", 0x46546C67, 2, total)
    json_chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    return header + json_chunk


def generate_all(base_dir: str) -> None:
    """CATALOG の全モデルを GLB に変換して保存"""
    for item in CATALOG:
        model_file: str = item["model_file"]
        make_fn = item["make_fn"]

        out_path = os.path.join(base_dir, model_file)
        out_dir = os.path.dirname(out_path)
        os.makedirs(out_dir, exist_ok=True)

        if os.path.exists(out_path):
            print(f"  skip (exists): {model_file}")
            continue

        print(f"  generating: {model_file} ...", end="", flush=True)
        pixels = make_fn()
        glb_bytes = _pixels_to_glb(pixels)

        with open(out_path, "wb") as f:
            f.write(glb_bytes)

        print(f" {len(pixels)} voxels → {len(glb_bytes):,} bytes")

    # food_labels README
    fl_dir = os.path.join(base_dir, "special", "food_labels")
    os.makedirs(fl_dir, exist_ok=True)
    readme = os.path.join(fl_dir, "README.md")
    if not os.path.exists(readme):
        with open(readme, "w") as f:
            f.write(
                "# food_labels\n\n"
                "食材仕分け用の識別画像・ラベルデータを格納するフォルダ。\n\n"
                "## 用途\n"
                "- バーコードスキャン時の食材名照合画像\n"
                "- カメラ撮影による食材認識のリファレンス画像\n\n"
                "## ファイル命名規則\n"
                "```\n{barcode_or_name}_{side}.png\n"
                "例: 4901085016541_front.png\n```\n"
            )

    print(f"\n✅ Generated {len(CATALOG)} models to {base_dir}")


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "frontend/public/models"
    # スクリプトの親ディレクトリから実行されることを想定
    if not os.path.isabs(base):
        # backend/scripts/generate_glb_placeholders.py から 3階層上がリポジトリルート
        repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        base = os.path.join(repo_root, base)
    print(f"Generating voxel GLBs to: {base}\n")
    generate_all(base)
