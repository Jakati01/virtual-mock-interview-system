from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class DiscussionQuestion(Base):
    __tablename__ = "discussion_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(String, nullable=False) # E.g., "CONCEPT", "SCENARIO", "VISUAL"
    prompt = Column(String, nullable=False)
    expected_keywords = Column(JSON, nullable=False) # JSON list of required keywords: ["LIFO", "memory"]
    code_snippet = Column(String, nullable=True) # Used if it's a code-reading question

class DiscussionEvaluation(Base):
    __tablename__ = "discussion_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False) 
    question_id = Column(Integer, ForeignKey("discussion_questions.id"))
    
    # Audio & Text
    audio_file_path = Column(String, nullable=True)
    transcript = Column(String, nullable=False)
    
    # Grading Metrics
    score_understanding = Column(Integer, nullable=False)
    score_clarity = Column(Integer, nullable=False)
    score_completeness = Column(Integer, nullable=False)
    final_score = Column(Float, nullable=False)
    
    # Feedback (Stored as JSON arrays/strings)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    interviewer_feedback = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())