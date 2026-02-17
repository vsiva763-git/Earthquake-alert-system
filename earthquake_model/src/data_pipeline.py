import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import pandas as pd
import requests

USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query"

INDIA_BBOX = {
    "minlatitude": 6.5,
    "maxlatitude": 37.6,
    "minlongitude": 68.1,
    "maxlongitude": 97.4,
}


def fetch_usgs_data(
    starttime: str,
    endtime: str,
    output_path: Path,
    timeout: int = 30,
) -> Path:
    params = {
        "format": "csv",
        "starttime": starttime,
        "endtime": endtime,
        "orderby": "time-asc",
        **INDIA_BBOX,
    }
    response = requests.get(USGS_API, params=params, timeout=timeout)
    response.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(response.content)
    return output_path


def clean_usgs_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    keep_cols = ["time", "latitude", "longitude", "depth", "mag", "place"]
    df = df[keep_cols].rename(
        columns={"depth": "depth_km", "mag": "magnitude"}
    )
    df["time"] = pd.to_datetime(df["time"], utc=True, errors="coerce")
    df = df.dropna(subset=["time", "magnitude"]).reset_index(drop=True)
    return df


def fetch_and_clean(years: int = 20, output_dir: Optional[Path] = None) -> Path:
    output_dir = output_dir or Path("data/raw")
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=365 * years)
    raw_path = output_dir / "usgs_india.csv"
    fetch_usgs_data(
        starttime=start_dt.strftime("%Y-%m-%d"),
        endtime=end_dt.strftime("%Y-%m-%d"),
        output_path=raw_path,
    )
    cleaned = clean_usgs_data(raw_path)
    cleaned_path = Path("data/processed") / "usgs_india_clean.csv"
    cleaned_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(cleaned_path, index=False)
    return cleaned_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch USGS earthquake data for India")
    parser.add_argument("--years", type=int, default=20)
    args = parser.parse_args()
    cleaned_path = fetch_and_clean(years=args.years)
    print(f"Saved cleaned data to {cleaned_path}")


if __name__ == "__main__":
    main()
