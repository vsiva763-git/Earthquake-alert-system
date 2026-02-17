import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import load_model
from xgboost import XGBRegressor

from src.train_xgboost import FEATURES


def main() -> None:
    features_path = Path("data/processed/features.csv")
    if not features_path.exists():
        raise FileNotFoundError(
            "Missing features. Run: python -m src.feature_engineering"
        )

    xgb_path = Path("models/xgb_model.json")
    lstm_path = Path("models/lstm_model.keras")
    if not xgb_path.exists() or not lstm_path.exists():
        raise FileNotFoundError("Missing base models. Train XGBoost and LSTM first.")

    df = pd.read_csv(features_path, parse_dates=["time"])
    xgb = XGBRegressor()
    xgb.load_model(xgb_path)
    lstm = load_model(lstm_path)

    xgb_input = df[FEATURES].fillna(0.0).values
    xgb_pred = xgb.predict(xgb_input)

    lstm_features = df[
        ["latitude", "longitude", "depth_km", "magnitude", "days_since_last_quake", "seismic_zone"]
    ].values
    seq_len = 10
    lstm_sequences = []
    lstm_targets = []
    for idx in range(seq_len, len(lstm_features)):
        lstm_sequences.append(lstm_features[idx - seq_len : idx])
        lstm_targets.append(df.iloc[idx]["magnitude"])

    lstm_sequences = np.array(lstm_sequences)
    lstm_pred = lstm.predict(lstm_sequences, verbose=0).reshape(-1)

    aligned_xgb = xgb_pred[seq_len:]
    X_fusion = np.vstack([aligned_xgb, lstm_pred]).T
    y_fusion = np.array(lstm_targets)

    X_train, X_test, y_train, y_test = train_test_split(
        X_fusion, y_fusion, test_size=0.2, random_state=42
    )

    fusion = Sequential(
        [
            Dense(8, activation="relu", input_shape=(2,)),
            Dense(1),
        ]
    )
    fusion.compile(optimizer="adam", loss="mse", metrics=["mae"])
    history = fusion.fit(X_train, y_train, validation_split=0.2, epochs=10, batch_size=32)
    eval_loss, eval_mae = fusion.evaluate(X_test, y_test, verbose=0)

    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    fusion.save(models_dir / "fusion_model.keras")

    metrics = {
        "loss": float(eval_loss),
        "mae": float(eval_mae),
        "epochs": len(history.history.get("loss", [])),
    }
    (models_dir / "fusion_metrics.json").write_text(json.dumps(metrics, indent=2))

    print(f"Fusion loss: {eval_loss:.3f}, MAE: {eval_mae:.3f}")


if __name__ == "__main__":
    main()
