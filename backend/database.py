import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "achievements.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'research',
    tags TEXT NOT NULL DEFAULT '[]',
    tier TEXT NOT NULL CHECK(tier IN ('bronze','silver','gold','platinum')),
    unlocked INTEGER NOT NULL DEFAULT 0,
    unlocked_at TEXT,
    custom INTEGER NOT NULL DEFAULT 0
);

-- Future cross-module linking (e.g. achievement -> paper, achievement -> concept).
-- Left empty in this pass; no achievement-specific foreign keys are added.
CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL
);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
        row = conn.execute("SELECT COUNT(*) AS c FROM achievements").fetchone()
        if row["c"] == 0:
            _seed(conn)
    finally:
        conn.close()


def _seed(conn: sqlite3.Connection) -> None:
    from seed_data import SEED_ACHIEVEMENTS

    conn.executemany(
        """
        INSERT INTO achievements (title, description, domain, tags, tier, unlocked, unlocked_at, custom)
        VALUES (:title, :description, :domain, :tags, :tier, 0, NULL, 0)
        """,
        [
            {
                "title": a["title"],
                "description": a["description"],
                "domain": a.get("domain", "research"),
                "tags": json.dumps(a["tags"]),
                "tier": a["tier"],
            }
            for a in SEED_ACHIEVEMENTS
        ],
    )
    conn.commit()
