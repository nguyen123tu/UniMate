import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Uuid
from datetime import datetime, timezone
from app.db.base_class import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    color_code = Column(String, default="#4f46e5")
    credits = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
