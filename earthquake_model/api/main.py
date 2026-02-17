from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Deque, Dict, List

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import HealthResponse, PredictRequest, PredictResponse
from src.alert_classifier import classify_alert
from src.data_pipeline import fetch_usgs_data
from src.feature_engineering import assign_seismic_zone
from src.predict import predict_event, get_feature_vector, get_historical_averages

app = FastAPI(title="Earthquake Prediction API", version="1.0.0")

# Add CORS middleware for React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LATEST_ALERTS: Deque[Dict] = deque(maxlen=50)


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
        latitude=payload.latitude,
        longitude=payload.longitude,
        depth_km=payload.depth_km,
        seismic_zone=zone,
    )
    LATEST_ALERTS.appendleft(response.model_dump())
    return response


@app.get("/latest-alerts")
async def latest_alerts() -> List[Dict]:
    return list(LATEST_ALERTS)


@app.post("/alert")
async def create_alert(payload: PredictRequest) -> Dict:
    """Manual alert creation endpoint for testing or IoT feedback"""
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

    alert = {
        "predicted_magnitude": magnitude,
        "alert_level": alert_level,
        "confidence": result["confidence"],
        "location": "India",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "recommendation": _recommendation(alert_level),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "depth_km": payload.depth_km,
        "seismic_zone": zone,
    }
    LATEST_ALERTS.appendleft(alert)
    return {"status": "alert_created", "alert": alert}


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
        "latitude": float(latest["latitude"]),
        "longitude": float(latest["longitude"]),
        "depth_km": float(latest["depth"]),
        "seismic_zone": int(result["seismic_zone"]),
    }
    LATEST_ALERTS.appendleft(payload)
    return payload


@app.post("/explain")
async def explain_prediction(payload: PredictRequest) -> Dict:
    """
    Returns feature-level explanation for why
    the model gave this alert level
    """
    try:
        recent_events = [event.model_dump() for event in payload.recent_events]
        
        # Get the feature vector used for prediction
        from src.train_xgboost import FEATURES
        from src.predict import _load_xgb
        
        features, feature_names = get_feature_vector(
            payload.latitude,
            payload.longitude,
            payload.depth_km,
            recent_events
        )

        # Get XGBoost feature importances (gain-based)
        model = _load_xgb()
        if model is None:
            return {"error": "XGBoost model not loaded"}
            
        importance_dict = model.get_booster().get_score(
            importance_type='gain'
        )

        # Normalize to percentages
        total = sum(importance_dict.values()) or 1
        importance_pct = {
            k: round((v / total) * 100, 1)
            for k, v in importance_dict.items()
        }

        # Map feature names to human-readable labels
        readable_labels = {
            "depth_km":           "Earthquake Depth",
            "seismic_zone":       "Seismic Zone",
            "quake_count_7d":     "Quakes in Last 7 Days",
            "quake_count_30d":    "Quakes in Last 30 Days",
            "avg_magnitude_30d":  "Avg Magnitude (30 Days)",
            "max_magnitude_30d":  "Max Magnitude (30 Days)",
            "prev_magnitude":     "Previous Event Magnitude",
            "days_since_last_quake": "Days Since Last Quake",
            "latitude":           "Latitude (Location)",
            "longitude":          "Longitude (Location)",
            "month":              "Time of Year"
        }

        # Build explanation features list sorted by importance
        explanation_features = []
        for feat, pct in sorted(
            importance_pct.items(),
            key=lambda x: x[1],
            reverse=True
        ):
            # Get actual value for this feature
            idx = feature_names.index(feat) if feat in feature_names else -1
            actual_value = float(features[idx]) if idx >= 0 else None

            explanation_features.append({
                "feature":        feat,
                "label":          readable_labels.get(feat, feat),
                "importance_pct": pct,
                "actual_value":   actual_value,
                "risk_level":     _classify_feature_risk(feat, actual_value)
            })

        # Get historical averages for comparison
        historical_avg = get_historical_averages(
            payload.latitude,
            payload.longitude
        )

        # Run prediction to get magnitude
        result = predict_event(
            payload.latitude,
            payload.longitude,
            payload.depth_km,
            recent_events
        )
        
        magnitude = result["predicted_magnitude"]
        zone = int(result["seismic_zone"])
        alert_level = classify_alert(magnitude, zone)

        return {
            "predicted_magnitude": magnitude,
            "alert_level":         alert_level,
            "confidence":          result["confidence"],
            "features":            explanation_features[:6],  # top 6
            "historical_avg":      historical_avg,
            "plain_english":       _generate_plain_english(
                                     explanation_features,
                                     {"predicted_magnitude": magnitude, 
                                      "alert_level": alert_level},
                                     historical_avg
                                   )
        }

    except Exception as e:
        return {"error": str(e)}


