# Earthquake Model (India)

This package provides a data pipeline, feature engineering, model training, and a FastAPI service for earthquake magnitude prediction and alert classification.

## Quick Start

```bash
cd earthquake_model
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Data Fetch (USGS)

```bash
python -m src.data_pipeline --years 20
```

## Feature Engineering

```bash
python -m src.feature_engineering
```

## Train Models

```bash
python -m src.train_xgboost
python -m src.train_lstm
# Optional fusion
python -m src.fusion_model
```

## Run API

```bash
uvicorn api.main:app --reload --port 8000
```

## Endpoints

- `GET /health`
- `POST /predict`
- `GET /latest-alerts`
- `GET /live-feed`

## Notes

- The seismic zone heuristic in `feature_engineering.py` is a placeholder and should be replaced with an official zone map for production use.
- If LSTM or fusion models are not present, the API falls back to XGBoost-only predictions.
