from typing import Any, Dict


FAILURE_REASONS = [
    "temporary_payment_failure",
    "expired_card",
    "network_timeout",
    "insufficient_funds",
    "payment_overdue",
    "checkout_abandoned",
    "declined by bank",
    "unknown",
]

TRANSACTION_TYPES = [
    "subscription",
    "one_time",
    "invoice",
    "unknown",
]

RISK_LEVELS = [
    "low",
    "medium",
    "high",
    "unknown",
]

RECOVERY_ACTIONS = [
    "retry_payment",
    "send_payment_reminder",
    "request_payment_method_update",
    "send_checkout_reminder",
    "escalate_to_human",
    "unknown",
]


def normalize(value: Any, default: str = "unknown") -> str:
    if value is None:
        return default

    value = str(value).strip().lower()

    return value if value else default


def one_hot(
    value: str,
    categories: list[str],
    prefix: str,
) -> Dict[str, int]:

    return {
        f"{prefix}_{category.replace(' ', '_')}":
        int(value == category)
        for category in categories
    }


def build_feature_row(
    transaction: Dict[str, Any],
    action: str,
) -> Dict[str, Any]:

    failure_reason = normalize(
        transaction.get("failure_reason")
    )

    if failure_reason not in FAILURE_REASONS:
        failure_reason = "unknown"

    transaction_type = normalize(
        transaction.get("type")
        or transaction.get("transaction_type")
    )

    if transaction_type not in TRANSACTION_TYPES:
        transaction_type = "unknown"

    risk_level = normalize(
        transaction.get("risk_level")
    )

    if risk_level not in RISK_LEVELS:
        risk_level = "unknown"

    action = normalize(action)

    if action not in RECOVERY_ACTIONS:
        action = "unknown"

    amount = float(
        transaction.get("amount", 0) or 0
    )

    retry_count = int(
        transaction.get("retry_count", 0) or 0
    )

    features = {
        "amount": amount,
        "retry_count": retry_count,
        "failure_reason": failure_reason,
        "risk_level": risk_level,
        "transaction_type": transaction_type,
        "action": action,
    }

    features.update(
        one_hot(
            failure_reason,
            FAILURE_REASONS,
            "failure",
        )
    )

    features.update(
        one_hot(
            transaction_type,
            TRANSACTION_TYPES,
            "type",
        )
    )

    features.update(
        one_hot(
            risk_level,
            RISK_LEVELS,
            "risk",
        )
    )

    features.update(
        one_hot(
            action,
            RECOVERY_ACTIONS,
            "action",
        )
    )

    return features
