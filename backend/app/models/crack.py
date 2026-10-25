import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CrackAnalysis(Base):
    __tablename__ = "crack_analyses"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    structure_type = Column(String(100), nullable=False)  # Wall, Slab, Beam, Column, Foundation
    age_years = Column(String(50), nullable=True)
    measurements = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    image_filename = Column(String(300), nullable=False)
    image_url = Column(String(500), nullable=False)

    observations = Column(Text, nullable=False)  # JSON string list
    location_in_image = Column(String(300), nullable=False)
    crack_pattern = Column(String(200), nullable=False)  # e.g., Diagonal shear, Vertical shrinkage, Hairline mapping
    possible_causes = Column(Text, nullable=False)  # JSON string list marked as hypotheses
    suggested_next_steps = Column(Text, nullable=False)  # JSON string list
    professional_inspection_warranted = Column(Boolean, default=True)
    urgency = Column(String(50), nullable=False)  # Immediate, Prompt, Monitor
    limitations = Column(Text, nullable=False)
    disclaimer = Column(Text, nullable=False)
    is_demo_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    project = relationship("Project", back_populates="crack_analyses")
