"""One-time migration from SQLite SQL dump to PostgreSQL.

Usage:
    python scripts/migrate_sql_dump_to_postgres.py --dump backend/virt_os.sql
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from psycopg import sql


TABLES_IN_ORDER = [
    "users",
    "apps",
    "fs_nodes",
    "note_versions",
    "notifications",
    "recycle_bin_meta",
    "security_logs",
    "startup_processes",
    "system_events",
    "update_state",
    "update_history",
]


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


SEQUENCE_TABLES = [
    "users",
    "fs_nodes",
    "note_versions",
    "notifications",
    "security_logs",
    "startup_processes",
    "system_events",
    "update_history",
]


def _ensure_postgres_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required.")
    if not database_url.startswith(("postgres://", "postgresql://")):
        raise RuntimeError("DATABASE_URL must be a PostgreSQL connection string.")
    return database_url


def _read_dump_into_sqlite(dump_path: Path) -> sqlite3.Connection:
    if not dump_path.exists():
        raise FileNotFoundError(f"Dump file not found: {dump_path}")

    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    sql_text = dump_path.read_text(encoding="utf-8")
    conn.executescript(sql_text)
    return conn


def _create_support_tables(pg_cur) -> None:
    from database import init_database, migrate_apps_storage
    from event_logger import init_event_logs
    from security import init_security_logs

    # Ensure core schema exists before loading migrated data.
    init_database()
    migrate_apps_storage()
    init_security_logs()
    init_event_logs()

    # These may not exist yet unless filesystem history/recycle features were used.
    pg_cur.execute(
        """
        CREATE TABLE IF NOT EXISTS recycle_bin_meta (
            recycle_path TEXT PRIMARY KEY,
            original_path TEXT NOT NULL,
            deleted_at TEXT NOT NULL,
            node_type TEXT NOT NULL
        )
        """
    )
    pg_cur.execute(
        """
        CREATE TABLE IF NOT EXISTS note_versions (
            id BIGSERIAL PRIMARY KEY,
            path TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )


def _truncate_tables(pg_cur) -> None:
    identifiers = sql.SQL(", ").join(sql.Identifier(table) for table in TABLES_IN_ORDER)
    pg_cur.execute(sql.SQL("TRUNCATE TABLE {} RESTART IDENTITY").format(identifiers))


def _insert_table(sqlite_cur, pg_cur, table: str) -> int:
    sqlite_cur.execute(f"SELECT * FROM {table}")
    rows = sqlite_cur.fetchall()
    if not rows:
        return 0

    columns = list(rows[0].keys())
    col_sql = sql.SQL(", ").join(sql.Identifier(col) for col in columns)
    placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in columns)
    insert_sql = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
        sql.Identifier(table),
        col_sql,
        placeholders,
    )

    values = [tuple(row[col] for col in columns) for row in rows]
    pg_cur.executemany(insert_sql, values)
    return len(values)


def _reset_sequences(pg_cur) -> None:
    for table in SEQUENCE_TABLES:
        pg_cur.execute(
            sql.SQL("SELECT COALESCE(MAX(id), 0) AS max_id FROM {}")
            .format(sql.Identifier(table))
        )
        max_id = int(pg_cur.fetchone()["max_id"])
        pg_cur.execute(
            """
            SELECT setval(
                pg_get_serial_sequence(%s, 'id'),
                %s,
                %s
            )
            """,
            (table, max(max_id, 1), max_id > 0),
        )


def _collect_counts(sqlite_cur, pg_cur) -> dict[str, tuple[int, int]]:
    counts: dict[str, tuple[int, int]] = {}
    for table in TABLES_IN_ORDER:
        sqlite_cur.execute(f"SELECT COUNT(*) AS c FROM {table}")
        src = int(sqlite_cur.fetchone()["c"])
        pg_cur.execute(
            sql.SQL("SELECT COUNT(*) AS c FROM {}").format(sql.Identifier(table))
        )
        dst = int(pg_cur.fetchone()["c"])
        counts[table] = (src, dst)
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description="One-time SQLite SQL dump to PostgreSQL migration")
    parser.add_argument("--dump", default="backend/virt_os.sql", help="Path to SQLite dump SQL file")
    args = parser.parse_args()

    dump_path = Path(args.dump).resolve()
    database_url = _ensure_postgres_url()

    sqlite_conn = _read_dump_into_sqlite(dump_path)
    sqlite_cur = sqlite_conn.cursor()

    with psycopg.connect(database_url, row_factory=dict_row) as pg_conn:
        with pg_conn.cursor() as pg_cur:
            _create_support_tables(pg_cur)
            _truncate_tables(pg_cur)

            migrated = {}
            for table in TABLES_IN_ORDER:
                migrated[table] = _insert_table(sqlite_cur, pg_cur, table)

            _reset_sequences(pg_cur)
            counts = _collect_counts(sqlite_cur, pg_cur)

        pg_conn.commit()

    sqlite_conn.close()

    print("Migration completed.")
    for table in TABLES_IN_ORDER:
        src, dst = counts[table]
        status = "OK" if src == dst else "MISMATCH"
        print(f"{table}: source={src}, target={dst} [{status}]")

    mismatches = [name for name, (src, dst) in counts.items() if src != dst]
    if mismatches:
        print("Migration finished with mismatches:", ", ".join(mismatches))
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
