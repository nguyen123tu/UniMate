from pydantic import BaseModel, field_validator, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.task import TaskStatus, TaskPriority, TaskType

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    task_type: TaskType = TaskType.OTHER
    estimated_minutes: Optional[int] = 0
    position: int = 0
    subject_id: Optional[UUID] = None
    parent_task_id: Optional[UUID] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty_or_too_long(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty")
        if len(trimmed) > 200:
            raise ValueError("Title length cannot exceed 200 characters")
        return trimmed

    @field_validator("description")
    @classmethod
    def description_must_not_be_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 2000:
            raise ValueError("Description length cannot exceed 2000 characters")
        return v

    @field_validator("estimated_minutes")
    @classmethod
    def estimated_minutes_must_be_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("estimated_minutes must be >= 0")
        return v

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    task_type: Optional[TaskType] = None
    estimated_minutes: Optional[int] = None
    position: Optional[int] = None
    subject_id: Optional[UUID] = None
    parent_task_id: Optional[UUID] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty_or_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Title cannot be empty")
            if len(trimmed) > 200:
                raise ValueError("Title length cannot exceed 200 characters")
            return trimmed
        return v
        
    @field_validator("description")
    @classmethod
    def description_must_not_be_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 2000:
            raise ValueError("Description length cannot exceed 2000 characters")
        return v

    @field_validator("estimated_minutes")
    @classmethod
    def estimated_minutes_must_be_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("estimated_minutes must be >= 0")
        return v

class TaskResponse(TaskBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    subtasks: List['TaskResponse'] = []
    focused_minutes: int = 0
    completed_pomodoros: int = 0
    
    model_config = ConfigDict(from_attributes=True)

from typing import TypeVar, Generic, List
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total: int
    total_pages: int

class TaskBulkDelete(BaseModel):
    task_ids: List[UUID]

class TaskBulkComplete(BaseModel):
    task_ids: List[UUID]

class TaskBulkUpdate(BaseModel):
    task_ids: List[UUID]
    priority: Optional[TaskPriority] = None
    task_type: Optional[TaskType] = None
    subject_id: Optional[UUID] = None
