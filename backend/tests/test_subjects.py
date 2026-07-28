import pytest
from uuid import uuid4
from app.models.task import Task
from app.models.subject import Subject

def test_delete_subject_keeps_task(auth_client, test_user, db_session):
    subject = Subject(id=uuid4(), user_id=test_user.id, name="Test Subject", color_code="#000")
    db_session.add(subject)
    db_session.commit()
    
    task = Task(id=uuid4(), user_id=test_user.id, title="Test Task", subject_id=subject.id)
    db_session.add(task)
    db_session.commit()
    
    res = auth_client.delete(f"/api/v1/subjects/{subject.id}")
    assert res.status_code == 200
    
    db_session.refresh(task)
    assert task.subject_id is None
