def verifier_agent(
    transaction,
    execution
):
    """
    Verify the result of the recovery execution.

    The verifier does NOT trust the AI decision.
    It checks the executor result and calculates
    the final recovered amount.
    """

    execution_status = execution.get(
        "status",
        "unknown"
    )

    recovered = (
        execution.get(
            "recovered",
            False
        )
        is True
        and execution_status == "success"
    )

    amount_recovered = (
        execution.get(
            "amount_recovered",
            0
        )
        if recovered
        else 0
    )

    # Never allow recovered amount to exceed
    # the original transaction amount.
    transaction_amount = transaction.get(
        "amount",
        0
    )

    amount_recovered = min(
        amount_recovered,
        transaction_amount
    )

    if recovered:

        status = "recovered"

    elif execution_status == "pending":

        status = "pending"

    elif execution_status == "stopped":

        status = "stopped"

    else:

        status = "failed"

    return {
        "verified": True,
        "recovered": recovered,
        "amount_recovered": amount_recovered,
        "status": status,
        "execution_status": execution_status
    }