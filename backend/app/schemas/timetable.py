from pydantic import BaseModel
from uuid import UUID
from datetime import time

class TimetableEventBase(BaseModel):
    subject_id: UUID
    day_of_week: int
    start_time: time
    end_time: time
    room: str | None = None

class TimetableEventCreate(TimetableEventBase):
    pass

class TimetableEventUpdate(BaseModel):
    subject_id: UUID | None = None
    day_of_week: int | None = None
    start_time: time | None = None
    end_time: time | None = None
    room: str | None = None

class TimetableEventResponse(TimetableEventBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True
