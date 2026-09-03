def baseline_recovery(transaction):
    """
    Simple non-AI merchant recovery strategy.

    Strategy:
    - Retry failed payments once.
    - No diagnosis.
    - No customer intelligence.
    - No adaptive intervention.
    """

    status = transaction.get("status")

    failure_reason = transaction.get(
        "failure_reason"
    )

    # Only failed payments are automatically retried.
    if status != "failed":

        return {
            "action": "none",
            "status": "no_action",
            "recovered": False,
            "amount_recovered": 0
        }

    # Baseline successfully recovers
    # temporary and network-related failures.
    if failure_reason in [
        "temporary_payment_failure",
        "network_timeout"
    ]:

        return {
            "action": "retry_payment",
            "status": "success",
            "recovered": True,
            "amount_recovered": transaction[
                "amount"
            ]
        }

    # Other failures are not recovered
    # by the basic baseline strategy.
    return {
        "action": "retry_payment",
        "status": "failed",
        "recovered": False,
        "amount_recovered": 0
    }