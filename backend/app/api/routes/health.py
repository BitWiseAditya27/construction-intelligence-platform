import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.services.ai_service import ai_service

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def check_health(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "database_connected": db_ok,
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": settings.AI_MODEL,
        "ai_credentials_configured": settings.has_ai_credentials,
        "demo_mode_active": not ai_service.is_ai_available
    }
