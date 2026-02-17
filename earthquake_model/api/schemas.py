from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RecentEvent(BaseModel):
    latitude: float
    longitude: float
    depth_km: float
    magnitude: float
    timestamp: datetime
    days_since_last_quake: Optional[float] = None
    seismic_zone: Optional[int] = None


class PredictRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    depth_km: float = Field(..., ge=0)
    recent_events: List[RecentEvent] = Field(default_factory=list)


class PredictResponse(BaseModel):
    predicted_magnitude: float
    alert_level: str
    confidence: float
    location: str
    timestamp: datetime
    recommendation: str


class HealthResponse(BaseModel):
    status: str
