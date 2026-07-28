from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.timetable import TimetableEventCreate, TimetableEventResponse, TimetableEventUpdate
from app.crud.timetable import get_timetable_events, create_timetable_event, get_timetable_event, update_timetable_event, delete_timetable_event
from app.models.user import User
from uuid import UUID

router = APIRouter()

@router.get("/", response_model=List[TimetableEventResponse])
def read_timetable_events(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return get_timetable_events(db=db, user_id=current_user.id)

@router.post("/", response_model=TimetableEventResponse)
def create_new_event(
    event: TimetableEventCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return create_timetable_event(db=db, event=event, user_id=current_user.id)

@router.put("/{event_id}", response_model=TimetableEventResponse)
def update_existing_event(
    event_id: UUID,
    event: TimetableEventUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_event = get_timetable_event(db=db, event_id=event_id, user_id=current_user.id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return update_timetable_event(db=db, db_event=db_event, event=event)

@router.delete("/{event_id}")
def delete_existing_event(
    event_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_event = get_timetable_event(db=db, event_id=event_id, user_id=current_user.id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    delete_timetable_event(db=db, db_event=db_event)
    return {"message": "Event deleted successfully"}
