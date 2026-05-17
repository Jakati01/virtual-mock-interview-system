from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.models.user import User
from app.models.user_progress import UserProgress

router = APIRouter()

def _normalize_round_score(score, round_name: str) -> int:
    numeric_score = float(score or 0)
    if numeric_score <= 0:
        return 0
    if round_name == "mcq" and numeric_score <= 30:
        return round((numeric_score / 30) * 100)
    if round_name == "theory" and numeric_score <= 5:
        return round(numeric_score * 20)
    if round_name != "coding" and numeric_score <= 10:
        return round(numeric_score * 10)
    return min(round(numeric_score), 100)

def _completed_average(*scores) -> int:
    completed_scores = [score for score in scores if score > 0]
    if not completed_scores:
        return 0
    return round(sum(completed_scores) / len(completed_scores))

# ==========================================
# PYDANTIC MODELS
# ==========================================
class ProgressUpdate(BaseModel):
    current_round: str  # "mcq", "intermediate", "communication", "coding", "completed"
    mcq_completed: bool = False
    intermediate_completed: bool = False
    communication_completed: bool = False
    coding_completed: bool = False

@router.get("/{user_id}/stats")
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user dashboard statistics"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        mcq_score = _normalize_round_score(user.mcq_score, "mcq")
        theory_score = _normalize_round_score(user.theory_score, "theory")
        communication_score = _normalize_round_score(user.communication_score, "communication")
        coding_score = _normalize_round_score(user.coding_score, "coding")
        technical_score = _completed_average(mcq_score, theory_score, coding_score)
        interview_score = _completed_average(mcq_score, theory_score, communication_score, coding_score)
        
        return {
            "success": True,
            "data": {
                "ats_score": user.ats_score or 0,
                "practice_tests_completed": user.practice_tests_completed or 0,
                "technical_score": technical_score,
                "communication_score": communication_score,
                "mcq_score": mcq_score,
                "theory_score": theory_score,
                "coding_score": coding_score,
                "interview_score": interview_score,
                "current_streak": user.current_streak or 0,
                "ats_trend": 5,  # Sample trend data
                "practice_trend": 3,
                "interview_trend": 8,
                "streak_trend": 1,
                "recent_tests": [
                    {
                        "id": 1,
                        "name": "MCQ Round",
                        "score": mcq_score,
                        "date": "Latest saved score",
                    },
                    {
                        "id": 2,
                        "name": "Theory Round",
                        "score": theory_score,
                        "date": "Latest saved score",
                    },
                    {
                        "id": 3,
                        "name": "Communication Round",
                        "score": communication_score,
                        "date": "Latest saved score",
                    },
                    {
                        "id": 4,
                        "name": "Coding Round",
                        "score": coding_score,
                        "date": "Latest saved score",
                    },
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_stats: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{user_id}")
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get user profile information"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "data": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.username,
                "ats_score": user.ats_score or 0,
                "extracted_skills": user.extracted_skills or "",
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_profile: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# ==========================================
# PROGRESS ENDPOINTS
# ==========================================

@router.get("/{user_id}/progress")
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get user progress - which round they should resume from"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get or create progress record
        progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
        
        # If no progress record exists, create one for first-time users
        if not progress:
            progress = UserProgress(user_id=user_id, current_round="mcq")
            db.add(progress)
            db.commit()
            db.refresh(progress)
        
        return {
            "success": True,
            "data": progress.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_progress: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/{user_id}/progress")
async def update_user_progress(user_id: int, payload: ProgressUpdate, db: Session = Depends(get_db)):
    """Update user progress after completing a round"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get or create progress record
        progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
        
        if not progress:
            progress = UserProgress(user_id=user_id)
        
        # Update progress
        progress.current_round = payload.current_round
        progress.mcq_completed = payload.mcq_completed
        progress.intermediate_completed = payload.intermediate_completed
        progress.communication_completed = payload.communication_completed
        progress.coding_completed = payload.coding_completed
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
        return {
            "success": True,
            "message": "Progress updated",
            "data": progress.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_user_progress: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
