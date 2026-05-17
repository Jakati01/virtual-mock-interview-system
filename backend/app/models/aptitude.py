from sqlalchemy import Column, Integer, String, JSON
from app.db.session import Base

class AptitudeQuestion(Base):
    __tablename__ = "aptitude_questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False) # Stores options as a JSON array
    correct_answer = Column(String, nullable=False)