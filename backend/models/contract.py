"""
Contract DB model — SQLAlchemy (PostgreSQL).
Currently the app uses in-memory storage.
Switch to this when you add a real database.

Setup:
  pip install sqlalchemy asyncpg alembic
  Set DATABASE_URL=postgresql+asyncpg://user:pass@host/db in .env
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid

Base = declarative_base()


class Contract(Base):
    __tablename__ = "contracts"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(String(64), nullable=True, index=True)
    name          = Column(String(255), nullable=False)
    file_name     = Column(String(255), nullable=True)
    contract_type = Column(String(64),  default="General")
    raw_text      = Column(Text,        nullable=True)
    risk_score    = Column(Float,       default=0.0)
    risk_level    = Column(String(16),  default="Unknown")
    status        = Column(String(32),  default="pending")
    analysis      = Column(JSON,        nullable=True)
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    analyzed_at   = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id":          str(self.id),
            "name":        self.name,
            "type":        self.contract_type,
            "risk_score":  self.risk_score,
            "risk_level":  self.risk_level,
            "status":      self.status,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "analyzed_at": self.analyzed_at.isoformat() if self.analyzed_at else None,
        }
