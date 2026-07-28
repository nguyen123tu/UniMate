from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
import os
import json
from groq import Groq

from datetime import datetime, timedelta
from collections import defaultdict
import time

router = APIRouter()

# Simple in-memory rate limiter
RATE_LIMIT_STORE = defaultdict(list)
MAX_CALLS_PER_DAY = 10
SECONDS_IN_DAY = 86400

class BreakdownRequest(BaseModel):
    task_title: str
    task_description: str | None = None
    subject_name: str | None = None
    deadline: str | None = None
    estimated_minutes: int | None = None

class SubTask(BaseModel):
    title: str
    description: str
    estimated_minutes: int
    order: int

class BreakdownResponse(BaseModel):
    subtasks: list[SubTask]

@router.post("/breakdown-task", response_model=BreakdownResponse)
def breakdown_task(
    req: BreakdownRequest,
    current_user: User = Depends(deps.get_current_user)
):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail={"code": "AI_CONFIG_ERROR", "message": "GROQ API key not configured"})

    # Check Rate Limit
    now = time.time()
    user_calls = RATE_LIMIT_STORE[current_user.id]
    # Filter calls within the last 24 hours
    user_calls = [t for t in user_calls if now - t < SECONDS_IN_DAY]
    RATE_LIMIT_STORE[current_user.id] = user_calls

    if len(user_calls) >= MAX_CALLS_PER_DAY:
        raise HTTPException(status_code=429, detail={"code": "RATE_LIMIT_EXCEEDED", "message": "Bạn đã vượt quá số lần sử dụng AI trong ngày."})

    # Setting a strict timeout for AI calls using httpx is possible if we use async, 
    # but with synchronous Groq client we set timeout directly.
    client = Groq(api_key=api_key, timeout=15.0)
    
    prompt = f"""
Bạn là một trợ lý học tập. Hãy chia nhỏ công việc sau thành các công việc con (sub-tasks) hợp lý để dễ thực hiện hơn. Cố gắng ước lượng thời gian cho từng sub-task sao cho tổng thời gian gần bằng thời gian dự kiến (nếu có).
Công việc chính: {req.task_title}
Mô tả: {req.task_description or 'Không có'}
Môn học: {req.subject_name or 'Không có'}
Hạn nộp: {req.deadline or 'Không có'}
Thời gian dự kiến tổng: {req.estimated_minutes or 'Không rõ'} phút

Chỉ trả về JSON theo định dạng sau, không kèm bất kỳ giải thích nào khác. Số lượng tối đa 10 subtasks:
{{
  "subtasks": [
    {{"title": "Tên subtask 1", "description": "Mô tả ngắn gọn", "estimated_minutes": 30, "order": 1}},
    {{"title": "Tên subtask 2", "description": "Mô tả ngắn gọn", "estimated_minutes": 15, "order": 2}}
  ]
}}
"""
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        result = completion.choices[0].message.content
        data = json.loads(result)
        
        # Limit max subtasks
        if "subtasks" in data:
            data["subtasks"] = data["subtasks"][:10]
            
        # Record success call
        RATE_LIMIT_STORE[current_user.id].append(now)
            
        return data
    except Exception as e:
        print(f"AI ERROR: {str(e)}") # Log server side
        raise HTTPException(
            status_code=500, 
            detail={
                "code": "AI_SERVICE_ERROR", 
                "message": "Dịch vụ AI đang quá tải hoặc phản hồi lỗi. Vui lòng thử lại sau.", 
                "field": None
            }
        )
