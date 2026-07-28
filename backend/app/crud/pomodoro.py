from sqlalchemy.orm import Session
from app.models.pomodoro import PomodoroSession
from app.schemas.pomodoro import PomodoroSessionCreate
from uuid import UUID

def get_pomodoro_sessions(db: Session, user_id: UUID):
    return db.query(PomodoroSession).filter(PomodoroSession.user_id == user_id).all()

def create_pomodoro_session(db: Session, session: PomodoroSessionCreate, user_id: UUID):
    db_session = PomodoroSession(**session.model_dump())
    db_session.user_id = user_id
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session
