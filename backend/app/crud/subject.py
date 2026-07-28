from sqlalchemy.orm import Session
from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate
from uuid import UUID

def get_subjects(db: Session, user_id: UUID):
    return db.query(Subject).filter(Subject.user_id == user_id).all()

def create_subject(db: Session, subject: SubjectCreate, user_id: UUID):
    db_subject = Subject(**subject.model_dump())
    db_subject.user_id = user_id
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def get_subject(db: Session, subject_id: UUID, user_id: UUID):
    return db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()

def update_subject(db: Session, db_subject: Subject, subject: SubjectUpdate):
    update_data = subject.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def delete_subject(db: Session, db_subject: Subject):
    db.delete(db_subject)
    db.commit()
