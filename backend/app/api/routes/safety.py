import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.safety import SafetyInspection
from app.models.project import Project
from app.schemas.safety import SafetyAnalyzeResponse
from app.services.safety_service import analyze_site_safety

router = APIRouter(prefix="/safety", tags=["Safety"])

@router.post("/analyze", response_model=SafetyAnalyzeResponse)
async def analyze_safety_inspection(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form("Site Safety Inspection"),
    location: Optional[str] = Form("Active Construction Zone"),
    notes: Optional[str] = Form(""),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        response_data, saved_filename, image_url = await analyze_site_safety(
            file_bytes=file_bytes,
            filename=file.filename or "site_photo.jpg",
            project_name=project_name or "",
            location=location or "",
            notes=notes or ""
        )

        # Associate project if specified or find by name
        resolved_proj_id = project_id
        if not resolved_proj_id and project_name:
            proj = db.query(Project).filter(Project.name == project_name).first()
            if proj:
                resolved_proj_id = proj.id

        # Persist inspection to database
        db_inspection = SafetyInspection(
            project_id=resolved_proj_id,
            project_name=project_name,
            location=location,
            inspector_notes=notes,
            image_filename=saved_filename,
            image_url=image_url,
            overall_risk=response_data.overall_risk,
            severity=response_data.severity,
            observations=json.dumps(response_data.observations),
            hazards=json.dumps([h.model_dump() for h in response_data.hazards]),
            recommended_actions=json.dumps(response_data.recommended_actions),
            summary=response_data.summary,
            limitations=response_data.limitations,
            disclaimer=response_data.disclaimer,
            is_demo_mode=response_data.is_demo_mode
        )
        db.add(db_inspection)
        db.commit()
        db.refresh(db_inspection)

        response_data.inspection_id = db_inspection.id
        response_data.created_at = db_inspection.created_at.isoformat() if db_inspection.created_at else ""

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Safety inspection failed: {str(e)}")

@router.get("/inspections", response_model=List[SafetyAnalyzeResponse])
def get_all_safety_inspections(db: Session = Depends(get_db)):
    records = db.query(SafetyInspection).order_by(SafetyInspection.created_at.desc()).limit(50).all()
    results = []
    for r in records:
        try:
            obs = json.loads(r.observations)
            hazards_raw = json.loads(r.hazards)
            actions = json.loads(r.recommended_actions)
        except Exception:
            obs, hazards_raw, actions = [], [], []

        results.append(SafetyAnalyzeResponse(
            inspection_id=r.id,
            project_name=r.project_name or "Site Inspection",
            location=r.location or "Site Zone",
            image_url=r.image_url,
            overall_risk=r.overall_risk,
            severity=r.severity,
            observations=obs,
            hazards=hazards_raw,
            recommended_actions=actions,
            summary=r.summary,
            limitations=r.limitations,
            disclaimer=r.disclaimer,
            is_demo_mode=r.is_demo_mode,
            created_at=r.created_at.isoformat() if r.created_at else ""
        ))
    return results
