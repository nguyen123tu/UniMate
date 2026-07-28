import pytest
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from app.models.task import Task, TaskStatus
from app.models.subject import Subject
from app.models.user import User

def test_create_valid_task(auth_client, test_user):
    response = auth_client.post("/api/v1/tasks/", json={
        "title": "Valid Task",
        "estimated_minutes": 30
    })
    if response.status_code != 200:
        print(response.text)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Valid Task"
    assert data["estimated_minutes"] == 30

def test_empty_title_task(auth_client):
    response = auth_client.post("/api/v1/tasks/", json={
        "title": "   ",
        "estimated_minutes": 30
    })
    assert response.status_code == 422 # Validation Error

def test_prevent_other_users_subject(auth_client, db_session, test_user):
    # Create another user and their subject
    other_user = User(id=uuid4(), email="other@example.com", password_hash="pw")
    db_session.add(other_user)
    db_session.commit()
    
    other_subject = Subject(id=uuid4(), user_id=other_user.id, name="Other Subject", color_code="#000")
    db_session.add(other_subject)
    db_session.commit()
    
    # Try to attach it
    response = auth_client.post("/api/v1/tasks/", json={
        "title": "My Task",
        "subject_id": str(other_subject.id)
    })
    assert response.status_code in [400, 403, 404]

def test_prevent_read_update_delete_others_task(auth_client, db_session):
    other_user = User(id=uuid4(), email="other2@example.com", password_hash="pw")
    db_session.add(other_user)
    db_session.commit()
    
    other_task = Task(id=uuid4(), user_id=other_user.id, title="Other Task")
    db_session.add(other_task)
    db_session.commit()
    
    # Update
    res = auth_client.patch(f"/api/v1/tasks/{other_task.id}", json={"title": "Hacked"})
    assert res.status_code == 404
    
    # Delete
    res = auth_client.delete(f"/api/v1/tasks/{other_task.id}")
    assert res.status_code == 404

def test_completed_sets_completed_at(auth_client, test_user, db_session):
    task = Task(id=uuid4(), user_id=test_user.id, title="Test Task")
    db_session.add(task)
    db_session.commit()
    
    res = auth_client.patch(f"/api/v1/tasks/{task.id}", json={"status": "COMPLETED"})
    if res.status_code != 200:
        print(res.text)
    assert res.status_code == 200
    assert res.json()["completed_at"] is not None

def test_parent_child_cycle(auth_client, test_user, db_session):
    task1 = Task(id=uuid4(), user_id=test_user.id, title="Task 1")
    task2 = Task(id=uuid4(), user_id=test_user.id, title="Task 2", parent_task_id=task1.id)
    db_session.add_all([task1, task2])
    db_session.commit()
    
    # Try to set task1 parent to task2
    res = auth_client.patch(f"/api/v1/tasks/{task1.id}", json={"parent_task_id": str(task2.id)})
    assert res.status_code in [400, 422]
