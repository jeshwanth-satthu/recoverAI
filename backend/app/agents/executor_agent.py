from app.services.message_service import generate_customer_recovery_message


def executor_agent(transaction, decision, customer_profile=None):
    """
    Execute a bounded recovery action dispatch.

    CRITICAL INVARIANTS:
    - An AI decision or dispatched reminder does NOT equal a recovered payment.
    - The executor agent MUST NOT declare a payment recovered on its own.
    - Recovered revenue must NEVER increase simply because an agent ran.
    - Status remains 'pending' / 'action_dispatched' until real payment verification.
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
    # Generate Customer Recovery Message for customer actions
    # ---------------------------------------------------------
    recovery_message = None
    if action in {
        "send_payment_reminder",
        "send_checkout_reminder",
        "request_payment_method_update",
        "retry_payment",
    }:
        recovery_message = generate_customer_recovery_message(
            transaction,
            decision,
            customer_profile
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
            "transaction_id": transaction_id,
            "recovery_message": None,
        }

    # ---------------------------------------------------------
    # Human escalation
    # ---------------------------------------------------------

    if action == "escalate_to_human":

        return {
            "status": "pending",
            "message": (
                "Recovery requires human approval before dispatch"
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "requires_human_approval": True,
            "transaction_id": transaction_id,
            "recovery_message": recovery_message,
        }

    # ---------------------------------------------------------
    # Retry payment
    # ---------------------------------------------------------

    if action == "retry_payment":

        return {
            "status": "pending",
            "message": "Payment retry scheduled. Awaiting gateway settlement.",
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "action_dispatched": True,
            "transaction_id": transaction_id,
            "recovery_message": recovery_message,
        }

    # ---------------------------------------------------------
    # Payment reminder
    # ---------------------------------------------------------

    if action == "send_payment_reminder":

        return {
            "status": "pending",
            "message": (
                "Personalized payment recovery reminder generated. "
                "Awaiting customer payment completion."
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "action_dispatched": True,
            "transaction_id": transaction_id,
            "recovery_message": recovery_message,
        }

    # ---------------------------------------------------------
    # Checkout reminder
    # ---------------------------------------------------------

    if action == "send_checkout_reminder":

        return {
            "status": "pending",
            "message": (
                "Personalized checkout recovery reminder generated. "
                "Awaiting customer return and settlement."
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "action_dispatched": True,
            "transaction_id": transaction_id,
            "recovery_message": recovery_message,
        }

    # ---------------------------------------------------------
    # Payment method update
    # ---------------------------------------------------------

    if action == "request_payment_method_update":

        return {
            "status": "pending",
            "message": (
                "Payment method update request generated. "
                "Awaiting customer card update and settlement."
            ),
            "action": action,
            "recovered": False,
            "amount_recovered": 0,
            "action_dispatched": True,
            "transaction_id": transaction_id,
            "recovery_message": recovery_message,
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
        "transaction_id": transaction_id,
        "recovery_message": None,
    }