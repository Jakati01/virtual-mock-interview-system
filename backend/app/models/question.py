import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SqlEnum
from app.db.session import Base
class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    SHORT = "short"
    CODING = "coding"

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    q_type = Column(SqlEnum(QuestionType), default=QuestionType.SHORT)
    difficulty = Column(String) # basic, intermediate, advanced
    user_id = Column(Integer, ForeignKey("users.id"))