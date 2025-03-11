import requests
import json
import os
import uuid

# Test the simulation API endpoint
def test_json_simulation():
    url = "http://127.0.0.1:8000/api/v1/simulation"
    
    # Test data for a simple pendulum simulation
    payload = {
        "input": "Create a simple pendulum simulation with a slider for length and gravity",
        "agent": "json",
        "chat_memory": []
    }
    
    # Send the request
    response = requests.post(url, json=payload)
    
    # Print the response status code
    print(f"JSON Generation Status Code: {response.status_code}")
    
    # Check if request was successful
    if response.status_code == 200:
        # Print the JSON response
        result = response.json()
        print("JSON Result Received Successfully")
        # Save the JSON for HTML generation test
        return result["json"]
    else:
        # Print error message if request failed
        print(f"Error: {response.text}")
        return None

def test_html_simulation(json_state):
    url = "http://127.0.0.1:8000/api/v1/simulation"
    
    # Test data for HTML generation using the previously generated JSON
    payload = {
        "input": "Generate HTML for the pendulum simulation",
        "agent": "html",
        "json_state": json_state,
        "chat_memory": []
    }
    
    # Send the request
    response = requests.post(url, json=payload)
    
    # Print the response status code
    print(f"HTML Generation Status Code: {response.status_code}")
    
    # Check if request was successful
    if response.status_code == 200:
        # Get the HTML response
        result = response.json()
        
        if result["html"]:
            # Save HTML to file for viewing
            html_file_path = os.path.join(os.path.dirname(__file__), "simulation.html")
            with open(html_file_path, "w", encoding="utf-8") as f:
                f.write(result["html"])
            print(f"HTML output saved to {html_file_path}")
        else:
            print("No HTML content returned")
    else:
        # Print error message if request failed
        print(f"Error: {response.text}")

def test_save_simulation():
    """Test saving a simulation module to a lab"""
    # First, we need to create a test lab with a section
    # For testing purposes, we use fixed IDs
    lab_id = str(uuid.uuid4())
    section_id = str(uuid.uuid4())
    module_id = str(uuid.uuid4())
    
    # Create a basic HTML simulation
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Simulation</title>
        <style>
            body { font-family: Arial, sans-serif; }
            .simulation { width: 100%; height: 400px; border: 1px solid #ccc; }
            .controls { margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="simulation">
            <h2>Test Simulation</h2>
            <div id="canvas" style="width: 100%; height: 300px; background-color: #f0f0f0;"></div>
        </div>
        <div class="controls">
            <label for="length">Length: </label>
            <input type="range" id="length" min="10" max="200" value="100">
        </div>
        <script>
            // Basic simulation code
            const canvas = document.getElementById('canvas');
            const lengthSlider = document.getElementById('length');
            
            function updateSimulation() {
                console.log('Length changed to: ' + lengthSlider.value);
            }
            
            lengthSlider.addEventListener('input', updateSimulation);
            updateSimulation();
        </script>
    </body>
    </html>
    """
    
    # Create a simple JSON structure
    json_structure = {
        "state": {
            "length": 100,
            "gravity": 9.8
        },
        "inputs": [
            {
                "type": "slider",
                "id": "length",
                "min": 10,
                "max": 200,
                "value": 100,
                "label": "Length"
            }
        ]
    }
    
    url = "http://127.0.0.1:8000/api/v1/simulation/save"
    
    payload = {
        "labId": lab_id,
        "sectionId": section_id,
        "moduleId": module_id,
        "title": "Test Simulation",
        "htmlContent": html_content,
        "description": "A test simulation",
        "jsonStructure": json_structure
    }
    
    # Note: In a real test, you'd need to include authentication
    # For testing without auth, make sure AUTH_BYPASS=true in .env
    
    # Send the request
    response = requests.post(url, json=payload)
    
    # Print the response status code
    print(f"Save Simulation Status Code: {response.status_code}")
    
    # Check if request was successful
    if response.status_code == 200:
        # Print the response
        result = response.json()
        print("Save Simulation Result:", result)
    else:
        # Print error message if request failed
        print(f"Error: {response.text}")

def test_get_simulation():
    """Test getting a simulation module"""
    # For testing purposes, we use the same fixed IDs as in test_save_simulation
    lab_id = "example-lab-id"  # Replace with actual ID if needed
    section_id = "example-section-id"  # Replace with actual ID if needed
    module_id = "example-module-id"  # Replace with actual ID if needed
    
    url = f"http://127.0.0.1:8000/api/v1/simulation/{lab_id}/{section_id}/{module_id}"
    
    # Send the request
    response = requests.get(url)
    
    # Print the response status code
    print(f"Get Simulation Status Code: {response.status_code}")
    
    # Check if request was successful
    if response.status_code == 200:
        # Print the response
        result = response.json()
        if result["success"]:
            print("Retrieved simulation successfully:")
            print(f"Title: {result['data']['title']}")
            print(f"Description: {result['data']['description']}")
            print("HTML Content Length:", len(result['data']['htmlContent']))
            print("JSON Structure:", json.dumps(result['data']['jsonStructure'], indent=2))
        else:
            print(f"API Error: {result['error']}")
    else:
        # Print error message if request failed
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("Testing JSON generation...")
    json_state = test_json_simulation()
    
    if json_state:
        print("\nTesting HTML generation...")
        test_html_simulation(json_state)
    
    print("\nTesting save simulation...")
    test_save_simulation()
    
    print("\nTesting get simulation...")
    test_get_simulation()
