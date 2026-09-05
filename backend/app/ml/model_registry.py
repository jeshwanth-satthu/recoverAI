from pathlib import Path
import json
import shutil
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent / "models"

MODEL_PATH = BASE_DIR / "recovery_probability.joblib"
METRICS_PATH = BASE_DIR / "metrics.json"

REGISTRY_PATH = BASE_DIR / "registry.json"
VERSIONS_DIR = BASE_DIR / "versions"


def _load_registry():
    if not REGISTRY_PATH.exists():
        return {
            "active_version": None,
            "versions": [],
        }

    with open(
        REGISTRY_PATH,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def _save_registry(registry):
    BASE_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        REGISTRY_PATH,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            registry,
            file,
            indent=2,
        )


def register_current_model():
    if not MODEL_PATH.exists():
        return {
            "success": False,
            "message": "No trained model found.",
        }

    registry = _load_registry()

    current_version = (
        len(registry["versions"]) + 1
    )

    version = f"1.{current_version}"

    version_dir = (
        VERSIONS_DIR / f"v{version}"
    )

    version_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    shutil.copy2(
        MODEL_PATH,
        version_dir / "recovery_probability.joblib",
    )

    if METRICS_PATH.exists():
        shutil.copy2(
            METRICS_PATH,
            version_dir / "metrics.json",
        )

    record = {
        "version": version,
        "created_at":
            datetime.utcnow().isoformat(),
        "status": "active",
    }

    # Mark previous active version as archived.
    for item in registry["versions"]:
        if item.get("status") == "active":
            item["status"] = "archived"

    registry["versions"].append(record)
    registry["active_version"] = version

    _save_registry(registry)

    return {
        "success": True,
        "active_version": version,
        "registry": registry,
    }


def get_model_registry():
    return _load_registry()
