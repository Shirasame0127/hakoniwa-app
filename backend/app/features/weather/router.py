from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.shared.db import get_db
from app.shared.models import GardenState
from app.features.auth.service import verify_token
from app.features.weather import service
from app.features.weather.schemas import CitySettingRequest, EnvironmentResponse

router = APIRouter(prefix="/api/garden/weather", tags=["weather"])


def _require_user(token: Optional[str]) -> str:
    if not token:
        raise HTTPException(status_code=401, detail="認証が必要です")
    payload = verify_token(token)
    uid = payload.get("user_id") if payload else None
    if not uid:
        raise HTTPException(status_code=401, detail="無効なトークン")
    return uid


def _get_garden(db: Session, user_id: str) -> GardenState:
    g = db.query(GardenState).filter(GardenState.user_id == user_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="箱庭が見つかりません")
    return g


@router.patch("/city")
def set_city(
    body: CitySettingRequest,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """天気連携する都市を設定"""
    user_id = _require_user(token)
    if not service.resolve_city(body.city_name) and body.city_name:
        # 未知の都市でも保存は許容（天気は clear フォールバック）
        pass
    garden = _get_garden(db, user_id)
    garden.city_name = body.city_name
    db.commit()
    return {"city_name": body.city_name}


@router.get("/environment", response_model=EnvironmentResponse)
async def get_environment(
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """現在の天気・時間帯を返す（設定済み都市ベース）"""
    user_id = _require_user(token)
    garden = _get_garden(db, user_id)
    city = garden.city_name or "tokyo"
    env = await service.fetch_environment(city)
    return EnvironmentResponse(**env)


@router.get("/cities")
def list_known_cities():
    """対応済み都市一覧"""
    cities = {k: {"tz": v["tz"]} for k, v in service.KNOWN_CITIES.items()}
    return {"cities": cities}
