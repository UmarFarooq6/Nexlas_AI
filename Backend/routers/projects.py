from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.project import Project
from models.user import User
from schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/{user_id}", response_model=list[ProjectResponse])
def list_projects(user_id: int, db: Session = Depends(get_db)):
    """Return all projects for a user."""
    projects = db.query(Project).filter(Project.user_id == user_id).order_by(Project.created_at.desc()).all()
    return projects


@router.post("/{user_id}", response_model=ProjectResponse)
def create_project(user_id: int, payload: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project for the given user."""
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    project = Project(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        technologies=payload.technologies,
        status=payload.status,
        live_url=payload.live_url,
        repo_url=payload.repo_url,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    """Update an existing project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"detail": "Project deleted"}


@router.post("/{project_id}/featured", response_model=ProjectResponse)
def toggle_featured(project_id: int, db: Session = Depends(get_db)):
    """Toggle whether a project is featured on the portfolio."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.featured = not project.featured
    db.commit()
    db.refresh(project)
    return project
