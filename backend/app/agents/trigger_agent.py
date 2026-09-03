def trigger_agent(transaction):
    return {
        "triggered": transaction["status"] in [
            "failed",
            "abandoned",
            "overdue"
        ],
        "transaction_id": transaction["id"],
        "event": transaction["status"]
    }