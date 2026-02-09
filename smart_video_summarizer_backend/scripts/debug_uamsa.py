from services.summarization import summarize_text
import traceback

print("--- Starting Debug ---")
print("1. Importing modules...")
try:
    from services.summarization import summarize_text, uamsa_algorithm
    print("2. Modules imported successfully.")
except Exception as e:
    print(f"FAILED to import modules: {e}")
    traceback.print_exc()
    exit()

text = """
Artificial intelligence (AI) is intelligence associated with computational agents. 
It is also the name of the field which studies how to create such agents and how they work.
"""

try:
    print("3. Attempting to summarize...")
    # Using the class directly to see internal steps
    result = uamsa_algorithm.summarize(text, "short")
    print(f"4. Success! Result: {result}")
except Exception:
    print("CRITICAL FAILURE in execution")
    traceback.print_exc()
print("--- End Debug ---")
