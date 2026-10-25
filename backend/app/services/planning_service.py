import logging
import datetime
from typing import Dict, Any, List
from app.schemas.planning import (
    PlanGenerateRequest,
    PlanResponse,
    PhaseItem,
    TaskItem,
    MilestoneItem,
    RiskItem
)
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

PLANNING_PROMPT = """
You are an expert Project Management Professional (PMP) and Chief Construction Planner.
Generate a structured, professional Work Breakdown Structure (WBS) and Critical Path Schedule for a construction project.

Project Parameters:
- Project Name: {project_name}
- Typology: {project_type}
- Site Footprint: {site_area} sq ft
- Total Budget: {budget}
- Timeline: From {start_date} to {target_completion_date}
- Floors: {floors}
- Material Preferences: {materials}
- Constraints: {constraints}

Return a strict JSON object with:
{{
  "total_duration_weeks": 36,
  "phases": [
    {{
      "name": "Phase 1: Pre-Construction & Permitting",
      "duration_days": 30,
      "budget_share_percent": 8.0,
      "estimated_cost": 80000.0,
      "key_deliverables": ["Architectural sign-off", "Soil testing report", "Municipal building permit"]
    }},
    {{
      "name": "Phase 2: Substructure & Foundation",
      "duration_days": 45,
      "budget_share_percent": 22.0,
      "estimated_cost": 220000.0,
      "key_deliverables": ["Site excavation", "Retaining walls", "Footings and plinth beam casting"]
    }},
    {{
      "name": "Phase 3: Superstructure Frame",
      "duration_days": 60,
      "budget_share_percent": 30.0,
      "estimated_cost": 300000.0,
      "key_deliverables": ["RCC columns", "Floor slabs", "Stairwell cores"]
    }},
    {{
      "name": "Phase 4: MEP & Infill Masonry",
      "duration_days": 50,
      "budget_share_percent": 25.0,
      "estimated_cost": 250000.0,
      "key_deliverables": ["Blockwork masonry", "Electrical rough-ins", "Plumbing riser lines", "HVAC ducting"]
    }},
    {{
      "name": "Phase 5: Finishes & Commissioning",
      "duration_days": 35,
      "budget_share_percent": 15.0,
      "estimated_cost": 150000.0,
      "key_deliverables": ["Flooring", "Internal/External paint", "Fixture installation", "Occupancy certificate audit"]
    }}
  ],
  "tasks": [
    {{
      "phase_name": "Phase 1: Pre-Construction & Permitting",
      "title": "Geotechnical Soil Borehole Testing",
      "description": "Extract SPT samples across 4 site corners to verify bearing capacity",
      "duration_days": 7,
      "start_day": 1,
      "end_day": 7,
      "dependencies": [],
      "status": "pending",
      "budget_share": 12000.0,
      "resources_needed": "Geotech drilling rig, certified soil technician"
    }},
    {{
      "phase_name": "Phase 1: Pre-Construction & Permitting",
      "title": "Structural & MEP Engineering Drawings Approval",
      "description": "Coordinate structural peer review and submit for town planning sanction",
      "duration_days": 18,
      "start_day": 8,
      "end_day": 25,
      "dependencies": ["Geotechnical Soil Borehole Testing"],
      "status": "pending",
      "budget_share": 35000.0,
      "resources_needed": "Licensed structural consultant, BIM coordinator"
    }},
    {{
      "phase_name": "Phase 2: Substructure & Foundation",
      "title": "Bulk Earthwork & Foundation Excavation",
      "description": "Excavate to -3.5m formation level with safe benching and dewatering",
      "duration_days": 14,
      "start_day": 26,
      "end_day": 39,
      "dependencies": ["Structural & MEP Engineering Drawings Approval"],
      "status": "pending",
      "budget_share": 55000.0,
      "resources_needed": "20T Tracked Excavator, 4 Tipper Trucks, Dewatering pumps"
    }},
    {{
      "phase_name": "Phase 2: Substructure & Foundation",
      "title": "PCC Bedding & Isolated Raft Reinforcement",
      "description": "Pour M10 grade mud mat and tie Fe500D rebar grid for foundation footings",
      "duration_days": 16,
      "start_day": 40,
      "end_day": 55,
      "dependencies": ["Bulk Earthwork & Foundation Excavation"],
      "status": "pending",
      "budget_share": 110000.0,
      "resources_needed": "Steel bar benders crew, Ready-Mix Concrete pump"
    }},
    {{
      "phase_name": "Phase 3: Superstructure Frame",
      "title": "Ground & Upper Floor RCC Casting",
      "description": "Formwork shuttering, rebar tying, and M30 grade concrete pour with cube sampling",
      "duration_days": 40,
      "start_day": 56,
      "end_day": 95,
      "dependencies": ["PCC Bedding & Isolated Raft Reinforcement"],
      "status": "pending",
      "budget_share": 240000.0,
      "resources_needed": "Tower crane / Boom placer, shuttering carpentry gang"
    }},
    {{
      "phase_name": "Phase 4: MEP & Infill Masonry",
      "title": "Autoclaved Aerated Concrete (AAC) Block Masonry",
      "description": "Erect perimeter and demising walls using polymer thin-bed adhesive mortar",
      "duration_days": 25,
      "start_day": 96,
      "end_day": 120,
      "dependencies": ["Ground & Upper Floor RCC Casting"],
      "status": "pending",
      "budget_share": 140000.0,
      "resources_needed": "Masonry crew, AAC block cutters"
    }},
    {{
      "phase_name": "Phase 4: MEP & Infill Masonry",
      "title": "Concealed Plumbing & Electrical Conduit Rerouting",
      "description": "Wall chasing and embedment of CPVC pressure pipes and heavy-gauge conduits",
      "duration_days": 20,
      "start_day": 110,
      "end_day": 130,
      "dependencies": ["Autoclaved Aerated Concrete (AAC) Block Masonry"],
      "status": "pending",
      "budget_share": 90000.0,
      "resources_needed": "Master electricians, certified plumbers"
    }},
    {{
      "phase_name": "Phase 5: Finishes & Commissioning",
      "title": "Internal Plaster, Tile Flooring & Priming",
      "description": "Gypsum skim plastering, vitrified tile laying, and anti-efflorescence wall primer",
      "duration_days": 25,
      "start_day": 131,
      "end_day": 155,
      "dependencies": ["Concealed Plumbing & Electrical Conduit Rerouting"],
      "status": "pending",
      "budget_share": 110000.0,
      "resources_needed": "Tiling specialists, painting contractors"
    }},
    {{
      "phase_name": "Phase 5: Finishes & Commissioning",
      "title": "Final Testing, Commissioning & Handover Inspection",
      "description": "Pressure test plumbing lines, megger test circuits, and snag list verification",
      "duration_days": 10,
      "start_day": 156,
      "end_day": 165,
      "dependencies": ["Internal Plaster, Tile Flooring & Priming"],
      "status": "pending",
      "budget_share": 20000.0,
      "resources_needed": "QA/QC lead inspector, Client liaison"
    }}
  ],
  "milestones": [
    {{"title": "Statutory Approvals Secured", "day": 25, "description": "All civil municipal clearances issued"}},
    {{"title": "Plinth Level Achieved", "day": 55, "description": "Substructure backfilled and plinth beams cast"}},
    {{"title": "Structural Topping Out", "day": 95, "description": "Final roof slab poured and cured"}},
    {{"title": "Lock-In Phase Completed", "day": 130, "description": "Building envelope weathertight and rough-ins signed off"}},
    {{"title": "Final Handover & Snag Cleared", "day": 165, "description": "Project ready for occupancy certificate"}}
  ],
  "risks": [
    {{"risk": "Monsoon rain or water table rise halting foundation work", "severity": "High", "mitigation": "Deploy backup submersible pumps and fast-track sub-base drainage"}},
    {{"risk": "Supply chain delay in cement or structural steel delivery", "severity": "Medium", "mitigation": "Maintain a 14-day rolling buffer inventory on site"}},
    {{"risk": "Labor shortages during regional agricultural or festival periods", "severity": "Medium", "mitigation": "Establish incentive agreements with primary labor subcontractors"}}
  ]
}}
"""

