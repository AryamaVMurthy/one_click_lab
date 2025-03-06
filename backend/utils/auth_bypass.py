"""
Utility for bypassing authentication in development/testing mode
"""
import os
from fastapi import Depends
from models.user import User

# Mock user for testing without authentication
MOCK_USER = User(
    id="test-user-id",
    name="Test User",
    email="test@example.com",
    role="admin",
    createdAt="2023-01-01T00:00:00Z",
    updatedAt="2023-01-01T00:00:00Z"
)

# Environment variable to control authentication bypass
AUTH_BYPASS_ENABLED = os.getenv("AUTH_BYPASS", "false").lower() == "true"

async def get_current_user_bypass():
    """
    Bypass authentication and return a mock user for testing
    """
    return MOCK_USER

def get_user_dependency():
    """
    Return the appropriate user dependency based on environment setting
    """
    from routes.auth import get_current_user
    
    if AUTH_BYPASS_ENABLED:
        return get_current_user_bypass
    return get_current_user
