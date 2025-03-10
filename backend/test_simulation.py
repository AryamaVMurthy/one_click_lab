import requests
import json
import os

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
            print("No HTML content received in the response")
    else:
        # Print error message if request failed
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("Testing JSON generation...")
    json_state = test_json_simulation()
    
    if json_state:
        print("\nTesting HTML generation...")
        test_html_simulation(json_state)
