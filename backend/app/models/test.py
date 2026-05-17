from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.session import Base


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    test_type = Column(String)  # practice / real

    mcq_score = Column(Integer, default=0)
    short_score = Column(Integer, default=0)
    coding_score = Column(Integer, default=0)

    total_score = Column(Integer, default=0)