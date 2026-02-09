import sys
import torch
import whisper

print(f"Python Version: {sys.version}")
print(f"PyTorch Version: {torch.__version__}")

if torch.cuda.is_available():
    print(f"CUDA Available: YES")
    print(f"Device Name: {torch.cuda.get_device_name(0)}")
    print(f"CUDA Version: {torch.version.cuda}")
    
    try:
        print("\nLoading Whisper model on GPU...")
        model = whisper.load_model("tiny", device="cuda")
        print("SUCCESS: Whisper loaded on CUDA!")
    except Exception as e:
        print(f"FAILURE: Could not load Whisper on CUDA: {e}")
else:
    print("CUDA Available: NO")
    print("This environment cannot use GPU.")
