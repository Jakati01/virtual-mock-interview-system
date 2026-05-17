from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.user_progress import UserProgress
from app.schemas.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token


def create_user(db: Session, user_data: UserCreate):
    # 1. Check if email or username is already taken
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")

    try:
        # 2. Hash password
        hashed_pw = get_password_hash(user_data.password)

        # 3. Create user (NO commit yet)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_pw
        )
        db.add(new_user)
        db.flush()   # 🔥 important: get ID without commit

        print("🔥 DEBUG USER ID:", new_user.id)

        # 4. Create UserProgress
        user_progress = UserProgress(
            user_id=new_user.id,
            current_round="mcq"
        )
        db.add(user_progress)

        # 5. Commit both together
        db.commit()
        db.refresh(new_user)

        print(f"[DEBUG] Created User and UserProgress for user {new_user.username}")
        return new_user

    except Exception as e:
        import traceback
        traceback.print_exc()   # 🔥 shows real error in terminal
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def authenticate_user(db: Session, login_data: UserLogin):
    # 1. Search DB for username OR email
    print(f"[DEBUG] Searching for user with login_id: {login_data.login_id}")

    user = db.query(User).filter(
        (User.email == login_data.login_id) | (User.username == login_data.login_id)
    ).first()

    print(f"[DEBUG] User found: {user is not None}")

    if user:
        print(f"[DEBUG] User ID: {user.id}, Username: {user.username}, Email: {user.email}")

    # 2. Validate user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    password_valid = verify_password(login_data.password, user.hashed_password)
    print(f"[DEBUG] Password valid: {password_valid}")

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    try:
        # 3. Get or create UserProgress
        progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).first()

        if not progress:
            print("[DEBUG] No progress found, creating new progress")
            progress = UserProgress(user_id=user.id, current_round="mcq")
            db.add(progress)
            db.commit()
            db.refresh(progress)

        # 4. Generate JWT
        access_token = create_access_token(data={"sub": str(user.id)})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": user.username,
            "user_id": user.id,
            "current_round": progress.current_round,
            "progress": {
                "mcq_completed": progress.mcq_completed,
                "intermediate_completed": progress.intermediate_completed,
                "communication_completed": progress.communication_completed,
                "coding_completed": progress.coding_completed,
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))