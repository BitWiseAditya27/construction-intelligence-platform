import logging
from typing import Dict, Any, List
from app.schemas.valuation import ValuationRequest, ValuationResponse
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

# Base benchmarks per sqft in INR by location tier and property type
CITY_TIERS = {
    "mumbai": 18000,
    "delhi": 12000,
    "bangalore": 9500,
    "bengaluru": 9500,
    "hyderabad": 8500,
    "chennai": 8000,
    "pune": 7500,
    "kolkata": 6500,
    "ahmedabad": 6000,
    "default": 6500
}

PROPERTY_TYPE_MULTIPLIERS = {
    "apartment": 1.0,
    "villa": 1.45,
    "independent house": 1.25,
    "commercial": 1.6,
    "plot": 0.85
}

CONDITION_MULTIPLIERS = {
    "new": 1.15,
    "excellent": 1.08,
    "good": 1.0,
    "fair": 0.88,
    "needs renovation": 0.72
}

def calculate_baseline_valuation(req: ValuationRequest) -> ValuationResponse:
    """
    Transparent, explainable baseline valuation model.
    Accounts for geographic tier, property classification, age depreciation, floor elevation,
    condition rating, and amenity stack.
    """
    loc_key = req.location.lower().strip()
    base_rate = CITY_TIERS.get("default")
    for city, rate in CITY_TIERS.items():
        if city in loc_key:
            base_rate = rate
            break

    # Adjust for property type
    prop_type_key = req.property_type.lower().strip()
    prop_mult = PROPERTY_TYPE_MULTIPLIERS.get(prop_type_key, 1.0)

    # Adjust for condition
    cond_mult = CONDITION_MULTIPLIERS.get(req.condition.lower().strip(), 1.0)

    # Age depreciation (approx 1.2% per year up to 30 years)
    age = max(0.0, req.age_years or 0.0)
    age_discount = max(0.60, 1.0 - (age * 0.012))

    # Floor multiplier (e.g. higher floors in towers command premium, ground floor in villas)
    floor_mult = 1.0
    if req.floor_number is not None and req.floor_number > 0 and "apartment" in prop_type_key:
        floor_mult += min(0.12, req.floor_number * 0.008)

    # Amenities bonus
    amenities = req.amenities or []
    amenity_bonus = min(0.15, len(amenities) * 0.02)

    # Composite rate per sqft
    final_rate_per_sqft = round(base_rate * prop_mult * cond_mult * age_discount * floor_mult * (1 + amenity_bonus), 2)
    
    # Currency conversion factor if user chooses USD or EUR
    currency = (req.currency or "INR").upper()
    rate_factor = 1.0
    if currency == "USD":
        rate_factor = 1 / 85.0
    elif currency == "EUR":
        rate_factor = 1 / 92.0
    elif currency == "GBP":
        rate_factor = 1 / 108.0
    elif currency == "AED":
        rate_factor = 1 / 23.0

    final_rate_per_sqft = round(final_rate_per_sqft * rate_factor, 2)
    area = req.built_up_area

    mid_value = round(area * final_rate_per_sqft, 2)
    min_value = round(mid_value * 0.90, 2)  # -10% spread
    max_value = round(mid_value * 1.12, 2)  # +12% spread

    factors = [
        f"Location baseline calibrated to {req.location} tier benchmark ({base_rate} INR/sqft base).",
        f"Property typology adjustment for '{req.property_type}' (multiplier: x{prop_mult:.2f}).",
        f"Structural condition '{req.condition}' applied rating factor (x{cond_mult:.2f}).",
        f"Depreciation for building age ({age} years) adjusted by x{age_discount:.2f}.",
        f"Amenity stack value contribution for {len(amenities)} selected features (+{amenity_bonus*100:.1f}%)."
    ]

    assumptions = [
        "Assumes freehold ownership, clear marketable title, and unencumbered legal status.",
        "Built-up area supplied by user reflects standard carpet plus allowable super-built-up loading.",
        "Standard local infrastructure availability (piped municipal water, 3-phase electricity, all-weather road access).",
        "Current market demand within normal cyclical trading ranges without distressed liquidation pressures."
    ]

    limitations = (
        "ILLUSTRATIVE ESTIMATE DISCLAIMER: This valuation is generated mathematically using a transparent baseline rule-engine. "
        "It does NOT constitute an official certified bank appraisal, registered valuer report, or guarantee of actual transaction price. "
        "Actual market value is subject to on-site physical inspection, municipal zoning checks, and live buyer negotiations."
    )

    additional_info = [
        "Exact carpet-to-super-built-up efficiency ratio from architectural floor plans.",
        "Recent registry deed transaction values (circle rates / guidance values) from local sub-registrar office.",
        "Proximity to transit corridors, metro stations, and key commercial employment hubs.",
        "Quality of interior fitouts, MEP specifications, and construction materials utilized."
    ]

    return ValuationResponse(
        estimated_min_value=min_value,
        estimated_max_value=max_value,
        estimated_mid_value=mid_value,
        price_per_sqft=final_rate_per_sqft,
        currency=currency,
        factors=factors,
        assumptions=assumptions,
        confidence_limitations=limitations,
        suggested_additional_info=additional_info,
        is_demo_mode=True,
        location=req.location,
        property_type=req.property_type,
        built_up_area=req.built_up_area
    )

def estimate_property_valuation(req: ValuationRequest) -> ValuationResponse:
    baseline = calculate_baseline_valuation(req)

    # If AI service is available, enrich with AI market commentary
    if ai_service.is_ai_available:
        prompt = f"""
You are an expert Real Estate Investment Analyst and Property Valuer.
Review the following baseline calculation:
- Location: {req.location}
- Property Type: {req.property_type}
- Built-up Area: {req.built_up_area} sq ft
- Age: {req.age_years} years
- Condition: {req.condition}
- Amenities: {req.amenities}
- Baseline Rate: {baseline.price_per_sqft} {baseline.currency}/sqft
- Baseline Mid Value: {baseline.estimated_mid_value} {baseline.currency}

Provide refined qualitative market insight, localized micro-market value drivers, and critical valuation risks.
Return a JSON object:
{{
  "factors": ["Enriched factor 1", "Enriched factor 2", "Enriched factor 3"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "confidence_limitations": "Strict transparent disclosure stating this is an AI-assisted statistical estimate, not a certified bank appraisal.",
  "suggested_additional_info": ["Item 1", "Item 2"]
}}
"""
        parsed, is_demo = ai_service.generate_json(prompt=prompt)
        if parsed and not is_demo:
            try:
                baseline.factors = parsed.get("factors", baseline.factors)
                baseline.assumptions = parsed.get("assumptions", baseline.assumptions)
                baseline.confidence_limitations = parsed.get("confidence_limitations", baseline.confidence_limitations)
                baseline.suggested_additional_info = parsed.get("suggested_additional_info", baseline.suggested_additional_info)
                baseline.is_demo_mode = False
            except Exception as e:
                logger.warning(f"Error enriching valuation with AI: {e}")

    return baseline
