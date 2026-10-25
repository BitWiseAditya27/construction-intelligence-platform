from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.project import Project

router = APIRouter(prefix="/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    name: str
    location: str
    client_name: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    location: str
    client_name: Optional[str] = None
    description: Optional[str] = None
    status: str
    budget: Optional[float] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    res = []
    for p in projects:
        res.append(ProjectResponse(
            id=p.id,
            name=p.name,
            location=p.location,
            client_name=p.client_name,
            description=p.description,
            status=p.status or "active",
            budget=p.budget,
            start_date=p.start_date,
            completion_date=p.completion_date,
            created_at=p.created_at.isoformat() if p.created_at else ""
        ))
    return res

@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(
        name=data.name,
        location=data.location,
        client_name=data.client_name,
        description=data.description,
        budget=data.budget,
        start_date=data.start_date,
        completion_date=data.completion_date
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return ProjectResponse(
        id=proj.id,
        name=proj.name,
        location=proj.location,
        client_name=proj.client_name,
        description=proj.description,
        status=proj.status or "active",
        budget=proj.budget,
        start_date=proj.start_date,
        completion_date=proj.completion_date,
        created_at=proj.created_at.isoformat() if proj.created_at else ""
    )
