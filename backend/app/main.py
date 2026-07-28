from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from sqlalchemy.exc import SQLAlchemyError

from app.api.auth import router as auth_router
from app.api.subject import router as subject_router
from app.api.task import router as task_router
from app.api.timetable import router as timetable_router
from app.api.dashboard import router as dashboard_router
from app.api.pomodoro import router as pomodoro_router
from app.api.ai import router as ai_router
from app.api.notification import router as notification_router

app = FastAPI(title="UniMate API")

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "ERROR"
    if exc.status_code == 400:
        code = "BAD_REQUEST"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 409:
        code = "CONFLICT"

    detail = exc.detail
    if isinstance(detail, str):
        message = detail
        field = None
    elif isinstance(detail, dict):
        message = detail.get("message", "Unknown error")
        field = detail.get("field")
        code = detail.get("code", code)
    else:
        message = str(detail)
        field = None
        
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": code, "message": message, "field": field}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        first_err = errors[0]
        field = str(first_err.get("loc", [""])[-1])
        message = first_err.get("msg", "Invalid value")
    else:
        field = None
        message = "Validation error"

    return JSONResponse(
        status_code=422,
        content={"code": "VALIDATION_ERROR", "message": message, "field": field}
    )

import logging

logger = logging.getLogger(__name__)

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"code": "DATABASE_ERROR", "message": "An internal database error occurred", "field": None}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For v1 development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(subject_router, prefix="/api/v1/subjects", tags=["subjects"])
app.include_router(task_router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(timetable_router, prefix="/api/v1/timetable", tags=["timetable"])
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(pomodoro_router, prefix="/api/v1/pomodoro", tags=["pomodoro"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(notification_router, prefix="/api/v1/notifications", tags=["notifications"])

@app.get("/")
def read_root():
    return {"message": "Welcome to UniMate API"}
