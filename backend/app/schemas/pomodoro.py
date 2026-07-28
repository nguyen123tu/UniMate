from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class PomodoroSessionBase(BaseModel):
    task_id: UUID | None = None
    subject_id: UUID | None = None
    duration_minutes: int = 0
    status: str = 'COMPLETED'

class PomodoroSessionCreate(PomodoroSessionBase):
    start_time: datetime | None = None

class PomodoroSessionResponse(PomodoroSessionBase):
    id: UUID
    user_id: UUID
    start_time: datetime | None = None
    completed_at: datetime | None = None

    class Config:
        from_attributes = True
