from typing import List, Dict, Any
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    total_projects: int
    site_inspections: int
    safety_issues: int
    properties_analyzed: int
    active_plans: int
    progress_chart: List[Dict[str, Any]]
    safety_distribution: List[Dict[str, Any]]
    recent_analyses: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]
