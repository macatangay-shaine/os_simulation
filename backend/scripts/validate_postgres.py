"""Validate that JezOS can start against the configured PostgreSQL database."""

from pathlib import Path
import os
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def main() -> int:
    """Run the deployment validation checks."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL is not set.")
        return 1

    from app.main import validate_database_configuration

    try:
        validate_database_configuration()
    except Exception as exc:
        print(f"ERROR: deployment validation failed: {exc}")
        return 1

    print("OK: PostgreSQL deployment validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())