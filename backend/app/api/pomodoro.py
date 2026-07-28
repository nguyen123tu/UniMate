from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.pomodoro import PomodoroSessionCreate, PomodoroSessionResponse
from app.crud.pomodoro import get_pomodoro_sessions, create_pomodoro_session
from app.models.pomodoro import PomodoroSession
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[PomodoroSessionResponse])
def read_pomodoro_sessions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return get_pomodoro_sessions(db=db, user_id=current_user.id)

@router.post("/", response_model=PomodoroSessionResponse)
def create_new_session(
    session: PomodoroSessionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    from datetime import datetime, timezone
    from fastapi import HTTPException
    from app.models.task import Task
    from app.models.subject import Subject
    
    if session.duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="Duration must be positive")
    if session.status not in ['COMPLETED', 'CANCELLED']:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    subject_id = session.subject_id
    if session.task_id:
        task = db.query(Task).filter(Task.id == session.task_id, Task.user_id == current_user.id).first()
        if not task:
            raise HTTPException(status_code=403, detail="Task not found or access denied")
        subject_id = task.subject_id
    elif session.subject_id:
        subj = db.query(Subject).filter(Subject.id == session.subject_id, Subject.user_id == current_user.id).first()
        if not subj:
            raise HTTPException(status_code=403, detail="Subject not found or access denied")
    
    # Create the model dict
    db_session = PomodoroSession(
        user_id=current_user.id,
        task_id=session.task_id,
        subject_id=subject_id,
        duration_minutes=session.duration_minutes,
        status=session.status,
        start_time=session.start_time or datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc)
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session
