from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class SubjectBase(BaseModel):
    name: str
    color_code: str | None = "#4f46e5"
    credits: int | None = 0

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: str | None = None
    color_code: str | None = None
    credits: int | None = None

class SubjectResponse(SubjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
