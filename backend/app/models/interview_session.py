from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Boolean
import enum
from app.db.session import Base

class InterviewStatus(str, enum.Enum):
    PRACTICE = "practice"
    REAL_LOCKED = "locked"
    REAL_ACTIVE = "active"
    COMPLETED = "completed"

class InterviewRound(str, enum.Enum):
    RESUME = "resume_based"
    CONCEPTUAL = "conceptual"
    REAL_WORLD = "real_world_task"
    HR = "hr_communication"
    