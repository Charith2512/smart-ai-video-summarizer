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
            print("Adding 'statistics' columns to 'history' table...")
            columns = [
                "orig_words", "summ_words", 
                "orig_sentences", "summ_sentences", 
                "orig_chars", "summ_chars"
            ]
            
            for col in columns:
                try:
                    cursor.execute(f"ALTER TABLE history ADD COLUMN {col} INT DEFAULT 0")
                    print(f"✅ Column '{col}' added successfully.")
                except pymysql.err.OperationalError as e:
                    if e.args[0] == 1060:
                        print(f"ℹ️ Column '{col}' already exists.")
                    else:
                        raise e
    
except Exception as e:
    print(f"❌ Error updating schema: {e}")
