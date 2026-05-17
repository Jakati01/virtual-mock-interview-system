import psycopg2

try:
    # Connect to the default postgres database
    conn = psycopg2.connect(
        host="localhost",
        user="postgres",
        password="123456",
        database="postgres"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'ai_mock_db'")
    exists = cursor.fetchone()
    
    if exists:
        print("✅ Database ai_mock_db already exists")
    else:
        # Create the database
        cursor.execute("CREATE DATABASE ai_mock_db")
        print("✅ Database ai_mock_db created successfully")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Error: {str(e)}")
