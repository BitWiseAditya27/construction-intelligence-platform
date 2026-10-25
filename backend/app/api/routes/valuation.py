import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.valuation import PropertyValuation
from app.schemas.valuation import ValuationRequest, ValuationResponse
from app.services.valuation_service import estimate_property_valuation

router = APIRouter(prefix="/valuation", tags=["Property Valuation"])

@router.post("/estimate", response_model=ValuationResponse)
def estimate_valuation(
    req: ValuationRequest,
    db: Session = Depends(get_db)
):
    try:
        res = estimate_property_valuation(req)

        # Persist to database
        db_val = PropertyValuation(
            project_id=req.project_id,
            location=req.location,
            property_type=req.property_type,
            built_up_area=req.built_up_area,
            bedrooms=req.bedrooms,
            bathrooms=req.bathrooms,
            age_years=req.age_years,
            floor_number=req.floor_number,
            amenities=json.dumps(req.amenities or []),
            condition=req.condition,
            currency=res.currency,
            estimated_min_value=res.estimated_min_value,
            estimated_max_value=res.estimated_max_value,
            estimated_mid_value=res.estimated_mid_value,
            price_per_sqft=res.price_per_sqft,
            factors=json.dumps(res.factors),
            assumptions=json.dumps(res.assumptions),
            confidence_limitations=res.confidence_limitations,
            suggested_additional_info=json.dumps(res.suggested_additional_info),
            is_demo_mode=res.is_demo_mode
        )
        db.add(db_val)
        db.commit()
        db.refresh(db_val)

        res.valuation_id = db_val.id
        res.created_at = db_val.created_at.isoformat() if db_val.created_at else ""

        return res
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Valuation failed: {str(e)}")

@router.get("/estimates", response_model=List[ValuationResponse])
def get_all_valuations(db: Session = Depends(get_db)):
    records = db.query(PropertyValuation).order_by(PropertyValuation.created_at.desc()).limit(50).all()
    results = []
    for r in records:
        try:
            factors = json.loads(r.factors)
            assumptions = json.loads(r.assumptions)
            info = json.loads(r.suggested_additional_info)
        except Exception:
            factors, assumptions, info = [], [], []

        results.append(ValuationResponse(
            valuation_id=r.id,
            location=r.location,
            property_type=r.property_type,
            built_up_area=r.built_up_area,
            currency=r.currency or "INR",
            estimated_min_value=r.estimated_min_value,
            estimated_max_value=r.estimated_max_value,
            estimated_mid_value=r.estimated_mid_value,
            price_per_sqft=r.price_per_sqft,
            factors=factors,
            assumptions=assumptions,
            confidence_limitations=r.confidence_limitations,
            suggested_additional_info=info,
            is_demo_mode=r.is_demo_mode,
            created_at=r.created_at.isoformat() if r.created_at else ""
        ))
    return results
