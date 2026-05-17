import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
import subprocess
import base64
import io
import json
import numpy as np
import tempfile
import requests
from dotenv import load_dotenv
from pathlib import Path

# Put this near your other schemas at the top
class CommunicationGenerateRequest(BaseModel):
    skill: Optional[str] = ""
    domain: Optional[str] = ""

BASE_DIR = Path(__file__).resolve().parents[4]  # Adjust as needed to point to the root of your project
env_path = BASE_DIR / ".env"

load_dotenv(dotenv_path=env_path)

CF_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CF_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

# Optional imports for image processing
try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    Image = None
    PILLOW_AVAILABLE = False

# 🟢 UPDATED: Using OpenCV instead of face_recognition to prevent C++ errors
try:
    import cv2
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    CV2_AVAILABLE = True
except ImportError:
    print("OpenCV not installed. Run: pip install opencv-python")
    CV2_AVAILABLE = False

# Optional imports for Whisper (STT)
try:
    import whisper
    # Load model once here so it's ready for all communication routes
    whisper_model = whisper.load_model("base") 
    WHISPER_AVAILABLE = True
    print("✅ Whisper Engine Ready")
except Exception as e:
    print(f"❌ Whisper Load Error: {e}")
    whisper_model = None
    WHISPER_AVAILABLE = False

# 🟢 Optional imports for YOLOv8 (Mobile Device Detection)
try:
    from ultralytics import YOLO
    # Loads a small, fast YOLO model (downloads automatically on first run)
    yolo_model = YOLO('yolov8n.pt') 
    YOLO_AVAILABLE = True
    print("✅ YOLOv8 Engine Ready (Mobile Detection Active)")
except Exception as e:
    print(f"❌ YOLO Load Error: {e}")
    yolo_model = None
    YOLO_AVAILABLE = False


from app.db.session import get_db
from app.models.user import User
from app.models.user_progress import UserProgress
from app.services import practice_service
from app.core.config import settings

router = APIRouter()

def _refresh_user_metrics(user: User) -> None:
    """
    Recalculate aggregate dashboard metrics after each practice update.
    """
    def completed_scores(*scores):
        return [float(score) for score in scores if score is not None and float(score) > 0]

    technical_components = [
        user.mcq_score or 0,
        user.theory_score or 0,
        user.coding_score or 0,
    ]
    completed_technical = completed_scores(*technical_components)
    user.technical_score = round(sum(completed_technical) / len(completed_technical), 2) if completed_technical else 0

    interview_components = [
        user.mcq_score or 0,
        user.theory_score or 0,
        user.communication_score or 0,
        user.coding_score or 0,
    ]
    completed_interview = completed_scores(*interview_components)
    user.interview_score = round(sum(completed_interview) / len(completed_interview), 2) if completed_interview else 0

    completed_rounds = len(completed_interview)
    user.practice_tests_completed = 1 if completed_rounds == 4 else 0
    user.current_streak = max(user.current_streak or 0, completed_rounds)
    

# ==========================================
# PYDANTIC SCHEMAS (Payloads from React)
# ==========================================
class MCQGenerateRequest(BaseModel):
    skill: str
    domain: str

class MCQSubmit(BaseModel):
    user_id: int
    score: int  # Since it's MCQ, the frontend can just send us the final tallied score
    total_questions: Optional[int] = 100

class TheorySubmit(BaseModel):
    user_id: int
    score: int # For saving the final Round 2 score

class CommunicationSubmit(BaseModel):
    user_id: int
    transcript: str
    overall_score: Optional[int] = None
    feedback: Optional[str] = None

class CommunicationEvaluateRequest(BaseModel):
    transcript: str
    question_type: str
    prompt_text: Optional[str] = None
    expected_text: Optional[str] = None

class CodingSubmit(BaseModel):
    user_id: int
    problem_statement: str
    code: str
    language: str

# ==========================================
# VERSANT-STYLE COMMUNICATION MODULES
# ==========================================
class ReadAloudRequest(BaseModel):
    user_id: int
    audio_file: str  # Base64 encoded WAV/MP3
    sentence: str    # Expected text

class RepeatSentenceRequest(BaseModel):
    user_id: int
    audio_file: str  # Base64 encoded user's repetition
    original_text: str  # Text user was supposed to repeat

class StoryRetellRequest(BaseModel):
    user_id: int
    audio_file: str  # Base64 encoded user's retelling
    story_summary: str  # For context

class DescribeImageRequest(BaseModel):
    user_id: int
    audio_file: str  # Base64 encoded user's description
    image_description: str  # Image context