def generate_baseline_construction_plan(req: PlanGenerateRequest) -> Dict[str, Any]:
    """Generates a realistic rule-based baseline construction plan."""
    budget = req.estimated_budget
    area = req.site_area
    floors = max(1, req.floors)

    phase1_cost = round(budget * 0.08, 2)
    phase2_cost = round(budget * 0.22, 2)
    phase3_cost = round(budget * 0.32, 2)
    phase4_cost = round(budget * 0.23, 2)
    phase5_cost = round(budget * 0.15, 2)

    return {
        "total_duration_weeks": 24 + (floors * 4),
        "phases": [
            {
                "name": "Phase 1: Pre-Construction & Permitting",
                "duration_days": 25,
                "budget_share_percent": 8.0,
                "estimated_cost": phase1_cost,
                "key_deliverables": ["Site boundary survey", "Soil bearing capacity test", "Local municipal sanctions"]
            },
            {
                "name": "Phase 2: Substructure & Foundation",
                "duration_days": 35,
                "budget_share_percent": 22.0,
                "estimated_cost": phase2_cost,
                "key_deliverables": ["Site grading & excavation", "Anti-termite treatment", "Foundation footings casting"]
            },
            {
                "name": "Phase 3: Superstructure Frame",
                "duration_days": 30 + (floors * 12),
                "budget_share_percent": 32.0,
                "estimated_cost": phase3_cost,
                "key_deliverables": [f"RCC columns & beams for {floors} levels", "Suspended slab formwork & casting", "Curing cycles"]
            },
            {
                "name": "Phase 4: MEP & Enclosure",
                "duration_days": 35,
                "budget_share_percent": 23.0,
                "estimated_cost": phase4_cost,
                "key_deliverables": ["AAC masonry walls", "Concealed electrical conduit & plumbing lines", "Door/window frames"]
            },
            {
                "name": "Phase 5: Finishes & Handover",
                "duration_days": 25,
                "budget_share_percent": 15.0,
                "estimated_cost": phase5_cost,
                "key_deliverables": ["Vitrified flooring", "Interior & exterior paint", "Fixture installation & commissioning"]
            }
        ],
        "tasks": [
            {
                "phase_name": "Phase 1: Pre-Construction & Permitting",
                "title": "Boundary Survey & Geotechnical Soil Testing",
                "description": f"Standard borehole sampling and total station survey for {area} sq ft site",
                "duration_days": 8,
                "start_day": 1,
                "end_day": 8,
                "dependencies": [],
                "status": "pending",
                "budget_share": round(phase1_cost * 0.35, 2),
                "resources_needed": "Survey team, soil testing rig"
            },
            {
                "phase_name": "Phase 1: Pre-Construction & Permitting",
                "title": "Architectural & Structural Vetting",
                "description": "Finalize working drawings, structural calculation sheets, and municipal filing",
                "duration_days": 16,
                "start_day": 9,
                "end_day": 24,
                "dependencies": ["Boundary Survey & Geotechnical Soil Testing"],
                "status": "pending",
                "budget_share": round(phase1_cost * 0.65, 2),
                "resources_needed": "Architect, structural engineer"
            },
            {
                "phase_name": "Phase 2: Substructure & Foundation",
                "title": "Site Excavation & Dewatering",
                "description": "Bulk earthwork excavation to bedrock or design footing depth",
                "duration_days": 12,
                "start_day": 25,
                "end_day": 36,
                "dependencies": ["Architectural & Structural Vetting"],
                "status": "pending",
                "budget_share": round(phase2_cost * 0.40, 2),
                "resources_needed": "Excavator, tipper trucks, trash pump"
            },
            {
                "phase_name": "Phase 2: Substructure & Foundation",
                "title": "PCC Bedding & Footings Reinforcement Pour",
                "description": "Plain cement concrete base followed by steel mat placement and M25 pour",
                "duration_days": 18,
                "start_day": 37,
                "end_day": 54,
                "dependencies": ["Site Excavation & Dewatering"],
                "status": "pending",
                "budget_share": round(phase2_cost * 0.60, 2),
                "resources_needed": "Bar benders, concrete transit mixers"
            },
            {
                "phase_name": "Phase 3: Superstructure Frame",
                "title": f"RCC Columns & Floor Slabs ({floors} Floors)",
                "description": f"Formwork erection, high-yield rebar placement, and slab casting across {floors} storeys",
                "duration_days": 30 + (floors * 10),
                "start_day": 55,
                "end_day": 55 + 30 + (floors * 10),
                "dependencies": ["PCC Bedding & Footings Reinforcement Pour"],
                "status": "pending",
                "budget_share": phase3_cost,
                "resources_needed": "Scaffolding system, boom concrete placer, carpenters"
            },
            {
                "phase_name": "Phase 4: MEP & Enclosure",
                "title": "Blockwork Walls & Waterproofing",
                "description": "Perimeter masonry, damp-proof course, and terrace waterproofing membrane",
                "duration_days": 20,
                "start_day": 55 + 30 + (floors * 10) + 1,
                "end_day": 55 + 30 + (floors * 10) + 20,
                "dependencies": [f"RCC Columns & Floor Slabs ({floors} Floors)"],
                "status": "pending",
                "budget_share": round(phase4_cost * 0.55, 2),
                "resources_needed": "Masonry gang, waterproofing crew"
            },
            {
                "phase_name": "Phase 4: MEP & Enclosure",
                "title": "Concealed Plumbing & Electrical Chasing",
                "description": "Wall chases, PVC conduits, water lines, and drainage vertical stacks",
                "duration_days": 15,
                "start_day": 55 + 30 + (floors * 10) + 10,
                "end_day": 55 + 30 + (floors * 10) + 25,
                "dependencies": ["Blockwork Walls & Waterproofing"],
                "status": "pending",
                "budget_share": round(phase4_cost * 0.45, 2),
                "resources_needed": "Electricians, plumbers"
            },
            {
                "phase_name": "Phase 5: Finishes & Handover",
                "title": "Tiling, Painting, Carpentry & Fixtures",
                "description": "Internal floor tiles, premium emulsion paint, sanitaryware & switchplates",
                "duration_days": 20,
                "start_day": 55 + 30 + (floors * 10) + 26,
                "end_day": 55 + 30 + (floors * 10) + 45,
                "dependencies": ["Concealed Plumbing & Electrical Chasing"],
                "status": "pending",
                "budget_share": round(phase5_cost * 0.75, 2),
                "resources_needed": "Tile layers, painters, finish carpenters"
            },
            {
                "phase_name": "Phase 5: Finishes & Handover",
                "title": "Snag List Resolution & Final Handover",
                "description": "Multi-trade snagging inspection, line pressure checks, and handover documentation",
                "duration_days": 7,
                "start_day": 55 + 30 + (floors * 10) + 46,
                "end_day": 55 + 30 + (floors * 10) + 52,
                "dependencies": ["Tiling, Painting, Carpentry & Fixtures"],
                "status": "pending",
                "budget_share": round(phase5_cost * 0.25, 2),
                "resources_needed": "Project engineer, QA/QC manager"
            }
        ],
        "milestones": [
            {"title": "Mobilization & Permits", "day": 24, "description": "Site perimeter secured and civil permissions active"},
            {"title": "Plinth Beam Completion", "day": 54, "description": "Substructure fully poured and tied"},
            {"title": "Superstructure Slab Topping", "day": 55 + 30 + (floors * 10), "description": "All floors completed to roof level"},
            {"title": "Lock-In Shell Waterproofed", "day": 55 + 30 + (floors * 10) + 20, "description": "Building protected from weather intrusion"},
            {"title": "Full Commissioning & Handover", "day": 55 + 30 + (floors * 10) + 52, "description": "Fit for occupancy"}
        ],
        "risks": [
            {"risk": "Adverse weather interrupting slab curing or deep excavation", "severity": "High", "mitigation": "Install tarpaulin canopies and verify dewatering pump readiness"},
            {"risk": "Material price fluctuations in rebar and cement", "severity": "Medium", "mitigation": "Lock in supply contracts with suppliers or maintain steel price hedging"},
            {"risk": "Subcontractor timeline slippage during MEP stage", "severity": "Medium", "mitigation": "Establish daily coordination standups and milestone retention bonuses"}
        ]
    }

