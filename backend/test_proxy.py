import requests
import json

url = "http://localhost:3000/api/predict-success"
payload = {
    "title": "Test Project",
    "description": "This is a test description for AI analysis.",
    "tech_stack": ["React", "Node.js"],
    "funding_goal": 10000
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
