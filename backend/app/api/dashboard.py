from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.subject import Subject
from app.models.pomodoro import PomodoroSession
from sqlalchemy import func, or_, and_, desc
from datetime import datetime, timezone, timedelta

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    timezone_offset: int = 0,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    now = datetime.now(timezone.utc)
    # timezone_offset from JS is (UTC - Local) in minutes
    local_now = now - timedelta(minutes=timezone_offset)
    
    local_start_of_today = datetime(local_now.year, local_now.month, local_now.day)
    local_end_of_today = local_start_of_today + timedelta(days=1)
    
    # Convert back to UTC for query
    start_of_today = local_start_of_today.replace(tzinfo=timezone.utc) + timedelta(minutes=timezone_offset)
    end_of_today = local_end_of_today.replace(tzinfo=timezone.utc) + timedelta(minutes=timezone_offset)
    end_of_7_days = start_of_today + timedelta(days=8)

    # 1. Trạng thái cơ bản
    total_tasks = db.query(Task).filter(Task.user_id == current_user.id).count()
    completed = db.query(Task).filter(Task.user_id == current_user.id, Task.status == TaskStatus.COMPLETED).count()
    in_progress = db.query(Task).filter(Task.user_id == current_user.id, Task.status == TaskStatus.IN_PROGRESS).count()
    pending = db.query(Task).filter(Task.user_id == current_user.id, Task.status == TaskStatus.PENDING).count()

    # 2. Thống kê theo Deadline (Bỏ qua Completed)
    active_query = db.query(Task).filter(Task.user_id == current_user.id, Task.status != TaskStatus.COMPLETED)
    
    overdue = active_query.filter(Task.deadline < now).count()
    due_today = active_query.filter(Task.deadline >= start_of_today, Task.deadline < end_of_today).count()
    due_in_7_days = active_query.filter(Task.deadline >= end_of_today, Task.deadline < end_of_7_days).count()
    no_deadline = active_query.filter(Task.deadline == None).count()

    # 3. Danh sách ưu tiên
    priority_overdue = active_query.filter(Task.deadline < now).order_by(Task.deadline.asc()).limit(5).all()
    priority_today = active_query.filter(Task.deadline >= start_of_today, Task.deadline < end_of_today).order_by(Task.deadline.asc()).limit(5).all()
    
    # 5 task có deadline sắp tới (bỏ qua hôm nay và quá khứ)
    priority_upcoming = active_query.filter(Task.deadline >= end_of_today).order_by(Task.deadline.asc()).limit(5).all()

    # 4. Thống kê theo Môn học
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    subject_stats = []
    
    for sub in subjects:
        sub_tasks = db.query(Task).filter(Task.subject_id == sub.id)
        t_total = sub_tasks.count()
        t_comp = sub_tasks.filter(Task.status == TaskStatus.COMPLETED).count()
        t_overdue = sub_tasks.filter(Task.status != TaskStatus.COMPLETED, Task.deadline < now).count()
        
        # Pomodoro time
        pomo_time = db.query(func.sum(PomodoroSession.duration_minutes)).filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.status == 'COMPLETED',
            PomodoroSession.task_id.in_(sub_tasks.with_entities(Task.id))
        ).scalar() or 0
        
        subject_stats.append({
            "id": sub.id,
            "name": sub.name,
            "color": sub.color_code,
            "total_tasks": t_total,
            "completed_tasks": t_comp,
            "overdue_tasks": t_overdue,
            "pomodoro_minutes": pomo_time,
            "completion_rate": round((t_comp / t_total * 100) if t_total > 0 else 0, 1)
        })

    # Find the most demanding subject (based on most uncompleted tasks)
    demanding_subject = None
    if subject_stats:
        demanding_subject = max(subject_stats, key=lambda x: x['total_tasks'] - x['completed_tasks'])

    from app.schemas.task import TaskResponse
    
    return {
        "status": {
            "total": total_tasks,
            "completed": completed,
            "in_progress": in_progress,
            "pending": pending
        },
        "deadlines": {
            "overdue": overdue,
            "due_today": due_today,
            "due_in_7_days": due_in_7_days,
            "no_deadline": no_deadline
        },
        "subjects": subject_stats,
        "demanding_subject": demanding_subject,
        "priority_lists": {
            "overdue": [TaskResponse.model_validate(t) for t in priority_overdue],
            "today": [TaskResponse.model_validate(t) for t in priority_today],
            "upcoming": [TaskResponse.model_validate(t) for t in priority_upcoming]
        }
    }
