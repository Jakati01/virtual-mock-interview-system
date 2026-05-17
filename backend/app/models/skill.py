from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.session import Base

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))

    skill_name = Column(String)