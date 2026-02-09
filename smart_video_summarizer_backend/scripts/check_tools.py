import shutil
import subprocess
import sys
import os

def check_tool(name):
    path = shutil.which(name)
    print(f"Checking {name}...")
    if path:
        print(f"  [OK] Found at: {path}")
        try:
            res = subprocess.run([name, "--version"], capture_output=True, text=True)
            print(f"  Version: {res.stdout.strip()}")
        except Exception as e:
            print(f"  [ERR] Execution failed: {e}")
    else:
        print(f"  [FAIL] Not found in PATH")
        
        # Check standard Python Scripts folder
        script_path = os.path.join(sys.prefix, "Scripts", f"{name}.exe")
        if os.path.exists(script_path):
            print(f"  [WARN] Found in Scripts folder but not in PATH: {script_path}")
        else:
            print(f"  [FAIL] Not found in Scripts folder either")

check_tool("yt-dlp")
check_tool("ffmpeg")
