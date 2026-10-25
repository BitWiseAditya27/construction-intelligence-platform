import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.planning import ConstructionPlan, ConstructionTask
from app.schemas.planning import (
    PlanGenerateRequest,
    PlanResponse,
    PhaseItem,
    TaskItem,
    MilestoneItem,
    RiskItem,
    TaskUpdateStatusRequest
)
from app.services.planning_service import generate_construction_plan

router = APIRouter(prefix="/planning", tags=["Planning"])

@router.post("/generate", response_model=PlanResponse)
async def generate_plan_endpoint(
    req: PlanGenerateRequest,
    db: Session = Depends(get_db)
):
    try:
        plan_res = await generate_construction_plan(req)

        # Save Plan to DB
        db_plan = ConstructionPlan(
            project_id=req.project_id,
            project_name=req.project_name,
            project_type=req.project_type,
            site_area=req.site_area,
            estimated_budget=req.estimated_budget,
            start_date=req.start_date,
            target_completion_date=req.target_completion_date,
            floors=req.floors,
            material_preferences=req.material_preferences,
            workforce_notes=req.workforce_notes,
            constraints=req.constraints,
            total_duration_weeks=plan_res.total_duration_weeks,
            phases=json.dumps([p.model_dump() for p in plan_res.phases]),
            milestones=json.dumps([m.model_dump() for m in plan_res.milestones]),
            risks=json.dumps([r.model_dump() for r in plan_res.risks]),
            is_demo_mode=plan_res.is_demo_mode
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)

        # Save Tasks to DB
        db_tasks = []
        for t in plan_res.tasks:
            d_task = ConstructionTask(
                plan_id=db_plan.id,
                phase_name=t.phase_name,
                title=t.title,
                description=t.description,
                duration_days=t.duration_days,
                start_day=t.start_day,
                end_day=t.end_day,
                dependencies=json.dumps(t.dependencies),
                status=t.status,
                budget_share=t.budget_share,
                resources_needed=t.resources_needed
            )
            db.add(d_task)
            db_tasks.append(d_task)

        db.commit()

        # Update tasks with generated IDs
        updated_tasks = []
        for dt in db_tasks:
            db.refresh(dt)
            updated_tasks.append(TaskItem(
                id=dt.id,
                phase_name=dt.phase_name,
                title=dt.title,
                description=dt.description,
                duration_days=dt.duration_days,
                start_day=dt.start_day,
                end_day=dt.end_day,
                dependencies=json.loads(dt.dependencies or "[]"),
                status=dt.status,
                budget_share=dt.budget_share,
                resources_needed=dt.resources_needed
            ))

        plan_res.plan_id = db_plan.id
        plan_res.tasks = updated_tasks
        plan_res.created_at = db_plan.created_at.isoformat() if db_plan.created_at else ""

        return plan_res

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Plan generation failed: {str(e)}")

@router.get("", response_model=List[PlanResponse])
def get_all_plans(db: Session = Depends(get_db)):
    plans = db.query(ConstructionPlan).order_by(ConstructionPlan.created_at.desc()).all()
    results = []
    for p in plans:
        phases = [PhaseItem(**item) for item in json.loads(p.phases or "[]")]
        milestones = [MilestoneItem(**item) for item in json.loads(p.milestones or "[]")]
        risks = [RiskItem(**item) for item in json.loads(p.risks or "[]")]
        tasks = [
            TaskItem(
                id=t.id,
                phase_name=t.phase_name,
                title=t.title,
                description=t.description,
                duration_days=t.duration_days,
                start_day=t.start_day,
                end_day=t.end_day,
                dependencies=json.loads(t.dependencies or "[]"),
                status=t.status,
                budget_share=t.budget_share,
                resources_needed=t.resources_needed
            )
            for t in p.tasks
        ]

        results.append(PlanResponse(
            plan_id=p.id,
            project_name=p.project_name,
            project_type=p.project_type,
            site_area=p.site_area,
            estimated_budget=p.estimated_budget,
            start_date=p.start_date,
            target_completion_date=p.target_completion_date,
            total_duration_weeks=p.total_duration_weeks,
            phases=phases,
            tasks=tasks,
            milestones=milestones,
            risks=risks,
            is_demo_mode=p.is_demo_mode,
            disclaimer="Illustrative planning model. Certified engineer review required.",
            created_at=p.created_at.isoformat() if p.created_at else ""
        ))
    return results

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan_by_id(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(ConstructionPlan).filter(ConstructionPlan.id == plan_id).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    phases = [PhaseItem(**item) for item in json.loads(p.phases or "[]")]
    milestones = [MilestoneItem(**item) for item in json.loads(p.milestones or "[]")]
    risks = [RiskItem(**item) for item in json.loads(p.risks or "[]")]
    tasks = [
        TaskItem(
            id=t.id,
            phase_name=t.phase_name,
            title=t.title,
            description=t.description,
            duration_days=t.duration_days,
            start_day=t.start_day,
            end_day=t.end_day,
            dependencies=json.loads(t.dependencies or "[]"),
            status=t.status,
            budget_share=t.budget_share,
            resources_needed=t.resources_needed
        )
        for t in p.tasks
    ]

    return PlanResponse(
        plan_id=p.id,
        project_name=p.project_name,
        project_type=p.project_type,
        site_area=p.site_area,
        estimated_budget=p.estimated_budget,
        start_date=p.start_date,
        target_completion_date=p.target_completion_date,
        total_duration_weeks=p.total_duration_weeks,
        phases=phases,
        tasks=tasks,
        milestones=milestones,
        risks=risks,
        is_demo_mode=p.is_demo_mode,
        disclaimer="Illustrative planning model. Certified engineer review required.",
        created_at=p.created_at.isoformat() if p.created_at else ""
    )

@router.patch("/{plan_id}/tasks/{task_id}", response_model=TaskItem)
def update_task_status(
    plan_id: int,
    task_id: int,
    body: TaskUpdateStatusRequest,
    db: Session = Depends(get_db)
):
    task = db.query(ConstructionTask).filter(
        ConstructionTask.id == task_id,
        ConstructionTask.plan_id == plan_id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in specified plan")

    task.status = body.status
    db.commit()
    db.refresh(task)

    return TaskItem(
        id=task.id,
        phase_name=task.phase_name,
        title=task.title,
        description=task.description,
        duration_days=task.duration_days,
        start_day=task.start_day,
        end_day=task.end_day,
        dependencies=json.loads(task.dependencies or "[]"),
        status=task.status,
        budget_share=task.budget_share,
        resources_needed=task.resources_needed
    )

@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(ConstructionPlan).filter(ConstructionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"message": f"Plan #{plan_id} deleted successfully"}
