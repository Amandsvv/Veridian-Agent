from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path in /api/data/app.db
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "app.db"

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(String(64), index=True, nullable=False)
    role = Column(String(16), nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TicketModel(Base):
    __tablename__ = "tickets"

    id = Column(String(32), primary_key=True, index=True)  # e.g. TK-1052
    employee = Column(String(128), default="Employee", nullable=False)
    category = Column(String(64), nullable=False)
    summary = Column(Text, nullable=False)
    status = Column(String(64), nullable=False)
    sources = Column(Text, default="[]")  # JSON encoded list of strings
    request_text = Column(Text, nullable=False)
    is_seed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLogModel(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(String(64), index=True, nullable=True)
    time = Column(DateTime, default=datetime.utcnow)
    request = Column(Text, nullable=False)
    action = Column(String(32), nullable=False)
    sources = Column(Text, default="[]")  # JSON encoded list of strings
    ticket_id = Column(String(32), nullable=True)
    escalation_reason = Column(Text, nullable=True)


def init_db():
    """Initializes tables on startup without seeding data."""
    Base.metadata.create_all(bind=engine)


# Ensure tables are created upon module import
init_db()


def get_db():
    """Dependency for obtaining DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
