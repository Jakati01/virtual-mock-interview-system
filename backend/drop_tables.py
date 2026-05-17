import psycopg2

try:
    # Connect to the database
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="123456",
        database="ai_mock_db"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Drop all tables to start fresh
    print("Dropping old tables...")
    cursor.execute("DROP TABLE IF EXISTS users CASCADE")
    cursor.execute("DROP TABLE IF EXISTS evaluation_reports CASCADE")
    cursor.execute("DROP TABLE IF EXISTS questions CASCADE")
    cursor.execute("DROP TABLE IF EXISTS interview_sessions CASCADE")
    cursor.execute("DROP TABLE IF EXISTS resumes CASCADE")
    cursor.execute("DROP TABLE IF EXISTS skills CASCADE")
    cursor.execute("DROP TABLE IF EXISTS results CASCADE")
    cursor.execute("DROP TABLE IF EXISTS tests CASCADE")
    cursor.execute("DROP TABLE IF EXISTS cheating_logs CASCADE")
    print("✅ Old tables dropped")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
