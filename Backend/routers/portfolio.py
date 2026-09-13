from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.learner_profile import LearnerProfile
from models.project import Project
from models.roadmap import Roadmap
from schemas.portfolio_schema import PortfolioUpdate, PortfolioResponse

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def _portfolio_response(db: Session, user: User, profile) -> PortfolioResponse:
    """Build the full portfolio payload (profile data + featured projects + career match)."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user.id)
        .order_by(Roadmap.created_at.desc())
        .first()
    )
    featured = (
        db.query(Project)
        .filter(Project.user_id == user.id, Project.featured == True)
        .order_by(Project.created_at.desc())
        .all()
    )
    featured_projects = [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description or "",
            "category": p.category or "Other",
            "technologies": p.technologies or [],
            "status": p.status,
            "live_url": p.live_url,
            "repo_url": p.repo_url,
        }
        for p in featured
    ]

    return PortfolioResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        bio=(profile.bio or "") if profile else "",
        education=(profile.education or {}) if profile else {},
        experience=(profile.experience or {}) if profile else {},
        skills=(profile.skills or []) if profile else [],
        interests=(profile.interests or []) if profile else [],
        career_goal=(profile.career_goal or "") if profile else "",
        social_links=(profile.social_links or {}) if profile else {},
        career_match=roadmap.career_recommendation if roadmap else None,
        fit_score=roadmap.fit_score if roadmap else None,
        featured_projects=featured_projects,
    )


@router.get("/{user_id}", response_model=PortfolioResponse)
def get_portfolio(user_id: int, db: Session = Depends(get_db)):
    """Get the full portfolio for a user — profile data + featured projects + career match."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()
    return _portfolio_response(db, user, profile)


@router.put("/{user_id}", response_model=PortfolioResponse)
def update_portfolio(user_id: int, payload: PortfolioUpdate, db: Session = Depends(get_db)):
    """Update portfolio-specific fields (bio, social_links) on the learner profile."""
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found — complete the diagnosis first")

    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.social_links is not None:
        profile.social_links = payload.social_links

    db.commit()
    db.refresh(profile)

    # Re-fetch full portfolio
    user = db.query(User).filter(User.id == user_id).first()
    return _portfolio_response(db, user, profile)
