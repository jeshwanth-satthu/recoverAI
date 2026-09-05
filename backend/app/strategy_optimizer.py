from typing import Any, Dict, List
from pathlib import Path

from app.ml.predictor import (
    predict_recovery_probability,
)


MAX_AUTOMATIC_RECOVERY_AMOUNT = 10000
MAX_AUTOMATIC_RETRIES = 3


STRATEGY_TIMING = {
    "retry_payment": "now",
    "send_payment_reminder": "later",
    "send_checkout_reminder": "now",
    "request_payment_method_update": "now",
}


STRATEGY_REASONS = {
    "retry_payment":
        "A transient payment problem may succeed on a bounded retry.",

    "send_payment_reminder":
        "The customer may need time or funds before another payment attempt.",

    "send_checkout_reminder":
        "The customer started checkout but did not complete the payment.",

    "request_payment_method_update":
        "The current payment method is unlikely to succeed without an update.",
}


def _normalize_failure_reason(
    transaction: Dict[str, Any],
) -> str:

    reason = str(
        transaction.get(
            "failure_reason",
            "",
        )
    ).strip().lower()

    aliases = {
        "payment_method_expired": "expired_card",
        "card_expired": "expired_card",
        "timeout": "network_timeout",
        "network_error": "network_timeout",
        "temporary_failure":
            "temporary_payment_failure",
        "insufficient_balance":
            "insufficient_funds",
    }

    return aliases.get(
        reason,
        reason,
    )


def _is_strategy_allowed(
    transaction: Dict[str, Any],
    action: str,
) -> bool:

    amount = float(
        transaction.get(
            "amount",
            0,
        ) or 0
    )

    retry_count = int(
        transaction.get(
            "retry_count",
            0,
        ) or 0
    )

    risk = str(
        transaction.get(
            "risk_level",
            "medium",
        )
    ).lower()

    # Existing safety boundary.
    if amount > MAX_AUTOMATIC_RECOVERY_AMOUNT:
        return False

    # Existing high-risk boundary.
    if risk == "high":
        return False

    # Existing retry limit.
    if (
        action == "retry_payment"
        and retry_count >= MAX_AUTOMATIC_RETRIES
    ):
        return False

    # IMPORTANT:
    # Never automatically retry an insufficient-funds
    # transaction simply because ML predicts success.
    if (
        _normalize_failure_reason(transaction)
        == "insufficient_funds"
        and action == "retry_payment"
    ):
        return False

    return True


def _candidate_actions(
    transaction: Dict[str, Any],
) -> List[str]:

    failure_reason = _normalize_failure_reason(
        transaction
    )

    if failure_reason == "insufficient_funds":

        return [
            "send_payment_reminder",
        ]

    if failure_reason == "checkout_abandoned":

        return [
            "send_checkout_reminder",
            "send_payment_reminder",
        ]

    if failure_reason in {
        "expired_card",
        "payment_method_expired",
    }:

        return [
            "request_payment_method_update",
            "send_payment_reminder",
        ]

    if failure_reason in {
        "network_timeout",
        "temporary_payment_failure",
    }:

        return [
            "retry_payment",
            "send_payment_reminder",
        ]

    if failure_reason == "overdue":

        return [
            "send_payment_reminder",
        ]

    return [
        "send_payment_reminder",
        "request_payment_method_update",
    ]


def _confidence_band(
    probability: float,
) -> str:

    if probability >= 0.80:
        return "high"

    if probability >= 0.60:
        return "medium"

    return "low"


def _evaluate_strategy(
    transaction: Dict[str, Any],
    action: str,
) -> Dict[str, Any]:

    amount = float(
        transaction.get(
            "amount",
            0,
        ) or 0
    )

    allowed = _is_strategy_allowed(
        transaction,
        action,
    )

    # Ask the trained ML model:
    #
    # "What is the probability of recovery
    #  if this particular strategy is used?"
    #
    ml_result = predict_recovery_probability(
        transaction,
        action,
    )

    probability = float(
        ml_result.get(
            "recovery_probability",
            0,
        )
    )

    expected_recovery = (
        amount * probability
    )

    # A strategy that violates a deterministic
    # guardrail can never win the optimizer.
    if not allowed:
        expected_recovery = 0.0

    return {
        "action": action,

        "probability": round(
            probability,
            4,
        ),

        "recovery_percentage": round(
            probability * 100,
            2,
        ),

        "confidence_band":
            _confidence_band(
                probability
            ),

        "expected_recovery_value":
            round(
                expected_recovery,
                2,
            ),

        "timing":
            STRATEGY_TIMING[action],

        "allowed_automatically":
            allowed,

        "reason":
            STRATEGY_REASONS[action],

        "model":
            ml_result.get(
                "model",
                "logistic_regression",
            ),

        "model_version":
            ml_result.get(
                "model_version",
                "1.0",
            ),
    }


def optimize_recovery_strategy(
    transaction: Dict[str, Any],
) -> Dict[str, Any]:

    candidates = _candidate_actions(
        transaction
    )

    strategies = []

    for action in candidates:

        try:

            result = _evaluate_strategy(
                transaction,
                action,
            )

            strategies.append(result)

        except Exception as error:

            print(
                "ML strategy evaluation failed "
                f"for {action}: {error}"
            )

            # If the ML model fails, do not
            # invent a probability.
            strategies.append({
                "action": action,
                "probability": 0.0,
                "recovery_percentage": 0.0,
                "confidence_band": "low",
                "expected_recovery_value": 0.0,
                "timing":
                    STRATEGY_TIMING[action],
                "allowed_automatically":
                    False,
                "reason":
                    "ML prediction unavailable; "
                    "human review required.",
                "model":
                    "unavailable",
                "model_version":
                    "unknown",
            })

    # Highest expected revenue wins.
    strategies.sort(
        key=lambda item: (
            item[
                "expected_recovery_value"
            ],
            item["probability"],
        ),
        reverse=True,
    )

    if not strategies:

        return {
            "transaction_id":
                transaction.get("id"),
            "recommended_strategy": {
                "action":
                    "escalate_to_human",
                "probability": 0.0,
                "expected_recovery_value": 0.0,
                "timing":
                    "human_review",
                "allowed_automatically":
                    False,
                "reason":
                    "No safe recovery strategy available.",
            },
            "alternatives": [],
            "execution_mode":
                "human_review",
            "requires_human_review":
                True,
            "optimizer_version":
                "2.0-ml",
        }

    best_strategy = strategies[0]

    amount = float(
        transaction.get(
            "amount",
            0,
        ) or 0
    )

    risk = str(
        transaction.get(
            "risk_level",
            "medium",
        )
    ).lower()

    requires_human_review = (
        amount > MAX_AUTOMATIC_RECOVERY_AMOUNT
        or risk == "high"
        or not best_strategy[
            "allowed_automatically"
        ]
        or best_strategy[
            "model"
        ] == "unavailable"
    )

    if requires_human_review:

        execution_mode = "human_review"

    elif best_strategy["timing"] == "later":

        execution_mode = "later"

    else:

        execution_mode = "now"

    return {
        "transaction_id":
            transaction.get("id"),

        "failure_reason":
            _normalize_failure_reason(
                transaction
            ),

        "recommended_strategy":
            best_strategy,

        "alternatives":
            strategies[1:],

        "execution_mode":
            execution_mode,

        "requires_human_review":
            requires_human_review,

        "optimizer_version":
            "2.0-ml",
    }
