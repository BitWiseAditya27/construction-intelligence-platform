import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class PropertyValuation(Base):
    __tablename__ = "property_valuations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(200), nullable=False)
    property_type = Column(String(100), nullable=False)  # Apartment, Villa, Commercial, Independent House
    built_up_area = Column(Float, nullable=False)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    age_years = Column(Float, nullable=True)
    floor_number = Column(Integer, nullable=True)
    amenities = Column(Text, nullable=True)  # JSON string list
    condition = Column(String(50), nullable=False)  # New, Excellent, Good, Fair, Needs Renovation
    currency = Column(String(10), default="INR")
    
    estimated_min_value = Column(Float, nullable=False)
    estimated_max_value = Column(Float, nullable=False)
    estimated_mid_value = Column(Float, nullable=False)
    price_per_sqft = Column(Float, nullable=False)
    factors = Column(Text, nullable=False)  # JSON string list
    assumptions = Column(Text, nullable=False)  # JSON string list
    confidence_limitations = Column(Text, nullable=False)
    suggested_additional_info = Column(Text, nullable=False)  # JSON string list
    image_url = Column(String(500), nullable=True)
    is_demo_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    project = relationship("Project", back_populates="valuations")
