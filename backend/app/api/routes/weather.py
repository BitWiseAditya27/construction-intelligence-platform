from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.weather import WeatherAdvisoryRequest, WeatherAdvisoryResponse, ManualWeatherOverride
from app.services.weather_service import get_weather_advisory

router = APIRouter(prefix="/weather", tags=["Weather Advisory"])

@router.get("/advisory", response_model=WeatherAdvisoryResponse)
async def get_weather_advisory_get(
    location: str = Query(..., min_length=2),
    activity: str = Query("Concrete Pouring")
):
    try:
        req = WeatherAdvisoryRequest(location=location, activity=activity)
        return await get_weather_advisory(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Weather advisory failed: {str(e)}")

@router.post("/advisory", response_model=WeatherAdvisoryResponse)
async def get_weather_advisory_post(req: WeatherAdvisoryRequest):
    try:
        return await get_weather_advisory(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Weather advisory failed: {str(e)}")
