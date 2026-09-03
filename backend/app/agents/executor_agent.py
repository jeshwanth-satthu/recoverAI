def executor_agent(transaction, decision):
    """
    Execute a bounded simulated recovery action.

    IMPORTANT:
    This is a simulation for the buildathon.
    It does not move real money.

    The executor is intentionally deterministic so that
    the same AI decision produces a reproducible demo result.
    """

    action = decision.get(
        "action",
        "no_action"
    )

    amount = transaction.get(
        "amount",
        0
    )

    transaction_id = transaction.get(
        "id"
    )

    # ---------------------------------------------------------
    # No action
    # ---------------------------------------------------------

    if action == "no_action":

        return {
            "status": "stopped",
            "message": "No recovery action selected",
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "transaction_id": transaction_id
        }

    # ---------------------------------------------------------
    # Human escalation
    # ---------------------------------------------------------

    if action == "escalate_to_human":

        return {
            "status": "pending",
            "message": (
                "Recovery requires human approval"
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "requires_human_approval": True,
            "transaction_id": transaction_id
        }

    # ---------------------------------------------------------
    # Retry payment
    # ---------------------------------------------------------

    if action == "retry_payment":

        return {
            "status": "success",
            "message": "Payment retry succeeded",
            "action": action,
            "recovered": True,
            "amount_recovered": amount,
            "transaction_id": transaction_id
        }

    # ---------------------------------------------------------
    # Payment reminder
    # ---------------------------------------------------------

    if action == "send_payment_reminder":

        return {
            "status": "pending",
            "message": (
                "Payment reminder sent; "
                "customer has not completed payment"
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "transaction_id": transaction_id
        }

    # ---------------------------------------------------------
    # Checkout reminder
    # ---------------------------------------------------------

    if action == "send_checkout_reminder":

        return {
            "status": "pending",
            "message": (
                "Checkout reminder sent; "
                "customer has not returned"
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "transaction_id": transaction_id
        }

    # ---------------------------------------------------------
    # Payment method update
    # ---------------------------------------------------------

    if action == "request_payment_method_update":

        return {
            "status": "success",
            "message": (
                "Payment method updated and "
                "payment recovered"
            ),
            "action": action,
            "recovered": True,
            "amount_recovered": amount,
            "transaction_id": transaction_id
        }

    # ---------------------------------------------------------
    # Unknown action
    # ---------------------------------------------------------

    return {
        "status": "stopped",
        "message": (
            "Unsupported recovery action"
        ),
        "action": action,
        "recovered": False,
        "amount_recovered": 0,
        "transaction_id": transaction_id
    }