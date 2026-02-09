import requests
import json
import uuid

url = "http://localhost:8000/export/video"
payload = {
    "url": "https://www.youtube.com/watch?v=ScMzIvxBSi4", # Dummy URL
    "highlights": [
        {"start": 10, "end": 15, "text": "Test Clip 1"},
        {"start": 20, "end": 25, "text": "Test Clip 2"}
    ],
    "quality": "720p"
}

print(f"Testing Export Stream to: {url}")
try:
    with requests.post(url, json=payload, stream=True, timeout=30) as r:
        print(f"Status Code: {r.status_code}")
        if r.status_code == 200:
            print("Response Headers:", r.headers)
            print("Listening for stream...")
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    print(f"Received Chunk ({len(chunk)} bytes):")
                    print(chunk.decode('utf-8'))
        else:
            print(f"Error: {r.text}")
except Exception as e:
    print(f"Request Failed: {e}")
