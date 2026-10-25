import io
import uuid
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, List
from PIL import Image

from app.core.config import settings
from app.services.ai_service import ai_service
from app.schemas.safety import SafetyAnalyzeResponse, HazardItem

logger = logging.getLogger(__name__)

SAFETY_PROMPT = """
You are an expert Certified Construction Safety Professional (CSP / OSHA Compliance Auditor).
Analyze this construction site photograph carefully for occupational health, structural, and safety hazards.

Analyze the image for:
1. Personal Protective Equipment (PPE) compliance (hard hats, high-vis vests, eye protection, safety boots, harnesses).
2. Fall hazards (unprotected edges, scaffolding without guardrails, ladders, floor openings).
3. Housekeeping and trip/slip hazards (scattered debris, exposed rebar, uncoiled cables, water pooling).
4. Electrical hazards (exposed wiring, improper grounding, proximity of equipment to overhead lines).
5. Heavy machinery and excavation risks (shoring defects, workers in blind spots, trench collapse risks).
6. Scaffolding and ladder setup (proper base plates, tie-backs, planking, stability).

Return a strict JSON object with this exact structure:
{
  "overall_risk": "Low" | "Medium" | "High" | "Critical",
  "severity": "Concise 1-sentence severity summary",
  "observations": ["Observed site condition 1", "Observed site condition 2", "Observed site condition 3"],
  "hazards": [
    {
      "hazard": "Name and description of potential hazard",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "location": "Location within the scene (e.g. midground left scaffold)",
      "recommendation": "Specific corrective action needed"
    }
  ],
  "recommended_actions": ["Immediate priority action 1", "Preventative measure 2", "Checklist item 3"],
  "summary": "Detailed executive summary of findings and overall site posture",
  "limitations": "Photographic inspection cannot confirm hidden structural anchorages, load calculations, or equipment certification tags.",
  "disclaimer": "This AI safety assessment is advisory only and cannot replace certified OSHA/NEBOSH safety officer site inspections."
}
"""

def validate_and_save_image(file_bytes: bytes, filename: str) -> Tuple[str, str]:
    """Validates file format, size, and saves securely. Returns (saved_filename, relative_url)."""
    # Check size
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    # Check extension
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError(f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}")

    # Verify image integrity via PIL
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Verifies headers and integrity
        # Re-open for actual saving
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError("Invalid or corrupted image file.") from e

    # Generate secure sanitized unique filename
    unique_name = f"safety_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = Path(settings.UPLOAD_DIR) / unique_name
    image.save(dest_path)

    relative_url = f"/uploads/{unique_name}"
    return unique_name, relative_url

def generate_fallback_safety_analysis(project_name: str, location: str, notes: str) -> Dict[str, Any]:
    """Deterministic, transparent baseline analysis when AI provider is unavailable."""
    return {
        "overall_risk": "High",
        "severity": "High risk detected due to visible edge work and active multi-trade operations",
        "observations": [
            "Active multi-story structural work with open floor perimeters observed in frame",
            "Multiple crew members present across elevated staging areas",
            "Materials stacked near slab edges and incomplete perimeter barricades",
            f"Inspection context: {project_name or 'Site Area'} located at {location or 'Zone 1'}"
        ],
        "hazards": [
            {
                "hazard": "Incomplete Perimeter Guardrail / Leading Edge",
                "severity": "Critical",
                "location": "Upper slab perimeter and stairwell opening",
                "recommendation": "Install standard top-rail (42 in), mid-rail (21 in), and toe-boards or certified personal fall arrest systems immediately."
            },
            {
                "hazard": "Uncapped Vertical Rebar Dowels",
                "severity": "High",
                "location": "Ground level access corridor and column starter bars",
                "recommendation": "Cover all protruding rebar with OSHA-compliant steel-reinforced protective impalement caps."
            },
            {
                "hazard": "Unmanaged Temporary Power Cables and Trip Hazards",
                "severity": "Medium",
                "location": "Walkway between mixing station and primary hoistway",
                "recommendation": "Elevate temporary power cords overhead using non-conductive hangers or cover with heavy-duty cable ramps."
            },
            {
                "hazard": "Inconsistent Head and Eye PPE Adherence",
                "severity": "Medium",
                "location": "Material laydown area and staging zone",
                "recommendation": "Enforce mandatory Type 1 Class E/G hard hats and ANSI Z87.1 safety eyewear at all site entry checkpoints."
            }
        ],
        "recommended_actions": [
            "Halt perimeter activities until edge protection barriers are verified by the site safety superintendent.",
            "Conduct a mandatory 15-minute morning toolbox talk on fall protection and impalement prevention.",
            "Implement a daily housekeeping sweep to clear scrap lumber, banding wire, and loose cords from walkways.",
            "Verify all subcontractor job hazard analyses (JHA) prior to proceeding with overhead crane picks."
        ],
        "summary": "Baseline inspection identified elevated fall potential and standard site housekeeping deficiencies that require immediate remediation before proceeding to next pour.",
        "limitations": "Baseline heuristic evaluation based on typical structural phase risk patterns. 2D photographs cannot assess cable insulation resistance, harness lanyard tag inspection dates, or wind gust metrics.",
        "disclaimer": "DEMO BASELINE MODE: This automated safety report provides illustrative guidelines only. It does NOT replace a certified human safety officer (OSHA/NEBOSH) physical inspection.",
        "is_demo_mode": True
    }

