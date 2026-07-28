from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.subject import Subject
from app.schemas.task import TaskCreate, TaskUpdate
from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException

from sqlalchemy import or_, desc, asc
from typing import Optional, List, Tuple
from app.models.task import TaskStatus, TaskPriority, TaskType

def get_tasks(
    db: Session, 
    user_id: UUID,
    subject_id: Optional[UUID] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    task_type: Optional[TaskType] = None,
    search: Optional[str] = None,
    deadline_from: Optional[datetime] = None,
    deadline_to: Optional[datetime] = None,
    overdue: Optional[bool] = None,
    parent_task_id: Optional[UUID] = None,
    include_subtasks: Optional[bool] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Task], int]:
    query = db.query(Task).filter(Task.user_id == user_id)

    if subject_id:
        query = query.filter(Task.subject_id == subject_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if task_type:
        query = query.filter(Task.task_type == task_type)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(or_(Task.title.ilike(search_pattern), Task.description.ilike(search_pattern)))
        
    if deadline_from:
        query = query.filter(Task.deadline >= deadline_from)
    if deadline_to:
        query = query.filter(Task.deadline <= deadline_to)
        
    if overdue:
        query = query.filter(Task.deadline < datetime.now(timezone.utc), Task.status != TaskStatus.COMPLETED)
        
    if parent_task_id:
        query = query.filter(Task.parent_task_id == parent_task_id)
    elif include_subtasks is False:
        query = query.filter(Task.parent_task_id == None)

    # Sorting
    if sort_by:
        column = getattr(Task, sort_by, Task.deadline)
        if sort_order == "desc":
            query = query.order_by(desc(column))
        else:
            query = query.order_by(asc(column))
    else:
        # Default sort: PENDING first, then by deadline ASC
        query = query.order_by(
            Task.status == TaskStatus.COMPLETED,
            asc(Task.deadline)
        )

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return items, total

def create_task(db: Session, task: TaskCreate, user_id: UUID):
    if task.subject_id:
        subject = db.query(Subject).filter(Subject.id == task.subject_id, Subject.user_id == user_id).first()
        if not subject:
            raise HTTPException(status_code=400, detail="Subject not found or does not belong to user")
    
    if task.parent_task_id:
        parent = db.query(Task).filter(Task.id == task.parent_task_id, Task.user_id == user_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent task not found or does not belong to user")

    db_task = Task(**task.model_dump())
    db_task.user_id = user_id
    if db_task.status == 'COMPLETED':
        db_task.completed_at = datetime.now(timezone.utc)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: UUID, user_id: UUID):
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()

def update_task(db: Session, db_task: Task, task: TaskUpdate, user_id: UUID):
    if task.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == task.subject_id, Subject.user_id == user_id).first()
        if not subject:
            raise HTTPException(status_code=400, detail="Subject not found or does not belong to user")
            
    if task.parent_task_id is not None:
        if task.parent_task_id == db_task.id:
            raise HTTPException(status_code=400, detail="Task cannot be its own parent")
        parent = db.query(Task).filter(Task.id == task.parent_task_id, Task.user_id == user_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent task not found or does not belong to user")
            
        # Check deep cyclic loops
        current_parent = parent.parent_task_id
        while current_parent:
            if current_parent == db_task.id:
                raise HTTPException(status_code=400, detail="Cannot set parent because it creates a cyclic loop")
            next_parent = db.query(Task).filter(Task.id == current_parent).first()
            current_parent = next_parent.parent_task_id if next_parent else None

    update_data = task.model_dump(exclude_unset=True)
    
    # Handle completed_at logic
    if 'status' in update_data:
        if update_data['status'] == 'COMPLETED' and db_task.status != 'COMPLETED':
            update_data['completed_at'] = datetime.now(timezone.utc)
        elif update_data['status'] != 'COMPLETED' and db_task.status == 'COMPLETED':
            update_data['completed_at'] = None

    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, db_task: Task, delete_subtasks: bool = False):
    if delete_subtasks:
        db.query(Task).filter(Task.parent_task_id == db_task.id).delete()
    else:
        db.query(Task).filter(Task.parent_task_id == db_task.id).update({"parent_task_id": None})
    
    db.delete(db_task)
    db.commit()

def bulk_delete(db: Session, task_ids: List[UUID], user_id: UUID, delete_subtasks: bool = False):
    try:
        if delete_subtasks:
            db.query(Task).filter(Task.parent_task_id.in_(task_ids), Task.user_id == user_id).delete(synchronize_session=False)
        else:
            db.query(Task).filter(Task.parent_task_id.in_(task_ids), Task.user_id == user_id).update({"parent_task_id": None}, synchronize_session=False)
            
        db.query(Task).filter(Task.id.in_(task_ids), Task.user_id == user_id).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

def bulk_complete(db: Session, task_ids: List[UUID], user_id: UUID):
    try:
        db.query(Task).filter(
            Task.id.in_(task_ids), 
            Task.user_id == user_id, 
            Task.status != 'COMPLETED'
        ).update(
            {"status": "COMPLETED", "completed_at": datetime.now(timezone.utc)}, 
            synchronize_session=False
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

def bulk_update(db: Session, task_ids: List[UUID], user_id: UUID, updates: dict):
    if updates:
        if 'subject_id' in updates and updates['subject_id'] is not None:
            from app.models.subject import Subject
            subj = db.query(Subject).filter(Subject.id == updates['subject_id'], Subject.user_id == user_id).first()
            if not subj:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Subject not found or access denied")
                
        try:
            db.query(Task).filter(Task.id.in_(task_ids), Task.user_id == user_id).update(updates, synchronize_session=False)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

def bulk_create_subtasks(db: Session, parent_task_id: UUID, subtasks: List[TaskCreate], user_id: UUID):
    from fastapi import HTTPException
    if len(subtasks) > 10:
        raise HTTPException(status_code=400, detail="Cannot create more than 10 subtasks at once")
        
    db_parent = db.query(Task).filter(Task.id == parent_task_id, Task.user_id == user_id).first()
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent task not found")
        
    db_subtasks = []
    try:
        for st in subtasks:
            db_st = Task(**st.model_dump())
            db_st.user_id = user_id
            db_st.parent_task_id = parent_task_id
            db_st.subject_id = db_parent.subject_id # force inherit
            db.add(db_st)
            db_subtasks.append(db_st)
            
        db.commit()
        for st in db_subtasks:
            db.refresh(st)
        return db_subtasks
    except Exception as e:
        db.rollback()
        raise e
