from app.data import transactions
from app.database import transactions_collection


def seed_transactions():
    inserted = 0
    skipped = 0

    for transaction in transactions:

        existing = transactions_collection.find_one({
            "id": transaction["id"]
        })

        if existing:
            skipped += 1
            continue

        transactions_collection.insert_one(transaction.copy())
        inserted += 1

    return {
        "inserted": inserted,
        "skipped": skipped,
        "total": transactions_collection.count_documents({})
    }


if __name__ == "__main__":
    result = seed_transactions()
    print(result)