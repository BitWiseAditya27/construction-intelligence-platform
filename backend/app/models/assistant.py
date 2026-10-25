import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    project_id = Column(Integer, nullable=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    context_type = Column(String(50), default="daily_site")  # daily_site, knowledge
    metadata_json = Column(Text, nullable=True)  # JSON string of structured caveats, next_steps, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
