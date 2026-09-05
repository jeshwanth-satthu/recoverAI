"""
Unit tests for the Scikit-Learn Machine Learning Predictor Subsystem.
Verifies probability output bounds, feature engineering, and inference stability.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ml.predictor import predict_recovery_probability, load_model
from app.ml.features import build_feature_row


def test_model_loading():
    model = load_model()
    assert model is not None, "Model failed to load from model registry"


def test_feature_row_construction():
    sample_tx = {
        "id": "pay_test_features",
        "amount": 1999,
        "customer_id": "cust_101",
        "error_code": "INSUFFICIENT_FUNDS",
        "payment_method": "upi",
        "risk_level": "medium",
        "customer": {
            "lifetime_value": 8500,
            "failed_attempts": 1,
            "risk_score": 15,
        },
    }
    feature_row = build_feature_row(sample_tx, "send_payment_reminder")
    assert isinstance(feature_row, dict)
    assert "amount" in feature_row


def test_recovery_prediction_bounds():
    sample_tx = {
        "id": "pay_1005",
        "amount": 1999,
        "customer_id": "cust_105",
        "error_code": "INSUFFICIENT_FUNDS",
        "payment_method": "upi",
        "risk_level": "low",
        "customer": {
            "lifetime_value": 12000,
            "failed_attempts": 0,
            "risk_score": 5,
        },
    }
    result = predict_recovery_probability(sample_tx, "send_payment_reminder")

    assert "recovery_probability" in result
    assert "recovery_percentage" in result
    assert "predicted_recovery" in result
    assert "model_version" in result

    prob = result["recovery_probability"]
    assert 0.0 <= prob <= 1.0, f"Probability {prob} out of [0, 1] bounds"
    assert result["recovery_percentage"] == round(prob * 100, 2)


if __name__ == "__main__":
    test_model_loading()
    test_feature_row_construction()
    test_recovery_prediction_bounds()
    print("All ML Predictor Unit Tests Passed!")
