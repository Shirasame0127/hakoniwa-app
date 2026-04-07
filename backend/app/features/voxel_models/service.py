import struct
import uuid
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.shared.models import VoxelModel, VoxelModelLike

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/hakoniwa_uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ジャンル別最大ピクセル数 (W, H, D)
CATEGORY_MAX_SIZE: dict[str, tuple[int, int, int]] = {
    "food":      (32, 32, 32),
    "plant":     (24, 32, 24),
    "person":    (24, 40, 24),
    "furniture": (32, 32, 32),
    "building":  (64, 64, 64),
}

VALID_CATEGORIES = set(CATEGORY_MAX_SIZE.keys())

# MagicaVoxel デフォルトパレット（255色、1-indexed）
_DEFAULT_PALETTE_HEX = [
    "#ffffff", "#ffccff", "#ff99ff", "#ff66ff", "#ff33ff", "#ff00ff", "#ffcccc", "#ff99cc",
    "#ff66cc", "#ff33cc", "#ff00cc", "#ffcc99", "#ff9999", "#ff6699", "#ff3399", "#ff0099",
    "#ffcc66", "#ff9966", "#ff6666", "#ff3366", "#ff0066", "#ffcc33", "#ff9933", "#ff6633",
    "#ff3333", "#ff0033", "#ffcc00", "#ff9900", "#ff6600", "#ff3300", "#ff0000", "#ccffff",
    "#ccccff", "#cc99ff", "#cc66ff", "#cc33ff", "#cc00ff", "#ccffcc", "#cccccc", "#cc99cc",
    "#cc66cc", "#cc33cc", "#cc00cc", "#ccff99", "#cc9999", "#cc6699", "#cc3399", "#cc0099",
    "#ccff66", "#cc9966", "#cc6666", "#cc3366", "#cc0066", "#ccff33", "#cc9933", "#cc6633",
    "#cc3333", "#cc0033", "#ccff00", "#cc9900", "#cc6600", "#cc3300", "#cc0000", "#99ffff",
    "#99ccff", "#9999ff", "#9966ff", "#9933ff", "#9900ff", "#99ffcc", "#99cccc", "#9999cc",
    "#9966cc", "#9933cc", "#9900cc", "#99ff99", "#99cc99", "#999999", "#996699", "#993399",
    "#990099", "#99ff66", "#99cc66", "#999966", "#996666", "#993366", "#990066", "#99ff33",
    "#99cc33", "#999933", "#996633", "#993333", "#990033", "#99ff00", "#99cc00", "#999900",
    "#996600", "#993300", "#990000", "#66ffff", "#66ccff", "#6699ff", "#6666ff", "#6633ff",
    "#6600ff", "#66ffcc", "#66cccc", "#6699cc", "#6666cc", "#6633cc", "#6600cc", "#66ff99",
    "#66cc99", "#669999", "#666699", "#663399", "#660099", "#66ff66", "#66cc66", "#669966",
    "#666666", "#663366", "#660066", "#66ff33", "#66cc33", "#669933", "#666633", "#663333",
    "#660033", "#66ff00", "#66cc00", "#669900", "#666600", "#663300", "#660000", "#33ffff",
    "#33ccff", "#3399ff", "#3366ff", "#3333ff", "#3300ff", "#33ffcc", "#33cccc", "#3399cc",
    "#3366cc", "#3333cc", "#3300cc", "#33ff99", "#33cc99", "#339999", "#336699", "#333399",
    "#330099", "#33ff66", "#33cc66", "#339966", "#336666", "#333366", "#330066", "#33ff33",
    "#33cc33", "#339933", "#336633", "#333333", "#330033", "#33ff00", "#33cc00", "#339900",
    "#336600", "#333300", "#330000", "#00ffff", "#00ccff", "#0099ff", "#0066ff", "#0033ff",
    "#0000ff", "#00ffcc", "#00cccc", "#0099cc", "#0066cc", "#0033cc", "#0000cc", "#00ff99",
    "#00cc99", "#009999", "#006699", "#003399", "#000099", "#00ff66", "#00cc66", "#009966",
    "#006666", "#003366", "#000066", "#00ff33", "#00cc33", "#009933", "#006633", "#003333",
    "#000033", "#00ff00", "#00cc00", "#009900", "#006600", "#003300", "#000000", "#ff7f7f",
    "#ff6680", "#ff4d80", "#ff3380", "#ff1a80", "#ff0080", "#bf7fbf", "#bf66bf", "#bf4dbf",
    "#bf33bf", "#bf1abf", "#bf00bf", "#7f7f7f", "#7f667f", "#7f4d7f", "#7f337f", "#7f1a7f",
    "#7f007f", "#3f7f3f", "#3f663f", "#3f4d3f", "#3f333f", "#3f1a3f", "#3f003f", "#007f00",
    "#006600", "#004d00", "#003300", "#001a00", "#000000", "#ffff7f", "#ffff66", "#ffff4d",
    "#ffff33", "#ffff1a", "#ffff00", "#bfbf00", "#bfb200", "#bf9900", "#bf8000", "#bf6600",
    "#bf4d00", "#7f7f00", "#7f6600", "#7f4d00", "#7f3300", "#7f1a00", "#7f0000", "#00007f",
]


