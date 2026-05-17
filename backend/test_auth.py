import sys
sys.path.insert(0, 'C:\\Users\\jaga\\OneDrive\\Desktop\\AI- virual mock interview\\backend')

from app.db.session import SessionLocal
from app.services import auth_service
from app.schemas.user import UserLogin

try:
    # Get a database session
    db = SessionLocal()
    
    # Try to authenticate a user that doesn't exist yet
    print("Testing authenticate_user with non-existent user...")
    login_data = UserLogin(login_id="test@example.com", password="password123")
    
    result = auth_service.authenticate_user(db, login_data)
    print(f"Login result: {result}")
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    if 'db' in locals():
        db.close()
