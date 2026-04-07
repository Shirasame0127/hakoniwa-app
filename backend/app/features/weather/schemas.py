from pydantic import BaseModel
from typing import Optional


class CitySettingRequest(BaseModel):
    city_name: str


class EnvironmentResponse(BaseModel):
    weather: str            # clear / rain / snow / cloudy / foggy / thunder
    time_of_day: str        # dawn / morning / afternoon / evening / night
    season: str             # spring / summer / autumn / winter
    temperature: Optional[float]
    city_name: str
    is_known_city: bool
