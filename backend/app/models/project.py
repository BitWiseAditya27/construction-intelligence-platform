import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    location = Column(String(200), nullable=False)
    client_name = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active")  # active, completed, on_hold
    budget = Column(Float, nullable=True)
    start_date = Column(String(50), nullable=True)
    completion_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    safety_inspections = relationship("SafetyInspection", back_populates="project", cascade="all, delete-orphan")
    crack_analyses = relationship("CrackAnalysis", back_populates="project", cascade="all, delete-orphan")
    valuations = relationship("PropertyValuation", back_populates="project", cascade="all, delete-orphan")
    plans = relationship("ConstructionPlan", back_populates="project", cascade="all, delete-orphan")
