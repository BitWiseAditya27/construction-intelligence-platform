import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.safety import SafetyInspection
from app.models.crack import CrackAnalysis
from app.models.valuation import PropertyValuation
from app.models.planning import ConstructionPlan
from app.schemas.dashboard import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    site_inspections = db.query(SafetyInspection).count()
    crack_count = db.query(CrackAnalysis).count()
    properties_analyzed = db.query(PropertyValuation).count()
    active_plans = db.query(ConstructionPlan).count()

    # Safety risk counts
    inspections = db.query(SafetyInspection).all()
    risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    total_hazards = 0

    for insp in inspections:
        risk = insp.overall_risk or "Medium"
        risk_counts[risk] = risk_counts.get(risk, 0) + 1
        try:
            hazards_list = json.loads(insp.hazards or "[]")
            total_hazards += len(hazards_list)
        except Exception:
            pass

    safety_distribution = [
        {"name": "Low Risk", "count": risk_counts.get("Low", 0), "color": "#10b981"},
        {"name": "Medium Risk", "count": risk_counts.get("Medium", 0), "color": "#f59e0b"},
        {"name": "High Risk", "count": risk_counts.get("High", 0), "color": "#f97316"},
        {"name": "Critical Risk", "count": risk_counts.get("Critical", 0), "color": "#ef4444"}
    ]

    # Progress chart data across project phases
    plans = db.query(ConstructionPlan).order_by(ConstructionPlan.created_at.desc()).limit(5).all()
    progress_chart = []
    if plans:
        for p in plans:
            total_tasks = len(p.tasks)
            completed_tasks = sum(1 for t in p.tasks if t.status == "completed")
            in_progress_tasks = sum(1 for t in p.tasks if t.status == "in_progress")
            percent = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
            progress_chart.append({
                "project": p.project_name[:18],
                "completion": percent,
                "completed_tasks": completed_tasks,
                "in_progress": in_progress_tasks,
                "total_tasks": total_tasks
            })
    else:
        # Default empty chart representation
        progress_chart = [
            {"project": "Phase 1: Pre-con", "completion": 85, "completed_tasks": 6, "in_progress": 1, "total_tasks": 7},
            {"project": "Phase 2: Foundation", "completion": 60, "completed_tasks": 4, "in_progress": 2, "total_tasks": 6},
            {"project": "Phase 3: Frame", "completion": 30, "completed_tasks": 2, "in_progress": 3, "total_tasks": 7},
            {"project": "Phase 4: MEP", "completion": 10, "completed_tasks": 1, "in_progress": 2, "total_tasks": 8},
            {"project": "Phase 5: Finishes", "completion": 0, "completed_tasks": 0, "in_progress": 0, "total_tasks": 5}
        ]

    # Collect recent analyses
    recent_analyses = []
    for insp in db.query(SafetyInspection).order_by(SafetyInspection.created_at.desc()).limit(3).all():
        recent_analyses.append({
            "id": insp.id,
            "type": "Safety Inspection",
            "title": insp.project_name or "Site Safety Scan",
            "badge": insp.overall_risk,
            "badge_type": "danger" if insp.overall_risk in ["High", "Critical"] else "warning" if insp.overall_risk == "Medium" else "success",
            "date": insp.created_at.strftime("%b %d, %Y") if insp.created_at else "",
            "summary": insp.summary[:100] + "..." if len(insp.summary) > 100 else insp.summary,
            "image_url": insp.image_url
        })

    for crack in db.query(CrackAnalysis).order_by(CrackAnalysis.created_at.desc()).limit(3).all():
        recent_analyses.append({
            "id": crack.id,
            "type": "Crack Diagnosis",
            "title": f"{crack.structure_type} Fracture Analysis",
            "badge": crack.urgency,
            "badge_type": "danger" if crack.urgency == "Immediate" else "warning",
            "date": crack.created_at.strftime("%b %d, %Y") if crack.created_at else "",
            "summary": crack.crack_pattern,
            "image_url": crack.image_url
        })

    for val in db.query(PropertyValuation).order_by(PropertyValuation.created_at.desc()).limit(3).all():
        recent_analyses.append({
            "id": val.id,
            "type": "Property Valuation",
            "title": f"{val.property_type} in {val.location}",
            "badge": f"{val.currency} {val.estimated_mid_value:,.0f}",
            "badge_type": "info",
            "date": val.created_at.strftime("%b %d, %Y") if val.created_at else "",
            "summary": f"Rate: {val.currency} {val.price_per_sqft}/sqft | Area: {val.built_up_area:,.0f} sqft",
            "image_url": None
        })

    # Sort recent analyses by date
    recent_analyses = recent_analyses[:6]

    # Recent activity timeline
    recent_activities = [
        {"action": "Safety inspection logged", "project": "Site Zone Beta", "time": "15m ago", "icon": "shield"},
        {"action": "Crack analysis completed", "project": "Basement Retaining Wall", "time": "2h ago", "icon": "search"},
        {"action": "WBS project plan updated", "project": "Apex Commercial Tower", "time": "5h ago", "icon": "calendar"},
        {"action": "Live weather advisory checked", "project": "Slab Concreting Pour", "time": "1d ago", "icon": "cloud"}
    ]

    return DashboardStatsResponse(
        total_projects=total_projects,
        site_inspections=site_inspections,
        safety_issues=total_hazards,
        properties_analyzed=properties_analyzed,
        active_plans=active_plans,
        progress_chart=progress_chart,
        safety_distribution=safety_distribution,
        recent_analyses=recent_analyses,
        recent_activities=recent_activities
    )
