import json
from sqlalchemy.orm import Session

from models.roadmap import Roadmap
from models.learner_profile import LearnerProfile
from services.ai_client import generate_text


def _fallback_roadmap_steps(course_ids: list[int], courses_by_id: dict) -> dict:
    """Deterministic fallback: just splits courses evenly across 3 months in order."""
    titles = [courses_by_id[cid].title for cid in course_ids if cid in courses_by_id]
    third = max(1, round(len(titles) / 3)) or 1

    month1 = titles[:third] or ["Review fundamentals for your target career"]
    month2 = titles[third:third * 2] or ["Continue building core skills"]
    month3 = titles[third * 2:] or ["Apply skills to a small project"]

    return {"month1": month1, "month2": month2, "month3": month3}


def generate_roadmap_steps(career_title: str, skill_gaps: list[dict], courses: list, career_goal: str) -> dict:
    """
    Asks Gemini to sequence the ALREADY-MATCHED real courses into month1/2/3
    and is validated to only ever contain course titles we actually gave it.
    Falls back to a simple even split if Gemini fails or returns invalid course titles.
    """
    course_titles = [c.title for c in courses]
    courses_by_id = {c.id: c for c in courses}
    course_ids = [c.id for c in courses]

    if not course_titles:
        return _fallback_roadmap_steps(course_ids, courses_by_id)

    gap_summary = ", ".join([f"{g['skill']} (gap: {g['gap']})" for g in skill_gaps[:5]])

    prompt = f"""A learner is working toward becoming a {career_title}. Their career goal in their own words: "{career_goal}".

Their top skill gaps: {gap_summary}

They have been matched to EXACTLY these courses (do not add, remove, or rename any): {course_titles}

Organize these exact course titles into a 30/60/90 day plan (month1, month2, month3). Every course title must appear exactly once, using the exact spelling given. Respond with ONLY valid JSON in this exact shape, no extra text:
{{"month1": ["course title", ...], "month2": [...], "month3": [...]}}"""

    result = generate_text(prompt)

    if result:
        try:
            cleaned = result.strip().strip("`").replace("json\n", "").strip()
            parsed = json.loads(cleaned)

            all_returned = parsed.get("month1", []) + parsed.get("month2", []) + parsed.get("month3", [])
            # Strict validation: every matched course must appear exactly once —
            # no invented titles, no drops, no duplicates. Anything else -> fallback.
            if len(all_returned) == len(course_titles) and set(all_returned) == set(course_titles):
                return parsed
        except (json.JSONDecodeError, AttributeError, TypeError):
            pass

    # Gemini failed, returned invalid JSON, or invented a course -> safe fallback
    return _fallback_roadmap_steps(course_ids, courses_by_id)


def generate_explanation(career_title: str, fit_score: float, skill_gaps: list[dict], career_goal: str) -> str:
    """Gemini writes plain-language reasoning. Falls back to a template if it fails."""
    gap_summary = ", ".join([g["skill"] for g in skill_gaps[:3]])

    prompt = f"""Write a short (3-4 sentence), encouraging explanation for a learner who has been matched to the career "{career_title}" with a {fit_score}% fit score. Their career goal: "{career_goal}". Their top skill gaps to focus on: {gap_summary}. Speak directly to them. Do not invent any facts, statistics, or salary figures."""

    result = generate_text(prompt)
    if result:
        return result.strip()

    return (
        f"Based on your profile, {career_title} is a strong match for you at a {fit_score}% fit. "
        f"Focus on building up {gap_summary} to close the biggest gaps. "
        f"Your roadmap below breaks this into manageable steps over the next 90 days."
    )


def build_and_save_roadmap(db: Session, user_id: int, matching_result: dict, career_goal: str) -> Roadmap:
    """Builds the full roadmap and persists it. One roadmap per user (no redo flow)."""
    career = matching_result["career"]
    fit_score = matching_result["fit_score"]
    skill_gaps = matching_result["skill_gaps"]
    courses = matching_result["courses"]
    mentor = matching_result["mentor"]

    steps = generate_roadmap_steps(career.title, skill_gaps, courses, career_goal)
    explanation = generate_explanation(career.title, fit_score, skill_gaps, career_goal)

    next_action = (
        f"Start with '{courses[0].title}'" if courses
        else f"Connect with mentor {mentor.name} to plan your first steps"
    )

    roadmap = Roadmap(
        user_id=user_id,
        career_recommendation=career.title,
        fit_score=fit_score,
        skill_gaps=skill_gaps,
        recommended_courses=[c.id for c in courses],
        recommended_mentor=mentor.id,
        roadmap_steps=steps,
        next_action=f"{next_action}. {explanation}"
    )

    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap