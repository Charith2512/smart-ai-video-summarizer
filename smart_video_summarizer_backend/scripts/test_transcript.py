
from services.video_service import video_service

test_url = "https://youtu.be/7InMuwT8gdg?si=XAyg4dfZk3FfgglB"

print(f"Testing URL: {test_url}")
try:
    result = video_service.process_video_url(test_url, "Medium", "paragraph")
    print("\n--- RESULT ---")
    print(result)
except Exception as e:
    print(f"\n--- ERROR ---")
    print(e)
