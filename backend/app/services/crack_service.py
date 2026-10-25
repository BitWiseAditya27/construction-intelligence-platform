import io
import uuid
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, List
from PIL import Image

from app.core.config import settings
from app.services.ai_service import ai_service
from app.schemas.crack import CrackAnalyzeResponse

logger = logging.getLogger(__name__)

CRACK_PROMPT = """
You are an expert Structural Forensic Engineer specialized in concrete, masonry, and reinforced concrete failure analysis.
Analyze the uploaded image of a structural surface with visible cracking.

Inputs:
- Structure Type: {structure_type}
- Structure Age: {age_years}
- User Notes / Measurements: {notes} {measurements}

Analyze the image for:
1. Crack pattern (e.g. diagonal shear, vertical settlement, map/crazing shrinkage, horizontal flexural, thermal expansion, corrosion-induced spalling).
2. Approximate visual location within the frame.
3. Possible engineering causes, explicitly categorized as hypotheses (never state causes as absolute facts).
4. Recommended engineering next steps (e.g., crack width gauge monitoring, non-destructive testing, ultrasonic pulse velocity, core extraction).
5. Urgency level: "Immediate", "Prompt", or "Monitor".
6. Whether prompt professional inspection by a licensed structural engineer is warranted.

IMPORTANT CONSTRAINTS:
- DO NOT invent exact sub-millimeter crack widths or load calculations from a 2D photograph.
- DO NOT claim to certify or guarantee the structural stability of the building.
- State clearly that image-only assessment is non-destructive visual screening, not a definitive structural audit.

Return a strict JSON object:
{{
  "observations": ["Surface texture observation", "Crack continuity observation", "Discoloration / moisture / efflorescence observation"],
  "location_in_image": "Descriptive visual location in frame",
  "crack_pattern": "Name of pattern (e.g. 45-degree diagonal shear crack near support)",
  "possible_causes": [
    "Hypothesis A: Differential foundation settlement causing shear displacement",
    "Hypothesis B: Thermal movement and restraint stresses in unreinforced masonry",
    "Hypothesis C: Drying shrinkage combined with tensile stress concentration"
  ],
  "suggested_next_steps": ["Step 1: Install tell-tale crack width gauge", "Step 2: Check foundation soil moisture", "Step 3: Structural engineering inspection"],
  "professional_inspection_warranted": true,
  "urgency": "Immediate",
  "limitations": "2D photographic evaluation cannot measure crack depth, subsurface voiding, or internal rebar section loss.",
  "disclaimer": "This analysis is for screening purposes only and CANNOT establish whether a structure is safe. An on-site evaluation by a licensed Professional Structural Engineer (PE / SE) is required."
}}
"""

def validate_and_save_crack_image(file_bytes: bytes, filename: str) -> Tuple[str, str]:
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError(f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}")

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError("Invalid or corrupted image file.") from e

    unique_name = f"crack_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = Path(settings.UPLOAD_DIR) / unique_name
    image.save(dest_path)

    relative_url = f"/uploads/{unique_name}"
    return unique_name, relative_url

