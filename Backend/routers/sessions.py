from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.mentor_session import MentorSession
from models.mentor import Mentor
from models.user import User
from schemas.session_schema import BookSessionRequest, SessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/{user_id}", response_model=list[SessionResponse])
def get_sessions(user_id: int, db: Session = Depends(get_db)):
    """Return all sessions for a user (active + history)."""
    sessions = (
        db.query(MentorSession)
        .filter(MentorSession.user_id == user_id)
        .order_by(MentorSession.booked_at.desc())
        .all()
    )
    # Single query for all mentors instead of one per session (avoids N+1)
    mentors = {m.id: m for m in db.query(Mentor).all()}
    result = []
    for s in sessions:
        mentor = mentors.get(s.mentor_id)
        result.append(SessionResponse(
            id=s.id,
            user_id=s.user_id,
            mentor_id=s.mentor_id,
            mentor_name=mentor.name if mentor else "Unknown",
            mentor_specialization=mentor.specialization if mentor else "",
            status=s.status,
            booked_at=s.booked_at,
        ))
    return result


@router.post("/{user_id}", response_model=SessionResponse)
def book_session(user_id: int, payload: BookSessionRequest, db: Session = Depends(get_db)):
    """Book a mentor session. Only 1 active session allowed per user at a time."""
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing active session
    active = (
        db.query(MentorSession)
        .filter(MentorSession.user_id == user_id, MentorSession.status == "active")
        .first()
    )
    if active:
        mentor = db.query(Mentor).filter(Mentor.id == active.mentor_id).first()
        mentor_name = mentor.name if mentor else "a mentor"
        raise HTTPException(
            status_code=400,
            detail=f"You already have an active session with {mentor_name}. Cancel it first to book a new one."
        )

    # Verify mentor exists
    mentor = db.query(Mentor).filter(Mentor.id == payload.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    session = MentorSession(user_id=user_id, mentor_id=payload.mentor_id, status="active")
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        mentor_id=session.mentor_id,
        mentor_name=mentor.name,
        mentor_specialization=mentor.specialization,
        status=session.status,
        booked_at=session.booked_at,
    )


@router.put("/{session_id}/cancel", response_model=SessionResponse)
def cancel_session(session_id: int, db: Session = Depends(get_db)):
    """Cancel an active session."""
    session = db.query(MentorSession).filter(MentorSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    session.status = "cancelled"
    db.commit()
    db.refresh(session)

    mentor = db.query(Mentor).filter(Mentor.id == session.mentor_id).first()
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        mentor_id=session.mentor_id,
        mentor_name=mentor.name if mentor else "Unknown",
        mentor_specialization=mentor.specialization if mentor else "",
        status=session.status,
        booked_at=session.booked_at,
    )