class VersantEvaluation(BaseModel):
    """Standard Versant evaluation response"""
    pronunciation: int  # 0-100
    fluency: int        # 0-100
    grammar: int        # 0-100
    vocabulary: int     # 0-100
    confidence: int     # 0-100
    score: int          # Overall 0-100
    feedback: str
    transcript: str

# ==========================================
# HELPER FUNCTIONS FOR VERSANT EVALUATION
# ==========================================
def _transcribe_audio(audio_base64: str) -> Optional[str]:
    tmp_path = None 
    
    if not WHISPER_AVAILABLE or whisper_model is None:
        print("[ERROR] Whisper Engine not initialized")
        return None
    
    try:
        if "," in audio_base64:
            audio_base64 = audio_base64.split(",")[1]
        audio_data = base64.b64decode(audio_base64)
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name 
        
        result = whisper_model.transcribe(tmp_path, language="en", fp16=False)
        return result.get("text", "").strip()
        
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

def _evaluate_with_cloudflare(
    transcript: str,
    module_type: str,
    expected_text: Optional[str] = None,
    context: Optional[str] = None
) -> Dict[str, Any]:

    if not transcript or len(transcript.strip()) == 0:
        return {
            "pronunciation": 0, "fluency": 0, "grammar": 0, "vocabulary": 0,
            "confidence": 0, "score": 0, "feedback": "No speech detected",
            "transcript": transcript
        }

    if module_type == "read_aloud":
        prompt = f"""Return ONLY valid JSON. No other text.
Expected: "{expected_text}"
User: "{transcript}"
Evaluate accuracy and fluency.
{{"accuracy": <number 0-100>, "fluency": "<Poor/Average/Good>", "score": <number 0-100>, "feedback": "<short text>"}}"""
    elif module_type == "repeat_sentence":
        prompt = f"""Return ONLY valid JSON. No other text.
Original: "{expected_text}"
User: "{transcript}"
Check exact match and missing words.
{{"accuracy": <number 0-100>, "fluency": "<Poor/Average/Good>", "score": <number 0-100>, "feedback": "<short text>"}}"""
    elif module_type == "story_retell":
        prompt = f"""Return ONLY valid JSON. No other text.
Story: "{context}"
User: "{transcript}"
Check understanding and clarity.
{{"accuracy": <number 0-100>, "fluency": "<Poor/Average/Good>", "score": <number 0-100>, "feedback": "<short text>"}}"""
    elif module_type == "describe_image":
        prompt = f"""Return ONLY valid JSON. No other text.
Image: "{context}"
User: "{transcript}"
Check description and vocabulary.
{{"accuracy": <number 0-100>, "fluency": "<Poor/Average/Good>", "score": <number 0-100>, "feedback": "<short text>"}}"""
    else:
        return {
            "pronunciation": 70, "fluency": 70, "grammar": 70, "vocabulary": 70,
            "confidence": 70, "score": 70, "feedback": "Invalid module", "transcript": transcript
        }

    try:
        url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct"
        headers = {
            "Authorization": f"Bearer {CF_API_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {"messages": [{"role": "user", "content": prompt}]}
        response = requests.post(url, headers=headers, json=payload)
        result = response.json()
        ai_text = result["result"]["response"]

        try:
            data = json.loads(ai_text)
        except:
            return {
                "pronunciation": 70, "fluency": 70, "grammar": 70, "vocabulary": 70,
                "confidence": 70, "score": 70, "feedback": "Parsing error", "transcript": transcript
            }

        pronunciation = data.get("accuracy", 70)
        fluency_text = data.get("fluency", "Average")
        fluency_score = 90 if fluency_text.lower() == "good" else 70 if fluency_text.lower() == "average" else 50
        overall = int(data.get("score", 70))

        return {
            "pronunciation": pronunciation, "fluency": fluency_score, "grammar": 80,
            "vocabulary": pronunciation, "confidence": 80, "score": overall,
            "feedback": data.get("feedback", "Good response"), "transcript": transcript
        }

    except Exception as e:
        print("[ERROR] Cloudflare:", e)
        return {
            "pronunciation": 70, "fluency": 70, "grammar": 70, "vocabulary": 70,
            "confidence": 70, "score": 70, "feedback": "AI evaluation failed", "transcript": transcript
        }

# ==========================================
# VERSANT ROUTES (Round 3 Core)
# ==========================================

@router.post("/read-aloud")
async def read_aloud(payload: ReadAloudRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user: raise HTTPException(status_code=404, detail="User not found")
        transcript = _transcribe_audio(payload.audio_file)
        if not transcript:
            return {"success": False, "message": "Could not transcribe", "transcript": "", "evaluation": None}
        evaluation = _evaluate_with_cloudflare(transcript=transcript, module_type="read_aloud", expected_text=payload.sentence)
        return {"success": True, "transcript": transcript, "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/repeat-sentence")
async def repeat_sentence(payload: RepeatSentenceRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user: raise HTTPException(status_code=404, detail="User not found")
        transcript = _transcribe_audio(payload.audio_file)
        if not transcript:
            return {"success": False, "message": "Could not transcribe", "transcript": "", "evaluation": None}
        evaluation = _evaluate_with_cloudflare(transcript=transcript, module_type="repeat_sentence", expected_text=payload.original_text)
        return {"success": True, "transcript": transcript, "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/story-retell")
async def story_retell(payload: StoryRetellRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user: raise HTTPException(status_code=404, detail="User not found")
        transcript = _transcribe_audio(payload.audio_file)
        if not transcript:
            return {"success": False, "message": "Could not transcribe", "transcript": "", "evaluation": None}
        evaluation = _evaluate_with_cloudflare(transcript=transcript, module_type="story_retell", context=payload.story_summary)
        return {"success": True, "transcript": transcript, "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/describe-image")
async def describe_image(payload: DescribeImageRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user: raise HTTPException(status_code=404, detail="User not found")
        transcript = _transcribe_audio(payload.audio_file)
        if not transcript:
            return {"success": False, "message": "Could not transcribe", "transcript": "", "evaluation": None}
        evaluation = _evaluate_with_cloudflare(transcript=transcript, module_type="describe_image", context=payload.image_description)
        return {"success": True, "transcript": transcript, "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================
# ROUND 1: MCQ 
# =========================================
@router.post("/mcq/generate")
async def generate_mcqs(payload: MCQGenerateRequest, db: Session = Depends(get_db)):
    try:
        mcq_data = practice_service.generate_mcqs(payload.skill, payload.domain, db)
        if not mcq_data or "error" in mcq_data or not mcq_data.get("technical_questions"):
            raise HTTPException(status_code=500, detail="Failed to generate MCQs from providers.")
        return {
            "status": "success",
            "data": {
                "technical": mcq_data["technical_questions"],
                "aptitude": mcq_data["aptitude_questions"]
            }
        }
    except Exception as e:
        print(f"Error generating MCQs: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/mcq/submit")
async def submit_mcq(payload: MCQSubmit, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Persist MCQ as a percentage, while allowing the frontend to submit raw correct answers.
        user.mcq_score = (
            round((payload.score / payload.total_questions) * 100, 2)
            if payload.total_questions and payload.total_questions > 0 and payload.total_questions != 100
            else payload.score
        )
        _refresh_user_metrics(user)
        
        progress = db.query(UserProgress).filter(UserProgress.user_id == payload.user_id).first()
        if not progress: progress = UserProgress(user_id=payload.user_id)
        
        progress.mcq_completed = True
        progress.current_round = "intermediate"
        
        db.add(progress)
        db.commit()

        return {
            "status": "success",
            "message": "MCQ Round Completed! Ready for Theory.",
            "score_saved": user.mcq_score,
            "next_round": "theory"
        }
    except Exception as e:
        print(f"Error in MCQ submit: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ==========================================================
# ROUND 2: TECHNICAL DISCUSSION (Upgraded Voice Round)
# ==========================================================
@router.post("/theory/generate")
async def generate_discussion(payload: MCQGenerateRequest):
    """Generates the 3 Voice Discussion questions (Concept, Scenario, Visual) using GitHub/Fallback."""
    try:
        discussion_data = practice_service.generate_discussion_questions(payload.skill, payload.domain)
        
        if not discussion_data or "questions" not in discussion_data:
            raise HTTPException(status_code=500, detail="Failed to generate discussion questions")
            
        return {
            "status": "success",
            "data": discussion_data
        }
    except Exception as e:
        print(f"Error generating discussion: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/theory/evaluate-audio")
async def evaluate_discussion_audio(
    user_id: str = Form(...),
    question_type: str = Form(...),
    prompt_text: str = Form(...),
    expected_keywords: str = Form(...), 
    audio_file: UploadFile = File(...)
):
    """
    Receives ONE spoken answer at a time. Processes audio via FFmpeg+Whisper,
    and grades it strictly using GitHub Models/Fallback.
    """
    try:
        transcript = await practice_service.process_interview_audio(audio_file, user_id)
        keywords_list = json.loads(expected_keywords)
        
        evaluation = practice_service.evaluate_discussion_answer(
            question_type=question_type,
            prompt_text=prompt_text,
            expected_keywords=keywords_list,
            transcript=transcript
        )
        
        return {
            "status": "success", 
            "data": {
                "transcript": transcript,
                "evaluation": evaluation
            }
        }
    except Exception as e:
        print(f"🚨 Discussion Evaluate Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process discussion answer.")


@router.post("/theory/complete-round")
async def complete_discussion_round(payload: TheorySubmit, db: Session = Depends(get_db)):
    """Saves the final calculated Round 2 score to PostgreSQL and unlocks Round 3."""
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.theory_score = payload.score
        _refresh_user_metrics(user)
        
        progress = db.query(UserProgress).filter(UserProgress.user_id == payload.user_id).first()
        if not progress:
            progress = UserProgress(user_id=payload.user_id)
        
        progress.theory_completed = True
        progress.current_round = "communication"
        
        db.add(progress)
        db.commit()

        return {
            "status": "success",
            "message": "Discussion Round Completed!",
            "score_saved": payload.score,
            "next_round": "communication"
        }
    except Exception as e:
        print(f"Error completing discussion round: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ==========================================
# ROUND 3: COMMUNICATION (GitHub Evaluation Primary)
# ==========================================
@router.post("/generate-communication-tasks")
async def generate_communication_tasks(payload: CommunicationGenerateRequest): 
    try:
        task_data = practice_service.generate_communication_tasks(payload.skill, payload.domain)
        return {"status": "success", "data": task_data}
    except Exception as e:
        print(f"Error generating communication tasks: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/evaluate-communication")
async def evaluate_communication(payload: CommunicationEvaluateRequest):
    try:
        evaluation = practice_service.evaluate_communication(
            transcript=payload.transcript,
            question_type=payload.question_type,
            prompt_text=payload.prompt_text or "",
            expected_text=payload.expected_text or ""
        )
        return {"status": "success", "data": evaluation}
    except Exception as e:
        print(f"Error evaluating communication: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/communication/submit")
async def submit_communication(payload: CommunicationSubmit, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        evaluation = (
            {
                "score": payload.overall_score,
                "feedback": payload.feedback or "Communication round submitted successfully.",
            }
            if payload.overall_score is not None
            else practice_service.evaluate_communication(transcript=payload.transcript)
        )

        comm_score = evaluation.get("score", evaluation.get("communication_score", 0))
        user.communication_score = comm_score
        _refresh_user_metrics(user)
        
        progress = db.query(UserProgress).filter(UserProgress.user_id == payload.user_id).first()
        if not progress:
            progress = UserProgress(user_id=payload.user_id)
        
        progress.communication_completed = True
        progress.current_round = "coding"
        
        db.add(progress)
        db.commit()

        return {
            "status": "success",
            "message": "Communication Round Completed! Welcome to the Boss Level.",
            "score": comm_score,
            "feedback": evaluation.get("feedback", "Good speaking skills!"),
            "next_round": "coding"
        }
    except Exception as e:
        print(f"Error in Communication submit: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ==========================================
# ROUND 4: CODING (Boss Level - Final Results)
# ==========================================

class CodingGenerateRequest(BaseModel):
    skill: str
    domain: str

# 🟢 FIXED: Added the missing endpoint here!
@router.post("/coding/generate")
async def generate_practice_coding(payload: CodingGenerateRequest):
    """Generates the coding problem for the practice sandbox."""
    try:
        # Note: You can replace this mock data with a real AI call later
        task = {
            "problem_title": f"{payload.skill} Array Optimization",
            "problem_statement": f"Write a {payload.skill} algorithm that takes an array of integers and returns the sum of all even numbers. You must handle empty arrays gracefully.",
            "target_complexity": "O(n)",
            "scenario": "A client needs a fast way to filter and sum sensor data.",
            "starter_code": "def sum_even_numbers(arr):\n    # Write your optimized code here\n    pass\n" if payload.skill.lower() == 'python' else "function sumEvenNumbers(arr) {\n    // Write your code here\n}\n",
            "language": payload.skill.lower() if payload.skill.lower() in ['python', 'javascript'] else 'python'
        }
        
        return {"status": "success", "task": task}
    except Exception as e:
        print(f"Error generating coding task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/coding/submit")
async def submit_coding(payload: CodingSubmit, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        evaluation = practice_service.evaluate_coding_answer(
            problem_statement=payload.problem_statement, 
            code=payload.code, 
            language=payload.language
        )

        coding_score = evaluation.get("coding_score", 0)
        user.coding_score = coding_score
        _refresh_user_metrics(user)
        
        progress = db.query(UserProgress).filter(UserProgress.user_id == payload.user_id).first()
        if not progress:
            progress = UserProgress(user_id=payload.user_id)
        
        progress.coding_completed = True
        progress.current_round = "completed"
        
        db.add(progress)
        
        total_score = (
            (user.mcq_score or 0) + 
            (user.theory_score or 0) + 
            (user.communication_score or 0) + 
            coding_score
        )
        final_average = total_score / 4
        
        passed_interview = final_average >= 65

        user.interview_score = round(final_average, 2)
        user.practice_tests_completed = max(user.practice_tests_completed or 0, 1)
        user.current_streak = max(user.current_streak or 0, 4)

        db.commit()

        return {
            "status": "success",
            "message": "Final Coding Round Completed!",
            "coding_results": evaluation,
            "final_interview_status": {
                "average_score": round(final_average, 2),
                "passed": passed_interview,
                "verdict": "Hired!" if passed_interview else "Keep Practicing!"
            }
        }
    except Exception as e:
        print(f"Error in Coding submit: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ==========================================
# CODING SUPPORT ENDPOINTS
# ==========================================
class RunCodeRequest(BaseModel):
    code: str
    language: str

@router.post("/run-code")
async def run_code(payload: RunCodeRequest):
    try:
        if payload.language.lower() == 'python':
            result = subprocess.run(
                ['python', '-c', payload.code],
                capture_output=True, text=True, timeout=5
            )
        elif payload.language.lower() in ['javascript', 'js']:
            result = subprocess.run(
                ['node', '-e', payload.code],
                capture_output=True, text=True, timeout=5
            )
        else:
            return {"status": "error", "error": f"Language '{payload.language}' not supported. Use Python or JavaScript."}
        
        return {
            "status": "success",
            "output": result.stdout,
            "error": result.stderr if result.stderr else None,
            "return_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"status": "error", "error": "Code execution timed out (> 5 seconds)"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


class LogWarningRequest(BaseModel):
    user_id: int
    warning_type: str
    session_id: Optional[int] = None

@router.post("/log-warning")
async def log_warning(payload: LogWarningRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"[SECURITY] Warning for user {payload.user_id}: {payload.warning_type}")
        return {"status": "success", "message": "Warning logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error logging warning")


class AnalyzeFrameRequest(BaseModel):
    user_id: int
    frame: str  # Base64 encoded image

# ==========================================
# 🟢 UPDATED: AI PROCTORING ENGINE (FACE & MOBILE)
# ==========================================
@router.post("/analyze-frame")
async def analyze_frame(payload: AnalyzeFrameRequest, db: Session = Depends(get_db)):
    try:
        if not PILLOW_AVAILABLE:
            return {"status": "OK", "message": "Frame analysis skipped (Pillow not installed)"}
        
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        try:
            # 1. Decode Image from Base64
            frame_data = base64.b64decode(payload.frame.split(',')[1] if ',' in payload.frame else payload.frame)
            image = Image.open(io.BytesIO(frame_data))
            
            # 🟢 2. Check for Mobile Phones FIRST (Using YOLOv8)
            if YOLO_AVAILABLE and yolo_model:
                results = yolo_model(image, verbose=False) 
                detected_classes = []
                for r in results:
                    for c in r.boxes.cls:
                        detected_classes.append(yolo_model.names[int(c)])
                
                # If a phone is detected, immediately trigger the strike!
                if "cell phone" in detected_classes:
                    return {"status": "MOBILE_DETECTED", "message": "Mobile phone usage detected"}

            # 🟢 3. Check for Missing or Multiple Faces (Using OpenCV instead of face_recognition)
            if CV2_AVAILABLE:
                img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                
                if len(faces) > 1:
                    return {"status": "MULTIPLE_FACES", "message": f"{len(faces)} faces detected"}
                elif len(faces) == 0:
                    return {"status": "NO_FACE", "message": "No face detected in frame"}
            
            # If everything passes:
            return {"status": "OK", "message": "Proctoring clear"}
        
        except Exception as decode_error:
            print(f"Frame decode error: {decode_error}")
            return {"status": "OK", "message": "Frame analysis skipped (decode error)"}
    
    except Exception as e:
        print(f"Error analyzing frame: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing frame")
