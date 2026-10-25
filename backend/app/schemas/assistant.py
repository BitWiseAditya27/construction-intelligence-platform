from typing import List, Optional
from pydantic import BaseModel, Field

class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=2, description="User question or site update")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    project_id: Optional[int] = Field(None, description="Optional associated project ID")
    context_type: str = Field("daily_site", description="'daily_site' or 'knowledge'")

class AssistantChatResponse(BaseModel):
    answer: str = Field(..., description="Direct concise answer")
    explanation: str = Field(..., description="Technical breakdown or detailed site guidance")
    recommended_next_steps: List[str] = Field(default_factory=list, description="Actionable checklist items")
    caveats: List[str] = Field(default_factory=list, description="Site constraints and verification warnings")
    citations: List[str] = Field(default_factory=list, description="Referenced standards or practices (if verified)")
    session_id: str
    context_type: str
    is_demo_mode: bool = False
    created_at: str
