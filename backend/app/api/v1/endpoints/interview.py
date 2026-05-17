import os
import io
import base64
import json
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from PIL import Image

# 🟢 NEW: AI Proctoring Imports using OpenCV (Fast, no C++ errors)
try:
    import cv2
    # Load OpenCV's built-in fast face detector
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    CV2_AVAILABLE = True
except ImportError:
    print("OpenCV not installed. Run: pip install opencv-python")
    CV2_AVAILABLE = False

try:
    from ultralytics import YOLO
    yolo_model = YOLO('yolov8n.pt') # Lightweight model for real-time mobile detection
    YOLO_AVAILABLE = True
except Exception as e:
    print(f"YOLO Load Error: {e}")
    YOLO_AVAILABLE = False

from app.db.session import get_db
from app.models.interview_session import InterviewStatus, InterviewRound
from app.models.result import Result
from app.models.user import User
from app.services import interview_service, practice_service, evaluation_service
from app.api.deps import get_current_user

router = APIRouter()

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class GenerateJDRequest(BaseModel):
    user_id: int
    job_description: str
    domain: str

class AnswerRecord(BaseModel):
    question_id: int
    is_aptitude: bool = False
    selected_answer: Optional[str] = None
    correct_answer: str

class Round1StrictSubmit(BaseModel):
    user_id: int
    answers: List[AnswerRecord]

class AdversarialFollowupRequest(BaseModel):
    user_id: int
    previous_question: str
    candidate_transcript: str

class BugHuntSubmit(BaseModel):
    user_id: int
    code_solution: str
    language: str

class LogWarningRequest(BaseModel):
    user_id: int
    warning_type: str

class AnalyzeFrameRequest(BaseModel):
    user_id: int
    frame: str # Base64 string

class CompleteInterviewRequest(BaseModel):
    user_id: int
    round1_score: float
    round2_score: float
    round3_score: float
    round4_score: float

# ==========================================
# 0. ELIGIBILITY & PROCTORING (STRICT AI)
# ==========================================

