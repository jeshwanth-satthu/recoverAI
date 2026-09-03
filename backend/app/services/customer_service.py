from app.database import transactions_collection
from app.repositories.customer_repository import (
    get_customer_by_email,
    create_customer,
    update_customer
)


def build_customer_profile(email: str):

    transactions = list(
        transactions_collection.find(
            {"email": email},
            {"_id": 0}
        )
    )

    if not transactions:
        return None

    successful = [
        t for t in transactions
        if t.get("status") in ["success", "recovered"]
    ]

    failed = [
        t for t in transactions
        if t.get("status") == "failed"
    ]

    recovered = [
        t for t in transactions
        if t.get("status") == "recovered"
    ]

    total_spent = sum(
        t.get("amount", 0)
        for t in successful
    )

    total_payments = len(transactions)

    success_rate = (
        len(successful) / total_payments * 100
        if total_payments
        else 0
    )

    average_transaction = (
        total_spent / len(successful)
        if successful
        else 0
    )

    return {
        "email": email,
        "total_payments": total_payments,
        "successful_payments": len(successful),
        "failed_payments": len(failed),
        "successful_recoveries": len(recovered),
        "total_spent": total_spent,
        "average_transaction": round(
            average_transaction,
            2
        ),
        "success_rate": round(
            success_rate,
            2
        )
    }


def get_or_create_customer(email: str):

    existing = get_customer_by_email(email)

    if existing:
        return existing

    profile = build_customer_profile(email)

    if not profile:
        return None

    profile["customer_id"] = (
        "cus_" + email.split("@")[0]
    )

    profile["preferred_channel"] = "email"
    profile["recovery_attempts"] = 0

    create_customer(profile)

    return profile


def refresh_customer_profile(email: str):

    profile = build_customer_profile(email)

    if not profile:
        return None

    existing = get_customer_by_email(email)

    if existing:

        update_customer(
            existing["customer_id"],
            profile
        )

        return get_customer_by_email(email)

    return get_or_create_customer(email)