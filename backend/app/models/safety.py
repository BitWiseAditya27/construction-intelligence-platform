import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class SafetyInspection(Base):
    __tablename__ = "safety_inspections"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    project_name = Column(String(200), nullable=True)
    location = Column(String(200), nullable=True)
    inspector_notes = Column(Text, nullable=True)
    image_filename = Column(String(300), nullable=False)
    image_url = Column(String(500), nullable=False)
    
    overall_risk = Column(String(50), nullable=False)  # Low, Medium, High, Critical
    severity = Column(String(50), nullable=False)
    observations = Column(Text, nullable=False)  # JSON string list
    hazards = Column(Text, nullable=False)  # JSON string list of objects
    recommended_actions = Column(Text, nullable=False)  # JSON string list
    summary = Column(Text, nullable=False)
    limitations = Column(Text, nullable=False)
    disclaimer = Column(Text, nullable=False)
    is_demo_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    project = relationship("Project", back_populates="safety_inspections")
