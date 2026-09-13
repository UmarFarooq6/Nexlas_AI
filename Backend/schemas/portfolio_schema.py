from pydantic import BaseModel
from typing import List, Optional


class PortfolioUpdate(BaseModel):
    bio: Optional[str] = None
    social_links: Optional[dict] = None  # {linkedin, github, website}


class PortfolioResponse(BaseModel):
    user_id: int
    name: str
    email: str
    bio: str = ""
    education: dict = {}
    experience: dict = {}
    skills: list = []
    interests: list = []
    career_goal: str = ""
    social_links: dict = {}
    career_match: Optional[str] = None
    fit_score: Optional[float] = None
    featured_projects: list = []

    class Config:
        from_attributes = True
