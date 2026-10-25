from typing import List, Optional
from pydantic import BaseModel, Field

class PlanGenerateRequest(BaseModel):
    project_name: str = Field(..., min_length=2)
    project_type: str = Field(..., description="Residential, Commercial, Industrial, Infrastructure, Renovation")
    site_area: float = Field(..., gt=0, description="Area in sq ft")
    estimated_budget: float = Field(..., gt=0, description="Total budget in selected currency")
    start_date: str = Field(..., description="YYYY-MM-DD")
    target_completion_date: str = Field(..., description="YYYY-MM-DD")
    floors: int = Field(1, ge=1)
    material_preferences: Optional[str] = None
    workforce_notes: Optional[str] = None
    constraints: Optional[str] = None
    project_id: Optional[int] = None

class TaskItem(BaseModel):
    id: Optional[int] = None
    phase_name: str
    title: str
    description: Optional[str] = None
    duration_days: int
    start_day: int
    end_day: int
    dependencies: List[str] = Field(default_factory=list)
    status: str = "pending"  # pending, in_progress, completed
    budget_share: float = 0.0
    resources_needed: Optional[str] = None

class PhaseItem(BaseModel):
    name: str
    duration_days: int
    budget_share_percent: float
    estimated_cost: float
    key_deliverables: List[str]

class MilestoneItem(BaseModel):
    title: str
    day: int
    description: str

class RiskItem(BaseModel):
    risk: str
    severity: str
    mitigation: str

class PlanResponse(BaseModel):
    plan_id: int
    project_name: str
    project_type: str
    site_area: float
    estimated_budget: float
    start_date: str
    target_completion_date: str
    total_duration_weeks: int
    phases: List[PhaseItem]
    tasks: List[TaskItem]
    milestones: List[MilestoneItem]
    risks: List[RiskItem]
    is_demo_mode: bool = False
    disclaimer: str
    created_at: Optional[str] = None

class TaskUpdateStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|in_progress|completed)$")
