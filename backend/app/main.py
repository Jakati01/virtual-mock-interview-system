from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your database and models to create tables automatically
from app.db.session import engine, Base

# Import ALL models to register them with SQLAlchemy Base
from app.models.user import User
from app.models.user_progress import UserProgress
from app.models.result import Result
from app.models.resume import Resume
from app.models.skill import Skill
from app.models.question import Question
from app.models.report import EvaluationReport
from app.models.test import Test
from app.models.interview_session import InterviewStatus, InterviewRound
from app.models.cheating_log import CheatingLog

# Import ALL your routers from the v1 endpoints folder
from app.api.v1.endpoints import auth, resume, practice, interview, results, proctor
from app.api.v1.endpoints import users

# Create all database tables (if they don't exist yet)
Base.metadata.create_all(bind=engine)

# Initialize the FastAPI App (CREATE ONLY ONCE!)
app = FastAPI(
    title="AI Virtual Mock Interview System",
    description="Backend API for Resume Analysis, Safe-Zone Practice, and Proctored Real Interviews",
    version="3.0.0"
)

# ==========================================
# CORS CONFIGURATION (CRUCIAL FOR REACT & WEBSOCKETS)
# ==========================================
# This ensures React can connect via standard HTTP AND live WebSockets

# THE ULTIMATE VIP LIST - Covers every variation of localhost
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# This MUST come immediately after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],  # Allows Authorization headers
)

# ==========================================
# REGISTER ALL ROUTERS
# ==========================================
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["Resume Analysis"])
app.include_router(practice.router, prefix="/api/v1/practice", tags=["Practice Arena"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["Real Interviews"])
app.include_router(proctor.router, prefix="/api/v1/proctor", tags=["Anti-Cheating API"])
# app.include_router(results.router, prefix="/api/v1/results", tags=["Final Results"])

# ==========================================
# HEALTH CHECK ENDPOINT
# ==========================================
@app.get("/", tags=["Health Check"])
async def root():
    """A simple ping to verify the server is running."""
    return {
        "status": "online",
        "message": "AI Mock Interview API is running smoothly!",
        "fort_knox_security": "Active"
    }
from fastapi import Request
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("🔥 GLOBAL ERROR:")
    traceback.print_exc()
    return {"detail": str(exc)}