import random
from datetime import datetime, timedelta

from app.database import (
    transactions_collection,
    customers_collection
)


random.seed(42)


FIRST_NAMES = [
    "Rahul", "Priya", "Arjun", "Ananya", "Meera",
    "Rohan", "Sneha", "Karan", "Aditi", "Vikram",
    "Neha", "Aditya", "Pooja", "Varun", "Isha",
    "Aman", "Kavya", "Nikhil", "Simran", "Riya"
]

LAST_NAMES = [
    "Sharma", "Reddy", "Kumar", "Rao", "Nair",
    "Patel", "Singh", "Verma", "Gupta", "Mehta"
]

FAILURE_REASONS = [
    "temporary_payment_failure",
    "insufficient_funds",
    "checkout_abandoned",
    "expired_card",
    "network_timeout",
    "payment_overdue"
]

CHANNELS = [
    "email",
    "whatsapp",
    "sms"
]

TRANSACTION_TYPES = [
    "subscription",
    "one_time",
    "invoice"
]


def generate_customer(index):

    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)

    name = f"{first_name} {last_name}"

    return {
        "customer_id": f"cus_{index:04d}",
        "name": name,
        "email": f"customer{index}@example.com",
        "phone": f"+919000{index:06d}",
        "preferred_channel": random.choice(CHANNELS),
        "created_at": datetime.now().isoformat()
    }


def generate_transaction(
    customer,
    transaction_index,
    is_failure
):

    amount = random.choice([
        499,
        999,
        1499,
        1999,
        2499,
        3499,
        4999,
        6999,
        8999,
        9999,
        14999,
        19999
    ])

    transaction_id = (
        f"txn_{transaction_index:06d}"
    )

    created_at = (
        datetime.now()
        - timedelta(
            days=random.randint(0, 90)
        )
    ).isoformat()

    if is_failure:

        failure_reason = random.choice(
            FAILURE_REASONS
        )

        status_map = {
            "checkout_abandoned": "abandoned",
            "payment_overdue": "overdue"
        }

        status = status_map.get(
            failure_reason,
            "failed"
        )

        recoverable = True

    else:

        failure_reason = None
        status = "success"
        recoverable = False

    return {
        "id": transaction_id,
        "customer": customer["name"],
        "customer_id": customer["customer_id"],
        "email": customer["email"],
        "amount": amount,
        "currency": "INR",
        "status": status,
        "failure_reason": failure_reason,
        "risk_level": random.choice([
            "low",
            "medium",
            "high"
        ]),
        "type": random.choice(
            TRANSACTION_TYPES
        ),
        "retry_count": 0,
        "recoverable": recoverable,
        "created_at": created_at
    }


def generate_dataset(
    number_of_customers=100,
    transactions_per_customer=5
):

    customers = []
    transactions = []

    transaction_index = 1

    for customer_index in range(
        1,
        number_of_customers + 1
    ):

        customer = generate_customer(
            customer_index
        )

        customers.append(customer)

        for _ in range(
            transactions_per_customer
        ):

            # Approximately 60% successful
            # and 40% revenue-at-risk cases.
            is_failure = (
                random.random() < 0.40
            )

            transaction = generate_transaction(
                customer,
                transaction_index,
                is_failure
            )

            transactions.append(
                transaction
            )

            transaction_index += 1

    return customers, transactions


def seed_dataset():

    customers, transactions = (
        generate_dataset(
            number_of_customers=100,
            transactions_per_customer=5
        )
    )

    print("Clearing old synthetic data...")

    customers_collection.delete_many({
        "customer_id": {
            "$regex": "^cus_"
        }
    })

    transactions_collection.delete_many({
        "id": {
            "$regex": "^txn_"
        }
    })

    print("Inserting customers...")

    if customers:
        customers_collection.insert_many(
            customers
        )

    print("Inserting transactions...")

    if transactions:
        transactions_collection.insert_many(
            transactions
        )

    print()
    print("Dataset created successfully.")
    print(f"Customers: {len(customers)}")
    print(f"Transactions: {len(transactions)}")

    recoverable_count = sum(
        1
        for transaction in transactions
        if transaction["recoverable"]
    )

    at_risk = sum(
        transaction["amount"]
        for transaction in transactions
        if transaction["recoverable"]
    )

    print(
        f"Recoverable cases: {recoverable_count}"
    )

    print(
        f"Revenue at risk: ₹{at_risk:,}"
    )


if __name__ == "__main__":
    seed_dataset()