from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority

router = APIRouter()

class NotificationResponse(BaseModel):
    id: str
    task_id: UUID
    type: str # 'OVERDUE', 'DUE_TODAY', 'HIGH_PRIORITY'
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    tomorrow_end = today_end + timedelta(days=1)

    # Lấy các task chưa hoàn thành
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status != TaskStatus.COMPLETED,
        Task.deadline != None
    ).all()

    notifications = []

    for task in tasks:
        deadline = task.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
            
        if deadline < now:
            notifications.append(NotificationResponse(
                id=f"{task.id}-OVERDUE",
                task_id=task.id,
                type="OVERDUE",
                message=f"Công việc '{task.title}' đã quá hạn!",
                created_at=deadline
            ))
        elif today_start <= deadline < today_end:
            notifications.append(NotificationResponse(
                id=f"{task.id}-DUE_TODAY",
                task_id=task.id,
                type="DUE_TODAY",
                message=f"Công việc '{task.title}' đến hạn trong hôm nay.",
                created_at=deadline
            ))
        elif today_end <= deadline < tomorrow_end and task.priority in [TaskPriority.HIGH, TaskPriority.URGENT]:
            notifications.append(NotificationResponse(
                id=f"{task.id}-HIGH_PRIORITY",
                task_id=task.id,
                type="HIGH_PRIORITY",
                message=f"Công việc Ưu tiên '{task.title}' sắp đến hạn (< 24h).",
                created_at=deadline
            ))

    # Sắp xếp để cái nào gần/quá hạn lâu lên trước hoặc mới nhất
    # Theo thứ tự tạo (deadline cũ nhất lên trước)
    notifications.sort(key=lambda x: x.created_at)

    return notifications
