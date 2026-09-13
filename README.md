# Nexlas AI

A career-guidance layer for an online learning platform. It diagnoses a learner, recommends a career path, finds skill gaps, matches courses/mentors, and generates a 30/60/90-day roadmap — then keeps them moving with a project tracker, mentor booking, and a portfolio builder.

**Core loop:** Diagnose → Understand → Recommend → Roadmap → Action

Built for the Alibaba Cloud AI Hackathon Pakistan 2026.

## Features

- **Auth** — register/login with bcrypt-hashed passwords
- **Diagnostic** — 8-question onboarding wizard, resumable
- **Career match** — Gemini picks the best-fit career (deterministic fallback if it fails)
- **Skill gaps, courses & mentors** — deterministic matching logic
- **Roadmap** — Gemini sequences a 30/60/90-day plan from matched courses
- **Projects** — CRUD project tracker with statuses and suggested ideas
- **Mentor sessions** — book, view, and cancel sessions
- **Portfolio** — public bio + links + featured projects + career match

## Tech Stack

Python (FastAPI) · PostgreSQL · Gemini (`gemini-3.6-flash` via `google-genai`) · Vanilla HTML/CSS/JS · Streamlit (test console)

Frontend is served single-origin by FastAPI (`StaticFiles`) — no CORS needed.

## Getting Started

```bash
cd Backend
pip install -r requirements.txt

python create_table.py        # create tables
python -m seed.seed_db        # seed careers, courses, mentors
uvicorn main:app --reload     # runs at http://localhost:8000
```

### Environment Variables

Create `Backend/.env`:

```
DATABASE_URL=postgresql://nexlas_user:<your_password>@localhost:5432/nexlas_db
GEMINI_API_KEY=<your_gemini_key>
GEMINI_MODEL=gemini-3.6-flash
DEBUG=True
```

> `<your_password>` and `<your_gemini_key>` are placeholders — replace them with your own PostgreSQL password and Gemini API key before running.
>
> If `DATABASE_URL` is unset, it falls back to SQLite for quick local testing.

## Project Structure

```
Backend/    FastAPI app — models, schemas, routers, services, seed data
Frontend/   Vanilla HTML/CSS/JS — onboarding wizard, dashboard, roadmap,
            learning, mentors, projects, portfolio pages
```

## API Overview

| Router | Endpoints |
|---|---|
| `auth` | register, login |
| `chat` | diagnostic questions & answers |
| `recommendations` | career match, catalogs |
| `roadmap` | roadmap by user |
| `projects` | full CRUD |
| `sessions` | book / list / cancel mentor sessions |
| `portfolio` | get / update |

## Projects & Portfolio

- **Projects:** CRUD tracker with statuses (Idea / In Progress / Completed), featured flag, and interest-based project suggestions.
- **Portfolio:** Public page combining bio, social links, featured projects, and matched career + fit score.

---
Last updated: September 2026