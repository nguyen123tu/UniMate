import uuid
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Uuid, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base_class import Base

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    task_id = Column(Uuid, ForeignKey("tasks.id"), nullable=True)
    subject_id = Column(Uuid, ForeignKey("subjects.id"), nullable=True)
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    duration_minutes = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status = Column(String(20), default='COMPLETED') # 'COMPLETED', 'CANCELLED'

    task = relationship("Task", back_populates="pomodoros")
