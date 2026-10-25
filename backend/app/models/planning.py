import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class ConstructionPlan(Base):
    __tablename__ = "construction_plans"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    project_name = Column(String(200), nullable=False)
    project_type = Column(String(100), nullable=False)
    site_area = Column(Float, nullable=False)
    estimated_budget = Column(Float, nullable=False)
    start_date = Column(String(50), nullable=False)
    target_completion_date = Column(String(50), nullable=False)
    floors = Column(Integer, default=1)
    material_preferences = Column(String(200), nullable=True)
    workforce_notes = Column(String(200), nullable=True)
    constraints = Column(Text, nullable=True)
    total_duration_weeks = Column(Integer, nullable=False)
    phases = Column(Text, nullable=False)  # JSON string list of phase objects with budgets
    milestones = Column(Text, nullable=False)  # JSON string list
    risks = Column(Text, nullable=False)  # JSON string list
    is_demo_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    project = relationship("Project", back_populates="plans")
    tasks = relationship("ConstructionTask", back_populates="plan", cascade="all, delete-orphan", order_by="ConstructionTask.start_day")

class ConstructionTask(Base):
    __tablename__ = "construction_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("construction_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    phase_name = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, default=1)
    start_day = Column(Integer, default=0)
    end_day = Column(Integer, default=1)
    dependencies = Column(Text, nullable=True)  # JSON list of task titles or IDs
    status = Column(String(50), default="pending")  # pending, in_progress, completed
    budget_share = Column(Float, default=0.0)
    resources_needed = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    plan = relationship("ConstructionPlan", back_populates="tasks")
