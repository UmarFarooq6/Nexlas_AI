from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "Other"
    technologies: List[str] = []
    status: str = "Idea"
    live_url: Optional[str] = None
    repo_url: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    technologies: Optional[List[str]] = None
    status: Optional[str] = None
    live_url: Optional[str] = None
    repo_url: Optional[str] = None
    featured: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    category: str
    technologies: List[str]
    status: str
    live_url: Optional[str] = None
    repo_url: Optional[str] = None
    featured: bool = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        from_attributes = True
