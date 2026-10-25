from typing import List, Optional
from pydantic import BaseModel, Field

class ValuationRequest(BaseModel):
    location: str = Field(..., min_length=2, description="City, micro-market, or locality")
    property_type: str = Field(..., description="Apartment, Villa, Commercial, Independent House, Plot")
    built_up_area: float = Field(..., gt=0, description="Area in square feet")
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    age_years: Optional[float] = Field(0.0, ge=0)
    floor_number: Optional[int] = Field(None, ge=0)
    amenities: Optional[List[str]] = Field(default_factory=list)
    condition: str = Field("Good", description="New, Excellent, Good, Fair, Needs Renovation")
    currency: str = Field("INR", description="Currency symbol/code, e.g. INR, USD, EUR")
    project_id: Optional[int] = None

class ValuationResponse(BaseModel):
    estimated_min_value: float = Field(..., description="Lower bound valuation")
    estimated_max_value: float = Field(..., description="Upper bound valuation")
    estimated_mid_value: float = Field(..., description="Central baseline estimate")
    price_per_sqft: float = Field(..., description="Estimated average rate per sqft")
    currency: str = Field("INR")
    factors: List[str] = Field(default_factory=list, description="Key factors positively or negatively impacting value")
    assumptions: List[str] = Field(default_factory=list, description="Methodological assumptions made")
    confidence_limitations: str = Field(..., description="Disclosures regarding market volatility and lack of physical inspection")
    suggested_additional_info: List[str] = Field(default_factory=list, description="Data points to refine estimate")
    is_demo_mode: bool = Field(False)
    valuation_id: Optional[int] = None
    location: str
    property_type: str
    built_up_area: float
    created_at: Optional[str] = None
