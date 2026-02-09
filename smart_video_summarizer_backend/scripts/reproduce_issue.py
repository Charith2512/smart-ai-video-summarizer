from services.video_service import video_service

# Test the specific URL reported by user
url = "https://youtu.be/mk1h-ku4GhY?si=i_dHPvysp-_CVbZT"
print(f"Testing URL: {url}")

try:
    transcript = video_service.process_video_url(url)
    print("SUCCESS: Got transcript!")
    print(f"Transcript Length: {len(transcript)} chars")
    print(f"Sample: {transcript[:200]}...")
    
    from services.summarization import uamsa_algorithm
    print("\nRunning Summarization Pipeline on Transcript...")
    res = uamsa_algorithm.summarize(transcript, "medium", "paragraph")
    print(f"Summary Result: {res['summary_text'][:200]}...")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
