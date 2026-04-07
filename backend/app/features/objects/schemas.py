"""
箱庭オブジェクト スキーマ

図鑑ID (catalog_id) 形式:
  F001~ : 食べ物 (food)
  P001~ : 植物 (plant)
  C001~ : 人 (person/character)
  I001~ : 家具 (furniture/interior)
  B001~ : 建造物 (building)
  L001~ : フィールド (field/land)
  SP001~: 特別 (special)
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HakoniwaObjectSummary(BaseModel):
    """図鑑一覧用（軽量）"""
    id: str
    catalog_id: str
    name: str
    name_en: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    rarity: str
    model_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    like_count: int
    view_count: int
    is_liked: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class HakoniwaObjectDetail(HakoniwaObjectSummary):
    """図鑑詳細（フルデータ）"""
    description: Optional[str] = None
    flavor_text: Optional[str] = None
    locations: Optional[list[str]] = None
    seasons: Optional[list[str]] = None
    obtain_method: Optional[str] = None
    size_w: Optional[int] = None
    size_h: Optional[int] = None
    size_d: Optional[int] = None

    model_config = {"from_attributes": True}


class HakoniwaObjectListResponse(BaseModel):
    objects: list[HakoniwaObjectSummary]
    total: int
    page: int
    limit: int


class UploadObjectRequest(BaseModel):
    """オブジェクトアップロードリクエスト"""
    catalog_id: str
    name: str
    name_en: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    flavor_text: Optional[str] = None
    rarity: str = "common"
    locations: Optional[list[str]] = None
    seasons: Optional[list[str]] = None
    obtain_method: Optional[str] = None
