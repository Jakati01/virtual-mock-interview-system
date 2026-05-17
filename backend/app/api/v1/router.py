# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import auth, resume, practice, interview, users

api_router = APIRouter()

# Plug in all the individual route files
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(resume.router, prefix="/resume", tags=["Resume Analysis"])
api_router.include_router(practice.router, prefix="/practice", tags=["Practice Arena"])
api_router.include_router(interview.router, prefix="/interview", tags=["Real Interview"])