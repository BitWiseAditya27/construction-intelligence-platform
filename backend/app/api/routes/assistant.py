import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.assistant import ChatMessage
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import process_assistant_chat

router = APIRouter(prefix="/assistant", tags=["Assistant"])

@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    req: AssistantChatRequest,
    db: Session = Depends(get_db)
):
    try:
        # Record user message in DB
        user_msg = ChatMessage(
            session_id=req.session_id or "default_session",
            project_id=req.project_id,
            role="user",
            content=req.message,
            context_type=req.context_type
        )
        db.add(user_msg)
        db.commit()

        # Process via assistant service
        resp = await process_assistant_chat(req)

        # Update user_msg session_id if generated
        user_msg.session_id = resp.session_id
        db.commit()

        # Record assistant reply in DB
        assistant_msg = ChatMessage(
            session_id=resp.session_id,
            project_id=req.project_id,
            role="assistant",
            content=resp.answer,
            context_type=req.context_type,
            metadata_json=json.dumps({
                "explanation": resp.explanation,
                "recommended_next_steps": resp.recommended_next_steps,
                "caveats": resp.caveats,
                "citations": resp.citations,
                "is_demo_mode": resp.is_demo_mode
            })
        )
        db.add(assistant_msg)
        db.commit()

        return resp
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Assistant chat error: {str(e)}")

@router.get("/history/{session_id}")
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    out = []
    for m in messages:
        meta = {}
        if m.metadata_json:
            try:
                meta = json.loads(m.metadata_json)
            except Exception:
                meta = {}
        out.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "context_type": m.context_type,
            "metadata": meta,
            "created_at": m.created_at.isoformat() if m.created_at else ""
        })
    return out
