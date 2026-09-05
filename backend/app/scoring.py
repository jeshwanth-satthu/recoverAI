from typing import Dict, Any


# ============================================================
# RECOVERAI RECOVERY SCORING
# ============================================================

FAILURE_PROBABILITIES = {
    "network_timeout": 0.85,
    "temporary_payment_failure": 0.75,
    "expired_card": 0.82,
    "payment_method_expired": 0.82,
    "insufficient_funds": 0.55,
    "checkout_abandoned": 0.68,
    "overdue": 0.60,
}


def normalize_failure_reason(value):
    if value is None:
        return ""

    return (
        str(value)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def get_recovery_probability(transaction: Dict[str, Any]) -> float:
    """
    Estimate the probability that the failed revenue can
    eventually be recovered.

    This is deliberately deterministic.
    It does not execute payments and does not call Gemini.
    """

    failure_reason = normalize_failure_reason(
        transaction.get("failure_reason")
    )

    # Exact / partial matching
    for reason, probability in FAILURE_PROBABILITIES.items():
        if reason in failure_reason:
            return probability

    # Status-based fallback
    status = normalize_failure_reason(
        transaction.get("status")
    )

    if status == "abandoned":
        return 0.68

    if status == "overdue":
        return 0.60

    # Unknown failure = conservative estimate
    return 0.40


def get_recommended_recovery_strategy(transaction):
    """
    Determine the most appropriate recovery strategy
    for scoring purposes.

    IMPORTANT:
    This does NOT execute the strategy.
    """

    failure_reason = normalize_failure_reason(
        transaction.get("failure_reason")
    )

    retry_count = transaction.get("retry_count", 0)

    try:
        retry_count = int(retry_count)
    except (TypeError, ValueError):
        retry_count = 0

    if "insufficient" in failure_reason:
        return {
            "action": "send_payment_reminder",
            "timing": "later",
            "reason": "Funds are unavailable now; avoid an immediate retry.",
        }

    if (
        "expired" in failure_reason
        or "payment_method_expired" in failure_reason
    ):
        return {
            "action": "request_payment_method_update",
            "timing": "now",
            "reason": "The payment method must be updated before recovery.",
        }

    if "abandoned" in failure_reason:
        return {
            "action": "send_checkout_reminder",
            "timing": "now",
            "reason": "The customer abandoned checkout.",
        }

    if "overdue" in failure_reason:
        return {
            "action": "send_payment_reminder",
            "timing": "now",
            "reason": "The payment is overdue.",
        }

    if "network" in failure_reason or "timeout" in failure_reason:
        if retry_count < 3:
            return {
                "action": "retry_payment",
                "timing": "now",
                "reason": "Temporary network failure with retry capacity available.",
            }

        return {
            "action": "escalate_to_human",
            "timing": "human_review",
            "reason": "Retry limit has been reached.",
        }

    if "temporary" in failure_reason:
        if retry_count < 3:
            return {
                "action": "retry_payment",
                "timing": "now",
                "reason": "Temporary payment failure with retry capacity available.",
            }

        return {
            "action": "escalate_to_human",
            "timing": "human_review",
            "reason": "Retry limit has been reached.",
        }

    return {
        "action": "escalate_to_human",
        "timing": "human_review",
        "reason": "Failure reason is unclear.",
    }


def calculate_recovery_score(transaction):
    """
    Calculate a deterministic 0-100 recovery score.

    The score represents how attractive a transaction is
    as a recovery opportunity.

    It is NOT a guarantee of recovery.
    """

    amount = transaction.get("amount", 0)

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        amount = 0

    probability = get_recovery_probability(transaction)

    strategy = get_recommended_recovery_strategy(
        transaction
    )

    risk_level = str(
        transaction.get("risk_level", "medium")
    ).lower()

    retry_count = transaction.get("retry_count", 0)

    try:
        retry_count = int(retry_count)
    except (TypeError, ValueError):
        retry_count = 0

    # --------------------------------------------------------
    # Base score
    # --------------------------------------------------------

    score = probability * 100

    # --------------------------------------------------------
    # Risk adjustment
    # --------------------------------------------------------

    if risk_level == "high":
        score -= 20

    elif risk_level == "low":
        score += 5

    # --------------------------------------------------------
    # Retry fatigue
    # --------------------------------------------------------

    score -= min(retry_count * 8, 24)

    # --------------------------------------------------------
    # Human-only actions should rank lower
    # --------------------------------------------------------

    if strategy["action"] == "escalate_to_human":
        score -= 10

    score = max(
        0,
        min(
            100,
            round(score),
        ),
    )

    # --------------------------------------------------------
    # Expected recovery value
    # --------------------------------------------------------

    expected_recovery_value = round(
        amount * probability,
        2,
    )

    return {
        "recovery_score": score,
        "recovery_probability": round(
            probability,
            4,
        ),
        "expected_recovery_value": expected_recovery_value,
        "recommended_strategy": strategy,
    }


def score_transaction(transaction):
    """
    Public helper used by APIs and the frontend.
    """

    result = calculate_recovery_score(
        transaction
    )

    return {
        "transaction_id": transaction.get("id"),
        "customer": transaction.get("customer"),
        "amount": transaction.get("amount", 0),
        "currency": transaction.get("currency", "INR"),
        "failure_reason": transaction.get("failure_reason"),
        "risk_level": transaction.get("risk_level"),
        **result,
    }


def build_recovery_priority_queue(transactions):
    """
    Score all currently recoverable transactions and
    return them ordered by expected recoverable revenue.
    """

    opportunities = []

    for transaction in transactions:

        if transaction.get("recoverable") is not True:
            continue

        opportunity = score_transaction(
            transaction
        )

        opportunities.append(
            opportunity
        )

    opportunities.sort(
        key=lambda item: (
            item["expected_recovery_value"],
            item["recovery_score"],
        ),
        reverse=True,
    )

    for index, opportunity in enumerate(
        opportunities,
        start=1,
    ):
        opportunity["priority"] = index

    return opportunities
