from database import engine, Base
from sqlalchemy import text

def add_highlights_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE history ADD COLUMN highlights TEXT"))
            conn.commit()
            print("Successfully added 'highlights' column.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    add_highlights_column()
