from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookSessionRequest(BaseModel):
    mentor_id: int


class SessionResponse(BaseModel):
    id: int
    user_id: int
    mentor_id: int
    mentor_name: Optional[str] = None
    mentor_specialization: Optional[str] = None
    status: str
    booked_at: datetime

    class Config:
        from_attributes = True
