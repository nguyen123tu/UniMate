import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Time, Uuid
from app.db.base_class import Base

class TimetableEvent(Base):
    __tablename__ = "timetable_events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Uuid, ForeignKey("subjects.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False) # 1 = Monday, 7 = Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String, nullable=True)
