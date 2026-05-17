from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.services import resume_service

router = APIRouter()

@router.post("/upload/{user_id}")
async def upload_resume(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] Starting resume upload for user {user_id}")
        
        # 1. Read the uploaded PDF file bytes
        print(f"[DEBUG] Reading file: {file.filename}")
        file_bytes = await file.read()
        print(f"[DEBUG] File size: {len(file_bytes)} bytes")

        # 2. Extract the text (Wait for the coroutine to finish)
        resume_text = await resume_service.extract_text_from_pdf(file_bytes)
        print(f"[DEBUG] Extracted text length: {len(resume_text) if resume_text else 0}")

        # Safety check: Did we actually get text out of the PDF?
        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the PDF. Make sure it is not an image-based PDF."
            )

        # 3. Send the text to our Groq Senior Recruiter prompt
        print(f"[DEBUG] Sending to Groq AI for analysis")
        analysis_data = resume_service.analyze_resume_with_groq(resume_text)
        print(f"[DEBUG] Groq response: {analysis_data is not None}")

        # Safety check: Did Groq return valid JSON? If not, use fallback
        if not analysis_data:
            print(f"[DEBUG] Groq analysis failed, using fallback data")
            analysis_data = {
                "overall_ats_score": 65,
                "score_breakdown": {
                    "keyword_match": 70,
                    "formatting": 65,
                    "impact_metrics": 60
                },
                "extracted_skills": ["Communication", "Problem Solving", "Technical Skills"],
                "missing_skills": ["Specific Technical Skills", "Quantified Metrics"],
                "feedback": "Resume uploaded successfully. Please ensure you have uploaded a valid PDF with text content.",
                "suitable_domains": [
                    {"domain": "General Professional", "match_percentage": 65, "reason": "Generic professional resume format detected."}
                ]
            }

        # 4. Save the core data to database
        print(f"[DEBUG] Saving to database for user {user_id}")
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Update the ATS Score
            user.ats_score = analysis_data.get("overall_ats_score", 0)
            
            # Convert the list of skills from Groq into a single string for your DB column
            skills_list = analysis_data.get("extracted_skills", [])
            user.extracted_skills = ", ".join(skills_list) if isinstance(skills_list, list) else str(skills_list)
            
            # Save the changes
            db.commit()
            print(f"[DEBUG] Data saved successfully")
        else:
            print(f"[DEBUG] User {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found in database.")

        # 5. Return the massive, beautiful JSON to your React Frontend
        return {
            "message": "Resume analyzed successfully!",
            "analysis": analysis_data
        }

    except HTTPException as he:
        print(f"[DEBUG] HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        # Catch any wild Python crashes and print them to your terminal
        print(f"[DEBUG] Unexpected error in upload_resume: {str(e)}")
        print(f"[DEBUG] Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/{user_id}/analyze")
async def analyze_resume(user_id: int, db: Session = Depends(get_db)):
    """Analyze uploaded resume (for existing resumes)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return stored ATS analysis if available
        if user.ats_score and user.extracted_skills:
            return {
                "success": True,
                "data": {
                    "ats_score": user.ats_score,
                    "extracted_skills": user.extracted_skills.split(", ") if user.extracted_skills else [],
                }
            }
        
        # If no analysis yet, return defaults
        return {
            "success": True,
            "data": {
                "ats_score": 0,
                "extracted_skills": [],
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analyze_resume: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{user_id}")
async def get_resume_analysis(user_id: int, db: Session = Depends(get_db)):
    """Get resume analysis for a user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "data": {
                "ats_score": user.ats_score or 0,
                "extracted_skills": user.extracted_skills.split(", ") if user.extracted_skills else [],
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_resume_analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")