def parse_vox(data: bytes) -> dict:
    """
    MagicaVoxelの .vox バイナリを解析してピクセルデータに変換する。

    Returns:
        {
          "size": {"x": int, "y": int, "z": int},
          "pixels": [{"x": int, "y": int, "z": int, "colorHex": str}, ...]
        }
    """
    if len(data) < 8:
        raise ValueError("ファイルサイズが小さすぎます")
    if data[:4] != b"VOX ":
        raise ValueError(".vox ファイルではありません")

    idx = 8  # magic(4) + version(4)
    size = None
    raw_voxels: list[dict] = []
    palette: list[str] = []

    while idx + 12 <= len(data):
        chunk_id = data[idx: idx + 4]
        content_size = struct.unpack("<I", data[idx + 4: idx + 8])[0]
        children_size = struct.unpack("<I", data[idx + 8: idx + 12])[0]
        idx += 12

        content = data[idx: idx + content_size]
        idx += content_size + children_size

        if chunk_id == b"SIZE":
            w, h, d = struct.unpack("<III", content[:12])
            size = {"x": w, "y": h, "z": d}

        elif chunk_id == b"XYZI":
            num = struct.unpack("<I", content[:4])[0]
            for i in range(num):
                off = 4 + i * 4
                vx, vy, vz, ci = struct.unpack("<BBBB", content[off: off + 4])
                raw_voxels.append({"x": int(vx), "y": int(vy), "z": int(vz), "ci": int(ci)})

        elif chunk_id == b"RGBA":
            for i in range(min(255, content_size // 4)):
                r, g, b, _ = struct.unpack("<BBBB", content[i * 4: i * 4 + 4])
                palette.append(f"#{r:02X}{g:02X}{b:02X}")

    if size is None:
        raise ValueError("SIZEチャンクが見つかりませんでした")

    if not palette:
        palette = _DEFAULT_PALETTE_HEX

    pixels = []
    for v in raw_voxels:
        ci = v["ci"]
        if ci == 0 or ci > len(palette):
            continue
        pixels.append({
            "x": v["x"],
            "y": v["y"],
            "z": v["z"],
            "colorHex": palette[ci - 1],
        })

    return {"size": size, "pixels": pixels}


def validate_category_size(size: dict, category: str) -> None:
    """ジャンル別最大ピクセル数のバリデーション"""
    if category not in VALID_CATEGORIES:
        raise ValueError(f"無効なカテゴリ: {category}。有効値: {sorted(VALID_CATEGORIES)}")

    max_w, max_h, max_d = CATEGORY_MAX_SIZE[category]
    w, h, d = size["x"], size["y"], size["z"]
    if w > max_w or h > max_h or d > max_d:
        raise ValueError(
            f"サイズ超過: {category} の最大は {max_w}×{max_h}×{max_d}px ですが、"
            f"このモデルは {w}×{h}×{d}px です"
        )


def save_vox_file(file_bytes: bytes, model_id: str) -> str:
    """アップロードされた .vox ファイルをローカルに保存してURLを返す"""
    path = UPLOAD_DIR / f"{model_id}.vox"
    path.write_bytes(file_bytes)
    return f"/uploads/{model_id}.vox"


# --- DB 操作 ---

def create_voxel_model(
    db: Session,
    model_id: str,
    user_id: str,
    name: str,
    category: str,
    description: str | None,
    pixel_data: list[dict],
    size: dict,
    vox_file_url: str | None = None,
) -> VoxelModel:
    model = VoxelModel(
        id=model_id,
        user_id=user_id,
        name=name,
        category=category,
        description=description,
        pixel_data=pixel_data,
        size_w=size["x"],
        size_h=size["y"],
        size_d=size["z"],
        vox_file_url=vox_file_url,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def get_voxel_models(
    db: Session,
    category: str | None = None,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20,
) -> tuple[list[VoxelModel], int]:
    q = db.query(VoxelModel)
    if category:
        q = q.filter(VoxelModel.category == category)
    if sort == "popular":
        q = q.order_by(VoxelModel.like_count.desc())
    else:
        q = q.order_by(VoxelModel.created_at.desc())
    total = q.count()
    models = q.offset((page - 1) * limit).limit(limit).all()
    return models, total


def get_voxel_model(db: Session, model_id: str) -> VoxelModel | None:
    return db.query(VoxelModel).filter(VoxelModel.id == model_id).first()


def toggle_like(db: Session, user_id: str, model_id: str) -> bool:
    """いいね切り替え。Trueなら追加、Falseなら削除"""
    existing = (
        db.query(VoxelModelLike)
        .filter(VoxelModelLike.user_id == user_id, VoxelModelLike.model_id == model_id)
        .first()
    )
    model = db.query(VoxelModel).filter(VoxelModel.id == model_id).first()
    if not model:
        return False

    if existing:
        db.delete(existing)
        model.like_count = max(0, model.like_count - 1)
        db.commit()
        return False
    else:
        like = VoxelModelLike(user_id=user_id, model_id=model_id)
        db.add(like)
        model.like_count = (model.like_count or 0) + 1
        db.commit()
        return True


def is_liked_by(db: Session, user_id: str, model_id: str) -> bool:
    return (
        db.query(VoxelModelLike)
        .filter(VoxelModelLike.user_id == user_id, VoxelModelLike.model_id == model_id)
        .first()
        is not None
    )
