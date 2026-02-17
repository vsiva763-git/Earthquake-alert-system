import json
from pathlib import Path
from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense, LSTM

SEQUENCE_LENGTH = 10
FEATURES = [
    "latitude",
    "longitude",
    "depth_km",
    "magnitude",
    "days_since_last_quake",
    "seismic_zone",
]


def build_sequences(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    sequences: List[np.ndarray] = []
    targets: List[float] = []

    for _, zone_df in df.groupby("seismic_zone"):
        zone_df = zone_df.sort_values("time")
        data = zone_df[FEATURES].values
        for idx in range(SEQUENCE_LENGTH, len(data)):
            sequences.append(data[idx - SEQUENCE_LENGTH : idx])
            targets.append(zone_df.iloc[idx]["magnitude"])

    return np.array(sequences), np.array(targets)


def main() -> None:
    input_path = Path("data/processed/features.csv")
    if not input_path.exists():
        raise FileNotFoundError(
            "Missing features. Run: python -m src.feature_engineering"
        )

    df = pd.read_csv(input_path, parse_dates=["time"])
    sequences, targets = build_sequences(df)
    if len(sequences) == 0:
        raise ValueError("Not enough data to build LSTM sequences")

    X_train, X_test, y_train, y_test = train_test_split(
        sequences, targets, test_size=0.2, random_state=42
    )

    model = Sequential(
        [
            LSTM(32, input_shape=(SEQUENCE_LENGTH, len(FEATURES))),
            Dense(16, activation="relu"),
            Dense(1),
        ]
    )
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])

    history = model.fit(X_train, y_train, validation_split=0.2, epochs=10, batch_size=32)
    eval_loss, eval_mae = model.evaluate(X_test, y_test, verbose=0)

    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    model.save(models_dir / "lstm_model.keras")

    metrics = {
        "loss": float(eval_loss),
        "mae": float(eval_mae),
        "epochs": len(history.history.get("loss", [])),
    }
    (models_dir / "lstm_metrics.json").write_text(json.dumps(metrics, indent=2))

    print(f"LSTM loss: {eval_loss:.3f}, MAE: {eval_mae:.3f}")


if __name__ == "__main__":
    main()
