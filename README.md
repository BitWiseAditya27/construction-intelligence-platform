# AI-Powered Multimodal Construction Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

An enterprise-grade multimodal decision-support platform designed for construction superintendents, project managers, civil engineers, and real estate professionals. The platform fuses computer vision, multimodal LLMs, geotechnical rule-engines, and live meteorological feeds to optimize construction site safety, diagnose concrete cracks, estimate property valuations, generate Work Breakdown Structure (WBS) schedules, and provide 24/7 site operational guidance.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React + Vite + Tailwind CSS)"]
        UI["Modern Dashboard & 10 Intelligence Modules"]
        AxiosClient["Centralized Axios API Client"]
        State["ProjectContext & Real-time State"]
        UI --> State
        State --> AxiosClient
    end

    subgraph Backend["FastAPI REST Backend (Python 3.11 / 3.13)"]
        Router["FastAPI Routers (/api/*)"]
        Security["Upload Sanitizer & CORS Gate"]
        Router --> Security

        subgraph Services["Core Domain Services Layer"]
            AIService["Multimodal AI Service (Google GenAI)"]
            SafetyService["Site Safety Vision Engine"]
            CrackService["Crack Forensic Diagnosis Engine"]
            ValuationService["Parametric Real Estate Valuation"]
            PlanningService["WBS Critical Path Planner"]
            WeatherService["Weather Workability Engine (Open-Meteo)"]
            AssistantService["Site & Engineering Copilot"]
        end

        Security --> Services

        subgraph Database["Database & Storage"]
            ORM["SQLAlchemy ORM 2.0"]
            SQLite[("SQLite Local / RDS Postgres")]
            Uploads[("Secure Uploads Storage")]
        end

        Services --> ORM
        ORM --> SQLite
        Services --> Uploads
    end

    AxiosClient -->|"HTTP / REST (JSON & Multipart)"| Router
```

---

## Intelligence Modules

| Module | Route | Inputs | Core Capability & Outputs |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/` | Aggregated telemetry | KPI stat cards, Recharts phase progress bar chart, hazard severity pie chart, recent multimodal scans, live site activity feed. |
| **Site Safety** | `/safety` | Site photograph (JPG/PNG/WEBP), project name, location, inspector notes | Multimodal hazard detection, PPE non-compliance, risk rating (Low/Medium/High/Critical), severity, corrective actions checklist, executive summary, and OSHA disclaimer. |
| **Crack Analysis** | `/cracks` | Close-up crack photo, structure type, age, measurements, observations | Structural morphology assessment, visual location, crack pattern (shear, settlement, shrinkage), engineering hypotheses, urgency (Immediate/Prompt/Monitor), and licensed PE inspection disclaimer. |
| **Valuation** | `/valuation` | Location, property type, built-up area, beds/baths, age, floor, amenities, condition, currency | Transparent econometric baseline valuation model calibrated with location benchmarks, depreciation curves, floor height premiums, and amenity stack valuation spread. |
| **Project Planner** | `/planning` | Project type, site area, budget, start & target dates, floors, materials, constraints | Phase-wise construction plan, suggested tasks with dependencies, duration per phase, budget share charts, milestones, and editable interactive task status toggles. |
| **Daily Site Assistant** | `/assistant` | Site query, project context, session ID | Conversational field engineering assistant for pour cards, slump tests, formwork stripping times, DPR formatting, and subcontractor coordination. |
| **Weather Advisory** | `/weather` | Location, planned construction activity, optional simulation parameters | Live weather integration via Open-Meteo (temp, humidity, wind, precipitation chance) mapped against trade safety thresholds (concrete pouring, crane picks, painting, excavation). |
| **Knowledge Assistant**| `/knowledge`| Technical civil engineering question | Engineering knowledge retrieval with answer, technical explanation, testing protocols, code caveats, and verified citations (ACI, IS, Eurocodes). |
| **Project History** | `/history` | Module filter, search query | Unified audit ledger of all saved inspections, crack reports, valuations, and plans. Includes modal inspector and record deletion. |
| **Settings & Telemetry**| `/settings` | System controls | Provider status, API key masking, live AI connectivity test endpoint, upload constraints, and AWS deployment roadmap. |

---

## Real AI vs. External APIs vs. Demo Baseline Mode

Transparency is a fundamental tenet of the platform:
1. **Multimodal AI (`google-genai` SDK)**: Used when an `AI_API_KEY` (or `GEMINI_API_KEY`) is configured in `backend/.env`. Image and prompt payloads are processed by Google Gemini (`gemini-2.5-flash`).
2. **External Weather API (Open-Meteo)**: Live real-world meteorological forecasts and geocoding are retrieved live across the globe without requiring an API key.
3. **Transparent Demo Baseline Mode**: If no AI API key is configured or if network calls timeout, the application executes **transparent, deterministic engineering rule engines**. Every screen explicitly flags baseline results with a `Demo Baseline Mode` badge and disclaimer. The platform **never fabricates** AI calls or comparable market sales.

---

## Quick Start (Windows)

### Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Node.js v18+ & npm 9+
- Git

### 1. Clone & Navigate
```powershell
cd C:\Users\py056\.gemini\antigravity\scratch\construction-intelligence-platform
```

### 2. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
*(Optional: Open `backend/.env` and insert your `AI_API_KEY=...` to enable live Gemini multimodal vision).*

