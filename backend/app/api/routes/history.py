import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.safety import SafetyInspection
from app.models.crack import CrackAnalysis
from app.models.valuation import PropertyValuation
from app.models.planning import ConstructionPlan
from app.schemas.history import HistoryItemResponse

router = APIRouter(prefix="/history", tags=["Project History"])

@router.get("", response_model=List[HistoryItemResponse])
def get_unified_history(
    module_type: Optional[str] = Query(None, description="safety, crack, valuation, planning"),
    search: Optional[str] = Query(None, description="Search term in project or title"),
    db: Session = Depends(get_db)
):
    items = []

    # 1. Safety Inspections
    if not module_type or module_type == "safety":
        query = db.query(SafetyInspection)
        if search:
            query = query.filter(SafetyInspection.project_name.ilike(f"%{search}%"))
        for s in query.order_by(SafetyInspection.created_at.desc()).limit(30).all():
            try:
                obs = json.loads(s.observations)
                haz = json.loads(s.hazards)
                acts = json.loads(s.recommended_actions)
            except Exception:
                obs, haz, acts = [], [], []

            badge_color = (
                "red" if s.overall_risk in ["Critical", "High"] else
                "amber" if s.overall_risk == "Medium" else "emerald"
            )

            items.append(HistoryItemResponse(
                id=s.id,
                module_type="safety",
                title=s.project_name or "Site Safety Scan",
                subtitle=s.location or "Site Inspection",
                badge_text=f"{s.overall_risk} Risk",
                badge_color=badge_color,
                details_summary=s.summary,
                is_demo_mode=s.is_demo_mode,
                created_at=s.created_at.isoformat() if s.created_at else "",
                image_url=s.image_url,
                payload={
                    "overall_risk": s.overall_risk,
                    "severity": s.severity,
                    "observations": obs,
                    "hazards": haz,
                    "recommended_actions": acts,
                    "summary": s.summary,
                    "limitations": s.limitations,
                    "disclaimer": s.disclaimer
                }
            ))

    # 2. Crack Analyses
    if not module_type or module_type == "crack":
        query = db.query(CrackAnalysis)
        if search:
            query = query.filter(CrackAnalysis.structure_type.ilike(f"%{search}%"))
        for c in query.order_by(CrackAnalysis.created_at.desc()).limit(30).all():
            try:
                obs = json.loads(c.observations)
                causes = json.loads(c.possible_causes)
                steps = json.loads(c.suggested_next_steps)
            except Exception:
                obs, causes, steps = [], [], []

            badge_color = (
                "red" if c.urgency == "Immediate" else
                "amber" if c.urgency == "Prompt" else "emerald"
            )

            items.append(HistoryItemResponse(
                id=c.id,
                module_type="crack",
                title=f"{c.structure_type} Fracture Diagnosis",
                subtitle=c.crack_pattern,
                badge_text=f"{c.urgency} Urgency",
                badge_color=badge_color,
                details_summary=c.crack_pattern,
                is_demo_mode=c.is_demo_mode,
                created_at=c.created_at.isoformat() if c.created_at else "",
                image_url=c.image_url,
                payload={
                    "structure_type": c.structure_type,
                    "crack_pattern": c.crack_pattern,
                    "location_in_image": c.location_in_image,
                    "observations": obs,
                    "possible_causes": causes,
                    "suggested_next_steps": steps,
                    "professional_inspection_warranted": c.professional_inspection_warranted,
                    "urgency": c.urgency,
                    "limitations": c.limitations,
                    "disclaimer": c.disclaimer
                }
            ))

    # 3. Property Valuations
    if not module_type or module_type == "valuation":
        query = db.query(PropertyValuation)
        if search:
            query = query.filter(PropertyValuation.location.ilike(f"%{search}%"))
        for v in query.order_by(PropertyValuation.created_at.desc()).limit(30).all():
            try:
                factors = json.loads(v.factors)
                assump = json.loads(v.assumptions)
            except Exception:
                factors, assump = [], []

            items.append(HistoryItemResponse(
                id=v.id,
                module_type="valuation",
                title=f"{v.property_type} Valuation",
                subtitle=v.location,
                badge_text=f"{v.currency} {v.estimated_mid_value:,.0f}",
                badge_color="blue",
                details_summary=f"{v.built_up_area:,.0f} sqft @ {v.currency} {v.price_per_sqft}/sqft ({v.condition})",
                is_demo_mode=v.is_demo_mode,
                created_at=v.created_at.isoformat() if v.created_at else "",
                image_url=v.image_url,
                payload={
                    "location": v.location,
                    "property_type": v.property_type,
                    "built_up_area": v.built_up_area,
                    "estimated_min_value": v.estimated_min_value,
                    "estimated_max_value": v.estimated_max_value,
                    "estimated_mid_value": v.estimated_mid_value,
                    "price_per_sqft": v.price_per_sqft,
                    "currency": v.currency,
                    "factors": factors,
                    "assumptions": assump,
                    "confidence_limitations": v.confidence_limitations
                }
            ))

    # 4. Construction Plans
    if not module_type or module_type == "planning":
        query = db.query(ConstructionPlan)
        if search:
            query = query.filter(ConstructionPlan.project_name.ilike(f"%{search}%"))
        for p in query.order_by(ConstructionPlan.created_at.desc()).limit(30).all():
            items.append(HistoryItemResponse(
                id=p.id,
                module_type="planning",
                title=p.project_name,
                subtitle=f"{p.project_type} • {p.site_area:,.0f} sqft",
                badge_text=f"{p.total_duration_weeks} Wks",
                badge_color="purple",
                details_summary=f"Budget: {p.estimated_budget:,.0f} | Tasks: {len(p.tasks)}",
                is_demo_mode=p.is_demo_mode,
                created_at=p.created_at.isoformat() if p.created_at else "",
                image_url=None,
                payload={
                    "project_name": p.project_name,
                    "project_type": p.project_type,
                    "estimated_budget": p.estimated_budget,
                    "site_area": p.site_area,
                    "total_duration_weeks": p.total_duration_weeks,
                    "start_date": p.start_date,
                    "target_completion_date": p.target_completion_date,
                    "task_count": len(p.tasks)
                }
            ))

    # Sort all by created_at descending
    items.sort(key=lambda x: x.created_at, reverse=True)
    return items

@router.delete("/{record_id}")
def delete_history_record(
    record_id: int,
    module_type: str = Query(..., description="safety, crack, valuation, or planning"),
    db: Session = Depends(get_db)
):
    if module_type == "safety":
        record = db.query(SafetyInspection).filter(SafetyInspection.id == record_id).first()
    elif module_type == "crack":
        record = db.query(CrackAnalysis).filter(CrackAnalysis.id == record_id).first()
    elif module_type == "valuation":
        record = db.query(PropertyValuation).filter(PropertyValuation.id == record_id).first()
    elif module_type == "planning":
        record = db.query(ConstructionPlan).filter(ConstructionPlan.id == record_id).first()
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid module type.")

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")

    db.delete(record)
    db.commit()
    return {"message": f"{module_type.capitalize()} record #{record_id} successfully deleted."}
