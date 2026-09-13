from pydantic import BaseModel
from typing import List, Dict


class RoadmapSteps(BaseModel):
    month1: List[str]
    month2: List[str]
    month3: List[str]


class RoadmapResponse(BaseModel):
    id: int
    user_id: int
    career_recommendation: str
    fit_score: float
    skill_gaps: List[Dict]
    recommended_courses: List[int]      # course ids
    recommended_mentor: int              # mentor id
    roadmap_steps: RoadmapSteps
    next_action: str

    class Config:
        from_attributes = True