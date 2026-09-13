from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    career_recommendation = Column(String, nullable=False)
    fit_score = Column(Float, nullable=False)
    skill_gaps = Column(JSON)              # array
    recommended_courses = Column(JSON)     # array of course ids
    recommended_mentor = Column(Integer, ForeignKey("mentors.id"))
    roadmap_steps = Column(JSON)           # {month1: [...], month2: [...], month3: [...]}
    next_action = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())