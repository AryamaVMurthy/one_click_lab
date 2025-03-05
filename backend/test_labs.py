"""
Simple test script to test the lab functionality directly.
"""
import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

def test_labs():
    """Test the lab functionality."""
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
    user_id = register_json["data"]["id"]
    user_name = register_json["data"]["name"]
    user_email = register_json["data"]["email"]
    
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
    token = login_json["token"]
    
    # Headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Step 3: Create a lab
    lab_data = {
        "title": "Introduction to Python",
        "description": "Learn the basics of Python programming language",
        "author": {
            "id": user_id,
            "name": user_name,
            "email": user_email
        }
    }
    
    print(f"\n3. Creating a lab: {lab_data['title']}")
    create_lab_response = requests.post(f"{BASE_URL}/labs", json=lab_data, headers=headers)
    
    if create_lab_response.status_code != 200:
        print(f"Lab creation failed with status code: {create_lab_response.status_code}")
        print(f"Response: {create_lab_response.text}")
        return False
    
    create_lab_json = create_lab_response.json()
    print(f"Lab creation response: {json.dumps(create_lab_json, indent=2)}")
    
    lab_id = create_lab_json["data"]["id"]
    
    # Step 4: Get the lab by ID
    print(f"\n4. Getting lab by ID: {lab_id}")
    get_lab_response = requests.get(f"{BASE_URL}/labs/{lab_id}", headers=headers)
    
    if get_lab_response.status_code != 200:
        print(f"Get lab failed with status code: {get_lab_response.status_code}")
        print(f"Response: {get_lab_response.text}")
        return False
    
    get_lab_json = get_lab_response.json()
    print(f"Get lab response: {json.dumps(get_lab_json, indent=2)}")
    
    # Step 5: Update the lab
    update_data = {
        "title": "Advanced Python Programming",
        "description": "Learn advanced concepts in Python programming"
    }
    
    print(f"\n5. Updating lab: {lab_id}")
    update_lab_response = requests.put(f"{BASE_URL}/labs/{lab_id}", json=update_data, headers=headers)
    
    if update_lab_response.status_code != 200:
        print(f"Update lab failed with status code: {update_lab_response.status_code}")
        print(f"Response: {update_lab_response.text}")
        return False
    
    update_lab_json = update_lab_response.json()
    print(f"Update lab response: {json.dumps(update_lab_json, indent=2)}")
    
    # Step 6: Create a section
    section_data = {
        "title": "Getting Started with Python"
    }
    
    print(f"\n6. Creating a section in lab: {lab_id}")
    create_section_response = requests.post(f"{BASE_URL}/labs/{lab_id}/sections", json=section_data, headers=headers)
    
    if create_section_response.status_code != 200:
        print(f"Section creation failed with status code: {create_section_response.status_code}")
        print(f"Response: {create_section_response.text}")
        return False
    
    create_section_json = create_section_response.json()
    print(f"Section creation response: {json.dumps(create_section_json, indent=2)}")
    
    section_id = create_section_json["data"]["id"]
    
    # Step 7: Create a text module
    text_module_data = {
        "type": "text",
        "title": "Introduction to Variables",
        "content": "<p>Variables are containers for storing data values.</p>"
    }
    
    print(f"\n7. Creating a text module in section: {section_id}")
    create_module_response = requests.post(f"{BASE_URL}/sections/{section_id}/modules", json=text_module_data, headers=headers)
    
    if create_module_response.status_code != 200:
        print(f"Module creation failed with status code: {create_module_response.status_code}")
        print(f"Response: {create_module_response.text}")
        return False
    
    create_module_json = create_module_response.json()
    print(f"Module creation response: {json.dumps(create_module_json, indent=2)}")
    
    # Step 8: Deploy the lab
    print(f"\n8. Deploying lab: {lab_id}")
    deploy_response = requests.post(f"{BASE_URL}/labs/{lab_id}/deploy", headers=headers)
    
    if deploy_response.status_code != 200:
        print(f"Lab deployment failed with status code: {deploy_response.status_code}")
        print(f"Response: {deploy_response.text}")
        return False
    
    deploy_json = deploy_response.json()
    print(f"Lab deployment response: {json.dumps(deploy_json, indent=2)}")
    
    # Step 9: Get all labs
    print(f"\n9. Getting all labs")
    get_all_labs_response = requests.get(f"{BASE_URL}/labs", headers=headers)
    
    if get_all_labs_response.status_code != 200:
        print(f"Get all labs failed with status code: {get_all_labs_response.status_code}")
        print(f"Response: {get_all_labs_response.text}")
        return False
    
    get_all_labs_json = get_all_labs_response.json()
    print(f"Get all labs response: {json.dumps(get_all_labs_json, indent=2)}")
    
    # Step 10: Delete the lab
    print(f"\n10. Deleting lab: {lab_id}")
    delete_lab_response = requests.delete(f"{BASE_URL}/labs/{lab_id}", headers=headers)
    
    if delete_lab_response.status_code != 200:
        print(f"Lab deletion failed with status code: {delete_lab_response.status_code}")
        print(f"Response: {delete_lab_response.text}")
        return False
    
    delete_lab_json = delete_lab_response.json()
    print(f"Lab deletion response: {json.dumps(delete_lab_json, indent=2)}")
    
    print("\nAll lab tests passed successfully!")
    return True

if __name__ == "__main__":
    # Make sure the server is running before executing this script
    print("Testing lab functionality...")
    success = test_labs()
    print(f"\nTest {'succeeded' if success else 'failed'}")
