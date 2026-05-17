from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.services import report_service

router = APIRouter()

@router.get("/final-report/{user_id}")
async def get_user_report(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    # 1. Prepare data for the report service
    data = {
        "username": user.username,
        "resume_score": user.resume_round_score, # Make sure these exist in your DB!
        "conceptual_score": user.conceptual_round_score,
        "task_score": user.task_round_score,
        "hr_score": user.hr_round_score,
        "tab_switches": user.tab_switch_count
    }
    
    # 2. Run the math and AI summary
    analysis = report_service.generate_final_report(data)
    ai_feedback = await report_service.get_ai_summary(data)
    
    return {
        "user": user.username,
        "scores": analysis,
        "ai_analysis": ai_feedback,
        "next_steps": "Contacting Startups..." if analysis['is_recommended'] else "Retake Practice"
    }