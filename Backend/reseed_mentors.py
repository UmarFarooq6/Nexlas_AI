"""One-off helper: upsert mentors from the seed data (safe to run repeatedly).

Updates existing mentors (matched by email) and inserts missing ones —
never duplicates rows. Run from anywhere; paths are resolved from this file.
"""
import sys, os, json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models.mentor import Mentor

seed_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed", "seed_data.json")
with open(seed_path) as f:
    data = json.load(f)

db = SessionLocal()
try:
    existing = {m.email: m for m in db.query(Mentor).all()}
    added = updated = 0
    for m in data["mentors"]:
        row = existing.get(m["email"])
        if row:
            row.name = m["name"]
            row.specialization = m["specialization"]
            row.bio = m["bio"]
            updated += 1
        else:
            db.add(Mentor(name=m["name"], specialization=m["specialization"], bio=m["bio"], email=m["email"]))
            added += 1
    db.commit()
    print(f"Mentors reseeded: {added} added, {updated} updated.")
finally:
    db.close()