def _classify_feature_risk(feature: str, value: float) -> str:
    """Classify each feature value as LOW/MED/HIGH risk"""
    if value is None:
        return "UNKNOWN"
    thresholds = {
        "depth_km":           [(10, "HIGH"), (30, "MED"), (999, "LOW")],
        "quake_count_7d":     [(2,  "LOW"),  (5,  "MED"), (999, "HIGH")],
        "quake_count_30d":    [(5,  "LOW"),  (15, "MED"), (999, "HIGH")],
        "avg_magnitude_30d":  [(3.0,"LOW"),  (4.0,"MED"), (999, "HIGH")],
        "max_magnitude_30d":  [(3.5,"LOW"),  (5.0,"MED"), (999, "HIGH")],
        "days_since_last_quake": [(1,  "HIGH"), (7,  "MED"), (999, "LOW")],
        "seismic_zone":       [(2,  "LOW"),  (3,  "MED"), (999, "HIGH")],
    }
    if feature not in thresholds:
        return "NEUTRAL"
    for threshold, label in thresholds[feature]:
        if value <= threshold:
            return label
    return "LOW"


def _generate_plain_english(features, result, historical) -> List[str]:
    """Generate human-readable sentences explaining the prediction"""
    sentences = []
    mag = result["predicted_magnitude"]
    level = result["alert_level"]

    sentences.append(
        f"The model predicted a magnitude {mag:.2f} event, "
        f"classifying this as a {level} alert based on "
        f"current seismic activity patterns in this region."
    )

    # Find top 3 contributing features
    top3 = features[:3]
    for f in top3:
        feat = f["feature"]
        val  = f["actual_value"]
        pct  = f["importance_pct"]
        risk = f["risk_level"]

        if feat == "depth_km" and val is not None:
            sentences.append(
                f"Earthquake depth of {val:.0f} km contributed {pct}% to this "
                f"prediction — {'shallow quakes cause more surface damage' if val < 10 else 'moderate depth reduces surface impact'}."
            )
        elif feat == "quake_count_7d" and val is not None:
            sentences.append(
                f"There were {val:.0f} earthquakes in this region in the last "
                f"7 days, contributing {pct}% — "
                f"{'elevated activity suggests stress buildup' if val > 3 else 'low recent activity'}."
            )
        elif feat == "avg_magnitude_30d" and val is not None:
            sentences.append(
                f"The 30-day average magnitude in this zone is {val:.1f}, "
                f"contributing {pct}% — "
                f"{'above normal baseline indicating increased seismic stress' if val > 3.5 else 'within normal range'}."
            )
        elif feat == "seismic_zone" and val is not None:
            zone_desc = {5: "Very High Risk", 4: "High Risk",
                         3: "Moderate Risk", 2: "Low Risk"}
            sentences.append(
                f"This location falls in IMD Seismic Zone {val:.0f} "
                f"({zone_desc.get(int(val), 'Known Risk Zone')}), "
                f"contributing {pct}% to the overall risk assessment."
            )
        elif feat == "days_since_last_quake" and val is not None:
            sentences.append(
                f"Only {val:.0f} days have passed since the last seismic event "
                f"in this region, contributing {pct}% — "
                f"{'recent activity increases short-term probability' if val < 5 else 'moderate gap since last event'}."
            )

    # Historical comparison
    if historical:
        hist_mag = historical.get("avg_magnitude", 0)
        if mag > hist_mag:
            sentences.append(
                f"This prediction of M{mag:.2f} is {(mag - hist_mag):.1f} above "
                f"the historical average of M{hist_mag:.1f} for this region, "
                f"indicating elevated seismic stress."
            )
        else:
            sentences.append(
                f"This prediction of M{mag:.2f} is within the historical "
                f"average range of M{hist_mag:.1f} for this region."
            )

    return sentences


def _recommendation(level: str) -> str:
    if level == "LOW":
        return "Informational only"
    if level == "MID":
        return "Precautionary alert — monitor updates"
    return "Emergency alert — follow official guidance"
