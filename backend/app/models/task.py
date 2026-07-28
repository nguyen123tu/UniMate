import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, Text, Integer, Uuid
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timezone
from app.db.base_class import Base
import enum

class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TaskType(str, enum.Enum):
    ASSIGNMENT = "ASSIGNMENT"
    EXAM = "EXAM"
    PROJECT = "PROJECT"
    REVIEW = "REVIEW"
    READING = "READING"
    OTHER = "OTHER"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), index=True, nullable=False)
    subject_id = Column(Uuid, ForeignKey("subjects.id", ondelete="SET NULL"), index=True, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), index=True, nullable=True)
    status = Column(Enum(TaskStatus), index=True, default=TaskStatus.PENDING)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, server_default="MEDIUM")
    task_type = Column(Enum(TaskType), default=TaskType.OTHER, server_default="OTHER")
    estimated_minutes = Column(Integer, nullable=True, server_default="0")
    position = Column(Integer, nullable=False, default=0, server_default="0")
    parent_task_id = Column(Uuid, ForeignKey("tasks.id"), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship to self
    subtasks = relationship(
        "Task",
        backref=backref('parent', remote_side=[id]),
        cascade="all, delete-orphan",
        order_by="Task.position"
    )
    pomodoros = relationship(
        "PomodoroSession",
        back_populates="task",
        cascade="all, delete-orphan"
    )

    @property
    def focused_minutes(self) -> int:
        return sum([p.duration_minutes for p in self.pomodoros if p.status == 'COMPLETED'])
        
    @property
    def completed_pomodoros(self) -> int:
        return len([p for p in self.pomodoros if p.status == 'COMPLETED'])
