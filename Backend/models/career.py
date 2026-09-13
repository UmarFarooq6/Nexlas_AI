from sqlalchemy import Column, Integer, String, JSON
from database import Base

class Career(Base):
    __tablename__ = "careers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    required_skills = Column(JSON, nullable=False)  # [{"skill": "SQL", "weight": 0.9}, ...]