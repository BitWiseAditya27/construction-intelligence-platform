from typing import Optional, Dict, Any
from pydantic import BaseModel

class HistoryItemResponse(BaseModel):
    id: int
    module_type: str  # safety, crack, valuation, planning
    title: str
    subtitle: str
    badge_text: str
    badge_color: str
    details_summary: str
    is_demo_mode: bool
    created_at: str
    image_url: Optional[str] = None
    payload: Dict[str, Any]
