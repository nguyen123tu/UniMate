from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.task import (
    TaskCreate, TaskResponse, TaskUpdate, PaginatedResponse, 
    TaskBulkDelete, TaskBulkComplete, TaskBulkUpdate
)
from app.crud.task import (
    get_tasks, create_task, get_task, update_task, delete_task,
    bulk_delete, bulk_complete, bulk_update, bulk_create_subtasks
)
from app.models.user import User
from app.models.task import TaskStatus, TaskPriority, TaskType
from app.models.task import Task, TaskStatus, TaskPriority, TaskType
from uuid import UUID
from datetime import datetime
import math

router = APIRouter()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(
    task_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/", response_model=PaginatedResponse[TaskResponse])
def read_tasks(
    subject_id: Optional[UUID] = Query(None),
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    task_type: Optional[TaskType] = Query(None),
    search: Optional[str] = Query(None),
    deadline_from: Optional[datetime] = Query(None),
    deadline_to: Optional[datetime] = Query(None),
    overdue: Optional[bool] = Query(None),
    parent_task_id: Optional[UUID] = Query(None),
    include_subtasks: Optional[bool] = Query(False),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    items, total = get_tasks(
        db=db, user_id=current_user.id, subject_id=subject_id, status=status,
        priority=priority, task_type=task_type, search=search, deadline_from=deadline_from,
        deadline_to=deadline_to, overdue=overdue, parent_task_id=parent_task_id,
        include_subtasks=include_subtasks, sort_by=sort_by, sort_order=sort_order,
        page=page, page_size=page_size
    )
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size) if total > 0 else 0
    }

@router.post("/", response_model=TaskResponse)
def create_new_task(
    task: TaskCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return create_task(db=db, task=task, user_id=current_user.id)

@router.put("/{task_id}", response_model=TaskResponse)
def update_existing_task(
    task_id: UUID,
    task: TaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_task = get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return update_task(db=db, db_task=db_task, task=task, user_id=current_user.id)

@router.patch("/{task_id}", response_model=TaskResponse)
def patch_existing_task(
    task_id: UUID,
    task: TaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_task = get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return update_task(db=db, db_task=db_task, task=task, user_id=current_user.id)

@router.delete("/{task_id}")
def delete_existing_task(
    task_id: UUID,
    delete_subtasks: bool = False,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_task = get_task(db=db, task_id=task_id, user_id=current_user.id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    delete_task(db=db, db_task=db_task, delete_subtasks=delete_subtasks)
    return {"message": "Task deleted successfully"}

@router.post("/bulk-delete")
def api_bulk_delete(
    payload: TaskBulkDelete,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    bulk_delete(db, payload.task_ids, current_user.id, delete_subtasks=payload.delete_subtasks)
    return {"message": f"Deleted {len(payload.task_ids)} tasks"}

@router.post("/bulk-complete")
def api_bulk_complete(
    payload: TaskBulkComplete,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    bulk_complete(db, payload.task_ids, current_user.id)
    return {"message": f"Completed {len(payload.task_ids)} tasks"}

@router.post("/bulk-update")
def api_bulk_update(
    payload: TaskBulkUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    updates = payload.model_dump(exclude_unset=True, exclude={"task_ids"})
    bulk_update(db, payload.task_ids, current_user.id, updates)
    return {"message": f"Updated {len(payload.task_ids)} tasks"}

@router.post("/{task_id}/subtasks/bulk", response_model=List[TaskResponse])
def api_bulk_create_subtasks(
    task_id: UUID,
    subtasks: List[TaskCreate],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return bulk_create_subtasks(db, task_id, subtasks, current_user.id)
