from sqlalchemy.orm import Session
from models.learner_profile import LearnerProfile

# The fixed question set — order matters, this is the sequence users go through
QUESTIONS = [
    {
        "id": "education_level",
        "question": "What's your current education level?",
        "type": "single_select",
        "options": ["High school", "FSc / Intermediate", "Diploma", "Bachelor's in progress", "Bachelor's completed", "Master's or higher"]
    },
    {
        "id": "education_field",
        "question": "What field is/was your education in?",
        "type": "text",
        "options": None
    },
    {
        "id": "experience_years",
        "question": "Do you have any work experience related to a career field?",
        "type": "single_select",
        "options": ["None", "Less than 1 year", "1-3 years", "3+ years"]
    },
    {
        "id": "skills",
        "question": "Which of these skills do you already have?",
        "type": "multi_select",
        "options": [
            "SQL", "Excel", "Python", "Data Visualization", "Statistics",
            "JavaScript", "React", "CSS", "HTML", "Git",
            "Figma", "Wireframing", "User Research", "Design Systems",
            "SEO", "Content Strategy", "Google Analytics", "Social Media Ads",
            "Copywriting", "Machine Learning"
        ]
    },
    {
        "id": "interests",
        "question": "Which of these areas interest you most?",
        "type": "multi_select",
        "options": ["Data", "Web Development", "Design", "Marketing", "Machine Learning"]
    },
    {
        "id": "career_goal",
        "question": "What's your career goal, or what role are you hoping to move into?",
        "type": "text",
        "options": None
    },
    {
        "id": "time_available",
        "question": "How much time can you commit weekly to learning?",
        "type": "single_select",
        "options": ["Less than 5hrs", "5-10hrs", "10+hrs"]
    },
    {
        "id": "learning_style",
        "question": "How do you prefer to learn?",
        "type": "single_select",
        "options": ["Video", "Hands-on", "Reading"]
    },
]

QUESTION_IDS = [q["id"] for q in QUESTIONS]


def get_or_create_profile(db: Session, user_id: int) -> LearnerProfile:
    profile = db.query(LearnerProfile).filter(LearnerProfile.user_id == user_id).first()
    if not profile:
        profile = LearnerProfile(
            user_id=user_id,
            education={},
            experience={},
            skills=[],
            interests=[],
            career_goal="",
            constraints={},
            bio="",
            social_links={},
            diagnostic_status="in_progress"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def get_next_question(profile: LearnerProfile):
    """Returns the next unanswered question, or None if diagnostic is complete."""
    answered_ids = _get_answered_ids(profile)
    for q in QUESTIONS:
        if q["id"] not in answered_ids:
            return q
    return None


def _get_answered_ids(profile: LearnerProfile):
    answered = []
    if profile.education and profile.education.get("level"):
        answered.append("education_level")
    if profile.education and profile.education.get("field"):
        answered.append("education_field")
    if profile.experience and profile.experience.get("years"):
        answered.append("experience_years")
    if profile.skills:
        answered.append("skills")
    if profile.interests:
        answered.append("interests")
    if profile.career_goal:
        answered.append("career_goal")
    if profile.constraints and profile.constraints.get("time_available"):
        answered.append("time_available")
    if profile.constraints and profile.constraints.get("learning_style"):
        answered.append("learning_style")
    return answered


def _require_answer(question_id: str, answer):
    """Single-select answers must be non-empty, otherwise the question can never
    be marked answered and the diagnostic would never complete."""
    if isinstance(answer, str) and answer.strip():
        return
    raise ValueError(f"An answer is required for '{question_id}'")


def save_answer(profile: LearnerProfile, question_id: str, answer) -> LearnerProfile:
    """Writes one answer into the correct profile field.

    Does NOT commit — the caller applies all answers in one transaction
    (see routers/chat.py) so a failed batch never leaves half-saved answers.
    Raises ValueError with a user-friendly message for invalid/empty answers.
    """
    if question_id == "education_level":
        _require_answer(question_id, answer)
        profile.education = {**(profile.education or {}), "level": answer}
    elif question_id == "education_field":
        # Optional free-text — default when blank so the question still counts as answered
        profile.education = {**(profile.education or {}), "field": (answer or "").strip() or "Not specified"}
    elif question_id == "experience_years":
        _require_answer(question_id, answer)
        profile.experience = {**(profile.experience or {}), "years": answer}
    elif question_id == "skills":
        if not isinstance(answer, list) or not answer:
            raise ValueError("Please select at least one skill")
        # answer is a list of skill names -> store with a default "intermediate" level
        profile.skills = [{"skill": s, "level": "intermediate"} for s in answer]
    elif question_id == "interests":
        if not isinstance(answer, list) or not answer:
            raise ValueError("Please select at least one interest")
        profile.interests = answer
    elif question_id == "career_goal":
        if not isinstance(answer, str) or not answer.strip():
            raise ValueError("Please describe your career goal")
        profile.career_goal = answer.strip()
    elif question_id == "time_available":
        _require_answer(question_id, answer)
        profile.constraints = {**(profile.constraints or {}), "time_available": answer}
    elif question_id == "learning_style":
        _require_answer(question_id, answer)
        profile.constraints = {**(profile.constraints or {}), "learning_style": answer}
    else:
        raise ValueError(f"Unknown question_id: {question_id}")

    # Mark complete if this was the last question
    if get_next_question(profile) is None:
        profile.diagnostic_status = "completed"

    return profile