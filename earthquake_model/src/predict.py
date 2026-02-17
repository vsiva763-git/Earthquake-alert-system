from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from xgboost import XGBRegressor

from src.feature_engineering import assign_seismic_zone
from src.train_xgboost import FEATURES

MODELS_CACHE: Dict[str, object] = {}
TRAINING_DATA: Optional[pd.DataFrame] = None


def _load_xgb() -> Optional[XGBRegressor]:
    model_path = Path("models/xgb_model.json")
    if not model_path.exists():
        return None
    if "xgb" in MODELS_CACHE:
        return MODELS_CACHE["xgb"]
    model = XGBRegressor()
    model.load_model(model_path)
    MODELS_CACHE["xgb"] = model
    return model


def _load_lstm() -> Optional[object]:
    model_path = Path("models/lstm_model.keras")
    if not model_path.exists():
        return None
    if "lstm" in MODELS_CACHE:
        return MODELS_CACHE["lstm"]
    model = load_model(model_path)
    MODELS_CACHE["lstm"] = model
    return model


def _load_fusion() -> Optional[object]:
    model_path = Path("models/fusion_model.keras")
    if not model_path.exists():
        return None
    if "fusion" in MODELS_CACHE:
        return MODELS_CACHE["fusion"]
    model = load_model(model_path)
    MODELS_CACHE["fusion"] = model
    return model


def _load_training_data() -> pd.DataFrame:
    """Load training data for historical comparisons"""
    global TRAINING_DATA
    if TRAINING_DATA is not None:
        return TRAINING_DATA
    
    data_path = Path("data/processed/features.csv")
    if not data_path.exists():
        # Fallback to notebook data
        data_path = Path("notebooks/data/processed/usgs_india_clean.csv")
    
    if data_path.exists():
        TRAINING_DATA = pd.read_csv(data_path)
    else:
        TRAINING_DATA = pd.DataFrame()
    
    return TRAINING_DATA


def get_feature_vector(
    lat: float,
    lon: float,
    depth_km: float,
    recent_events: Optional[List[Dict]] = None
) -> tuple[np.ndarray, List[str]]:
    """
    Returns feature vector and feature names used for prediction
    """
    recent_events = _enrich_recent_events(recent_events or [])
    context = _context_features(lat, lon, depth_km, recent_events)
    
    row = {
        "latitude": lat,
        "longitude": lon,
        "depth_km": depth_km,
        **context,
    }
    x_input = pd.DataFrame([row])[FEATURES].fillna(0.0)
    return x_input.values[0], FEATURES


def get_historical_averages(lat: float, lon: float) -> Dict:
    """
    Returns historical average stats for the region
    from the training dataset
    """
    try:
        training_data = _load_training_data()
        
        if training_data.empty:
            return {
                "avg_magnitude": 3.2,
                "max_magnitude": 5.1,
                "avg_depth": 18.0,
                "total_events": 0,
                "note": "No regional history — using India baseline"
            }
        
        # Filter training data for nearby region (±2 degrees)
        nearby = training_data[
            (training_data['latitude'].between(lat - 2, lat + 2)) &
            (training_data['longitude'].between(lon - 2, lon + 2))
        ]
        
        if len(nearby) == 0:
            return {
                "avg_magnitude": 3.2,
                "max_magnitude": 5.1,
                "avg_depth": 18.0,
                "total_events": 0,
                "note": "No regional history — using India baseline"
            }
        
        return {
            "avg_magnitude": round(float(nearby['magnitude'].mean()), 2),
            "max_magnitude": round(float(nearby['magnitude'].max()), 2),
            "avg_depth": round(float(nearby['depth_km'].mean()), 2),
            "total_events": int(len(nearby)),
            "note": f"Based on {len(nearby)} historical events in ±2° radius"
        }
    except Exception as e:
        return {
            "avg_magnitude": 3.2,
            "max_magnitude": 5.1,
            "avg_depth": 18.0,
            "total_events": 0,
            "note": f"Error loading historical data: {str(e)}"
        }


