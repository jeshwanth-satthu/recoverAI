from collections import Counter

from app.database import (
    transactions_collection,
    recovery_cases_collection,
    audit_logs_collection,
)


def inspect_collection(name, collection):
    documents = list(
        collection.find(
            {},
            {"_id": 0},
        )
    )

    print("\n" + "=" * 70)
    print(f"{name}")
    print("=" * 70)

    print(f"Documents: {len(documents)}")

    if not documents:
        return

    print("\nFields found:")

    fields = Counter()

    for document in documents:
        fields.update(document.keys())

    for field, count in fields.most_common():
        print(f"  {field}: {count}")

    print("\nSample document:")

    sample = documents[0]

    for key, value in sample.items():
        print(f"  {key}: {value}")


def inspect_transaction_outcomes():
    transactions = list(
        transactions_collection.find(
            {},
            {"_id": 0},
        )
    )

    print("\n" + "=" * 70)
    print("TRANSACTION OUTCOME ANALYSIS")
    print("=" * 70)

    print(f"Total transactions: {len(transactions)}")

    status_counter = Counter(
        str(
            transaction.get(
                "status",
                "unknown",
            )
        ).lower()
        for transaction in transactions
    )

    print("\nTransaction statuses:")

    for status, count in status_counter.most_common():
        print(f"  {status}: {count}")

    failure_counter = Counter(
        str(
            transaction.get(
                "failure_reason",
                "none",
            )
        ).lower()
        for transaction in transactions
    )

    print("\nFailure reasons:")

    for reason, count in failure_counter.most_common():
        print(f"  {reason}: {count}")

    print("\nRecovery-related fields:")

    recovery_fields = [
        "recoverable",
        "retry_count",
        "risk_level",
        "recovered",
        "amount_recovered",
        "recovery_status",
        "recovery_probability",
    ]

    for field in recovery_fields:

        count = sum(
            1
            for transaction in transactions
            if field in transaction
        )

        print(
            f"  {field}: "
            f"{count}/{len(transactions)}"
        )


def inspect_recovery_outcomes():
    cases = list(
        recovery_cases_collection.find(
            {},
            {"_id": 0},
        )
    )

    print("\n" + "=" * 70)
    print("RECOVERY CASE OUTCOME ANALYSIS")
    print("=" * 70)

    print(f"Recovery cases: {len(cases)}")

    status_counter = Counter(
        str(
            case.get(
                "status",
                "unknown",
            )
        ).lower()
        for case in cases
    )

    print("\nCase statuses:")

    for status, count in status_counter.most_common():
        print(f"  {status}: {count}")

    action_counter = Counter()

    for case in cases:

        decision = case.get(
            "decision",
            {},
        )

        if isinstance(decision, dict):

            action = decision.get(
                "action",
                "unknown",
            )

            action_counter[action] += 1

    print("\nRecovery actions:")

    for action, count in action_counter.most_common():
        print(f"  {action}: {count}")


def inspect_audit_outcomes():
    logs = list(
        audit_logs_collection.find(
            {},
            {"_id": 0},
        )
    )

    print("\n" + "=" * 70)
    print("AUDIT OUTCOME ANALYSIS")
    print("=" * 70)

    print(f"Audit logs: {len(logs)}")

    if not logs:
        return

    event_counter = Counter()

    recovered_count = 0
    failed_count = 0

    for log in logs:

        event = (
            log.get("event")
            or log.get("event_type")
            or log.get("action")
            or "unknown"
        )

        event_counter[str(event)] += 1

        recovered = log.get(
            "recovered"
        )

        if recovered is True:
            recovered_count += 1

        elif recovered is False:
            failed_count += 1

    print("\nEvents:")

    for event, count in event_counter.most_common():
        print(f"  {event}: {count}")

    print(
        f"\nRecovered outcomes: {recovered_count}"
    )

    print(
        f"Failed outcomes: {failed_count}"
    )


def main():

    inspect_collection(
        "TRANSACTIONS",
        transactions_collection,
    )

    inspect_collection(
        "RECOVERY CASES",
        recovery_cases_collection,
    )

    inspect_collection(
        "AUDIT LOGS",
        audit_logs_collection,
    )

    inspect_transaction_outcomes()

    inspect_recovery_outcomes()

    inspect_audit_outcomes()


if __name__ == "__main__":
    main()
