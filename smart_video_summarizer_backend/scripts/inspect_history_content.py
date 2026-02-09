import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from models import History
# Import base if needed, but we can query directly

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

print(f"Connecting to: {db_url}")
engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("\nFetching history items...")
    items = session.query(History).all()
    print(f"Total items: {len(items)}")
    for item in items[:5]:
        print(f"ID: {item.id}, User: {item.user_id}, Type: {item.input_type}")
        print(f"  Title: {item.original_filename}")
        print(f"  Highlights (Snippet): {str(item.highlights)[:50] if item.highlights else 'None'}")
        print(f"  Qualities: {item.available_qualities}")
        print("-" * 20)
finally:
    session.close()
