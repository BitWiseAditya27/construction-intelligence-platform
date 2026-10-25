import logging
import datetime
import httpx
from typing import Optional, Dict, Any, Tuple
from app.schemas.weather import WeatherAdvisoryRequest, WeatherAdvisoryResponse

logger = logging.getLogger(__name__)

WEATHER_CODE_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

ACTIVITY_THRESHOLDS = {
    "concrete pouring": {
        "max_temp": 35.0,
        "min_temp": 5.0,
        "max_wind": 30.0,
        "max_precip_prob": 35,
        "recommendations": {
            "hot": "Ambient temperature exceeds 35°C: Introduce chilled batching water or shaved ice, deploy sunshades over fresh pours, and apply chemical curing compounds immediately.",
            "cold": "Ambient temperature below 5°C: Utilize heated mixing aggregates, non-chloride accelerating admixtures, and insulating curing blankets to maintain hydration temperature above 10°C.",
            "wind": "Elevated wind velocity (>25 km/h) accelerates surface evaporation. Erect windbreaks and mist spray to avert plastic shrinkage cracking.",
            "rain": "Precipitation risk active: Halt unshielded slab casting to prevent rainwater increasing water-cement ratio and weakening surface matrix."
        }
    },
    "exterior painting": {
        "max_temp": 38.0,
        "min_temp": 10.0,
        "max_humidity": 80,
        "max_precip_prob": 25,
        "recommendations": {
            "humidity": "Relative humidity > 80%: Retard drying time; latex/acrylic films will blush, trap moisture, and blister. Postpone exterior coats.",
            "rain": "Precipitation will wash uncured water-borne resins. Ensure 8-12 hours of dry weather prior to and post application.",
            "temp": "Extreme temperatures compromise film coalescence. Schedule painting during sheltered morning hours."
        }
    },
    "crane operations": {
        "max_wind": 38.0,
        "max_gust": 48.0,
        "recommendations": {
            "wind_adverse": "Wind speed exceeds crane manufacturer operational envelope (>38 km/h). Cease high-radius picks, boom down, and engage slewing brake / weather-vaning.",
            "wind_caution": "Wind gusts between 25-35 km/h: Restrict handling of large-surface-area panels (formwork, cladding) and tag-line all suspended loads."
        }
    },
    "excavation": {
        "max_precip_prob": 45,
        "recommendations": {
            "rain": "Precipitation elevates soil pore water pressure and risks trench collapse. Verify trench box shoring and keep dewatering trash pumps primed.",
            "mud": "Softened haul roads require crushed stone stabilization to avoid heavy haulage tipper bogging."
        }
    },
    "roofing": {
        "max_wind": 28.0,
        "max_precip_prob": 20,
        "recommendations": {
            "wind": "Roof deck wind speeds exceed safe working thresholds for sheet membrane handling. All crew must tie off to certified lifeline anchorages.",
            "rain": "Wet metal decking or membrane substrate poses severe slip/fall risks. Suspend rooftop activity until substrate is dry."
        }
    },
    "masonry": {
        "max_temp": 36.0,
        "min_temp": 4.0,
        "max_precip_prob": 40,
        "recommendations": {
            "rain": "Rainwash will scour fresh mortar joints and induce efflorescence. Protect newly laid blockwork with polythene sheeting.",
            "hot": "Pre-wet porous masonry blocks before laying in hot dry weather to prevent moisture suction from the cement mortar."
        }
    }
}

