from typing import Any, Dict, List
from datetime import datetime, timedelta


ANOMALY_THRESHOLD = 2.0
CIRCUIT_BREAKER_THRESHOLD = 3.0
MINIMUM_SAMPLE_SIZE = 5


def _failure_rate(transactions: List[Dict[str, Any]]) -> float:
    if not transactions:
        return 0.0

    failed = sum(
        1
        for tx in transactions
        if tx.get("status") in {
            "failed",
            "abandoned",
        }
    )

    return failed / len(transactions)


def detect_recovery_anomaly(
    transactions: List[Dict[str, Any]],
) -> Dict[str, Any]:

    if len(transactions) < MINIMUM_SAMPLE_SIZE:
        return {
            "anomaly_detected": False,
            "circuit_breaker": False,
            "reason": "Insufficient transaction history.",
            "current_failure_rate": 0.0,
            "baseline_failure_rate": 0.0,
            "severity": "low",
        }

    now = datetime.utcnow()

    recent = []
    baseline = []

    for tx in transactions:

        created_at = tx.get("created_at")

        if not created_at:
            continue

        try:
            if isinstance(created_at, str):
                timestamp = datetime.fromisoformat(
                    created_at.replace("Z", "")
                )
            else:
                timestamp = created_at

        except Exception:
            continue

        age = now - timestamp

        if age <= timedelta(hours=1):
            recent.append(tx)

        elif age <= timedelta(hours=24):
            baseline.append(tx)

    if (
        len(recent) < MINIMUM_SAMPLE_SIZE
        or len(baseline) < MINIMUM_SAMPLE_SIZE
    ):
        return {
            "anomaly_detected": False,
            "circuit_breaker": False,
            "reason": "Not enough recent/baseline data.",
            "current_failure_rate":
                round(_failure_rate(recent), 4),
            "baseline_failure_rate":
                round(_failure_rate(baseline), 4),
            "severity": "low",
        }

    current_rate = _failure_rate(recent)
    baseline_rate = _failure_rate(baseline)

    # Avoid division by zero.
    if baseline_rate == 0:
        ratio = (
            float("inf")
            if current_rate > 0
            else 1.0
        )
    else:
        ratio = current_rate / baseline_rate

    anomaly_detected = (
        ratio >= ANOMALY_THRESHOLD
    )

    circuit_breaker = (
        ratio >= CIRCUIT_BREAKER_THRESHOLD
    )

    if circuit_breaker:
        severity = "critical"
    elif anomaly_detected:
        severity = "high"
    else:
        severity = "low"

    return {
        "anomaly_detected":
            anomaly_detected,

        "circuit_breaker":
            circuit_breaker,

        "severity":
            severity,

        "current_failure_rate":
            round(current_rate, 4),

        "baseline_failure_rate":
            round(baseline_rate, 4),

        "failure_rate_ratio":
            round(ratio, 2)
            if ratio != float("inf")
            else None,

        "recent_transactions":
            len(recent),

        "baseline_transactions":
            len(baseline),

        "reason":
            (
                "Payment failures are significantly above "
                "the normal baseline."
                if anomaly_detected
                else
                "Payment failure rate is within normal range."
            ),
    }
