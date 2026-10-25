import logging
import uuid
import datetime
from typing import Dict, Any, List
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

SITE_ASSISTANT_SYSTEM_PROMPT = """
You are an expert Senior Site Construction Superintendent and Project Engineer.
Assist field engineers, project managers, and contractors with practical daily site operations:
- Material logistics, slump testing, rebar laps, curing duration.
- Quality control checklists, pour cards, inspection hold points.
- Daily progress log formatting, subcontractor task sequencing, and issue mitigation.

Always return a structured JSON object:
{
  "answer": "Concise, actionable direct answer for immediate site application.",
  "explanation": "Technical and procedural breakdown explaining the 'why' and standard method statement.",
  "recommended_next_steps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"],
  "caveats": ["Site-specific constraint or caveat 1", "Verification caveat 2"],
  "citations": ["Standard civil engineering practice / IS/ACI/BS guideline (only verified ones)"]
}
"""

KNOWLEDGE_ASSISTANT_SYSTEM_PROMPT = """
You are a Principal Civil Engineer and Construction Materials Scientist.
Answer questions regarding cement hydration, concrete mix design, structural mechanics, soil mechanics, QA/QC testing, building codes, and safety standards.

CONSTRAINTS:
- Structure response strictly as JSON with answer, explanation, recommended_next_steps, caveats, and citations.
- Do NOT invent fake building code clause numbers or claim legal compliance without verified authority.
- Clearly emphasize that regional jurisdiction codes (e.g. IBC, Eurocode, IS 456, OSHA) take legal precedence over general AI explanations.

Return JSON:
{
  "answer": "Clear, accurate engineering definition or answer.",
  "explanation": "Detailed technical exposition covering materials, chemistry, mechanics, or standards.",
  "recommended_next_steps": ["Engineering verification step 1", "Testing protocol 2"],
  "caveats": ["Crucial engineering limitation or code variation caveat"],
  "citations": ["Verified reference code or technical manual"]
}
"""

