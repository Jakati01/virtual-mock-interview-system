from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from datetime import datetime
from app.db.session import Base

class CheatingLog(Base):
    __tablename__ = "cheating_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    violation_type = Column(String)  # "tab_switch", "copy_paste", "face_missing", "multiple_faces", etc.
    violation_count = Column(Integer, default=1)
    severity = Column(String, default="low")  # "low", "medium", "high"
    detected_at = Column(DateTime, default=datetime.utcnow)
    description = Column(String, nullable=True)
    is_reviewed = Column(Boolean, default=False)
    action_taken = Column(String, nullable=True)  # "none", "warning", "disqualify"