async def fetch_live_weather(location_query: str) -> Optional[Dict[str, Any]]:
    """Fetches real weather from Open-Meteo free geocoding and forecast API."""
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            # 1. Geocode location name
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={httpx.URL(location_query).raw_path.decode()}&count=1&language=en&format=json"
            geo_res = await client.get(geo_url)
            if geo_res.status_code != 200:
                return None
            geo_data = geo_res.json()
            results = geo_data.get("results")
            if not results:
                return None

            lat = results[0]["latitude"]
            lon = results[0]["longitude"]
            city_name = results[0].get("name", location_query)
            country = results[0].get("country", "")
            resolved_loc = f"{city_name}, {country}" if country else city_name

            # 2. Fetch current weather forecast
            forecast_url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                f"&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
                f"&hourly=precipitation_probability&forecast_days=1"
            )
            f_res = await client.get(forecast_url)
            if f_res.status_code != 200:
                return None
            f_data = f_res.json()

            current = f_data.get("current", {})
            hourly = f_data.get("hourly", {})
            precip_prob_list = hourly.get("precipitation_probability", [10])
            precip_prob = precip_prob_list[0] if precip_prob_list else 10

            weather_code = current.get("weather_code", 0)
            condition = WEATHER_CODE_DESCRIPTIONS.get(weather_code, "Variable cloudiness")

            return {
                "location": resolved_loc,
                "observation_time": current.get("time", datetime.datetime.utcnow().isoformat()),
                "temperature_c": float(current.get("temperature_2m", 26.0)),
                "humidity_percent": int(current.get("relative_humidity_2m", 55)),
                "wind_speed_kmh": float(current.get("wind_speed_10m", 12.0)),
                "condition": condition,
                "precipitation_probability": int(precip_prob),
                "is_live": True
            }
    except Exception as e:
        logger.warning(f"Could not retrieve live weather from Open-Meteo for '{location_query}': {e}")
        return None

def evaluate_activity_advisory(
    activity: str,
    temp: float,
    humidity: int,
    wind: float,
    precip_prob: int,
    condition: str
) -> Tuple[str, str, list, list]:
    """
    Evaluates weather suitability for construction activity.
    Returns (status: 'optimal'|'caution'|'adverse', summary, recommendations, hazards).
    """
    act_lower = activity.lower().strip()
    status = "optimal"
    recs = []
    hazards = []

    # Check for rain / storms
    is_storm = "thunderstorm" in condition.lower() or "heavy rain" in condition.lower()
    if is_storm or precip_prob >= 60:
        status = "adverse"
        hazards.append(f"Severe precipitation / thunderstorm alert ({condition}, {precip_prob}% chance).")
    elif precip_prob >= 35:
        status = "caution"
        hazards.append(f"Moderate precipitation threat ({precip_prob}% probability).")

    # Activity-specific rule evaluations
    if "concrete" in act_lower:
        if temp > 35.0:
            status = "adverse" if status != "adverse" else status
            hazards.append(f"High ambient thermal stress ({temp}°C > 35°C threshold).")
            recs.append("Add ice flake chilled water to mix and apply liquid membrane curing immediately.")
        elif temp < 5.0:
            status = "adverse"
            hazards.append(f"Low temperature freezing danger ({temp}°C < 5°C).")
            recs.append("Enclose pour area with thermal tarpaulins and supply warm air blower curing.")
        elif temp > 30.0 or wind > 25.0:
            if status != "adverse":
                status = "caution"
            recs.append("Monitor concrete slump retention closely; apply anti-evaporant surface mist.")

    elif "crane" in act_lower:
        if wind > 38.0 or is_storm:
            status = "adverse"
            hazards.append(f"Critical wind velocity ({wind} km/h) exceeds safe crane lift thresholds.")
            recs.append("Ground all heavy suspended picks and unlock slew brakes to allow wind-vaning.")
        elif wind > 24.0:
            if status != "adverse":
                status = "caution"
            hazards.append(f"Moderate wind velocity ({wind} km/h) can cause sail-effect on broad loads.")
            recs.append("Mandate dual tag lines on all loads and limit lifting height.")

    elif "paint" in act_lower:
        if humidity > 80 or precip_prob > 30:
            status = "adverse"
            hazards.append(f"Excessive humidity ({humidity}%) or moisture risk will ruin coating adhesion.")
            recs.append("Suspend exterior facade coatings; redirect crews to internal dry drywall work.")
        elif humidity > 70 or temp > 35.0:
            if status != "adverse":
                status = "caution"
            recs.append("Schedule application in shaded elevations away from direct sun exposure.")

    elif "excavat" in act_lower:
        if precip_prob > 45 or "rain" in condition.lower():
            status = "adverse"
            hazards.append("Trench wall water saturation and risk of cave-in / mud accumulation.")
            recs.append("Inspect shoring braces and keep submersible dewatering trash pumps active.")
        elif precip_prob > 25:
            if status != "adverse":
                status = "caution"
            recs.append("Grade access ramps with ballast to maintain tipper vehicle traction.")

    elif "roof" in act_lower or "scaffold" in act_lower:
        if wind > 28.0 or precip_prob > 30:
            status = "adverse"
            hazards.append("Extreme fall risk from elevated open decks under wind/wet surfaces.")
            recs.append("Halt open-deck installations; verify all perimeter guardrails and safety nets.")
        elif wind > 20.0:
            if status != "adverse":
                status = "caution"
            recs.append("Inspect toe-boards, tie-backs, and ensure 100% harness tie-off compliance.")

    else:
        # General outdoor work
        if temp > 38.0:
            status = "caution"
            hazards.append("High heat stress hazard for field personnel.")
            recs.append("Implement mandatory 15-minute shaded hydration breaks every hour.")
        elif wind > 35.0:
            status = "caution"
            hazards.append("Blowing dust and elevated debris hazard.")
            recs.append("Provide sealed eye goggles and damp down dry soil stockpiles.")

    if not recs:
        recs.append("Atmospheric conditions conform to standard civil engineering operational criteria.")
        recs.append("Conduct standard pre-task briefing and verify daily personal protective equipment.")

    summary_map = {
        "optimal": f"Weather conditions at {temp}°C and {condition} are favorable for {activity}.",
        "caution": f"Marginal weather conditions detected. Implement targeted site safeguards before commencing {activity}.",
        "adverse": f"Adverse weather detected ({condition}, {temp}°C, {wind} km/h wind). Strongly recommend postponing or modifying {activity}."
    }

    return status, summary_map[status], recs, hazards

