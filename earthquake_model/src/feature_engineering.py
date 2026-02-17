from __future__ import annotations

from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import List, Tuple

import pandas as pd


@dataclass
class FeatureConfig:
    radius_km: float = 100.0
    window_7d: int = 7
    window_30d: int = 30


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c


def _in_box(lat: float, lon: float, box: Tuple[float, float, float, float]) -> bool:
    min_lon, min_lat, max_lon, max_lat = box
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon


def assign_seismic_zone(lat: float, lon: float) -> int:
    # Approximate zone polygons as bounding boxes for a lightweight, file-free setup.
    zone_boxes = {
        5: [
            (89.0, 20.0, 97.0, 29.0),
            (73.0, 32.0, 80.0, 37.0),
            (68.0, 22.0, 74.0, 25.0),
            (92.0, 6.0, 94.0, 14.0),
        ],
        4: [
            (75.0, 28.0, 82.0, 32.0),
            (84.0, 24.0, 89.0, 28.0),
            (88.0, 24.0, 92.0, 27.0),
            (73.0, 30.0, 76.0, 33.0),
        ],
        3: [
            (72.0, 14.0, 78.0, 22.0),
            (78.0, 18.0, 86.0, 24.0),
            (74.0, 24.0, 82.0, 28.0),
            (76.0, 8.0, 80.0, 14.0),
            (80.0, 8.0, 88.0, 16.0),
            (86.0, 20.0, 92.0, 24.0),
        ],
        2: [
            (76.0, 8.0, 82.0, 16.0),
            (68.0, 24.0, 76.0, 30.0),
            (78.0, 14.0, 84.0, 20.0),
        ],
    }

    for zone in [5, 4, 3, 2]:
        if any(_in_box(lat, lon, box) for box in zone_boxes[zone]):
            return zone
    return 2


def build_features(df: pd.DataFrame, config: FeatureConfig | None = None) -> pd.DataFrame:
    config = config or FeatureConfig()
    df = df.sort_values("time").reset_index(drop=True)
    df["seismic_zone"] = df.apply(
        lambda row: assign_seismic_zone(row["latitude"], row["longitude"]), axis=1
    )
    df["month"] = df["time"].dt.month

    prev_magnitude: List[float] = []
    days_since_last: List[float] = []
    quake_count_7d: List[int] = []
    quake_count_30d: List[int] = []
    avg_magnitude_30d: List[float] = []
    max_magnitude_30d: List[float] = []

    history: List[Tuple[int, pd.Timestamp]] = []

    for idx, row in df.iterrows():
        current_time = row["time"]
        zone = row["seismic_zone"]
        lat = row["latitude"]
        lon = row["longitude"]

        past_df = df.loc[: idx - 1]
        zone_df = past_df[past_df["seismic_zone"] == zone]

        if zone_df.empty:
            prev_magnitude.append(0.0)
            days_since_last.append(0.0)
        else:
            prev_row = zone_df.iloc[-1]
            prev_magnitude.append(float(prev_row["magnitude"]))
            delta_days = (current_time - prev_row["time"]).total_seconds() / 86400
            days_since_last.append(float(delta_days))

        cutoff_7d = current_time - pd.Timedelta(days=config.window_7d)
        cutoff_30d = current_time - pd.Timedelta(days=config.window_30d)

        window_7d = past_df[past_df["time"] >= cutoff_7d]
        count_7d = 0
        for _, past_row in window_7d.iterrows():
            distance = haversine_km(lat, lon, past_row["latitude"], past_row["longitude"])
            if distance <= config.radius_km:
                count_7d += 1
        quake_count_7d.append(count_7d)

        zone_30d = zone_df[zone_df["time"] >= cutoff_30d]
        quake_count_30d.append(int(len(zone_30d)))
        if zone_30d.empty:
            avg_magnitude_30d.append(0.0)
            max_magnitude_30d.append(0.0)
        else:
            avg_magnitude_30d.append(float(zone_30d["magnitude"].mean()))
            max_magnitude_30d.append(float(zone_30d["magnitude"].max()))

        history.append((idx, current_time))

    df["prev_magnitude"] = prev_magnitude
    df["days_since_last_quake"] = days_since_last
    df["quake_count_7d"] = quake_count_7d
    df["quake_count_30d"] = quake_count_30d
    df["avg_magnitude_30d"] = avg_magnitude_30d
    df["max_magnitude_30d"] = max_magnitude_30d
    return df


def main() -> None:
    input_path = Path("data/processed/usgs_india_clean.csv")
    if not input_path.exists():
        raise FileNotFoundError(
            "Missing cleaned data. Run: python -m src.data_pipeline"
        )
    df = pd.read_csv(input_path, parse_dates=["time"])
    features = build_features(df)
    output_path = Path("data/processed/features.csv")
    features.to_csv(output_path, index=False)
    print(f"Saved features to {output_path}")


if __name__ == "__main__":
    main()
