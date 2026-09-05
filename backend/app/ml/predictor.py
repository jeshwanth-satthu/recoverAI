from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd

from app.ml.features import build_feature_row


MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "recovery_probability.joblib"
)


_model = None


def load_model():
    global _model

    if _model is None:

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"ML model not found: {MODEL_PATH}"
            )

        _model = joblib.load(
            MODEL_PATH
        )

    return _model


def predict_recovery_probability(
    transaction: Dict[str, Any],
    action: str,
) -> Dict[str, Any]:

    model = load_model()

    feature_row = build_feature_row(
        transaction,
        action,
    )

    dataframe = pd.DataFrame(
        [feature_row]
    )

    probability = float(
        model.predict_proba(
            dataframe
        )[0][1]
    )

    prediction = int(
        probability >= 0.50
    )

    return {
        "recovery_probability": round(
            probability,
            4,
        ),
        "recovery_percentage": round(
            probability * 100,
            2,
        ),
        "predicted_recovery": (
            prediction == 1
        ),
        "model": "logistic_regression",
        "model_version": "1.0",
    }
