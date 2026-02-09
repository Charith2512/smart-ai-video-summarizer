
import youtube_transcript_api
from youtube_transcript_api import YouTubeTranscriptApi

print(f"Library File: {youtube_transcript_api.__file__}")
print(f"Version: {getattr(youtube_transcript_api, '__version__', 'Unknown')}")
print("Attributes of YouTubeTranscriptApi class:")
print(dir(YouTubeTranscriptApi))
