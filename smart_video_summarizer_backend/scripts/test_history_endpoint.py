import requests
import json
import uuid

base_url = "http://localhost:8000"
user_id = str(uuid.uuid4()) # Generate random UUID

print(f"Testing History Endpoint for random user: {user_id}")
try:
    response = requests.get(f"{base_url}/history/{user_id}", timeout=5)
    print(f"Status Code: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Items count: {len(data)}")
        if data:
            print("First item sample:")
            print(json.dumps(data[0], indent=2))
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request Failed: {e}")
