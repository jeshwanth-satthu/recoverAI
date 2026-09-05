from pathlib import Path
import json
import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ml.features import build_feature_row
from app.database import db
from app.ml.model_registry import register_current_model


MODEL_DIR = (
    Path(__file__).resolve().parent / "models"
)

MODEL_PATH = MODEL_DIR / "recovery_probability.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"


def build_feedback_dataset():

    feedback_collection = db[
        "recovery_feedback"
    ]

    rows = list(
        feedback_collection.find(
            {},
            {"_id": 0},
        )
    )

    dataset = []

    for item in rows:

        feedback = item.get("feedback")

        if feedback not in {
            "positive",
            "negative",
        }:
            continue

        transaction = {
            "id": item.get("transaction_id"),
            "amount": item.get("amount", 0),
            "failure_reason":
                item.get("failure_reason"),
            "risk_level":
                item.get("risk_level"),
            "retry_count":
                item.get("retry_count", 0),
        }

        action = item.get("action")

        features = build_feature_row(
            transaction,
            action,
        )

        features["target"] = (
            1
            if feedback == "positive"
            else 0
        )

        features["transaction_id"] = (
            item.get("transaction_id")
        )

        dataset.append(features)

    return dataset


def train_feedback_model():

    dataset = build_feedback_dataset()

    if len(dataset) < 20:
        return {
            "success": False,
            "message":
                "At least 20 feedback records "
                "are required before retraining.",
            "samples": len(dataset),
        }

    dataframe = pd.DataFrame(dataset)

    groups = dataframe[
        "transaction_id"
    ]

    y = dataframe["target"]

    X = dataframe.drop(
        columns=[
            "target",
            "transaction_id",
        ]
    )

    if y.nunique() < 2:
        return {
            "success": False,
            "message":
                "Feedback must contain both "
                "positive and negative examples.",
            "samples": len(dataset),
        }

    numeric_features = [
        column
        for column in X.columns
        if X[column].dtype != "object"
    ]

    categorical_features = [
        column
        for column in X.columns
        if X[column].dtype == "object"
    ]

    numeric_pipeline = Pipeline([
        (
            "imputer",
            SimpleImputer(
                strategy="median"
            ),
        ),
        (
            "scaler",
            StandardScaler(),
        ),
    ])

    categorical_pipeline = Pipeline([
        (
            "imputer",
            SimpleImputer(
                strategy="most_frequent"
            ),
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
        ),
    ])

    preprocessor = ColumnTransformer([
        (
            "numeric",
            numeric_pipeline,
            numeric_features,
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features,
        ),
    ])

    model = Pipeline([
        (
            "preprocessor",
            preprocessor,
        ),
        (
            "classifier",
            LogisticRegression(
                class_weight="balanced",
                max_iter=2000,
            ),
        ),
    ])

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42,
    )

    train_indices, test_indices = next(
        splitter.split(
            X,
            y,
            groups=groups,
        )
    )

    X_train = X.iloc[train_indices]
    X_test = X.iloc[test_indices]

    y_train = y.iloc[train_indices]
    y_test = y.iloc[test_indices]

    model.fit(
        X_train,
        y_train,
    )

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    if y_test.nunique() >= 2:
        roc_auc = roc_auc_score(
            y_test,
            probabilities,
        )
    else:
        roc_auc = None

    new_metrics = {
        "samples": len(dataset),
        "training_samples":
            len(X_train),
        "testing_samples":
            len(X_test),
        "positive_feedback":
            int(y.sum()),
        "negative_feedback":
            int((y == 0).sum()),
        "roc_auc":
            round(roc_auc, 4)
            if roc_auc is not None
            else None,
        "model":
            "logistic_regression",
        "source":
            "human_feedback",
    }

    # Existing model metrics.
    old_metrics = {}

    if METRICS_PATH.exists():

        try:
            with open(
                METRICS_PATH,
                "r",
                encoding="utf-8",
            ) as file:
                old_metrics = json.load(file)

        except Exception:
            old_metrics = {}

    old_auc = old_metrics.get(
        "roc_auc"
    )

    # Safety rule:
    # Never replace an existing model with
    # an obviously weaker model.
    if (
        old_auc is not None
        and roc_auc is not None
        and roc_auc < old_auc - 0.05
    ):

        return {
            "success": False,
            "message":
                "New model rejected because "
                "performance dropped significantly.",
            "old_roc_auc": old_auc,
            "new_roc_auc": round(
                roc_auc,
                4,
            ),
            "model_replaced": False,
        }

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    with open(
        METRICS_PATH,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            new_metrics,
            file,
            indent=2,
        )

    registry_result = register_current_model()

    return {
        "success": True,
        "message": "Feedback model trained and registered successfully.",
        "metrics": new_metrics,
        "model_replaced": True,
        "registry": registry_result,
    }
