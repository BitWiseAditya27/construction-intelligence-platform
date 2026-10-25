import json
import logging
import re
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        api_key = settings.effective_ai_key
        if api_key and settings.AI_PROVIDER.lower() == "gemini":
            try:
                from google import genai
                self.client = genai.Client(api_key=api_key)
                logger.info("Initialized Google GenAI client successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")
                self.client = None
        else:
            logger.info("Running in local baseline/demo mode (no active AI API key configured).")

    @property
    def is_ai_available(self) -> bool:
        return self.client is not None

    def clean_json_text(self, text: str) -> str:
        """Strip markdown fences, trailing commas, or surrounding notes."""
        text = text.strip()
        # Remove ```json ... ``` or ``` ... ```
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
        if fence_match:
            text = fence_match.group(1).strip()
        return text

    def generate_json(
        self,
        prompt: str,
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = "image/jpeg",
        system_instruction: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        Sends prompt to multimodal model.
        Returns (parsed_json_dict, is_demo_mode).
        If no credentials or error occurs, returns (None, True).
        """
        if not self.client:
            return None, True

        target_model = model_name or settings.AI_MODEL
        try:
            from google.genai import types

            contents = []
            if image_bytes:
                image_part = types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type or "image/jpeg"
                )
                contents.append(image_part)
            contents.append(prompt)

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
            if system_instruction:
                config.system_instruction = system_instruction

            response = self.client.models.generate_content(
                model=target_model,
                contents=contents,
                config=config
            )

            raw_text = response.text or ""
            cleaned = self.clean_json_text(raw_text)
            parsed = json.loads(cleaned)
            return parsed, False
        except Exception as e:
            logger.warning(f"AI API request failed or timed out: {e}. Falling back to deterministic demo engine.")
            return None, True

ai_service = AIService()
