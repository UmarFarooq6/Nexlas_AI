from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.learner_profile import LearnerProfile
from models.career import Career
from models.course import Course
from models.mentor import Mentor
from models.roadmap import Roadmap
from schemas.recommendation_schema import (
    RecommendationResponse,
    SkillGap,
    RecommendedCourse,
    RecommendedMentor,
)
from services.matching_engine import run_matching

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _ensure_catalog(db: Session):
    """Fail with a clear 503 instead of a 500 when the seed data is missing."""
    if db.query(Career).first() is None:
        raise HTTPException(status_code=503, detail="Career catalog is empty — run seed/seed_db.py first")
    if db.query(Mentor).first() is None:
        raise HTTPException(status_code=503, detail="Mentor catalog is empty — run seed/seed_db.py first")


@router.get("/{user_id}", response_model=RecommendationResponse)
def get_recommendation(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user")

    if profile.diagnostic_status != "completed":
        raise HTTPException(status_code=400, detail="Diagnostic not completed yet")

    _ensure_catalog(db)

    # Reuse the career already persisted with the user's roadmap (if any) so the
    # recommendation is stable across visits and always agrees with the roadmap page.
    career = None
    existing_roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id)
        .order_by(Roadmap.created_at.desc())
        .first()
    )
    if existing_roadmap:
        career = db.query(Career).filter(Career.title == existing_roadmap.career_recommendation).first()

    result = run_matching(db, profile, career=career)

    return RecommendationResponse(
        career_title=result["career"].title,
        fit_score=result["fit_score"],
        skill_gaps=[SkillGap(**g) for g in result["skill_gaps"]],
        recommended_courses=[
            RecommendedCourse(
                id=c.id,
                title=c.title,
                skill_covered=c.skill_covered,
                difficulty=c.difficulty
            ) for c in result["courses"]
        ],
        recommended_mentor=RecommendedMentor(
            id=result["mentor"].id,
            name=result["mentor"].name,
            specialization=result["mentor"].specialization,
            bio=result["mentor"].bio,
            email=result["mentor"].email
        )
    )


@router.get("/catalog/courses")
def list_courses(db: Session = Depends(get_db)):
    """Return all courses for the learning catalog."""
    courses = db.query(Course).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "skill_covered": c.skill_covered,
            "difficulty": c.difficulty,
            "description": c.description,
        }
        for c in courses
    ]


@router.get("/catalog/mentors")
def list_mentors(db: Session = Depends(get_db)):
    """Return all mentors for the mentors page."""
    mentors = db.query(Mentor).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "specialization": m.specialization,
            "bio": m.bio,
            "email": m.email,
        }
        for m in mentors
    ]