async def generate_construction_plan(req: PlanGenerateRequest) -> PlanResponse:
    prompt = PLANNING_PROMPT.format(
        project_name=req.project_name,
        project_type=req.project_type,
        site_area=req.site_area,
        budget=req.estimated_budget,
        start_date=req.start_date,
        target_completion_date=req.target_completion_date,
        floors=req.floors,
        materials=req.material_preferences or "Standard Grade",
        constraints=req.constraints or "Standard working hours"
    )

    parsed_result, is_demo = ai_service.generate_json(prompt=prompt)
    if not parsed_result or is_demo:
        data = generate_baseline_construction_plan(req)
        is_demo_mode = True
    else:
        try:
            data = parsed_result
            is_demo_mode = False
        except Exception as e:
            logger.warning(f"Error parsing AI plan: {e}. Falling back to baseline.")
            data = generate_baseline_construction_plan(req)
            is_demo_mode = True

    phases = [
        PhaseItem(
            name=p.get("name", "Phase"),
            duration_days=p.get("duration_days", 15),
            budget_share_percent=p.get("budget_share_percent", 20.0),
            estimated_cost=p.get("estimated_cost", req.estimated_budget * 0.2),
            key_deliverables=p.get("key_deliverables", [])
        )
        for p in data.get("phases", [])
    ]

    tasks = [
        TaskItem(
            phase_name=t.get("phase_name", "General"),
            title=t.get("title", "Task"),
            description=t.get("description"),
            duration_days=t.get("duration_days", 5),
            start_day=t.get("start_day", 1),
            end_day=t.get("end_day", 5),
            dependencies=t.get("dependencies", []),
            status="pending",
            budget_share=t.get("budget_share", 0.0),
            resources_needed=t.get("resources_needed")
        )
        for t in data.get("tasks", [])
    ]

    milestones = [
        MilestoneItem(
            title=m.get("title", "Milestone"),
            day=m.get("day", 1),
            description=m.get("description", "")
        )
        for m in data.get("milestones", [])
    ]

    risks = [
        RiskItem(
            risk=r.get("risk", "Operational risk"),
            severity=r.get("severity", "Medium"),
            mitigation=r.get("mitigation", "Monitor daily")
        )
        for r in data.get("risks", [])
    ]

    disclaimer = (
        "PLANNING ESTIMATE DISCLAIMER: Schedules, task durations, and cost allocations are algorithmic planning baselines. "
        "A certified Project Management Professional (PMP) or Chartered Civil Engineer must conduct an on-site feasibility "
        "and procurement review prior to contractual commitments."
    )

    return PlanResponse(
        plan_id=0,  # Will be assigned upon DB persist
        project_name=req.project_name,
        project_type=req.project_type,
        site_area=req.site_area,
        estimated_budget=req.estimated_budget,
        start_date=req.start_date,
        target_completion_date=req.target_completion_date,
        total_duration_weeks=data.get("total_duration_weeks", 30),
        phases=phases,
        tasks=tasks,
        milestones=milestones,
        risks=risks,
        is_demo_mode=is_demo_mode,
        disclaimer=disclaimer
    )
