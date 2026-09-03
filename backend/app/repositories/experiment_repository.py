from datetime import datetime

from app.database import experiments_collection


def create_experiment(experiment):
    experiment["created_at"] = datetime.now().isoformat()

    result = experiments_collection.insert_one(
        experiment
    )

    experiment.pop("_id", None)

    return experiment


def get_experiments():
    return list(
        experiments_collection.find(
            {},
            {"_id": 0}
        ).sort(
            "created_at",
            -1
        )
    )


def get_experiment(experiment_id):
    return experiments_collection.find_one(
        {
            "experiment_id": experiment_id
        },
        {
            "_id": 0
        }
    )