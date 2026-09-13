from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    education = Column(JSON)          # {level, field}
    experience = Column(JSON)
    skills = Column(JSON)             # [{"skill": "Excel", "level": "intermediate"}, ...]
    interests = Column(JSON)
    career_goal = Column(String)
    constraints = Column(JSON)        # {time_available, learning_style}
    bio = Column(String, default="")
    social_links = Column(JSON)       # {linkedin, github, website}
    diagnostic_status = Column(String, default="in_progress")  # "in_progress" / "completed"
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())