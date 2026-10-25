import io
import pytest

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data
    assert "ai_provider" in data

def test_dashboard_stats(client):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_projects" in data
    assert "site_inspections" in data
    assert "safety_distribution" in data
    assert "recent_analyses" in data

def test_safety_analyze_valid_image(client, sample_image_bytes):
    response = client.post(
        "/api/safety/analyze",
        data={
            "project_name": "Test Hospital Tower",
            "location": "North Wing Core",
            "notes": "Testing safety hazards on level 4"
        },
        files={"file": ("site.jpg", sample_image_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["overall_risk"] in ["Low", "Medium", "High", "Critical"]
    assert len(data["hazards"]) > 0
    assert "image_url" in data
    assert data["inspection_id"] is not None

def test_safety_analyze_invalid_extension(client):
    response = client.post(
        "/api/safety/analyze",
        data={"project_name": "Invalid File Test"},
        files={"file": ("malicious.exe", b"fake binary payload", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["message"]

def test_crack_analyze_valid_image(client, sample_image_bytes):
    response = client.post(
        "/api/cracks/analyze",
        data={
            "structure_type": "Beam",
            "age_years": "3.5",
            "measurements": "1.5mm width",
            "notes": "Near exterior column joint"
        },
        files={"file": ("crack.png", sample_image_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["urgency"] in ["Immediate", "Prompt", "Monitor"]
    assert len(data["possible_causes"]) > 0
    assert "disclaimer" in data
    assert data["analysis_id"] is not None

def test_property_valuation_calculation(client):
    req_payload = {
        "location": "Bandra, Mumbai",
        "property_type": "Apartment",
        "built_up_area": 1200.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "age_years": 2.0,
        "floor_number": 5,
        "amenities": ["Gym", "Swimming Pool", "24x7 Security"],
        "condition": "Excellent",
        "currency": "INR"
    }
    response = client.post("/api/valuation/estimate", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["estimated_mid_value"] > 0
    assert data["price_per_sqft"] > 0
    assert len(data["factors"]) > 0
    assert data["valuation_id"] is not None

def test_construction_planning_workflow(client):
    plan_payload = {
        "project_name": "Test Industrial Warehouse",
        "project_type": "Industrial",
        "site_area": 25000.0,
        "estimated_budget": 50000000.0,
        "start_date": "2026-03-01",
        "target_completion_date": "2026-11-30",
        "floors": 1,
        "material_preferences": "Pre-engineered steel building (PEB)",
        "constraints": "Strict monsoon deadline"
    }
    # 1. Generate plan
    res = client.post("/api/planning/generate", json=plan_payload)
    assert res.status_code == 200
    plan_data = res.json()
    plan_id = plan_data["plan_id"]
    assert plan_id > 0
    assert len(plan_data["phases"]) > 0
    assert len(plan_data["tasks"]) > 0

    first_task = plan_data["tasks"][0]
    task_id = first_task["id"]

    # 2. Update task status
    update_res = client.patch(
        f"/api/planning/{plan_id}/tasks/{task_id}",
        json={"status": "in_progress"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "in_progress"

    # 3. Retrieve plan
    get_res = client.get(f"/api/planning/{plan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["plan_id"] == plan_id

def test_weather_advisory(client):
    res = client.get("/api/weather/advisory?location=Mumbai&activity=Concrete%20Pouring")
    assert res.status_code == 200
    data = res.json()
    assert data["operational_status"] in ["optimal", "caution", "adverse"]
    assert len(data["specific_recommendations"]) > 0
    assert "disclaimer" in data

def test_weather_advisory_manual_override(client):
    payload = {
        "location": "Custom Site Zone",
        "activity": "Exterior Painting",
        "manual_override": {
            "temperature_c": 39.0,
            "humidity_percent": 88,
            "wind_speed_kmh": 15.0,
            "condition": "Humid / Threat of Drizzle",
            "precipitation_probability": 75
        }
    }
    res = client.post("/api/weather/advisory", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["operational_status"] == "adverse"
    assert data["is_live_data"] is False

def test_assistant_chat(client):
    chat_payload = {
        "message": "What is the recommended concrete curing procedure for hot weather?",
        "context_type": "daily_site"
    }
    res = client.post("/api/assistant/chat", json=chat_payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "explanation" in data
    assert len(data["recommended_next_steps"]) > 0
    assert "session_id" in data

def test_history_list_and_delete(client):
    # Retrieve history items
    res = client.get("/api/history")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
