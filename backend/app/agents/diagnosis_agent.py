from app.services.gemini_service import ask_gemini_json


def _normalize_reason(value):
    """
    Normalize a transaction failure reason for
    deterministic fallback matching.
    """

    if value is None:
        return ""

    return (
        str(value)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def _fallback_diagnosis(transaction):
    """
    Deterministic diagnosis used when Gemini is unavailable.

    IMPORTANT:
    This uses the actual transaction failure_reason,
    not the entire Gemini prompt.
    """

    failure_reason = _normalize_reason(
        transaction.get("failure_reason")
    )

    # ---------------------------------------------------------
    # Insufficient funds
    # ---------------------------------------------------------

    if (
        "insufficient_funds" in failure_reason
        or "insufficient" in failure_reason
    ):
        return {
            "diagnosis": "Insufficient funds",
            "confidence": 0.95,
            "reasoning": (
                "The transaction failure reason indicates "
                "insufficient funds."
            ),
            "severity": "medium",
        }

    # ---------------------------------------------------------
    # Temporary payment failure
    # ---------------------------------------------------------

    if (
        "temporary_payment_failure" in failure_reason
        or "temporary" in failure_reason
    ):
        return {
            "diagnosis": "Temporary payment failure",
            "confidence": 0.95,
            "reasoning": (
                "The transaction failure reason indicates "
                "a temporary payment failure."
            ),
            "severity": "medium",
        }

    # ---------------------------------------------------------
    # Network timeout
    # ---------------------------------------------------------

    if (
        "network_timeout" in failure_reason
        or "timeout" in failure_reason
    ):
        return {
            "diagnosis": "Network timeout during payment",
            "confidence": 0.95,
            "reasoning": (
                "The transaction failure reason indicates "
                "a network timeout."
            ),
            "severity": "medium",
        }

    # ---------------------------------------------------------
    # Checkout abandoned
    # ---------------------------------------------------------

    if (
        "checkout_abandoned" in failure_reason
        or "abandoned" in failure_reason
    ):
        return {
            "diagnosis": "Customer abandoned checkout",
            "confidence": 0.95,
            "reasoning": (
                "The transaction indicates that the customer "
                "abandoned checkout."
            ),
            "severity": "medium",
        }

    # ---------------------------------------------------------
    # Expired card / payment method
    # ---------------------------------------------------------

    if (
        "expired_card" in failure_reason
        or "payment_method_expired" in failure_reason
        or "expired" in failure_reason
    ):
        return {
            "diagnosis": "Payment method has expired",
            "confidence": 0.95,
            "reasoning": (
                "The transaction failure reason indicates "
                "an expired payment method."
            ),
            "severity": "medium",
        }

    # ---------------------------------------------------------
    # Overdue payment
    # ---------------------------------------------------------

    if (
        "payment_overdue" in failure_reason
        or "overdue" in failure_reason
    ):
        return {
            "diagnosis": "Payment is overdue",
            "confidence": 0.95,
            "reasoning": (
                "The transaction failure reason indicates "
                "an overdue payment."
            ),
            "severity": "medium",
        }

    # ---------------------------------------------------------
    # Unknown
    # ---------------------------------------------------------

    return {
        "diagnosis": "Unknown payment issue",
        "confidence": 0.50,
        "reasoning": (
            "Gemini was unavailable and the transaction "
            "failure reason could not be confidently classified."
        ),
        "severity": "medium",
    }


def diagnosis_agent(
    transaction,
    customer_profile=None
):
    """
    AI diagnosis agent.

    Gemini is used when available.

    If Gemini is unavailable, a deterministic diagnosis
    is generated from the actual transaction failure reason.
    """

    prompt = f"""
You are the diagnosis agent for RecoverAI, an AI revenue recovery system.

Your job is to diagnose WHY a merchant transaction is at risk.

You must analyze the transaction and available customer history.

TRANSACTION:
- Transaction ID: {transaction.get("id")}
- Amount: ₹{transaction.get("amount")}
- Status: {transaction.get("status")}
- Failure reason: {transaction.get("failure_reason")}
- Transaction type: {transaction.get("type")}
- Retry count: {transaction.get("retry_count", 0)}
- Risk level: {transaction.get("risk_level")}

CUSTOMER:
- Name: {transaction.get("customer")}
- Email: {transaction.get("email")}

CUSTOMER HISTORY:
{customer_profile if customer_profile else "No customer history available"}

Return ONLY valid JSON with this exact structure:

{{
    "diagnosis": "short diagnosis",
    "confidence": 0.0,
    "reasoning": "brief explanation based on the available evidence",
    "severity": "low|medium|high"
}}

Rules:

1. Do not invent information.
2. Use the transaction failure reason when available.
3. Confidence must be between 0 and 1.
4. Keep reasoning concise.
5. This is a payment recovery system, not a fraud detection system.
"""

    # =========================================================
    # TRY GEMINI
    # =========================================================

    try:

        result = ask_gemini_json(
            prompt
        )

    except Exception as error:

        print(
            f"Gemini diagnosis failed: {error}"
        )

        result = None

    # =========================================================
    # GEMINI UNAVAILABLE
    # =========================================================

    if result is None:

        print(
            "Using deterministic diagnosis fallback."
        )

        return _fallback_diagnosis(
            transaction
        )

    # =========================================================
    # VALIDATE GEMINI RESULT
    # =========================================================

    if not isinstance(
        result,
        dict
    ):

        print(
            "Gemini diagnosis returned invalid data. "
            "Using deterministic fallback."
        )

        return _fallback_diagnosis(
            transaction
        )

    # =========================================================
    # CONFIDENCE
    # =========================================================

    try:

        confidence = float(
            result.get(
                "confidence",
                0
            )
        )

    except (
        TypeError,
        ValueError
    ):

        confidence = 0.0

    confidence = max(
        0.0,
        min(
            1.0,
            confidence
        )
    )

    # =========================================================
    # SEVERITY
    # =========================================================

    severity = result.get(
        "severity",
        "medium"
    )

    if severity not in [
        "low",
        "medium",
        "high",
    ]:

        severity = "medium"

    # =========================================================
    # RETURN GEMINI RESULT
    # =========================================================

    return {
        "diagnosis": result.get(
            "diagnosis",
            "Unknown payment issue"
        ),

        "confidence": confidence,

        "reasoning": result.get(
            "reasoning",
            ""
        ),

        "severity": severity,

        "ai_generated": True,
    }