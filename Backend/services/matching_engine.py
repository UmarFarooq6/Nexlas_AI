import json
from sqlalchemy.orm import Session

from models.career import Career
from models.course import Course
from models.mentor import Mentor
from models.learner_profile import LearnerProfile
from services.ai_client import generate_text


def pick_career_with_gemini(profile: LearnerProfile, careers: list[Career]) -> Career:
    """
    Asks Gemini to pick the single best-fit career from the real list.
    Output is strictly validated against actual career titles in the DB —
    if Gemini returns anything else, we fall back to a deterministic backup.
    """
    career_titles = [c.title for c in careers]

    skills_list = ", ".join([s["skill"] for s in (profile.skills or [])]) or "none listed"
    interests_list = ", ".join(profile.interests or []) or "none listed"

    prompt = f"""You are matching a learner to exactly ONE career from this fixed list: {career_titles}.

Learner profile:
- Skills: {skills_list}
- Interests: {interests_list}
- Career goal (their own words): {profile.career_goal or "not specified"}
- Education: {profile.education}
- Experience: {profile.experience}

Respond with ONLY the exact career title from the list above that best fits this learner. No explanation, no extra text, no punctuation — just the exact title as written in the list."""

    result = generate_text(prompt)

    if result:
        cleaned = result.strip()
        for career in careers:
            if career.title.lower() == cleaned.lower():
                return career

    # Fallback: Gemini failed or returned something invalid -> deterministic backup
    return _fallback_pick_career(profile, careers)


def _fallback_pick_career(profile: LearnerProfile, careers: list[Career]) -> Career:
    """Deterministic backup if Gemini fails or returns an invalid career title."""
    user_skills = {s["skill"] for s in (profile.skills or [])}
    best_career = None
    best_score = -1

    for career in careers:
        required = career.required_skills or []
        score = sum(r["weight"] for r in required if r["skill"] in user_skills)
        if score > best_score:
            best_score = score
            best_career = career

    return best_career or careers[0]


def calculate_skill_gaps(profile: LearnerProfile, career: Career) -> list[dict]:
    """Deterministic: compares user's skill levels against career's required weights."""
    level_map = {"beginner": 0.3, "intermediate": 0.6, "advanced": 1.0}
    user_skills = {s["skill"]: level_map.get(s["level"], 0.5) for s in (profile.skills or [])}

    gaps = []
    for req in (career.required_skills or []):
        skill_name = req["skill"]
        required_level = req["weight"]
        current_level = user_skills.get(skill_name, 0.0)
        gap = round(required_level - current_level, 2)
        gaps.append({
            "skill": skill_name,
            "required_level": required_level,
            "current_level": current_level,
            "gap": max(gap, 0.0)
        })

    # Largest gaps first -> most important to address
    gaps.sort(key=lambda g: g["gap"], reverse=True)
    return gaps


def calculate_fit_score(profile: LearnerProfile, career: Career) -> float:
    """Deterministic: 0-100 fit score based on skill overlap and weights."""
    user_skills = {s["skill"] for s in (profile.skills or [])}
    required = career.required_skills or []

    if not required:
        return 0.0

    total_weight = sum(r["weight"] for r in required)
    matched_weight = sum(r["weight"] for r in required if r["skill"] in user_skills)

    if total_weight == 0:
        return 0.0

    return round((matched_weight / total_weight) * 100, 1)


def match_courses(db: Session, skill_gaps: list[dict], limit: int = 5) -> list[Course]:
    """Deterministic: picks real courses from DB matching the biggest skill gaps."""
    gap_skills = [g["skill"] for g in skill_gaps if g["gap"] > 0]

    matched = []
    for skill in gap_skills:
        course = (
            db.query(Course)
            .filter(Course.skill_covered == skill)
            .order_by(Course.id)  # stable pick if several courses cover the same skill
            .first()
        )
        if course and course not in matched:
            matched.append(course)
        if len(matched) >= limit:
            break

    return matched


def match_mentor(db: Session, career: Career) -> Mentor:
    """Deterministic: picks the mentor whose specialization matches the career."""
    mentor = (
        db.query(Mentor)
        .filter(Mentor.specialization == career.title)
        .order_by(Mentor.id)
        .first()
    )
    if not mentor:
        mentor = db.query(Mentor).order_by(Mentor.id).first()  # fallback: any mentor, better than none
    return mentor


def run_matching(db: Session, profile: LearnerProfile, career: Career = None) -> dict:
    """Full pipeline: Gemini picks career (unless one is given) -> deterministic gap/course/mentor matching.

    Pass ``career`` to reuse an already-persisted pick (e.g. the career stored with
    the user's roadmap) so repeated calls never disagree with each other.
    """
    if career is None:
        career = pick_career_with_gemini(profile, db.query(Career).order_by(Career.id).all())
    fit_score = calculate_fit_score(profile, career)
    skill_gaps = calculate_skill_gaps(profile, career)
    courses = match_courses(db, skill_gaps)
    mentor = match_mentor(db, career)

    return {
        "career": career,
        "fit_score": fit_score,
        "skill_gaps": skill_gaps,
        "courses": courses,
        "mentor": mentor,
    }