async def get_weather_advisory(req: WeatherAdvisoryRequest) -> WeatherAdvisoryResponse:
    # If manual override provided by user
    if req.manual_override:
        weather_data = {
            "location": req.location,
            "observation_time": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "temperature_c": req.manual_override.temperature_c,
            "humidity_percent": req.manual_override.humidity_percent,
            "wind_speed_kmh": req.manual_override.wind_speed_kmh,
            "condition": req.manual_override.condition,
            "precipitation_probability": req.manual_override.precipitation_probability,
            "is_live": False
        }
    else:
        # Try live weather fetch
        live = await fetch_live_weather(req.location)
        if live:
            weather_data = live
        else:
            # Deterministic demo fallback for location
            weather_data = {
                "location": f"{req.location} (Demo Mode)",
                "observation_time": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
                "temperature_c": 32.5,
                "humidity_percent": 68,
                "wind_speed_kmh": 22.0,
                "condition": "Scattered Clouds / Humid",
                "precipitation_probability": 30,
                "is_live": False
            }

    status, summary, recs, hazards = evaluate_activity_advisory(
        activity=req.activity,
        temp=weather_data["temperature_c"],
        humidity=weather_data["humidity_percent"],
        wind=weather_data["wind_speed_kmh"],
        precip_prob=weather_data["precipitation_probability"],
        condition=weather_data["condition"]
    )

    disclaimer = (
        "WEATHER ADVISORY DISCLAIMER: Meteorological advice is supplementary and intended for preliminary scheduling. "
        "Official national meteorological service advisories and on-site supervisor safety determinations always take precedence."
    )

    return WeatherAdvisoryResponse(
        location=weather_data["location"],
        activity=req.activity,
        observation_time=weather_data["observation_time"],
        temperature_c=weather_data["temperature_c"],
        humidity_percent=weather_data["humidity_percent"],
        wind_speed_kmh=weather_data["wind_speed_kmh"],
        condition=weather_data["condition"],
        precipitation_probability=weather_data["precipitation_probability"],
        operational_status=status,
        advisory_summary=summary,
        specific_recommendations=recs,
        weather_hazards=hazards,
        is_live_data=weather_data["is_live"],
        disclaimer=disclaimer
    )
