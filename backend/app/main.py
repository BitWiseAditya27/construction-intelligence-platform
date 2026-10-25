import os
import json
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.base import Base
from app.db.session import engine, SessionLocal
import app.models  # Ensure all models are registered
from app.models.project import Project
from app.models.safety import SafetyInspection
from app.models.crack import CrackAnalysis
from app.models.valuation import PropertyValuation
from app.models.planning import ConstructionPlan, ConstructionTask

from app.api.routes import (
    health,
    dashboard,
    safety,
    cracks,
    valuation,
    planning,
    assistant,
    weather,
    history,
    projects,
    settings as settings_route
)

setup_logging()
logger = logging.getLogger("construction_platform")

def seed_sample_data_if_empty():
    db = SessionLocal()
    try:
        project_count = db.query(Project).count()
        if project_count == 0:
            logger.info("Database is fresh. Seeding sample construction projects and baseline records...")
            # 1. Sample Projects
            p1 = Project(
                name="Skyline Horizon Commercial Tower",
                location="Worli, Mumbai",
                client_name="Horizon Infra Holdings",
                description="42-storey mixed-use commercial and grade-A office development with 3-level basement.",
                budget=285000000.0,
                status="active",
                start_date="2026-02-15",
                completion_date="2027-12-30"
            )
            p2 = Project(
                name="Greenfield Eco-Residences",
                location="Whitefield, Bengaluru",
                client_name="Greenfield Living Ltd",
                description="G+14 sustainable residential enclave with IGBC Platinum pre-certification.",
                budget=142000000.0,
                status="active",
                start_date="2026-04-01",
                completion_date="2027-08-15"
            )
            db.add_all([p1, p2])
            db.commit()
            db.refresh(p1)
            db.refresh(p2)

            # 2. Sample Safety Inspection
            s1 = SafetyInspection(
                project_id=p1.id,
                project_name=p1.name,
                location="Level 14 Slab Edge - East Wing",
                inspector_notes="Routine afternoon field scan of edge formwork and rebar gang.",
                image_filename="sample_safety_inspection.jpg",
                image_url="/assets/hero-CLDdwZDr.png",
                overall_risk="High",
                severity="High edge fall hazard and uncurbed perimeter opening detected",
                observations=json.dumps([
                    "Active formwork erection on elevated cantilevered slab",
                    "Workers operating within 1.2m of leading perimeter edge",
                    "Safety net installed 2 floors below, but temporary top guardrail missing on active deck"
                ]),
                hazards=json.dumps([
                    {
                        "hazard": "Missing Perimeter Guardrail on Leading Edge",
                        "severity": "Critical",
                        "location": "North-East slab corner",
                        "recommendation": "Install rigid steel post guardrail with 42-inch top rail and 21-inch mid rail immediately."
                    },
                    {
                        "hazard": "Worker Without 100% Tie-Off Lanyard",
                        "severity": "High",
                        "location": "Slab edge beam formwork",
                        "recommendation": "Enforce mandatory connection to certified static horizontal lifeline."
                    }
                ]),
                recommended_actions=json.dumps([
                    "Halt perimeter activities until edge protection barriers are verified by the safety superintendent.",
                    "Conduct a mandatory morning toolbox talk on leading-edge fall protection."
                ]),
                summary="Elevated edge work requires immediate guardrail reinforcement and harness tie-off verification before concrete pour.",
                limitations="Visual screening cannot assess subsurface anchor torque or static lifeline test load certifications.",
                disclaimer="ADVISORY FINDINGS ONLY: Visual AI inspection must be confirmed by certified on-site safety personnel.",
                is_demo_mode=True
            )
            db.add(s1)

            # 3. Sample Crack Analysis
            c1 = CrackAnalysis(
                project_id=p1.id,
                structure_type="Beam",
                age_years="1.5",
                measurements="Width ~1.2mm, length ~800mm",
                notes="Observed near column-beam junction on basement level 2.",
                image_filename="sample_crack_shear.jpg",
                image_url="/assets/hero-CLDdwZDr.png",
                observations=json.dumps([
                    "Inclined diagonal hairline fracture propagating at roughly 45 degrees near support face",
                    "No visible water seepage or rust efflorescence staining along fracture margins",
                    "Concrete surface shows standard formwork tie impressions"
                ]),
                location_in_image="Lower third of transfer beam adjacent to shear wall connection",
                crack_pattern="Diagonal shear fracture pattern",
                possible_causes=json.dumps([
                    "Hypothesis A: Principal diagonal tension stresses exceeding shear stirrup design threshold",
                    "Hypothesis B: Thermal contraction during initial mass concrete hydration",
                    "Hypothesis C: Minor localized differential settlement of adjacent pile cap"
                ]),
                suggested_next_steps=json.dumps([
                    "Install precision optical tell-tale crack width monitor to track cyclic movement",
                    "Commission non-destructive ultrasonic pulse velocity (UPV) testing",
                    "Request licensed structural engineer peer review before adding superimposed live loads"
                ]),
                professional_inspection_warranted=True,
                urgency="Immediate",
                limitations="2D photographic assessment cannot establish internal rebar strain or subsurface void depth.",
                disclaimer="Screening hypothesis only. Cannot certify structural capacity. Licensed structural engineer inspection required.",
                is_demo_mode=True
            )
            db.add(c1)

            # 4. Sample Valuation
            v1 = PropertyValuation(
                project_id=p2.id,
                location="Whitefield, Bengaluru",
                property_type="Apartment",
                built_up_area=1850.0,
                bedrooms=3,
                bathrooms=3,
                age_years=1.0,
                floor_number=8,
                amenities=json.dumps(["Clubhouse", "Swimming Pool", "24/7 Security", "Covered Parking", "Solar Water"]),
                condition="New",
                currency="INR",
                estimated_min_value=17500000.0,
                estimated_max_value=21500000.0,
                estimated_mid_value=19250000.0,
                price_per_sqft=10405.0,
                factors=json.dumps([
                    "Tier-1 Bengaluru IT hub location benchmark",
                    "New condition grade with 0% depreciation",
                    "Mid-high floor elevation premium",
                    "Full premium amenity stack"
                ]),
                assumptions=json.dumps([
                    "Freehold title with clear RERA registration",
                    "Standard super-built-up loading of 24%"
                ]),
                confidence_limitations="Statistical baseline estimate. Certified registered valuer appraisal required for lending.",
                suggested_additional_info=json.dumps([
                    "Verified carpet area from registered deed",
                    "Monthly society maintenance levy"
                ]),
                is_demo_mode=True
            )
            db.add(v1)

            # 5. Sample Construction Plan
            plan1 = ConstructionPlan(
                project_id=p1.id,
                project_name=p1.name,
                project_type="Commercial",
                site_area=45000.0,
                estimated_budget=285000000.0,
                start_date="2026-02-15",
                target_completion_date="2027-12-30",
                floors=42,
                total_duration_weeks=98,
                phases=json.dumps([
                    {"name": "Phase 1: Mobilization & Piling", "duration_days": 60, "budget_share_percent": 12.0, "estimated_cost": 34200000.0, "key_deliverables": ["Bored cast-in-situ piles", "Diaphragm wall"]},
                    {"name": "Phase 2: Basement & Raft", "duration_days": 90, "budget_share_percent": 24.0, "estimated_cost": 68400000.0, "key_deliverables": ["Raft foundation pour", "3-level basement RCC"]},
                    {"name": "Phase 3: Core & Tower Frame", "duration_days": 210, "budget_share_percent": 34.0, "estimated_cost": 96900000.0, "key_deliverables": ["Jump-form central core", "Post-tensioned floor slabs"]},
                    {"name": "Phase 4: Glazing & Enclosure", "duration_days": 120, "budget_share_percent": 18.0, "estimated_cost": 51300000.0, "key_deliverables": ["Unitized curtain wall", "Firestopping"]},
                    {"name": "Phase 5: MEP & Commissioning", "duration_days": 90, "budget_share_percent": 12.0, "estimated_cost": 34200000.0, "key_deliverables": ["Elevator banks", "HVAC chillers", "BEE 5-star commissioning"]}
                ]),
                milestones=json.dumps([
                    {"title": "Diaphragm Wall Keyed", "day": 45, "description": "Basement excavation pit retained safely"},
                    {"title": "Raft Pour 4000m3 Cast", "day": 120, "description": "Continuous mass pour completed"},
                    {"title": "Tower Topping Out", "day": 360, "description": "Roof level structural completion"}
                ]),
                risks=json.dumps([
                    {"risk": "Groundwater ingress during basement excavation", "severity": "High", "mitigation": "Install continuous wellpoint dewatering system"},
                    {"risk": "High wind restrictions on tower crane lifts above 150m", "severity": "Medium", "mitigation": "Equip cranes with real-time anemometers and scheduling window buffers"}
                ]),
                is_demo_mode=True
            )
            db.add(plan1)
            db.commit()
            db.refresh(plan1)

            # Sample Tasks
            t1 = ConstructionTask(
                plan_id=plan1.id,
                phase_name="Phase 1: Mobilization & Piling",
                title="Geotechnical Static Load Pile Test",
                description="Perform 1200T static load test on 2 sacrificial test piles",
                duration_days=15,
                start_day=1,
                end_day=15,
                dependencies=json.dumps([]),
                status="completed",
                budget_share=4500000.0,
                resources_needed="Hydraulic jack assembly, dial gauges"
            )
            t2 = ConstructionTask(
                plan_id=plan1.id,
                phase_name="Phase 1: Mobilization & Piling",
                title="Diaphragm Wall Trench Cutter Excavation",
                description="800mm thick reinforced concrete perimeter retaining barrier",
                duration_days=45,
                start_day=16,
                end_day=60,
                dependencies=json.dumps(["Geotechnical Static Load Pile Test"]),
                status="in_progress",
                budget_share=29700000.0,
                resources_needed="Hydromill cutter, bentonite recycling plant"
            )
            t3 = ConstructionTask(
                plan_id=plan1.id,
                phase_name="Phase 2: Basement & Raft",
                title="Mass Raft Concrete Pour (M50 Grade)",
                description="Low heat Portland slag cement mass pour with temperature logging sensors",
                duration_days=20,
                start_day=61,
                end_day=80,
                dependencies=json.dumps(["Diaphragm Wall Trench Cutter Excavation"]),
                status="pending",
                budget_share=35000000.0,
                resources_needed="3 boom placers, 24 transit mixers"
            )
            db.add_all([t1, t2, t3])
            db.commit()

            logger.info("Sample construction data seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    Base.metadata.create_all(bind=engine)
    seed_sample_data_if_empty()
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack AI-powered multimodal platform for construction site safety, crack diagnosis, property valuation, scheduling, and engineering knowledge.",
    lifespan=lifespan
)

# CORS Middleware
origins = [settings.FRONTEND_ORIGIN] + settings.ADDITIONAL_CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
upload_dir_path = Path(settings.UPLOAD_DIR).resolve()
upload_dir_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir_path)), name="uploads")

# Mount Routers
api_v1 = settings.API_V1_STR
app.include_router(health.router, prefix=api_v1)
app.include_router(dashboard.router, prefix=api_v1)
app.include_router(safety.router, prefix=api_v1)
app.include_router(cracks.router, prefix=api_v1)
app.include_router(valuation.router, prefix=api_v1)
app.include_router(planning.router, prefix=api_v1)
app.include_router(assistant.router, prefix=api_v1)
app.include_router(weather.router, prefix=api_v1)
app.include_router(history.router, prefix=api_v1)
app.include_router(projects.router, prefix=api_v1)
app.include_router(settings_route.router, prefix=api_v1)

# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Input data failed schema validation.",
            "details": exc.errors()
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Request Failed",
            "message": exc.detail
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing your request. Please try again."
        }
    )

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "operational",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
