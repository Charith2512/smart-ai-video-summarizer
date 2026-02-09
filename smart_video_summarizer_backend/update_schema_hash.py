from database import engine, Base
from sqlalchemy import text, inspect

def update_schema():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('history')]
    
    with engine.connect() as conn:
        if 'content_hash' not in columns:
            print("Adding content_hash column...")
            conn.execute(text("ALTER TABLE history ADD COLUMN content_hash VARCHAR(64)"))
            conn.execute(text("CREATE INDEX ix_history_content_hash ON history (content_hash)"))
            conn.commit()
            print("content_hash column added successfully.")
        else:
            print("content_hash column already exists.")

if __name__ == "__main__":
    update_schema()
