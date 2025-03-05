"""
Simple test script to test the login functionality directly.
"""
import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

def test_login():
    """Test the login functionality."""
    # Step 1: Register a test user
    register_data = {
        "name": "Test User",
        "email": f"test_{int(time.time())}@example.com",  # Use timestamp to avoid duplicate emails
        "password": "password123"
    }
    
    print(f"\n1. Registering user: {register_data['email']}")
    register_response = requests.post(f"{BASE_URL}/register", json=register_data)
    
    if register_response.status_code != 200:
        print(f"Registration failed with status code: {register_response.status_code}")
        print(f"Response: {register_response.text}")
        return False
    
    register_json = register_response.json()
    print(f"Registration response: {json.dumps(register_json, indent=2)}")
    
    # Step 2: Login with the registered user
    login_data = {
        "username": register_data["email"],
        "password": register_data["password"]
    }
    
    print(f"\n2. Logging in with: {login_data['username']}")
    login_response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"Login failed with status code: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    login_json = login_response.json()
    print(f"Login response: {json.dumps(login_json, indent=2)}")
    
    # Verify the login response structure
    if "success" not in login_json or not login_json["success"]:
        print("Login response does not indicate success")
        return False
    
    if "token" not in login_json:
        print("Login response does not contain token")
        return False
    
    if "refreshToken" not in login_json:
        print("Login response does not contain refreshToken")
        return False
    
    if "user" not in login_json:
        print("Login response does not contain user data")
        return False
    
    # Step 3: Test login with invalid credentials
    invalid_login_data = {
        "username": register_data["email"],
        "password": "wrongpassword"
    }
    
    print(f"\n3. Testing login with invalid credentials")
    invalid_login_response = requests.post(f"{BASE_URL}/login", json=invalid_login_data)
    
    if invalid_login_response.status_code != 401:
        print(f"Invalid login test failed. Expected status code 401, got {invalid_login_response.status_code}")
        print(f"Response: {invalid_login_response.text}")
        return False
    
    invalid_login_json = invalid_login_response.json()
    print(f"Invalid login response: {json.dumps(invalid_login_json, indent=2)}")
    
    # Step 4: Test refresh token
    refresh_data = {
        "refreshToken": login_json["refreshToken"]
    }
    
    print(f"\n4. Testing refresh token")
    refresh_response = requests.post(f"{BASE_URL}/refresh-token", json=refresh_data)
    
    if refresh_response.status_code != 200:
        print(f"Refresh token failed with status code: {refresh_response.status_code}")
        print(f"Response: {refresh_response.text}")
        return False
    
    refresh_json = refresh_response.json()
    print(f"Refresh token response: {json.dumps(refresh_json, indent=2)}")
    
    # Step 5: Test logout
    headers = {
        "Authorization": f"Bearer {login_json['token']}"
    }
    
    print(f"\n5. Testing logout")
    logout_response = requests.post(f"{BASE_URL}/logout", headers=headers)
    
    if logout_response.status_code != 200:
        print(f"Logout failed with status code: {logout_response.status_code}")
        print(f"Response: {logout_response.text}")
        return False
    
    logout_json = logout_response.json()
    print(f"Logout response: {json.dumps(logout_json, indent=2)}")
    
    print("\nAll login tests passed successfully!")
    return True

if __name__ == "__main__":
    # Make sure the server is running before executing this script
    print("Testing login functionality...")
    success = test_login()
    print(f"\nTest {'succeeded' if success else 'failed'}")
