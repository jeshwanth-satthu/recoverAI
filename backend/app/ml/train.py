import json
from pathlib import Path
from collections import Counter

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.database import (
    transactions_collection,
    recovery_cases_collection,
)


BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

MODEL_PATH = MODEL_DIR / "recovery_probability.joblib"

METRICS_PATH = MODEL_DIR / "metrics.json"


KNOWN_SUCCESS_STATUSES = {
    "recovered",
}

KNOWN_FAILURE_STATUSES = {
    "failed",
}


def load_training_data():

    cases = list(
        recovery_cases_collection.find(
            {},
            {"_id": 0},
        )
    )

    transactions = {
        transaction["id"]: transaction
        for transaction in transactions_collection.find(
            {},
            {"_id": 0},
        )
        if transaction.get("id")
    }

    rows = []

    skipped = Counter()

    for case in cases:

        status = str(
            case.get(
                "status",
                "",
            )
        ).strip().lower()

        if status in KNOWN_SUCCESS_STATUSES:

            target = 1

        elif status in KNOWN_FAILURE_STATUSES:

            target = 0

        else:

            skipped[status or "unknown"] += 1

            continue

        transaction_id = case.get(
            "transaction_id"
        )

        transaction = transactions.get(
            transaction_id,
            {},
        )

        decision = case.get(
            "decision",
            {},
        )

        if not isinstance(
            decision,
            dict,
        ):
            decision = {}

        action = decision.get(
            "action",
            "unknown",
        )

        row = {
            "transaction_id": transaction_id,

            "amount": float(
                case.get(
                    "amount",
                    transaction.get(
                        "amount",
                        0,
                    ),
                )
                or 0
            ),

            "retry_count": int(
                case.get(
                    "retry_count",
                    transaction.get(
                        "retry_count",
                        0,
                    ),
                )
                or 0
            ),

            "failure_reason": str(
                case.get(
                    "failure_reason",
                    transaction.get(
                        "failure_reason",
                        "unknown",
                    ),
                )
                or "unknown"
            ).lower(),

            "risk_level": str(
                case.get(
                    "risk_level",
                    transaction.get(
                        "risk_level",
                        "unknown",
                    ),
                )
                or "unknown"
            ).lower(),

            "transaction_type": str(
                case.get(
                    "transaction_type",
                    transaction.get(
                        "type",
                        "unknown",
                    ),
                )
                or "unknown"
            ).lower(),

            "action": str(
                action
                or "unknown"
            ).lower(),

            "target": target,
        }

        rows.append(row)

    print("\nTraining data preparation")
    print("=" * 70)

    print(
        f"Total recovery cases: {len(cases)}"
    )

    print(
        f"Usable labeled cases: {len(rows)}"
    )

    print(
        f"Skipped cases: {sum(skipped.values())}"
    )

    print("\nSkipped statuses:")

    for status, count in skipped.most_common():

        print(
            f"  {status}: {count}"
        )

    print("\nTarget distribution:")

    target_counter = Counter(
        row["target"]
        for row in rows
    )

    print(
        f"  recovered: "
        f"{target_counter.get(1, 0)}"
    )

    print(
        f"  failed: "
        f"{target_counter.get(0, 0)}"
    )

    return pd.DataFrame(rows)


def build_model():

    numeric_features = [
        "amount",
        "retry_count",
    ]

    categorical_features = [
        "failure_reason",
        "risk_level",
        "transaction_type",
        "action",
    ]

    numeric_pipeline = Pipeline(
        steps=[
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
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
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
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
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
        ]
    )

    classifier = LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=42,
    )

    model = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "classifier",
                classifier,
            ),
        ]
    )

    return model


def train():

    dataframe = load_training_data()

    if dataframe.empty:

        raise RuntimeError(
            "No labeled recovery outcomes available."
        )

    if dataframe["target"].nunique() < 2:

        raise RuntimeError(
            "Training data must contain both "
            "recovered and failed outcomes."
        )

    if len(dataframe) < 30:

        raise RuntimeError(
            "Not enough labeled examples "
            "for ML training."
        )

    feature_columns = [
        "amount",
        "retry_count",
        "failure_reason",
        "risk_level",
        "transaction_type",
        "action",
    ]

    X = dataframe[
        feature_columns
    ]

    y = dataframe["target"]

    groups = dataframe[
        "transaction_id"
    ].fillna(
        pd.Series(dataframe.index.astype(str), index=dataframe.index)
    )

    # ----------------------------------------------------------
    # IMPORTANT:
    # Split by transaction rather than individual recovery case.
    #
    # This prevents multiple attempts for the same transaction
    # from leaking into both training and test sets.
    # ----------------------------------------------------------

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

    X_train = X.iloc[
        train_indices
    ]

    X_test = X.iloc[
        test_indices
    ]

    y_train = y.iloc[
        train_indices
    ]

    y_test = y.iloc[
        test_indices
    ]

    print("\nDataset split")
    print("=" * 70)

    print(
        f"Training examples: {len(X_train)}"
    )

    print(
        f"Testing examples: {len(X_test)}"
    )

    print(
        f"Training transactions: "
        f"{groups.iloc[train_indices].nunique()}"
    )

    print(
        f"Testing transactions: "
        f"{groups.iloc[test_indices].nunique()}"
    )

    model = build_model()

    model.fit(
        X_train,
        y_train,
    )

    predictions = model.predict(
        X_test
    )

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    try:

        roc_auc = roc_auc_score(
            y_test,
            probabilities,
        )

    except ValueError:

        roc_auc = None

    matrix = confusion_matrix(
        y_test,
        predictions,
    )

    metrics = {
        "model": "logistic_regression",
        "version": "1.0",
        "training_examples": int(
            len(X_train)
        ),
        "testing_examples": int(
            len(X_test)
        ),
        "training_transactions": int(
            groups.iloc[
                train_indices
            ].nunique()
        ),
        "testing_transactions": int(
            groups.iloc[
                test_indices
            ].nunique()
        ),
        "accuracy": round(
            float(accuracy),
            4,
        ),
        "precision": round(
            float(precision),
            4,
        ),
        "recall": round(
            float(recall),
            4,
        ),
        "f1": round(
            float(f1),
            4,
        ),
        "roc_auc": (
            round(
                float(roc_auc),
                4,
            )
            if roc_auc is not None
            else None
        ),
        "confusion_matrix": matrix.tolist(),
    }

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
            metrics,
            file,
            indent=2,
        )

    print("\nMODEL RESULTS")
    print("=" * 70)

    print(
        f"Accuracy:  {accuracy:.2%}"
    )

    print(
        f"Precision: {precision:.2%}"
    )

    print(
        f"Recall:    {recall:.2%}"
    )

    print(
        f"F1 Score:  {f1:.2%}"
    )

    if roc_auc is not None:

        print(
            f"ROC-AUC:   {roc_auc:.2%}"
        )

    print("\nConfusion Matrix:")

    print(matrix)

    print("\nModel saved to:")

    print(
        MODEL_PATH
    )

    print("\nMetrics saved to:")

    print(
        METRICS_PATH
    )

    return model, metrics


if __name__ == "__main__":

    train()
