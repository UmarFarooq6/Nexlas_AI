from pydantic import BaseModel
from typing import List, Optional


class Education(BaseModel):
    level: str          # e.g. "Bachelor's completed"
    field: Optional[str] = None


class Experience(BaseModel):
    years: str           # e.g. "1-3 years"
    field: Optional[str] = None


class SkillItem(BaseModel):
    skill: str
    level: str            # "beginner" / "intermediate" / "advanced"


class Constraints(BaseModel):
    time_available: str    # e.g. "5-10hrs"
    learning_style: str    # e.g. "video" / "hands-on" / "reading"


class LearnerProfileInput(BaseModel):
    """What the frontend sends after the user answers the hardcoded questions."""
    education: Education
    experience: Experience
    skills: List[SkillItem]
    interests: List[str]
    career_goal: str
    constraints: Constraints


class LearnerProfileResponse(LearnerProfileInput):
    """What the backend returns back — includes DB fields."""
    id: int
    user_id: int
    diagnostic_status: str

    class Config:
        from_attributes = True