import pymysql
import os
from dotenv import load_dotenv
from tabulate import tabulate # You might need to install this or just print raw

load_dotenv()

# Connect to DB
connection = pymysql.connect(
    host='localhost',
    user='root',
    password=os.getenv("DATABASE_URL").split(":")[2].split("@")[0], # Hacky extraction or just hardcode for debug
    database='summarizer_db',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        print("\n=== 📜 USER HISTORY (MySQL) ===")
        cursor.execute("SELECT id, user_id, input_type, left(input_content, 30) as content, created_at FROM history")
        rows = cursor.fetchall()
        
        if not rows:
            print("No history found yet. Try summarizing something!")
        else:
            for row in rows:
                print(row)
                
except Exception as e:
    print(f"Error: {e}")
finally:
    connection.close()
