from app.services.gemini_service import ask_gemini_json


ALLOWED_ACTIONS = [
    "retry_payment",
    "send_payment_reminder",
    "send_checkout_reminder",
    "request_payment_method_update",
    "escalate_to_human",
    "no_action",
]


def _normalize_reason(value):
    """
    Normalize a failure reason / diagnosis so that
    deterministic fallback rules can match it reliably.
    """
    if value is None:
        return ""

    return str(value).strip().lower().replace("-", "_").replace(" ", "_")


def _fallback_decision(transaction, diagnosis):
    """
    Deterministic decision engine used when Gemini is unavailable.

    This is intentionally rule-based so Gemini quota exhaustion
    cannot cause every transaction to become retry_payment.
    """

    failure_reason = _normalize_reason(
        transaction.get("failure_reason")
    )

    status = _normalize_reason(
        transaction.get("status")
    )

    diagnosis_text = _normalize_reason(
        diagnosis.get("diagnosis")
    )

    retry_count = transaction.get(
        "retry_count",
        0
    )

    try:
        retry_count = int(retry_count)
    except (TypeError, ValueError):
        retry_count = 0

    # ---------------------------------------------------------
    # 1. Expired payment method
    # ---------------------------------------------------------

    if (
        "expired" in failure_reason
        or "expired" in diagnosis_text
        or "expired_card" in failure_reason
        or "payment_method_expired" in failure_reason
    ):
        return {
            "action": "request_payment_method_update",
            "reason": (
                "Fallback decision: the payment method has expired, "
                "so the customer should update their payment method."
            ),
            "confidence": 0.95,
            "ai_generated": False,
        }

    # ---------------------------------------------------------
    # 2. Insufficient funds
    # ---------------------------------------------------------

    if (
        "insufficient" in failure_reason
        or "insufficient_funds" in failure_reason
        or "insufficient" in diagnosis_text
    ):
        return {
            "action": "send_payment_reminder",
            "reason": (
                "Fallback decision: insufficient funds should use "
                "a payment reminder rather than an automatic retry."
            ),
            "confidence": 0.95,
            "ai_generated": False,
        }

    # ---------------------------------------------------------
    # 3. Checkout abandoned
    # ---------------------------------------------------------

    if (
        "abandoned" in failure_reason
        or "checkout_abandoned" in failure_reason
        or "abandoned" in diagnosis_text
        or status == "abandoned"
    ):
        return {
            "action": "send_checkout_reminder",
            "reason": (
                "Fallback decision: the customer abandoned checkout, "
                "so a checkout recovery reminder is appropriate."
            ),
            "confidence": 0.95,
            "ai_generated": False,
        }

    # ---------------------------------------------------------
    # 4. Overdue payment
    # ---------------------------------------------------------

    if (
        "overdue" in failure_reason
        or "payment_overdue" in failure_reason
        or "overdue" in diagnosis_text
        or status == "overdue"
    ):
        return {
            "action": "send_payment_reminder",
            "reason": (
                "Fallback decision: the payment is overdue, "
                "so a payment reminder is appropriate."
            ),
            "confidence": 0.95,
            "ai_generated": False,
        }

    # ---------------------------------------------------------
    # 5. Network timeout
    # ---------------------------------------------------------

    if (
        "network" in failure_reason
        or "timeout" in failure_reason
        or "network_timeout" in failure_reason
        or "network" in diagnosis_text
        or "timeout" in diagnosis_text
    ):

        if retry_count < 3:
            return {
                "action": "retry_payment",
                "reason": (
                    "Fallback decision: network timeouts are suitable "
                    "for a bounded retry."
                ),
                "confidence": 0.95,
                "ai_generated": False,
            }

        return {
            "action": "escalate_to_human",
            "reason": (
                "Fallback decision: retry limit has been reached "
                "for the network timeout."
            ),
            "confidence": 0.95,
            "ai_generated": False,
        }

    # ---------------------------------------------------------
    # 6. Temporary payment failure
    # ---------------------------------------------------------

    if (
        "temporary" in failure_reason
        or "temporary_payment_failure" in failure_reason
        or "temporary" in diagnosis_text
    ):

        if retry_count < 3:
            return {
                "action": "retry_payment",
                "reason": (
                    "Fallback decision: temporary payment failures "
                    "are suitable for a bounded retry."
                ),
                "confidence": 0.95,
                "ai_generated": False,
            }

        return {
            "action": "escalate_to_human",
            "reason": (
                "Fallback decision: retry limit has been reached "
                "for the temporary payment failure."
            ),
            "confidence": 0.95,
            "ai_generated": False,
        }

    # ---------------------------------------------------------
    # 7. Unknown failure
    # ---------------------------------------------------------

    return {
        "action": "escalate_to_human",
        "reason": (
            "Fallback decision: failure reason is unclear, "
            "so human review is required."
        ),
        "confidence": 0.50,
        "ai_generated": False,
    }


