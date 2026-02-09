from database import SessionLocal
import models
import json

def inspect_history():
    db = SessionLocal()
    try:
        # Get last 5 items
        items = db.query(models.History).order_by(models.History.created_at.desc()).limit(5).all()
        for item in items:
            print(f"ID: {item.id} | Type: {item.input_type} | Title: {item.original_filename}")
            print(f"  Qualities (Raw): {item.available_qualities}")
            print("-" * 20)
    finally:
        db.close()

if __name__ == "__main__":
    inspect_history()
