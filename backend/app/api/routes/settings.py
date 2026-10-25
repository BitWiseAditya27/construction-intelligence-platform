import os
from fastapi import APIRouter
from app.core.config import settings
from app.services.ai_service import ai_service

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_system_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "ai_model": settings.AI_MODEL,
        "ai_configured": settings.has_ai_credentials,
        "ai_key_masked": (settings.effective_ai_key[:4] + "..." + settings.effective_ai_key[-4:]) if settings.effective_ai_key and len(settings.effective_ai_key) > 8 else "Not configured",
        "weather_provider": settings.WEATHER_PROVIDER,
        "weather_api_configured": bool(settings.WEATHER_API_KEY),
        "database_type": "SQLite (Development)" if "sqlite" in settings.DATABASE_URL else "PostgreSQL (Production)",
        "upload_dir": settings.UPLOAD_DIR,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
        "demo_mode": not ai_service.is_ai_available,
        "multimodal_supported": True,
        "env_guidelines": {
            "AI_PROVIDER": "gemini",
            "AI_API_KEY": "Your Google Gemini API Key (or set GEMINI_API_KEY)",
            "AI_MODEL": "gemini-2.5-flash",
            "WEATHER_API_KEY": "Optional (Open-Meteo free live tier active by default)",
            "DATABASE_URL": "sqlite:///./construction_intelligence.db"
        }
    }

@router.post("/test-ai")
def test_ai_connectivity():
    if not ai_service.is_ai_available:
        return {
            "success": False,
            "message": "AI service is running in local baseline demo mode. No active AI_API_KEY detected in environment.",
            "mode": "demo_fallback"
        }
    try:
        parsed, is_demo = ai_service.generate_json("Respond with JSON: {\"status\": \"ok\", \"service\": \"operational\"}")
        if parsed and not is_demo:
            return {
                "success": True,
                "message": f"Successfully connected to {settings.AI_PROVIDER} ({settings.AI_MODEL}).",
                "details": parsed
            }
        else:
            return {
                "success": False,
                "message": "AI API call returned empty or fallback.",
                "mode": "demo_fallback"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"AI test failed: {str(e)}",
            "mode": "demo_fallback"
        }
