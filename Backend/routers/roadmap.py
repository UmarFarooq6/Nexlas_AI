from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.career import Career
from models.mentor import Mentor
from models.roadmap import Roadmap
from models.learner_profile import LearnerProfile
from schemas.roadmap_schema import RoadmapResponse
from services.matching_engine import run_matching
from services.roadmap_generator import build_and_save_roadmap

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


def _ensure_catalog(db: Session):
    """Fail with a clear 503 instead of a 500 when the seed data is missing."""
    if db.query(Career).first() is None:
        raise HTTPException(status_code=503, detail="Career catalog is empty — run seed/seed_db.py first")
    if db.query(Mentor).first() is None:
        raise HTTPException(status_code=503, detail="Mentor catalog is empty — run seed/seed_db.py first")


@router.get("/{user_id}", response_model=RoadmapResponse)
def get_roadmap(user_id: int, db: Session = Depends(get_db)):
    """
    Fetches the saved roadmap if one exists. If not, generates it once and saves it.
    Roadmap is persisted, not regenerated on every visit (per plan — one roadmap per user).
    """
    existing = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id)
        .order_by(Roadmap.created_at.desc())
        .first()
    )
    if existing:
        return existing

    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user")

    if profile.diagnostic_status != "completed":
        raise HTTPException(status_code=400, detail="Diagnostic not completed yet")

    _ensure_catalog(db)

    matching_result = run_matching(db, profile)
    roadmap = build_and_save_roadmap(db, user_id, matching_result, profile.career_goal)

    return roadmap