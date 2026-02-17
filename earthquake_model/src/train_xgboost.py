import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

FEATURES = [
    "latitude",
    "longitude",
    "depth_km",
    "prev_magnitude",
    "quake_count_7d",
    "quake_count_30d",
    "avg_magnitude_30d",
    "max_magnitude_30d",
    "days_since_last_quake",
    "month",
    "seismic_zone",
]


def main() -> None:
    input_path = Path("data/processed/features.csv")
    if not input_path.exists():
        raise FileNotFoundError(
            "Missing features. Run: python -m src.feature_engineering"
        )

    df = pd.read_csv(input_path)
    X = df[FEATURES].fillna(0.0)
    y = df["magnitude"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse = mean_squared_error(y_test, preds, squared=False)
    mae = mean_absolute_error(y_test, preds)

    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    model.save_model(models_dir / "xgb_model.json")
    joblib.dump(model, models_dir / "xgb_model.joblib")

    metrics = {"rmse": float(rmse), "mae": float(mae)}
    (models_dir / "xgb_metrics.json").write_text(json.dumps(metrics, indent=2))

    print(f"XGBoost RMSE: {rmse:.3f}, MAE: {mae:.3f}")


if __name__ == "__main__":
    main()
