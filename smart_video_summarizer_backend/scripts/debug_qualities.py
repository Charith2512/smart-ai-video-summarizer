import yt_dlp

def test_config(name, opts, url):
    print(f"\n--- Testing Config: {name} ---")
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'formats' in info:
                heights = sorted(list(set([f.get('height') for f in info['formats'] if f.get('height')])))
                print(f"Heights found: {heights}")
            else:
                print("No formats found.")
    except Exception as e:
        print(f"Error: {str(e)[:100]}")

def debug_compare():
    url = "https://www.youtube.com/watch?v=aqz-KE-bpKQ" # Big Buck Bunny (4K)
    
    # Mirroring new get_metadata logic
    ydl_opts = {
        'quiet': True, 'no_warnings': True, 'nocheckcertificate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
    
    print(f"Testing quality discovery for: {url}")
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'formats' in info:
                heights = sorted(list(set([f.get('height') for f in info['formats'] if f.get('height')])))
                print(f"Heights found: {heights}")
                
                qualities = [f"{h}p" for h in heights]
                valid_resolutions = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"]
                filtered = [q for q in qualities if q in valid_resolutions]
                print(f"Filtered Qualities: {filtered}")
            else:
                print("No formats found.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    debug_compare()
