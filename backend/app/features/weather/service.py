"""
天候・時間帯サービス

Open-Meteo API（無料、APIキー不要）で天気情報を取得。
時刻は都市のタイムゾーンから自動計算する。
"""

import httpx
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# 都市名 → (緯度, 経度, タイムゾーン)
# Open-Meteoはコード不要だが都市名からは自動解決不可のため主要都市をハードコード
KNOWN_CITIES: dict[str, dict] = {
    "tokyo":     {"lat": 35.6762, "lon": 139.6503, "tz": "Asia/Tokyo"},
    "東京":      {"lat": 35.6762, "lon": 139.6503, "tz": "Asia/Tokyo"},
    "osaka":     {"lat": 34.6937, "lon": 135.5023, "tz": "Asia/Tokyo"},
    "大阪":      {"lat": 34.6937, "lon": 135.5023, "tz": "Asia/Tokyo"},
    "sapporo":   {"lat": 43.0642, "lon": 141.3469, "tz": "Asia/Tokyo"},
    "札幌":      {"lat": 43.0642, "lon": 141.3469, "tz": "Asia/Tokyo"},
    "fukuoka":   {"lat": 33.5904, "lon": 130.4017, "tz": "Asia/Tokyo"},
    "福岡":      {"lat": 33.5904, "lon": 130.4017, "tz": "Asia/Tokyo"},
    "new york":  {"lat": 40.7128, "lon": -74.0060, "tz": "America/New_York"},
    "london":    {"lat": 51.5074, "lon": -0.1278,  "tz": "Europe/London"},
    "paris":     {"lat": 48.8566, "lon": 2.3522,   "tz": "Europe/Paris"},
    "sydney":    {"lat": -33.8688, "lon": 151.2093, "tz": "Australia/Sydney"},
}

# Open-Meteo WMO 天気コード → 箱庭の天気状態
_WMO_MAP = {
    range(0, 1):    "clear",       # 快晴
    range(1, 4):    "cloudy",      # 曇り
    range(45, 48):  "foggy",       # 霧
    range(51, 68):  "rain",        # 雨（小〜激）
    range(71, 78):  "snow",        # 雪
    range(80, 83):  "rain",        # にわか雨
    range(85, 87):  "snow",        # にわか雪
    range(95, 100): "thunder",     # 雷雨
}


def _wmo_to_condition(code: int) -> str:
    for r, cond in _WMO_MAP.items():
        if code in r:
            return cond
    return "cloudy"


def _get_time_of_day(hour: int) -> str:
    """時刻 → dawn/morning/afternoon/evening/night"""
    if 5 <= hour < 7:
        return "dawn"
    if 7 <= hour < 11:
        return "morning"
    if 11 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 20:
        return "evening"
    return "night"


def _get_season(month: int) -> str:
    """月 → spring/summer/autumn/winter"""
    if 3 <= month <= 5:
        return "spring"
    if 6 <= month <= 8:
        return "summer"
    if 9 <= month <= 11:
        return "autumn"
    return "winter"


def _local_hour(tz_name: str) -> int:
    try:
        tz = ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        tz = ZoneInfo("UTC")
    return datetime.now(tz).hour


def resolve_city(city_name: str) -> dict | None:
    """都市名（大文字小文字を無視）から都市情報を返す"""
    return KNOWN_CITIES.get(city_name.strip().lower()) or KNOWN_CITIES.get(city_name.strip())


async def fetch_environment(city_name: str) -> dict:
    """
    外部APIで天気を取得し、箱庭の環境パラメータを返す。

    Returns:
        {
          "weather": "clear|rain|snow|cloudy|foggy|thunder",
          "time_of_day": "dawn|morning|afternoon|evening|night",
          "season": "spring|summer|autumn|winter",
          "temperature": float,
          "city_name": str,
          "is_known_city": bool,
        }
    """
    city = resolve_city(city_name)
    now = datetime.now(timezone.utc)

    if city is None:
        # 不明な都市は clear + 現在刻（UTC）
        return {
            "weather": "clear",
            "time_of_day": _get_time_of_day(now.hour),
            "season": _get_season(now.month),
            "temperature": None,
            "city_name": city_name,
            "is_known_city": False,
        }

    lat, lon, tz = city["lat"], city["lon"], city["tz"]
    time_of_day = _get_time_of_day(_local_hour(tz))

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,weathercode",
                },
            )
            resp.raise_for_status()
            data = resp.json()["current"]
            weather = _wmo_to_condition(data["weathercode"])
            temperature = data["temperature_2m"]
    except Exception:
        weather = "clear"
        temperature = None

    return {
        "weather": weather,
        "time_of_day": time_of_day,
        "season": _get_season(now.month),
        "temperature": temperature,
        "city_name": city_name,
        "is_known_city": True,
    }
