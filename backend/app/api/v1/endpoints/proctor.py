from fastapi import APIRouter, UploadFile, File, Depends
from app.services.proctoring_service import proctor_ai
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.models.user import User

router = APIRouter()

@router.post("/analyze-frame/{user_id}")
async def analyze_camera(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await file.read()
    analysis = proctor_ai.analyze_frame(image_bytes)
    
    # If cheating is detected, log it in the database automatically
    if analysis["status"] != "Safe":
        user = db.query(User).filter(User.id == user_id).first()
        user.tab_switch_count += 1 # We can use this same counter for camera violations
        db.commit()

    return analysis