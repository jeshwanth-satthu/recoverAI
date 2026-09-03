from app.database import transactions_collection


def get_transaction(transaction_id: str):

    return transactions_collection.find_one(
        {"id": transaction_id},
        {"_id": 0}
    )


def get_all_transactions():

    return list(
        transactions_collection.find(
            {},
            {"_id": 0}
        )
    )


def update_transaction(transaction_id: str, updates: dict):

    result = transactions_collection.update_one(
        {"id": transaction_id},
        {"$set": updates}
    )

    return result.modified_count > 0