def _enrich_recent_events(
    recent_events: List[Dict],
) -> List[Dict]:
    if not recent_events:
        return []

    events_df = pd.DataFrame(recent_events)
    events_df["timestamp"] = pd.to_datetime(events_df["timestamp"], utc=True)
    events_df = events_df.sort_values("timestamp").reset_index(drop=True)

    seismic_zones = []
    days_since = []
    for idx, row in events_df.iterrows():
        zone = row.get("seismic_zone")
        if pd.isna(zone):
            zone = assign_seismic_zone(row["latitude"], row["longitude"])
        seismic_zones.append(int(zone))

        if idx == 0:
            days_since.append(0.0)
        else:
            delta_days = (
                row["timestamp"] - events_df.iloc[idx - 1]["timestamp"]
            ).total_seconds() / 86400
            days_since.append(float(delta_days))

    events_df["seismic_zone"] = seismic_zones
    events_df["days_since_last_quake"] = days_since
    return events_df.to_dict(orient="records")


def _context_features(
    lat: float, lon: float, depth_km: float, recent_events: List[Dict]
) -> Dict[str, float]:
    zone = assign_seismic_zone(lat, lon)
    month = datetime.utcnow().month

    if not recent_events:
        return {
            "prev_magnitude": 0.0,
            "quake_count_7d": 0.0,
            "quake_count_30d": 0.0,
            "avg_magnitude_30d": 0.0,
            "max_magnitude_30d": 0.0,
            "days_since_last_quake": 0.0,
            "month": month,
            "seismic_zone": zone,
        }

    events_df = pd.DataFrame(recent_events)
    events_df["timestamp"] = pd.to_datetime(events_df["timestamp"], utc=True)
    events_df = events_df.sort_values("timestamp")

    prev_magnitude = float(events_df.iloc[-1]["magnitude"])
    days_since_last = (
        datetime.utcnow() - events_df.iloc[-1]["timestamp"].to_pydatetime()
    ).total_seconds() / 86400

    now = pd.Timestamp.utcnow()
    window_7d = events_df[events_df["timestamp"] >= now - pd.Timedelta(days=7)]
    window_30d = events_df[events_df["timestamp"] >= now - pd.Timedelta(days=30)]

    return {
        "prev_magnitude": prev_magnitude,
        "quake_count_7d": float(len(window_7d)),
        "quake_count_30d": float(len(window_30d)),
        "avg_magnitude_30d": float(window_30d["magnitude"].mean())
        if not window_30d.empty
        else 0.0,
        "max_magnitude_30d": float(window_30d["magnitude"].max())
        if not window_30d.empty
        else 0.0,
        "days_since_last_quake": float(days_since_last),
        "month": float(month),
        "seismic_zone": float(zone),
    }


def predict_event(
    lat: float,
    lon: float,
    depth_km: float,
    recent_events: Optional[List[Dict]] = None,
) -> Dict[str, float]:
    recent_events = _enrich_recent_events(recent_events or [])
    context = _context_features(lat, lon, depth_km, recent_events)
    xgb = _load_xgb()
    lstm = _load_lstm()
    fusion = _load_fusion()

    xgb_pred = None
    if xgb:
        row = {
            "latitude": lat,
            "longitude": lon,
            "depth_km": depth_km,
            **context,
        }
        x_input = pd.DataFrame([row])[FEATURES].fillna(0.0)
        xgb_pred = float(xgb.predict(x_input)[0])

    lstm_pred = None
    if lstm and recent_events:
        seq = pd.DataFrame(recent_events)[
            ["latitude", "longitude", "depth_km", "magnitude", "days_since_last_quake", "seismic_zone"]
        ]
        seq = seq.tail(10)
        if len(seq) == 10:
            lstm_pred = float(lstm.predict(np.array([seq.values]), verbose=0)[0][0])

    if fusion and xgb_pred is not None and lstm_pred is not None:
        fused = float(fusion.predict(np.array([[xgb_pred, lstm_pred]]), verbose=0)[0][0])
        magnitude = fused
        confidence = 0.8
    elif xgb_pred is not None:
        magnitude = xgb_pred
        confidence = 0.7
    elif lstm_pred is not None:
        magnitude = lstm_pred
        confidence = 0.65
    else:
        magnitude = 0.0
        confidence = 0.0

    return {
        "predicted_magnitude": magnitude,
        "confidence": confidence,
        "seismic_zone": context["seismic_zone"],
    }
