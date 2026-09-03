MAX_AUTOMATIC_RECOVERY_AMOUNT = 10000
MAX_AUTOMATIC_RETRIES = 3

ALLOWED_ACTIONS = {
    "retry_payment",
    "send_payment_reminder",
    "send_checkout_reminder",
    "request_payment_method_update",
    "escalate_to_human",
    "no_action",
}


def guardrail_agent(transaction, action):

    amount = float(transaction.get("amount", 0))
    risk_level = transaction.get("risk_level", "medium")
    retry_count = int(transaction.get("retry_count", 0))

    # ---------------------------------------------------------
    # Unknown action
    # ---------------------------------------------------------

    if action not in ALLOWED_ACTIONS:

        return {
            "passed": False,
            "reason": (
                f"Action '{action}' is not permitted "
                "by merchant policy."
            ),
            "requires_human_approval": True,
        }

    # ---------------------------------------------------------
    # Explicit human escalation
    # ---------------------------------------------------------

    if action == "escalate_to_human":

        return {
            "passed": False,
            "reason": (
                "AI selected human escalation."
            ),
            "requires_human_approval": True,
        }

    # ---------------------------------------------------------
    # No action
    # ---------------------------------------------------------

    if action == "no_action":

        return {
            "passed": False,
            "reason": (
                "No recovery action was recommended."
            ),
            "requires_human_approval": False,
        }

    # ---------------------------------------------------------
    # High-risk transactions
    # ---------------------------------------------------------

    if risk_level == "high":

        return {
            "passed": False,
            "reason": (
                "High-risk transaction requires "
                "human approval before recovery."
            ),
            "requires_human_approval": True,
        }

    # ---------------------------------------------------------
    # Amount limit
    # ---------------------------------------------------------

    if amount > MAX_AUTOMATIC_RECOVERY_AMOUNT:

        return {
            "passed": False,
            "reason": (
                f"Automatic recovery is limited to "
                f"transactions of ₹{MAX_AUTOMATIC_RECOVERY_AMOUNT:,} "
                f"or less. This ₹{amount:,.0f} transaction "
                "requires human approval."
            ),
            "requires_human_approval": True,
        }

    # ---------------------------------------------------------
    # Retry limit
    # ---------------------------------------------------------

    if (
        action == "retry_payment"
        and retry_count >= MAX_AUTOMATIC_RETRIES
    ):

        return {
            "passed": False,
            "reason": (
                f"Maximum automatic retry limit of "
                f"{MAX_AUTOMATIC_RETRIES} has been reached."
            ),
            "requires_human_approval": True,
        }

    # ---------------------------------------------------------
    # Everything passed
    # ---------------------------------------------------------

    return {
        "passed": True,
        "reason": (
            "Action is within merchant policy: "
            f"amount ₹{amount:,.0f}, "
            f"risk={risk_level}, "
            f"retry_count={retry_count}."
        ),
        "requires_human_approval": False,
    }