from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PixelData(BaseModel):
    x: int
    y: int
    z: int
    colorHex: str


class VoxelModelResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    description: Optional[str]
    pixel_data: list[PixelData]
    size_w: int
    size_h: int
    size_d: int
    vox_file_url: Optional[str]
    thumbnail_url: Optional[str]
    like_count: int
    view_count: int
    created_at: datetime
    is_liked: bool = False

    class Config:
        from_attributes = True


class VoxelModelSummary(BaseModel):
    """一覧表示用（pixel_data省略）"""
    id: str
    user_id: str
    name: str
    category: str
    description: Optional[str]
    size_w: int
    size_h: int
    size_d: int
    thumbnail_url: Optional[str]
    like_count: int
    view_count: int
    created_at: datetime
    is_liked: bool = False

    class Config:
        from_attributes = True


class VoxelModelListResponse(BaseModel):
    models: list[VoxelModelSummary]
    total: int
    page: int
    limit: int


class UploadVoxelModelRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
