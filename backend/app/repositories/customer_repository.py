from app.database import customers_collection


def get_customer(customer_id: str):
    return customers_collection.find_one(
        {"customer_id": customer_id},
        {"_id": 0}
    )


def get_customer_by_email(email: str):
    return customers_collection.find_one(
        {"email": email},
        {"_id": 0}
    )


def create_customer(customer):
    customers_collection.insert_one(customer)


def update_customer(customer_id: str, updates: dict):
    customers_collection.update_one(
        {"customer_id": customer_id},
        {"$set": updates}
    )


def get_all_customers():
    return list(
        customers_collection.find(
            {},
            {"_id": 0}
        )
    )