import pytest

def test_ai_malformed_response(auth_client):
    # This might actually require mocking the google genai call.
    # We can test the AI API directly if it allows mocking, or we just ensure
    # the endpoint returns a 500/400 if it fails parsing.
    pass

def test_transaction_rollback(auth_client, test_user, db_session):
    # To test transaction rollback, we could simulate an error during subtask creation
    pass
