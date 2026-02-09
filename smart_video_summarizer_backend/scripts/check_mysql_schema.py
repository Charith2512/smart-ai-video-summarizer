import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

print(f"Connecting to: {db_url}")
engine = create_engine(db_url)
inspector = inspect(engine)
columns = inspector.get_columns('history')
print("\nColumns in 'history' table:")
found = False
for column in columns:
    print(f"- {column['name']} ({column['type']})")
    if column['name'] == 'available_qualities':
        found = True

if found:
    print("\n[SUCCESS] 'available_qualities' column exists.")
else:
    print("\n[FAILURE] 'available_qualities' column MISSING!")
