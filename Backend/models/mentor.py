from sqlalchemy import Column, Integer, String
from database import Base

class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    bio = Column(String, nullable=False)
    email = Column(String, nullable=False)