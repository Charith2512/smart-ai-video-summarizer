import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_PASSWORD = "800474" 

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password=DB_PASSWORD,
        database='summarizer_db',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    with connection:
        with connection.cursor() as cursor:
            print("Adding 'original_filename' column to 'history' table...")
            try:
                cursor.execute("ALTER TABLE history ADD COLUMN original_filename VARCHAR(255)")
                print("✅ Column 'original_filename' added successfully.")
            except pymysql.err.OperationalError as e:
                if e.args[0] == 1060:
                    print("ℹ️ Column 'original_filename' already exists.")
                else:
                    raise e
    
except Exception as e:
    print(f"❌ Error updating schema: {e}")