async def analyze_site_safety(
    file_bytes: bytes,
    filename: str,
    project_name: str = "",
    location: str = "",
    notes: str = ""
) -> Tuple[SafetyAnalyzeResponse, str, str]:
    """Analyzes site safety image via AI or deterministic baseline."""
    saved_filename, image_url = validate_and_save_image(file_bytes, filename)

    ext = Path(filename).suffix.lower()
    mime_type = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"

    prompt = f"""
Site Name: {project_name or 'Unspecified Project'}
Location: {location or 'Unspecified Location'}
Inspector Site Notes: {notes or 'None provided'}

{SAFETY_PROMPT}
"""

    parsed_result, is_demo = ai_service.generate_json(
        prompt=prompt,
        image_bytes=file_bytes,
        mime_type=mime_type
    )

    if not parsed_result or is_demo:
        data = generate_fallback_safety_analysis(project_name, location, notes)
    else:
        # Validate AI fields and construct response
        try:
            data = {
                "overall_risk": parsed_result.get("overall_risk", "Medium"),
                "severity": parsed_result.get("severity", "Inspection completed with identified hazards."),
                "observations": parsed_result.get("observations", []),
                "hazards": [
                    HazardItem(
                        hazard=h.get("hazard", "Identified hazard"),
                        severity=h.get("severity", "Medium"),
                        location=h.get("location", "Visible area"),
                        recommendation=h.get("recommendation", "Review and mitigate.")
                    )
                    for h in parsed_result.get("hazards", [])
                ],
                "recommended_actions": parsed_result.get("recommended_actions", []),
                "summary": parsed_result.get("summary", "Automated analysis completed."),
                "limitations": parsed_result.get("limitations", "Visual analysis cannot determine hidden defects."),
                "disclaimer": parsed_result.get("disclaimer", "Advisory only. Certified inspector verification required."),
                "is_demo_mode": False
            }
        except Exception as e:
            logger.warning(f"Error parsing AI safety response: {e}. Falling back to baseline.")
            data = generate_fallback_safety_analysis(project_name, location, notes)

    response_obj = SafetyAnalyzeResponse(
        overall_risk=data["overall_risk"],
        severity=data["severity"],
        observations=data["observations"],
        hazards=[h if isinstance(h, HazardItem) else HazardItem(**h) for h in data["hazards"]],
        recommended_actions=data["recommended_actions"],
        summary=data["summary"],
        limitations=data["limitations"],
        disclaimer=data["disclaimer"],
        is_demo_mode=data["is_demo_mode"],
        image_url=image_url,
        project_name=project_name,
        location=location
    )

    return response_obj, saved_filename, image_url
