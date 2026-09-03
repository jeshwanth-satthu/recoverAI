import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not configured in .env")

client = MongoClient(MONGODB_URI)

db = client["recoverai"]

transactions_collection = db["transactions"]
customers_collection = db["customers"]
recovery_cases_collection = db["recovery_cases"]
audit_logs_collection = db["audit_logs"]
agent_runs_collection = db["agent_runs"]
policies_collection = db["policies"]
experiments_collection = db["experiments"]


def check_database_connection():
    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return False