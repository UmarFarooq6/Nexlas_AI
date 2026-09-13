import json
import os
import sys

# Allow importing from the backend/ root (one level up from seed/)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.career import Career
from models.course import Course
from models.mentor import Mentor


def load_seed_data():
    json_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed():
    data = load_seed_data()
    db = SessionLocal()

    try:
        # Idempotent: each table is checked independently by its natural key
        # (career/course title, mentor email) so partially-seeded databases heal
        # themselves instead of skipping everything or duplicating rows.
        existing_career_titles = {c.title for c in db.query(Career).all()}
        added_careers = 0
        for career in data["careers"]:
            if career["title"] in existing_career_titles:
                continue
            db.add(Career(
                title=career["title"],
                description=career["description"],
                required_skills=career["required_skills"]
            ))
            added_careers += 1

        existing_course_titles = {c.title for c in db.query(Course).all()}
        added_courses = 0
        for course in data["courses"]:
            if course["title"] in existing_course_titles:
                continue
            db.add(Course(
                title=course["title"],
                category=course["category"],
                skill_covered=course["skill_covered"],
                difficulty=course["difficulty"],
                description=course["description"]
            ))
            added_courses += 1

        existing_mentor_emails = {m.email for m in db.query(Mentor).all()}
        added_mentors = 0
        for mentor in data["mentors"]:
            if mentor["email"] in existing_mentor_emails:
                continue
            db.add(Mentor(
                name=mentor["name"],
                specialization=mentor["specialization"],
                bio=mentor["bio"],
                email=mentor["email"]
            ))
            added_mentors += 1

        db.commit()
        print(
            f"Seeded {added_careers} careers, {added_courses} courses, {added_mentors} mentors "
            f"(existing records skipped)."
        )

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()