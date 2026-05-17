import sys
sys.path.insert(0, 'C:\\Users\\jaga\\OneDrive\\Desktop\\AI- virual mock interview\\backend')

from app.db.session import SessionLocal
from app.services import auth_service
from app.schemas.user import UserCreate, UserLogin

try:
    # Get a database session
    db = SessionLocal()
    
    # Create a test user
    print("Creating test user...")
    user_data = UserCreate(username="testuser", email="test@example.com", password="password123")
    new_user = auth_service.create_user(db, user_data)
    print(f"✅ User created: {new_user.username} ({new_user.email})")
    
    # Try to login with this user
    print("\nTesting login...")
    login_data = UserLogin(login_id="test@example.com", password="password123")
    result = auth_service.authenticate_user(db, login_data)
    print(f"✅ Login successful!")
    print(f"   Token: {result['access_token'][:20]}...")
    print(f"   User ID: {result['user_id']}")
    print(f"   Username: {result['username']}")
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    if 'db' in locals():
        db.close()
