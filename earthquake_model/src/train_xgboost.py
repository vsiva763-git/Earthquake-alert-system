import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from alert_classifier import classify_alert

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
    
    # Convert magnitudes to alert labels (LOW/MID/HIGH)
    y_labels = [classify_alert(m) for m in df["magnitude"].values]
    label_to_int = {"LOW": 0, "MID": 1, "HIGH": 2}
    y = np.array([label_to_int[label] for label in y_labels])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Calculate class weights to handle HIGH (class 2) imbalance
    unique, counts = np.unique(y_train, return_counts=True)
    class_weights = {}
    for cls, count in zip(unique, counts):
        class_weights[cls] = len(y_train) / (len(unique) * count)
    
    # Scale pos_weight specifically for HIGH class (minority class)
    scale_pos_weight = (len(y_train[y_train != 2]) / len(y_train[y_train == 2]))

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        objective="multi:softmax",
        num_class=3,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    accuracy = (preds == y_test).sum() / len(y_test)

    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    model.save_model(models_dir / "xgb_model.json")
    joblib.dump(model, models_dir / "xgb_model.joblib")

    metrics = {"accuracy": float(accuracy), "scale_pos_weight": float(scale_pos_weight)}
    (models_dir / "xgb_metrics.json").write_text(json.dumps(metrics, indent=2))

    print(f"XGBoost Accuracy: {accuracy:.3f}, Scale Pos Weight (HIGH): {scale_pos_weight:.3f}")


if __name__ == "__main__":
    main()
