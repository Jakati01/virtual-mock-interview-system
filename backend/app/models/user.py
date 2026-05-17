from sqlalchemy import Column, Integer, String, Float, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Career Data
    resume_path = Column(String, nullable=True)
    extracted_skills = Column(String, nullable=True)  # Changed to String for easier querying
    ats_score = Column(Float, default=0.0)

    # Performance Tracking
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)

    # Practice Scores & Stats
    mcq_score = Column(Integer, default=0)
    theory_score = Column(Integer, default=0)
    coding_score = Column(Integer, default=0)
    practice_tests_completed = Column(Integer, default=0)
    interview_score = Column(Float, default=0.0)
    current_streak = Column(Integer, default=0)

    # Proctoring Logs
    tab_switch_count = Column(Integer, default=0)
    
    # Relationship to UserProgress
    progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")
