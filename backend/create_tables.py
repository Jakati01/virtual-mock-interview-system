import sys
sys.path.insert(0, 'C:\\Users\\jaga\\OneDrive\\Desktop\\AI- virual mock interview\\backend')

from app.db.session import engine, Base   # ✅ FIXED (IMPORTANT)

# Import ALL models so SQLAlchemy registers them
from app.models.user import User
from app.models.user_progress import UserProgress

try:
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"✅ Tables in database: {tables}")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()