def generate_fallback_crack_analysis(
    structure_type: str,
    age_years: str,
    notes: str,
    measurements: str
) -> Dict[str, Any]:
    st_lower = (structure_type or "wall").lower()
    
    if "beam" in st_lower or "column" in st_lower:
        pattern = "Diagonal shear cracking inclined near member support"
        urgency = "Immediate"
        prof_warranted = True
        hypotheses = [
            "Hypothesis 1: Principle tensile stress exceeding concrete tensile capacity under shear/flexure",
            "Hypothesis 2: Deflection or support displacement from unexpected dead or live overload",
            "Hypothesis 3: Corrosion of internal stirrups leading to longitudinal splitting and spalling"
        ]
        steps = [
            "Halt storage of heavy concentrated loads directly above this member immediately.",
            "Install temporary shoring props if advised by the site civil superintendent.",
            "Commission immediate on-site core inspection and ultrasonic pulse velocity (UPV) testing by a licensed structural engineer."
        ]
    elif "slab" in st_lower or "foundation" in st_lower:
        pattern = "Stepped settlement / flexural cracking across bottom surface"
        urgency = "Prompt"
        prof_warranted = True
        hypotheses = [
            "Hypothesis 1: Subgrade soil compaction or differential foundation settlement",
            "Hypothesis 2: Insufficient bottom reinforcement distribution during peak deflection",
            "Hypothesis 3: Early strip-out of formwork prior to reaching specified 28-day compressive strength"
        ]
        steps = [
            "Affix calibrated acrylic tell-tale motion monitors to track any active crack displacement over 30 days.",
            "Inspect basement or perimeter drainage for localized water pooling or soil washout.",
            "Engage a geotechnical and structural engineering specialist to evaluate sub-base stability."
        ]
    else:
        pattern = "Linear diagonal-to-vertical cracking across masonry mortar joints"
        urgency = "Prompt"
        prof_warranted = True
        hypotheses = [
            "Hypothesis 1: Differential thermal expansion between concrete frame and masonry infill",
            "Hypothesis 2: Minor foundation settlement or seasonal moisture variation in reactive clay subgrade",
            "Hypothesis 3: Autogenous drying shrinkage in cement-sand mortar bedding"
        ]
        steps = [
            "Mark crack endpoints with indelible marker and date stamp to observe extension.",
            "Measure crack aperture across 3 distinct points with an optical crack-measuring microscope or gauge.",
            "Consult a qualified structural engineer if crack widens beyond 1.5mm or extends through load-bearing lintels."
        ]

    return {
        "observations": [
            f"Visible continuous fissure traversing the surface of the {structure_type or 'structural component'}",
            "Rough, uneven fracture margins indicative of brittle tensile tearing",
            f"Structure estimated age: {age_years or 'Unspecified'}; Context: {notes or 'No prior damage history provided'}",
            f"User reported dimensions: {measurements or 'No manual width specified'}"
        ],
        "location_in_image": "Extending diagonally across the central vertical field of the photographic frame",
        "crack_pattern": pattern,
        "possible_causes": hypotheses,
        "suggested_next_steps": steps,
        "professional_inspection_warranted": prof_warranted,
        "urgency": urgency,
        "limitations": "Standard photographs cannot measure three-dimensional crack depth, rebar bond slip, or foundation settlement subgrade conditions.",
        "disclaimer": "DEMO BASELINE MODE: This automated engineering assessment provides hypothesis screening only. It CANNOT certify structural safety. Direct physical examination by a licensed structural engineer (PE/SE) is required.",
        "is_demo_mode": True
    }

async def analyze_crack_image(
    file_bytes: bytes,
    filename: str,
    structure_type: str = "Wall",
    age_years: str = "",
    notes: str = "",
    measurements: str = ""
) -> Tuple[CrackAnalyzeResponse, str, str]:
    saved_filename, image_url = validate_and_save_crack_image(file_bytes, filename)

    ext = Path(filename).suffix.lower()
    mime_type = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"

    prompt = CRACK_PROMPT.format(
        structure_type=structure_type or "Wall",
        age_years=age_years or "Unknown",
        notes=notes or "None",
        measurements=measurements or "Not provided"
    )

    parsed_result, is_demo = ai_service.generate_json(
        prompt=prompt,
        image_bytes=file_bytes,
        mime_type=mime_type
    )

    if not parsed_result or is_demo:
        data = generate_fallback_crack_analysis(structure_type, age_years, notes, measurements)
    else:
        try:
            data = {
                "observations": parsed_result.get("observations", []),
                "location_in_image": parsed_result.get("location_in_image", "Visible in center field"),
                "crack_pattern": parsed_result.get("crack_pattern", "Surface fracture"),
                "possible_causes": parsed_result.get("possible_causes", []),
                "suggested_next_steps": parsed_result.get("suggested_next_steps", []),
                "professional_inspection_warranted": parsed_result.get("professional_inspection_warranted", True),
                "urgency": parsed_result.get("urgency", "Prompt"),
                "limitations": parsed_result.get("limitations", "Photographic evaluation cannot measure depth or steel rebar state."),
                "disclaimer": parsed_result.get("disclaimer", "Visual AI analysis cannot establish whether a structure is safe."),
                "is_demo_mode": False
            }
        except Exception as e:
            logger.warning(f"Error parsing AI crack response: {e}. Falling back to baseline.")
            data = generate_fallback_crack_analysis(structure_type, age_years, notes, measurements)

    response_obj = CrackAnalyzeResponse(
        observations=data["observations"],
        location_in_image=data["location_in_image"],
        crack_pattern=data["crack_pattern"],
        possible_causes=data["possible_causes"],
        suggested_next_steps=data["suggested_next_steps"],
        professional_inspection_warranted=data["professional_inspection_warranted"],
        urgency=data["urgency"],
        limitations=data["limitations"],
        disclaimer=data["disclaimer"],
        is_demo_mode=data["is_demo_mode"],
        image_url=image_url,
        structure_type=structure_type
    )

    return response_obj, saved_filename, image_url
