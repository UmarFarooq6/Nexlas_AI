from pydantic import BaseModel
from typing import List


class SkillGap(BaseModel):
    skill: str
    required_level: float     # weight from careers.required_skills
    current_level: float      # derived from user's self-rated skill level
    gap: float                 # required - current


class RecommendedCourse(BaseModel):
    id: int
    title: str
    skill_covered: str
    difficulty: str


class RecommendedMentor(BaseModel):
    id: int
    name: str
    specialization: str
    bio: str
    email: str


class RecommendationResponse(BaseModel):
    career_title: str
    fit_score: float                          # 0-100
    skill_gaps: List[SkillGap]
    recommended_courses: List[RecommendedCourse]
    recommended_mentor: RecommendedMentor