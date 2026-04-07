from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.shared.db import get_db
from app.features.auth.service import verify_token
from app.features.voxel_models import service
from app.features.voxel_models.schemas import (
    VoxelModelResponse,
    VoxelModelListResponse,
    VoxelModelSummary,
    PixelData,
)

router = APIRouter(prefix="/api/voxel-models", tags=["voxel-models"])

MAX_VOX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


def _get_user_id(token: Optional[str]) -> Optional[str]:
    """トークンからユーザーIDを取得（任意）"""
    if not token:
        return None
    payload = verify_token(token)
    return payload.get("user_id") if payload else None


def _require_user_id(token: Optional[str] = None) -> str:
    user_id = _get_user_id(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="認証が必要です")
    return user_id


def _to_summary(model, is_liked: bool = False) -> VoxelModelSummary:
    return VoxelModelSummary(
        id=str(model.id),
        user_id=str(model.user_id),
        name=model.name,
        category=model.category,
        description=model.description,
        size_w=model.size_w,
        size_h=model.size_h,
        size_d=model.size_d,
        thumbnail_url=model.thumbnail_url,
        like_count=model.like_count or 0,
        view_count=model.view_count or 0,
        created_at=model.created_at,
        is_liked=is_liked,
    )


def _to_response(model, is_liked: bool = False) -> VoxelModelResponse:
    return VoxelModelResponse(
        id=str(model.id),
        user_id=str(model.user_id),
        name=model.name,
        category=model.category,
        description=model.description,
        pixel_data=[PixelData(**p) for p in (model.pixel_data or [])],
        size_w=model.size_w,
        size_h=model.size_h,
        size_d=model.size_d,
        vox_file_url=model.vox_file_url,
        thumbnail_url=model.thumbnail_url,
        like_count=model.like_count or 0,
        view_count=model.view_count or 0,
        created_at=model.created_at,
        is_liked=is_liked,
    )


@router.post("/upload", response_model=VoxelModelResponse, status_code=status.HTTP_201_CREATED)
async def upload_vox_model(
    file: UploadFile = File(..., description=".vox ファイル"),
    name: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    token: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """MagicaVoxel の .vox ファイルをアップロードして登録"""
    user_id = _require_user_id(token)

    if not file.filename or not file.filename.endswith(".vox"):
        raise HTTPException(status_code=400, detail=".vox ファイルのみ対応しています")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_VOX_FILE_BYTES:
        raise HTTPException(status_code=400, detail="ファイルサイズは10MB以下にしてください")

    # .vox パース
    try:
        vox = service.parse_vox(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # ジャンル別サイズ検証
    try:
        service.validate_category_size(vox["size"], category)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # DB 保存（IDを先に確定してからファイル保存）
    import uuid as _uuid
    model_id = str(_uuid.uuid4())
    vox_file_url = service.save_vox_file(file_bytes, model_id)

    model = service.create_voxel_model(
        db=db,
        model_id=model_id,
        user_id=user_id,
        name=name,
        category=category,
        description=description,
        pixel_data=vox["pixels"],
        size=vox["size"],
        vox_file_url=vox_file_url,
    )
    return _to_response(model, is_liked=False)


@router.get("", response_model=VoxelModelListResponse)
def list_voxel_models(
    category: Optional[str] = None,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """ボクセルモデル一覧（図鑑）"""
    user_id = _get_user_id(token)
    models, total = service.get_voxel_models(db, category=category, sort=sort, page=page, limit=limit)
    summaries = [
        _to_summary(m, is_liked=service.is_liked_by(db, user_id, str(m.id)) if user_id else False)
        for m in models
    ]
    return VoxelModelListResponse(models=summaries, total=total, page=page, limit=limit)


@router.get("/{model_id}", response_model=VoxelModelResponse)
def get_voxel_model(
    model_id: str,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """ボクセルモデル詳細"""
    user_id = _get_user_id(token)
    model = service.get_voxel_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    is_liked = service.is_liked_by(db, user_id, model_id) if user_id else False
    return _to_response(model, is_liked=is_liked)


@router.post("/{model_id}/like")
def like_model(
    model_id: str,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """いいね切り替え"""
    user_id = _require_user_id(token)
    model = service.get_voxel_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    liked = service.toggle_like(db, user_id, model_id)
    return {"liked": liked, "like_count": model.like_count}
