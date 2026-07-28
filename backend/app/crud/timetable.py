from sqlalchemy.orm import Session
from app.models.timetable import TimetableEvent
from app.schemas.timetable import TimetableEventCreate, TimetableEventUpdate
from uuid import UUID

def get_timetable_events(db: Session, user_id: UUID):
    return db.query(TimetableEvent).filter(TimetableEvent.user_id == user_id).all()

def create_timetable_event(db: Session, event: TimetableEventCreate, user_id: UUID):
    db_event = TimetableEvent(**event.model_dump())
    db_event.user_id = user_id
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_timetable_event(db: Session, event_id: UUID, user_id: UUID):
    return db.query(TimetableEvent).filter(TimetableEvent.id == event_id, TimetableEvent.user_id == user_id).first()

def update_timetable_event(db: Session, db_event: TimetableEvent, event: TimetableEventUpdate):
    update_data = event.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_timetable_event(db: Session, db_event: TimetableEvent):
    db.delete(db_event)
    db.commit()
