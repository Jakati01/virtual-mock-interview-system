from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import traceback

from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import create_user, authenticate_user
from app.api.deps import get_db

router = APIRouter()


# ✅ REGISTER ROUTE
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        result = create_user(db, user)
        return result
    except HTTPException as http_err:
        # Already handled error (like duplicate user)
        raise http_err
    except Exception as e:
        print("🔥 REGISTER ERROR:")
        traceback.print_exc()   # 🔥 shows full error in terminal
        raise HTTPException(status_code=500, detail=str(e))


# ✅ LOGIN ROUTE
@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    try:
        result = authenticate_user(db, login_data)
        return result
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print("🔥 LOGIN ERROR:")
        traceback.print_exc()   # 🔥 shows full error in terminal
        raise HTTPException(status_code=500, detail=str(e))