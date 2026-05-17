from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from app.db.session import Base

class EvaluationReport(Base):
    __tablename__ = "evaluation_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Scores we track across your project
    ats_score = Column(Float, default=0.0)
    practice_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    
    # Store Groq/Gemini feedback as JSON or String
    feedback_summary = Column(JSON, nullable=True)
    
    # e.g., "Analyzed", "Practice Complete", "Interview Unlocked"
    status = Column(String, default="Pending")