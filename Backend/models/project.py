from sqlalchemy import Column, Integer, String, JSON, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, default="")
    category = Column(String, default="Other")          # e.g. Data Analysis, Web Dev, Design
    technologies = Column(JSON, default=list)            # ["Python", "SQL", ...]
    status = Column(String, default="Idea")              # Idea / In Progress / Completed
    live_url = Column(String, nullable=True)
    repo_url = Column(String, nullable=True)
    featured = Column(Boolean, default=False)            # show on portfolio?
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
