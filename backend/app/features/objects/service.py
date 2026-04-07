"""
箱庭オブジェクト サービス

.glb ファイルのバリデーション・保存・CRUD。
本番では S3 など外部ストレージへのアップロードを想定。
開発環境では /tmp/hakoniwa_uploads/ に保存し /uploads/{id}.glb を返す。
"""
import os
import struct
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.shared.models import HakoniwaObject, HakoniwaObjectLike


# GLB ファイルの先頭バイト (magic: "glTF")
_GLB_MAGIC = b"glTF"
MAX_GLB_FILE_BYTES = 50 * 1024 * 1024  # 50MB

# カテゴリ別 catalog_id プレフィックス
CATALOG_PREFIXES: dict[str, str] = {
    "food":      "F",
    "plant":     "P",
    "person":    "C",
    "furniture": "I",
    "building":  "B",
    "field":     "L",
    "special":   "SP",
}

VALID_CATEGORIES = set(CATALOG_PREFIXES.keys())
VALID_RARITIES = {"common", "uncommon", "rare", "legendary"}
VALID_SUBCATEGORIES = {"game_software", "book", "food_label"}


def validate_glb(data: bytes) -> None:
    """GLBファイルのバリデーション（マジックバイト確認）"""
    if len(data) < 12:
        raise ValueError("ファイルが小さすぎます")
    magic = data[:4]
    if magic != _GLB_MAGIC:
        raise ValueError("GLBファイル形式ではありません (.glb のみ対応)")


def save_glb_file(file_bytes: bytes, object_id: UUID) -> str:
    """GLBファイルを保存し、アクセスURLを返す

    本番では S3 等に移行。開発では /tmp/ に保存。
    """
    upload_dir = "/tmp/hakoniwa_uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{object_id}.glb")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return f"/uploads/{object_id}.glb"


def create_object(
    db: Session,
    *,
    catalog_id: str,
    name: str,
    name_en: Optional[str],
    category: str,
    subcategory: Optional[str],
    description: Optional[str],
    flavor_text: Optional[str],
    rarity: str,
    locations: Optional[list[str]],
    seasons: Optional[list[str]],
    obtain_method: Optional[str],
    model_path: Optional[str],
    size_w: Optional[int],
    size_h: Optional[int],
    size_d: Optional[int],
    uploaded_by: Optional[UUID],
) -> HakoniwaObject:
    obj = HakoniwaObject(
        catalog_id=catalog_id,
        name=name,
        name_en=name_en,
        category=category,
        subcategory=subcategory,
        description=description,
        flavor_text=flavor_text,
        rarity=rarity,
        locations=locations,
        seasons=seasons,
        obtain_method=obtain_method,
        model_path=model_path,
        size_w=size_w,
        size_h=size_h,
        size_d=size_d,
        uploaded_by=uploaded_by,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_objects(
    db: Session,
    *,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    rarity: Optional[str] = None,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20,
) -> tuple[list[HakoniwaObject], int]:
    q = db.query(HakoniwaObject)
    if category:
        q = q.filter(HakoniwaObject.category == category)
    if subcategory:
        q = q.filter(HakoniwaObject.subcategory == subcategory)
    if rarity:
        q = q.filter(HakoniwaObject.rarity == rarity)

    total = q.count()

    if sort == "popular":
        q = q.order_by(HakoniwaObject.like_count.desc())
    else:
        q = q.order_by(HakoniwaObject.created_at.desc())

    items = q.offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_object(db: Session, object_id: UUID) -> Optional[HakoniwaObject]:
    obj = db.query(HakoniwaObject).filter(HakoniwaObject.id == object_id).first()
    if obj:
        obj.view_count = (obj.view_count or 0) + 1
        db.commit()
        db.refresh(obj)
    return obj


def get_object_by_catalog_id(db: Session, catalog_id: str) -> Optional[HakoniwaObject]:
    return db.query(HakoniwaObject).filter(HakoniwaObject.catalog_id == catalog_id).first()


def toggle_like(db: Session, user_id: UUID, object_id: UUID) -> bool:
    """いいね切り替え。追加したら True、削除したら False を返す"""
    existing = db.query(HakoniwaObjectLike).filter_by(
        user_id=user_id, object_id=object_id
    ).first()

    obj = db.query(HakoniwaObject).filter(HakoniwaObject.id == object_id).first()
    if not obj:
        raise ValueError("オブジェクトが見つかりません")

    if existing:
        db.delete(existing)
        obj.like_count = max(0, (obj.like_count or 0) - 1)
        db.commit()
        return False
    else:
        like = HakoniwaObjectLike(user_id=user_id, object_id=object_id)
        db.add(like)
        obj.like_count = (obj.like_count or 0) + 1
        db.commit()
        return True


def is_liked_by(db: Session, user_id: Optional[UUID], object_id: UUID) -> bool:
    if not user_id:
        return False
    return db.query(HakoniwaObjectLike).filter_by(
        user_id=user_id, object_id=object_id
    ).first() is not None