def generate_fallback_assistant_response(req: AssistantChatRequest) -> Dict[str, Any]:
    query_lower = req.message.lower()

    if "slump" in query_lower or "concrete" in query_lower or "curing" in query_lower:
        return {
            "answer": "Maintain water-cement ratio between 0.40 - 0.45, conduct standard ASTM C143 slump test, and cure continuously for minimum 7-14 days.",
            "explanation": "Concrete compressive strength depends heavily on the water-cementitious ratio and hydration completion. A standard slump for pumped structural slabs is 100-150 mm (with superplasticizer). Insufficient curing causes plastic shrinkage micro-cracking and loss of up to 40% surface abrasion resistance.",
            "recommended_next_steps": [
                "Verify batch delivery slip for batching timestamp; reject any mix in transit over 90 minutes without retarding admixture.",
                "Take 6 test cylinders/cubes per 50 cubic meters: test 3 at 7 days and 3 at 28 days.",
                "Ensure wet hessian cloth or chemical curing compound is applied immediately after final troweling."
            ],
            "caveats": [
                "Never add untracked water to the transit mixer drum on site to increase workability; use site-approved dosage of superplasticizer instead.",
                "High ambient temperatures (>35°C) require ice flakes or chilled water to prevent flash set."
            ],
            "citations": [
                "ACI 308R: Guide to External Curing of Concrete",
                "IS 456:2000 - Plain and Reinforced Concrete Code of Practice",
                "ASTM C143 - Standard Test Method for Slump of Hydraulic-Cement Concrete"
            ]
        }
    elif "rebar" in query_lower or "steel" in query_lower or "lap" in query_lower:
        return {
            "answer": "Standard development lap length for deformed tension bars is typically 40d to 50d (where d is bar diameter), with laps staggered across adjacent bars.",
            "explanation": "Rebar lap splices transfer stress from one bar to another via surrounding concrete bond shear. Lapping 100% of tensile reinforcement at maximum bending moment locations is prohibited by structural codes; laps must be staggered by at least 1.3 times the lap length.",
            "recommended_next_steps": [
                "Verify bar diameter and grade (e.g. Fe500D / Grade 60) against structural bar bending schedule (BBS).",
                "Ensure concrete cover blocks (25mm for slabs, 40mm for beams/columns, 50-75mm for foundations) are tied firmly with binding wire.",
                "Perform pre-pour rebar inspection walk with the client's structural clerk of works."
            ],
            "caveats": [
                "Do not weld high-yield deformed bars on site without certified welding procedure specifications (WPS).",
                "Tack welding is strictly prohibited due to localized brittleness and fatigue notch sensitivity."
            ],
            "citations": [
                "ACI 318 - Building Code Requirements for Structural Concrete",
                "IS 13920 - Ductile Design and Detailing of Reinforced Concrete Structures"
            ]
        }
    elif "safety" in query_lower or "ppe" in query_lower or "fall" in query_lower:
        return {
            "answer": "Enforce 100% mandatory PPE (Hard hat, Hi-Vis, Steel-toe boots, eye protection) and require certified 100% tie-off fall protection above 1.8 meters (6 feet).",
            "explanation": "Falls remain the leading cause of construction fatalities ('Fatal Four'). Open floor edges, floor penetrations, and scaffolding must feature engineered top rails (42\" ± 3\"), mid-rails (21\"), and toe-boards (3.5\"), or engineered personal fall arrest systems (PFAS) anchored to 5,000 lb rated points.",
            "recommended_next_steps": [
                "Inspect safety harnesses daily before use for frayed webbing, distorted D-rings, or deployed shock absorbers.",
                "Secure and cover all floor openings with material capable of supporting at least twice the anticipated load, labeled 'HOLE'.",
                "Issue immediate stop-work authority if unharnessed edge work is detected."
            ],
            "caveats": [
                "A standard body belt is illegal for fall arrest; only full-body harnesses are OSHA-compliant.",
                "Ensure adequate fall clearance distance including lanyard length, deceleration distance, and safety margin."
            ],
            "citations": [
                "OSHA 29 CFR 1926 Subpart M - Fall Protection",
                "ANSI/ASSP Z359 Fall Protection Code"
            ]
        }
    else:
        return {
            "answer": f"Consult the project execution plan and relevant structural specification for: '{req.message[:80]}'.",
            "explanation": "In construction project management, adherence to technical specifications, approved shop drawings, and site quality control protocols is essential to prevent rework, structural deficiencies, and schedule creep.",
            "recommended_next_steps": [
                "Review the project Request for Information (RFI) log to verify if this issue has prior formal engineering clarification.",
                "Cross-reference the architectural and MEP coordination drawings for inter-trade clash detection.",
                "Document site conditions in the Daily Progress Report (DPR) with dated photographs."
            ],
            "caveats": [
                "Verbal instructions from supervisors must be substantiated by a written Site Instruction (SI) or Architect's Instruction (AI).",
                "Local municipal building bye-laws and structural consultant directives always supersede generic AI guidelines."
            ],
            "citations": [
                "Project Management Institute (PMI) - Construction Extension to the PMBOK Guide",
                "FIDIC Conditions of Contract for Construction"
            ]
        }

async def process_assistant_chat(req: AssistantChatRequest) -> AssistantChatResponse:
    session_id = req.session_id or f"sess_{uuid.uuid4().hex[:10]}"
    sys_prompt = SITE_ASSISTANT_SYSTEM_PROMPT if req.context_type == "daily_site" else KNOWLEDGE_ASSISTANT_SYSTEM_PROMPT

    prompt = f"User Request: {req.message}\nContext: {req.context_type}\nRespond in the required strict JSON format."

    parsed_result, is_demo = ai_service.generate_json(
        prompt=prompt,
        system_instruction=sys_prompt
    )

    if not parsed_result or is_demo:
        data = generate_fallback_assistant_response(req)
        is_demo_mode = True
    else:
        try:
            data = parsed_result
            is_demo_mode = False
        except Exception as e:
            logger.warning(f"Error parsing assistant response: {e}. Falling back to baseline.")
            data = generate_fallback_assistant_response(req)
            is_demo_mode = True

    return AssistantChatResponse(
        answer=data.get("answer", "Actionable guidance provided."),
        explanation=data.get("explanation", ""),
        recommended_next_steps=data.get("recommended_next_steps", []),
        caveats=data.get("caveats", []),
        citations=data.get("citations", []),
        session_id=session_id,
        context_type=req.context_type,
        is_demo_mode=is_demo_mode,
        created_at=datetime.datetime.utcnow().isoformat()
    )