def decision_agent(
    transaction,
    diagnosis,
    customer_profile=None
):
    """
    AI-powered recovery decision agent.

    Gemini recommends an action when available.

    If Gemini is unavailable or quota is exceeded,
    deterministic fallback rules are used.

    Gemini does NOT execute payments.
    The guardrail agent remains responsible for
    deciding whether the action is allowed.
    """

    prompt = f"""
You are the recovery decision agent for RecoverAI.

Your job is to choose the safest and most appropriate
revenue recovery intervention for a merchant transaction.

You MUST choose exactly one action from this list:

{ALLOWED_ACTIONS}

TRANSACTION:

Transaction ID:
{transaction.get("id")}

Customer:
{transaction.get("customer")}

Amount:
₹{transaction.get("amount")}

Status:
{transaction.get("status")}

Failure reason:
{transaction.get("failure_reason")}

Transaction type:
{transaction.get("type")}

Retry count:
{transaction.get("retry_count", 0)}

Risk level:
{transaction.get("risk_level")}


AI DIAGNOSIS:

Diagnosis:
{diagnosis.get("diagnosis")}

Confidence:
{diagnosis.get("confidence")}

Reasoning:
{diagnosis.get("reasoning")}

Severity:
{diagnosis.get("severity")}


CUSTOMER HISTORY:

{customer_profile if customer_profile else "No customer history available"}


DECISION RULES:

1. Choose only one action from the allowed list.
2. Prefer the least aggressive intervention that can reasonably
   recover the payment.
3. Do not invent customer information.
4. Do not claim that money has been recovered.
5. You are recommending an action only.
6. Do not bypass merchant safety policies.
7. High-risk or uncertain situations may be escalated to a human.
8. Temporary payment failures should generally use retry_payment
   when retry_count is low.
9. Network timeouts should generally use retry_payment
   when retry_count is low.
10. Insufficient funds should use send_payment_reminder.
11. Checkout abandonment should use send_checkout_reminder.
12. Expired payment methods should use
    request_payment_method_update.
13. Overdue payments should use send_payment_reminder.
14. Never use retry_payment merely because Gemini cannot determine
    the correct action.
15. Match the action to the actual failure reason.

Return ONLY valid JSON.

Required format:

{{
    "action": "one_allowed_action",
    "reason": "brief explanation",
    "confidence": 0.0
}}
"""

    # ---------------------------------------------------------
    # Try Gemini first
    # ---------------------------------------------------------

    try:

        result = ask_gemini_json(prompt)
        if result is None:
            return _fallback_decision(
                transaction,
                diagnosis
    )
        action = result.get(
            "action",
            "no_action"
        )

        # Never trust an invalid Gemini action.
        if action not in ALLOWED_ACTIONS:
            raise ValueError(
                f"Invalid Gemini action: {action}"
            )

        confidence = result.get(
            "confidence",
            0
        )

        try:
            confidence = float(
                confidence
            )
        except (TypeError, ValueError):
            confidence = 0.0

        confidence = max(
            0.0,
            min(
                1.0,
                confidence
            )
        )

        return {
            "action": action,
            "reason": result.get(
                "reason",
                "No reason provided by AI"
            ),
            "confidence": confidence,
            "ai_generated": True,
        }

    # ---------------------------------------------------------
    # Gemini unavailable / quota exceeded
    # ---------------------------------------------------------

    except Exception as exc:

        print(
            f"Gemini decision unavailable: {exc}"
        )

        print(
            "Using deterministic recovery decision fallback."
        )

        return _fallback_decision(
            transaction,
            diagnosis
        )