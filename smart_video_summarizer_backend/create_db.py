import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Extract password from known .env structure or hardcoded since we just set it
DB_PASSWORD = "800474" 

try:
    # Connect to MySQL Server (no db specified)
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password=DB_PASSWORD,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    with connection:
        with connection.cursor() as cursor:
            # Create Database
            cursor.execute("CREATE DATABASE IF NOT EXISTS summarizer_db")
            print("✅ Database 'summarizer_db' created successfully (or already exists).")
    
except Exception as e:
    print(f"❌ Error creating database: {e}")
