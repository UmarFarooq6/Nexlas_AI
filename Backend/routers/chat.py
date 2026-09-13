from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.learner_profile import LearnerProfile
from models.roadmap import Roadmap
from models.user import User
from schemas.chat_schema import ChatRequest, ChatResponse, DiagnosticQuestion
from services.conversation_manager import (
    get_or_create_profile,
    get_next_question,
    save_answer,
)

router = APIRouter(prefix="/chat", tags=["chat"])


def _require_user(db: Session, user_id: int) -> None:
    """404 for unknown users instead of an FK-violation 500 when the profile is created."""
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    """Return the user's saved diagnostic profile so the frontend can restore the wizard."""
    _require_user(db, user_id)
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()
    if not profile:
        return {"diagnostic_status": "not_started"}
    return {
        "diagnostic_status": profile.diagnostic_status,
        "education": profile.education or {},
        "experience": profile.experience or {},
        "skills": profile.skills or [],
        "interests": profile.interests or [],
        "career_goal": profile.career_goal or "",
        "constraints": profile.constraints or {},
    }


@router.get("/next/{user_id}", response_model=ChatResponse)
def get_next(user_id: int, db: Session = Depends(get_db)):
    """Fetch the next unanswered diagnostic question for this user."""
    _require_user(db, user_id)
    profile = get_or_create_profile(db, user_id)
    next_q = get_next_question(profile)

    return ChatResponse(
        next_question=DiagnosticQuestion(**next_q) if next_q else None,
        diagnostic_status=profile.diagnostic_status
    )


@router.post("/answer", response_model=ChatResponse)
def submit_answer(payload: ChatRequest, db: Session = Depends(get_db)):
    """Submit one or more answers, save them, return the next question.

    All answers are applied in a single transaction: if any answer is invalid,
    nothing is saved. Re-submitting a completed diagnostic drops the user's old
    roadmap so it regenerates from the new answers instead of going stale.
    """
    _require_user(db, payload.user_id)
    profile = get_or_create_profile(db, payload.user_id)

    for ans in payload.answers:
        try:
            profile = save_answer(profile, ans.question_id, ans.answer)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if profile.diagnostic_status == "completed":
        db.query(Roadmap).filter(Roadmap.user_id == payload.user_id).delete()

    db.commit()
    db.refresh(profile)

    next_q = get_next_question(profile)

    return ChatResponse(
        next_question=DiagnosticQuestion(**next_q) if next_q else None,
        diagnostic_status=profile.diagnostic_status
    )