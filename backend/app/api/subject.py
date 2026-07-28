from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.crud.subject import get_subjects, create_subject, get_subject, update_subject, delete_subject
from app.models.user import User
from uuid import UUID

router = APIRouter()

@router.get("/", response_model=List[SubjectResponse])
def read_subjects(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return get_subjects(db=db, user_id=current_user.id)

@router.post("/", response_model=SubjectResponse)
def create_new_subject(
    subject: SubjectCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return create_subject(db=db, subject=subject, user_id=current_user.id)

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_existing_subject(
    subject_id: UUID,
    subject: SubjectUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_subject = get_subject(db=db, subject_id=subject_id, user_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return update_subject(db=db, db_subject=db_subject, subject=subject)

@router.delete("/{subject_id}")
def delete_existing_subject(
    subject_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_subject = get_subject(db=db, subject_id=subject_id, user_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    delete_subject(db=db, db_subject=db_subject)
    return {"message": "Subject deleted successfully"}
