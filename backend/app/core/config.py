import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Multimodal Construction Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./construction_intelligence.db"
    
    # AI Multimodal Configuration
    AI_PROVIDER: str = "gemini"  # "gemini", "openai", "fallback"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-2.5-flash"
    
    # Weather Configuration
    WEATHER_API_KEY: Optional[str] = None
    WEATHER_PROVIDER: str = "open-meteo"  # "open-meteo" provides real free global forecasts without key
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]
    
    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ADDITIONAL_CORS_ORIGINS: List[str] = [
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    @property
    def has_ai_credentials(self) -> bool:
        # Check either AI_API_KEY or standard GEMINI_API_KEY / GOOGLE_API_KEY
        key = self.AI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        return bool(key and len(key.strip()) > 5)
    
    @property
    def effective_ai_key(self) -> Optional[str]:
        return self.AI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()

# Ensure uploads directory exists
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
