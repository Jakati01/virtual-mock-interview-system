from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class UserProgress(Base):
    """
    Tracks user progress through practice rounds.
    Allows users to resume from where they left off.
    """
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    
    # Track completion status of each round
    mcq_completed = Column(Boolean, default=False)
    intermediate_completed = Column(Boolean, default=False)
    communication_completed = Column(Boolean, default=False)
    coding_completed = Column(Boolean, default=False)
    
    # Current round the user should resume from
    # Values: "mcq", "intermediate", "communication", "coding", "completed"
    current_round = Column(String(50), default="mcq")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to User
    user = relationship("User", back_populates="progress")

    def __repr__(self):
        return f"<UserProgress(user_id={self.user_id}, current_round={self.current_round})>"
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "mcq_completed": self.mcq_completed,
            "intermediate_completed": self.intermediate_completed,
            "communication_completed": self.communication_completed,
            "coding_completed": self.coding_completed,
            "current_round": self.current_round,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }
