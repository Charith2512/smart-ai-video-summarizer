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
            print("Adding 'preference' column to 'history' table...")
            try:
                cursor.execute("ALTER TABLE history ADD COLUMN preference VARCHAR(20) DEFAULT 'medium'")
                print("✅ Column 'preference' added successfully.")
            except pymysql.err.OperationalError as e:
                if e.args[0] == 1060:
                    print("ℹ️ Column 'preference' already exists.")
                else:
                    raise e
    
except Exception as e:
    print(f"❌ Error updating schema: {e}")
