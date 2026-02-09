from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), index=True) # Firebase User ID
    input_type = Column(String(50)) # text, pdf, video
    input_content = Column(Text) # Truncated text or filename/url
    summary_output = Column(Text) # The generated summary
    file_path = Column(String(500), nullable=True) # Path to stored file
    original_filename = Column(String(255), nullable=True) # Original filename or Video Title
    preference = Column(String(20), default="medium") # short, medium, long
    format_mode = Column(String(20), default="paragraph") # paragraph, bullet points
    highlights = Column(Text, nullable=True) # JSON String of highlights
    available_qualities = Column(Text, nullable=True) # Comma-separated list of quality strings

    
    # Statistics
    orig_words = Column(Integer, default=0)
    summ_words = Column(Integer, default=0)
    orig_sentences = Column(Integer, default=0)
    summ_sentences = Column(Integer, default=0)
    orig_chars = Column(Integer, default=0)
    summ_chars = Column(Integer, default=0)
    
    content_hash = Column(String(64), index=True) # SHA256 Hash

    created_at = Column(DateTime(timezone=True), server_default=func.now())
