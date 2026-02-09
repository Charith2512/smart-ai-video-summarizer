from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Get DB URL from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create Engine
# pool_recycle is important for MySQL to prevent connection timeouts
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
