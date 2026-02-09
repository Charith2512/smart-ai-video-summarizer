from database import engine, Base
from sqlalchemy import text

def add_qualities_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE history ADD COLUMN available_qualities TEXT"))
            conn.commit()
            print("Successfully added 'available_qualities' column.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    add_qualities_column()