@router.get("/check-eligibility/{user_id}")
async def check_interview_eligibility(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        ats_score = user.ats_score if hasattr(user, 'ats_score') else 0
        practice_result = db.query(Result).filter(Result.user_id == user_id, Result.result_type == "practice").order_by(Result.created_at.desc()).first()
        practice_score = practice_result.score if practice_result else 0
        
        is_demo_account = (getattr(user, 'login_id', '') == "demo" or getattr(user, 'email', '') == "demo@gmail.com")
        is_eligible = (ats_score >= 80 and practice_score >= 80) or is_demo_account
        
        return {
            "eligible": is_eligible,
            "ats_score": ats_score,
            "practice_score": practice_score,
            "is_demo_override": is_demo_account
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proctor/analyze-frame")
async def analyze_strict_frame(payload: AnalyzeFrameRequest, db: Session = Depends(get_db)):
    """
    Performs real-time AI detection. 
    Checks for Mobile Phones FIRST, then Multiple People.
    """
    try:
        # Decode image from Base64
        frame_data = base64.b64decode(payload.frame.split(',')[1] if ',' in payload.frame else payload.frame)
        image = Image.open(io.BytesIO(frame_data))
        
        # --- 1. MOBILE PHONE DETECTION (Run this FIRST) ---
        if YOLO_AVAILABLE:
            # Run YOLOv8 inference on the frame
            results = yolo_model(image, verbose=False)
            detected_classes = []
            for r in results:
                for c in r.boxes.cls:
                    detected_classes.append(yolo_model.names[int(c)])
            
            # If a phone is detected, immediately trigger the strike!
            if "cell phone" in detected_classes:
                return {"status": "MOBILE_DETECTED", "message": "Unauthorized mobile device detected"}

        # --- 2. FACE DETECTION (Using OpenCV) ---
        if CV2_AVAILABLE:
            img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # detectMultiScale finds the faces
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            if len(faces) > 1:
                return {"status": "MULTIPLE_FACES", "message": f"{len(faces)} people detected"}
            if len(faces) == 0:
                # This will now only trigger if there is NO phone AND NO face
                return {"status": "NO_FACE", "message": "Candidate is not visible"}

        return {"status": "OK", "message": "Proctoring clear"}
    except Exception as e:
        print(f"Proctoring Error: {e}")
        return {"status": "ERROR", "message": str(e)}

@router.post("/proctor/log-warning")
async def strict_log_warning(payload: LogWarningRequest, db: Session = Depends(get_db)):
    """
    Increments the strike counter. If strikes >= 3, the interview is terminated.
    """
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Ignore strikes for demo accounts
        if user.email == "demo@gmail.com" or getattr(user, 'login_id', '') == "demo":
            return {"status": "WARNING_IGNORED", "strikes": 0}

        # Increment warning count
        current_warnings = getattr(user, 'warning_count', 0) + 1
        user.warning_count = current_warnings
        
        # 🟢 TERMINATION LOGIC: Auto-fail if strikes reach 3
        if current_warnings >= 3:
            user.is_terminated = True
            user.interview_score = 0 # Forced fail
            db.commit()
            return {"status": "TERMINATED", "message": "Interview terminated due to 3 strikes.", "strikes": current_warnings}
            
        db.commit()
        return {"status": "WARNING", "strikes": current_warnings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUND 1: JD SCREENING
# ==========================================
@router.post("/round1/generate")
async def generate_jd_screening(payload: GenerateJDRequest, db: Session = Depends(get_db)):
    try:
        questions_data = await interview_service.generate_strict_jd_mcqs(payload.job_description, payload.domain, 20)
        practice_data = practice_service.generate_mcqs(payload.domain, payload.domain, db)
        return {
            "round": "jd_screening",
            "technical": questions_data["questions"],
            "aptitude": practice_data.get("aptitude_questions", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/round1/submit")
async def submit_jd_screening(payload: Round1StrictSubmit, db: Session = Depends(get_db)):
    try:
        total_score = 0.0
        for item in payload.answers:
            if item.selected_answer and item.selected_answer == item.correct_answer:
                total_score += 1.0
            elif item.selected_answer:
                total_score -= 0.25 # Negative Marking penalty

        final_score = max(0, total_score)
        passed = final_score >= 19.5
        
        user = db.query(User).filter(User.id == payload.user_id).first()
        if user and (user.email == "demo@gmail.com" or getattr(user, 'login_id', '') == "demo"):
            passed = True

        return {"status": "success", "passed": passed, "metrics": {"score": final_score}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUND 2 & 3 GENERATION
# ==========================================
@router.post("/round2/generate-initial")
async def generate_initial_theory(payload: GenerateJDRequest):
    try:
        data = practice_service.generate_discussion_questions(payload.domain, payload.domain)
        return {"round": "adversarial_theory", "questions": data.get("questions", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/round2/adversarial-followup")
async def trigger_followup(payload: AdversarialFollowupRequest):
    try:
        followup = await interview_service.generate_adversarial_followup(payload.previous_question, payload.candidate_transcript)
        return {"status": "success", "followup_task": followup}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/round3/generate")
async def generate_pressure_comm():
    try:
        tasks = await interview_service.generate_pressure_communication_tasks()

        # Debug log
        print("Round 3 Generated Tasks:", tasks)

        # Ensure frontend-required structure
        if not isinstance(tasks, dict):
            tasks = {}

        return {
            "round": "client_escalation",
            "tasks": {
                "angry_client_scenario": tasks.get(
                    "angry_client_scenario",
                    "A frustrated enterprise client reports that your recent deployment crashed their payment system during business hours. Respond professionally, acknowledge the urgency, and explain immediate corrective action."
                ),
                "tech_architecture_explain": tasks.get(
                    "tech_architecture_explain",
                    "Explain to a non-technical CEO why cloud migration improves scalability, security, and operational efficiency."
                )
            }
        }

    except Exception as e:
        print("Round 3 Generation Error:", str(e))

        # Emergency fallback
        return {
            "round": "client_escalation",
            "tasks": {
                "angry_client_scenario": "A key client is angry because your software outage affected their customers. Leave a calm, professional voicemail resolving the escalation.",
                "tech_architecture_explain": "Explain microservices vs monolithic architecture to a CEO in simple business language."
            }
        }

@router.post("/round3/evaluate")
async def evaluate_pressure_comm(user_id: str = Form(...), task_type: str = Form(...), audio_file: UploadFile = File(...)):
    try:
        transcript = await practice_service.process_interview_audio(audio_file, user_id)
        eval_result = practice_service.evaluate_communication_with_cloudflare(transcript=transcript, module_type="story_retell")
        return {"status": "success", "transcript": transcript, "evaluation": eval_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROUND 4: THE BUG HUNT
# ==========================================
@router.post("/round4/generate")
async def generate_bug_hunt():
    try:
        task = await interview_service.generate_bug_hunt_task("Python")
        return {"round": "bug_hunt", "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/round4/submit")
async def submit_bug_hunt(payload: BugHuntSubmit):
    try:
        eval_result = practice_service.evaluate_coding_with_groq("Find 3 bugs and optimize", payload.code_solution, payload.language)
        return {"status": "success", "evaluation": eval_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# FINAL COMPLETION & HR DASHBOARD
# ==========================================
@router.post("/complete")
async def complete_real_interview(payload: CompleteInterviewRequest, db: Session = Depends(get_db)):
    try:
        final_average = (payload.round1_score + payload.round2_score + payload.round3_score + payload.round4_score) / 4
        passed_interview = final_average >= 75.0
        recommendation = "Hired" if passed_interview else "Rejected"

        user = db.query(User).filter(User.id == payload.user_id).first()
        if user and (user.email == "demo@gmail.com" or getattr(user, 'login_id', '') == "demo"):
            recommendation = "Hired (Demo Override)"

        interview_result = Result(
            user_id=payload.user_id,
            result_type="real_interview_strict",
            score=final_average,
            status=recommendation,
            detailed_result={
                "round1_jd_screening": payload.round1_score,
                "round2_theory": payload.round2_score,
                "round3_communication": payload.round3_score,
                "round4_bug_hunt": payload.round4_score,
            }
        )
        db.add(interview_result)
        db.commit()
        return {"status": "completed", "final_score": final_average, "verdict": recommendation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hr/dashboard-results")
async def get_hr_dashboard_results(db: Session = Depends(get_db)):
    """Fetches all strict mode results for the HR Dashboard."""
    try:
        results = db.query(Result, User).join(User, Result.user_id == User.id).filter(
            Result.result_type == "real_interview_strict"
        ).order_by(Result.created_at.desc()).all()

        dashboard_data = []
        for result, user in results:
            dashboard_data.append({
                "id": result.id,
                "candidate_name": getattr(user, 'full_name', f"Candidate {user.id}"),
                "email": getattr(user, 'email', 'N/A'),
                "final_score": result.score,
                "status": result.status,
                "date": result.created_at.strftime("%Y-%m-%d %H:%M"),
                "details": result.detailed_result
            })
        return {"status": "success", "data": dashboard_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))