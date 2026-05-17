from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.db.session import Base

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    result_type = Column(String, index=True)  # "practice", "interview", "mcq", "theory", "coding", etc.
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    round_name = Column(String, nullable=True)  # For multi-round interviews: "resume", "conceptual", etc.
    feedback = Column(String, nullable=True)
    details = Column(String, nullable=True)  # JSON or detailed feedback
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
