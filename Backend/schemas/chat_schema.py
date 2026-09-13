from pydantic import BaseModel
from typing import List, Optional, Any


class DiagnosticQuestion(BaseModel):
    """One hardcoded question sent to the frontend to render."""
    id: str                 # e.g. "education_level"
    question: str            # display text
    type: str                 # "single_select" / "multi_select" / "text"
    options: Optional[List[str]] = None  # None for free-text questions


class DiagnosticAnswer(BaseModel):
    """One answer submitted back from the frontend."""
    question_id: str
    answer: Any               # string, list of strings, etc. depending on question type


class ChatRequest(BaseModel):
    """Submit one or more answers for a user."""
    user_id: int
    answers: List[DiagnosticAnswer]


class ChatResponse(BaseModel):
    """What comes back after submitting answers."""
    next_question: Optional[DiagnosticQuestion] = None   # None if diagnostic is complete
    diagnostic_status: str                                  # "in_progress" / "completed"