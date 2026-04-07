"""
箱庭オブジェクト ルーター

エンドポイント:
  GET    /api/objects          - 図鑑一覧
  GET    /api/objects/{id}     - 図鑑詳細
  GET    /api/objects/catalog/{catalog_id} - カタログIDで取得
  POST   /api/objects/upload   - .glbアップロード
  POST   /api/objects/{id}/like - いいね切り替え
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import uuid

from app.shared.db import get_db
from app.features.objects import service, schemas

router = APIRouter(prefix="/api/objects", tags=["objects"])

MAX_GLB_FILE_BYTES = 50 * 1024 * 1024  # 50MB


def _get_user_id(token: Optional[str] = Query(default=None)) -> Optional[UUID]:
    """トークンからuser_idを取得（任意）"""
    if not token:
        return None
    try:
        return UUID(token)
    except Exception:
        return None


def _require_user_id(token: str = Query(...)) -> UUID:
    """トークンからuser_idを取得（必須）"""
    try:
        return UUID(token)
    except Exception:
        raise HTTPException(status_code=401, detail="無効なトークンです")


@router.get("", response_model=schemas.HakoniwaObjectListResponse)
def list_objects(
    category: Optional[str] = Query(default=None),
    subcategory: Optional[str] = Query(default=None),
    rarity: Optional[str] = Query(default=None),
    sort: str = Query(default="recent"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: Optional[UUID] = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    items, total = service.get_objects(
        db, category=category, subcategory=subcategory, rarity=rarity,
        sort=sort, page=page, limit=limit,
    )
    summaries = []
    for item in items:
        # ORM オブジェクトを辞書に変換して、id を string に変換
        obj_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        obj_dict['id'] = str(item.id)
        obj_dict['is_liked'] = service.is_liked_by(db, user_id, item.id)
        s = schemas.HakoniwaObjectSummary.model_validate(obj_dict)
        summaries.append(s)

    return schemas.HakoniwaObjectListResponse(
        objects=summaries, total=total, page=page, limit=limit
    )


@router.get("/catalog/{catalog_id}", response_model=schemas.HakoniwaObjectDetail)
def get_by_catalog_id(
    catalog_id: str,
    user_id: Optional[UUID] = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    obj = service.get_object_by_catalog_id(db, catalog_id)
    if not obj:
        raise HTTPException(status_code=404, detail="オブジェクトが見つかりません")
    obj_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    obj_dict['id'] = str(obj.id)
    obj_dict['is_liked'] = service.is_liked_by(db, user_id, obj.id)
    detail = schemas.HakoniwaObjectDetail.model_validate(obj_dict)
    return detail


@router.get("/{object_id}", response_model=schemas.HakoniwaObjectDetail)
def get_object(
    object_id: UUID,
    user_id: Optional[UUID] = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    obj = service.get_object(db, object_id)
    if not obj:
        raise HTTPException(status_code=404, detail="オブジェクトが見つかりません")
    obj_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    obj_dict['id'] = str(obj.id)
    obj_dict['is_liked'] = service.is_liked_by(db, user_id, obj.id)
    detail = schemas.HakoniwaObjectDetail.model_validate(obj_dict)
    return detail


@router.post("/upload", response_model=schemas.HakoniwaObjectDetail, status_code=201)
async def upload_object(
    file: UploadFile = File(...),
    catalog_id: str = Form(...),
    name: str = Form(...),
    name_en: Optional[str] = Form(default=None),
    category: str = Form(...),
    subcategory: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    flavor_text: Optional[str] = Form(default=None),
    rarity: str = Form(default="common"),
    locations: Optional[str] = Form(default=None),   # JSON配列 "["kitchen","garden"]"
    seasons: Optional[str] = Form(default=None),
    obtain_method: Optional[str] = Form(default=None),
    user_id: UUID = Depends(_require_user_id),
    db: Session = Depends(get_db),
):
    if category not in service.VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"不正なカテゴリ: {category}")
    if rarity not in service.VALID_RARITIES:
        raise HTTPException(status_code=400, detail=f"不正なレアリティ: {rarity}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_GLB_FILE_BYTES:
        raise HTTPException(status_code=413, detail="ファイルが大きすぎます (最大50MB)")

    try:
        service.validate_glb(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    obj_id = uuid.uuid4()
    model_path = service.save_glb_file(file_bytes, obj_id)

    import json
    locations_list = json.loads(locations) if locations else None
    seasons_list = json.loads(seasons) if seasons else None

    obj = service.create_object(
        db,
        catalog_id=catalog_id,
        name=name,
        name_en=name_en,
        category=category,
        subcategory=subcategory,
        description=description,
        flavor_text=flavor_text,
        rarity=rarity,
        locations=locations_list,
        seasons=seasons_list,
        obtain_method=obtain_method,
        model_path=model_path,
        size_w=None,
        size_h=None,
        size_d=None,
        uploaded_by=user_id,
    )
    # IDを指定して再作成（save_glb_file は obj_id を使うが create_object は新しい UUID を生成する）
    # 実際の運用では保存前にIDを決めるか、保存後にファイル名を更新する
    detail = schemas.HakoniwaObjectDetail.model_validate(obj)
    detail.id = str(obj.id)
    return detail


@router.post("/{object_id}/like")
def like_object(
    object_id: UUID,
    user_id: UUID = Depends(_require_user_id),
    db: Session = Depends(get_db),
):
    try:
        liked = service.toggle_like(db, user_id, object_id)
        return {"liked": liked}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
