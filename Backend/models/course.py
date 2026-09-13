from sqlalchemy import Column, Integer, String
from database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    skill_covered = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)  # beginner / intermediate / advanced
    description = Column(String, nullable=False)