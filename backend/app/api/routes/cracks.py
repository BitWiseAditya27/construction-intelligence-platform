import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.crack import CrackAnalysis
from app.schemas.crack import CrackAnalyzeResponse
from app.services.crack_service import analyze_crack_image

router = APIRouter(prefix="/cracks", tags=["Crack Analysis"])

@router.post("/analyze", response_model=CrackAnalyzeResponse)
async def analyze_concrete_crack(
    file: UploadFile = File(...),
    structure_type: Optional[str] = Form("Wall"),
    age_years: Optional[str] = Form(""),
    measurements: Optional[str] = Form(""),
    notes: Optional[str] = Form(""),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

        response_data, saved_filename, image_url = await analyze_crack_image(
            file_bytes=file_bytes,
            filename=file.filename or "crack_photo.jpg",
            structure_type=structure_type or "Wall",
            age_years=age_years or "",
            notes=notes or "",
            measurements=measurements or ""
        )

        db_crack = CrackAnalysis(
            project_id=project_id,
            structure_type=structure_type or "Wall",
            age_years=age_years,
            measurements=measurements,
            notes=notes,
            image_filename=saved_filename,
            image_url=image_url,
            observations=json.dumps(response_data.observations),
            location_in_image=response_data.location_in_image,
            crack_pattern=response_data.crack_pattern,
            possible_causes=json.dumps(response_data.possible_causes),
            suggested_next_steps=json.dumps(response_data.suggested_next_steps),
            professional_inspection_warranted=response_data.professional_inspection_warranted,
            urgency=response_data.urgency,
            limitations=response_data.limitations,
            disclaimer=response_data.disclaimer,
            is_demo_mode=response_data.is_demo_mode
        )
        db.add(db_crack)
        db.commit()
        db.refresh(db_crack)

        response_data.analysis_id = db_crack.id
        response_data.created_at = db_crack.created_at.isoformat() if db_crack.created_at else ""

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Crack inspection failed: {str(e)}")

@router.get("/analyses", response_model=List[CrackAnalyzeResponse])
def get_all_crack_analyses(db: Session = Depends(get_db)):
    records = db.query(CrackAnalysis).order_by(CrackAnalysis.created_at.desc()).limit(50).all()
    results = []
    for r in records:
        try:
            obs = json.loads(r.observations)
            causes = json.loads(r.possible_causes)
            steps = json.loads(r.suggested_next_steps)
        except Exception:
            obs, causes, steps = [], [], []

        results.append(CrackAnalyzeResponse(
            analysis_id=r.id,
            structure_type=r.structure_type,
            image_url=r.image_url,
            observations=obs,
            location_in_image=r.location_in_image,
            crack_pattern=r.crack_pattern,
            possible_causes=causes,
            suggested_next_steps=steps,
            professional_inspection_warranted=r.professional_inspection_warranted,
            urgency=r.urgency,
            limitations=r.limitations,
            disclaimer=r.disclaimer,
            is_demo_mode=r.is_demo_mode,
            created_at=r.created_at.isoformat() if r.created_at else ""
        ))
    return results
