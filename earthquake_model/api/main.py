from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Deque, Dict, List

import pandas as pd
from fastapi import FastAPI

from api.schemas import HealthResponse, PredictRequest, PredictResponse
from src.alert_classifier import classify_alert
from src.data_pipeline import fetch_usgs_data
from src.feature_engineering import assign_seismic_zone
from src.predict import predict_event

app = FastAPI(title="Earthquake Prediction API", version="1.0.0")
LATEST_ALERTS: Deque[Dict] = deque(maxlen=10)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest) -> PredictResponse:
    recent_events = [event.model_dump() for event in payload.recent_events]
    result = predict_event(
        lat=payload.latitude,
        lon=payload.longitude,
        depth_km=payload.depth_km,
        recent_events=recent_events,
    )

    magnitude = result["predicted_magnitude"]
    zone = int(result["seismic_zone"])
    alert_level = classify_alert(magnitude, zone)

    response = PredictResponse(
        predicted_magnitude=magnitude,
        alert_level=alert_level,
        confidence=result["confidence"],
        location="India",
        timestamp=datetime.now(timezone.utc),
        recommendation=_recommendation(alert_level),
    )
    LATEST_ALERTS.appendleft(response.model_dump())
    return response


@app.get("/latest-alerts")
async def latest_alerts() -> List[Dict]:
    return list(LATEST_ALERTS)


@app.get("/live-feed")
async def live_feed() -> Dict:
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - pd.Timedelta(days=2)
    temp_path = fetch_usgs_data(
        starttime=start_dt.strftime("%Y-%m-%d"),
        endtime=end_dt.strftime("%Y-%m-%d"),
        output_path=Path("data/raw/usgs_live.csv"),
    )
    df = pd.read_csv(temp_path)
    if df.empty:
        return {"status": "no-data"}
    df = df.sort_values("time")
    latest = df.iloc[-1]
    recent = df.tail(10)
    recent_events = []
    for _, row in recent.iterrows():
        recent_events.append(
            {
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "depth_km": float(row["depth"]),
                "magnitude": float(row["mag"]),
                "timestamp": row["time"],
                "days_since_last_quake": 0.0,
                "seismic_zone": assign_seismic_zone(row["latitude"], row["longitude"]),
            }
        )

    result = predict_event(
        lat=float(latest["latitude"]),
        lon=float(latest["longitude"]),
        depth_km=float(latest["depth"]),
        recent_events=recent_events,
    )
    alert_level = classify_alert(result["predicted_magnitude"], int(result["seismic_zone"]))

    payload = {
        "predicted_magnitude": result["predicted_magnitude"],
        "alert_level": alert_level,
        "confidence": result["confidence"],
        "location": latest.get("place", "India"),
        "timestamp": latest["time"],
        "recommendation": _recommendation(alert_level),
    }
    LATEST_ALERTS.appendleft(payload)
    return payload


def _recommendation(level: str) -> str:
    if level == "LOW":
        return "Informational only"
    if level == "MID":
        return "Precautionary alert — monitor updates"
    return "Emergency alert — follow official guidance"
