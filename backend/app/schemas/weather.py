from typing import List, Optional
from pydantic import BaseModel, Field

class ManualWeatherOverride(BaseModel):
    temperature_c: float
    humidity_percent: int
    wind_speed_kmh: float
    condition: str
    precipitation_probability: int

class WeatherAdvisoryRequest(BaseModel):
    location: str = Field(..., min_length=2)
    activity: str = Field(..., description="Concrete Pouring, Exterior Painting, Excavation, Roofing, Crane Operations, Masonry, Outdoor Scaffolding")
    manual_override: Optional[ManualWeatherOverride] = None

class WeatherAdvisoryResponse(BaseModel):
    location: str
    activity: str
    observation_time: str
    temperature_c: float
    humidity_percent: int
    wind_speed_kmh: float
    condition: str
    precipitation_probability: int
    operational_status: str = Field(..., description="optimal, caution, or adverse")
    advisory_summary: str
    specific_recommendations: List[str] = Field(default_factory=list)
    weather_hazards: List[str] = Field(default_factory=list)
    is_live_data: bool = True
    disclaimer: str