Run backend development server:
```powershell
.\venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be accessible at: `http://localhost:8000` (Interactive Docs: `http://localhost:8000/docs`).

### 3. Frontend Setup
In a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`.

---

## Quick Start (Linux / macOS)

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Configuration

### Backend (`backend/.env`)
```ini
# AI Provider (Optional: runs in rich baseline demo mode if omitted)
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.5-flash

# Weather Configuration (Open-Meteo live free tier active by default)
WEATHER_PROVIDER=open-meteo
WEATHER_API_KEY=

# Database
DATABASE_URL=sqlite:///./construction_intelligence.db

# Storage & Upload Limits
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=15

# CORS Origins
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Running Automated Tests

### Backend Unit & Integration Tests (pytest)
```powershell
cd backend
.\venv\Scripts\pytest -v
```
Test coverage verifies:
- Health checks and system diagnostics
- Dashboard metrics and safety distribution aggregation
- Site safety multipart photo upload, dimension validation, and hazard generation
- Malicious extension rejection (.exe, .sh) and oversized file detection
- Crack morphology analysis and structural urgency triage
- Property valuation baseline calculations and currency conversions
- Construction project WBS generation, task status updates, and deletion
- Weather workability rules for high wind, precipitation, and thermal extremes
- Daily site assistant and knowledge engine structured responses
- Unified history persistence and record deletion

### Frontend Production Build Test
```powershell
cd frontend
npm run build
```

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, database connection, and AI provider status. |
| `GET` | `/api/dashboard/stats` | Aggregated metrics, progress charts, and recent activity. |
| `POST` | `/api/safety/analyze` | Upload site photo (multipart/form-data) for hazard inspection. |
| `GET` | `/api/safety/inspections` | Retrieve all persisted safety inspections. |
| `POST` | `/api/cracks/analyze` | Upload crack image (multipart/form-data) for forensic analysis. |
| `GET` | `/api/cracks/analyses` | Retrieve all persisted crack inspection records. |
| `POST` | `/api/valuation/estimate` | Compute parametric property valuation from structured inputs. |
| `GET` | `/api/valuation/estimates`| Retrieve past property valuations. |
| `POST` | `/api/planning/generate` | Generate phase-wise WBS construction schedule and tasks. |
| `GET` | `/api/planning` | Retrieve all construction plans. |
| `GET` | `/api/planning/{id}` | Retrieve specific plan with tasks. |
| `PATCH`| `/api/planning/{id}/tasks/{task_id}` | Update task status (`pending`, `in_progress`, `completed`). |
| `DELETE`|`/api/planning/{id}` | Permanently delete a construction plan. |
| `POST` | `/api/assistant/chat` | Chat with site assistant or knowledge engine. |
| `GET` | `/api/assistant/history/{session_id}` | Retrieve chat session history. |
| `GET` | `/api/weather/advisory` | Query weather workability advisory for location and activity. |
| `POST` | `/api/weather/advisory` | Query advisory with manual simulation parameters. |
| `GET` | `/api/history` | Filter unified audit records by module type and keyword. |
| `DELETE`|`/api/history/{id}` | Delete inspection or analysis record by ID. |
| `GET` | `/api/projects` | List all active construction projects. |
| `POST` | `/api/projects` | Register a new construction project workspace. |
| `GET` | `/api/settings` | Retrieve active system parameters and upload limits. |
| `POST` | `/api/settings/test-ai` | Trigger live AI provider connectivity diagnostic. |

---

## AWS Deployment Architecture

The platform is designed for scalable production deployment on AWS:

1. **Frontend Hosting**:
   - Built assets (`frontend/dist/`) deployed to an **Amazon S3** bucket configured for static web hosting.
   - **Amazon CloudFront** distribution with SSL (ACM certificate) providing edge caching and sub-100ms global latency.
   - Alternatively, continuous Git-based deployment via **AWS Amplify Hosting**.
2. **Backend Microservice**:
   - Containerized FastAPI service hosted on **AWS App Runner** or **Amazon ECS (Fargate)** with Auto Scaling (CPU/Memory triggers).
   - Application Load Balancer (ALB) terminating HTTPS and routing `/api/*` to the container service.
3. **Database Layer**:
   - **Amazon RDS for PostgreSQL** (Multi-AZ) configured by updating `DATABASE_URL=postgresql://user:pass@rds-host:5432/construction_db`.
4. **File & Image Storage**:
   - High-resolution construction photos stored in a private **Amazon S3** bucket using AWS SDK (`boto3`) and pre-signed URLs.
5. **Secret Management**:
   - LLM API keys (`AI_API_KEY`) and database credentials stored securely in **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**.

---

## Professional Limitations & Disclaimers

1. **Safety Compliance**: The AI safety monitoring tool assists human inspectors but cannot replace an OSHA/NEBOSH certified safety officer. Visual inspections cannot verify harness drop-test certifications, air quality, or electrical insulation resistance.
2. **Structural Health**: Crack analysis provides non-destructive preliminary hypothesis screening. A 2D photograph cannot establish structural safety, load-bearing reserve capacity, or internal rebar section loss. Direct physical inspection by a licensed Professional Structural Engineer (PE/SE) is required.
3. **Valuation Estimates**: Real estate estimates are algorithmic illustrative calculations based on benchmark city tiers and physical parameters. They do not constitute certified bank appraisals or legal title guarantees.
4. **Weather Information**: Meteorological advice is supplementary. On-site anemometer readings and superintendent safety determinations always take precedence.
