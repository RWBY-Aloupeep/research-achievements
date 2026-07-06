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

-- Star map nodes: a paper or a knowledge point, both are just stars.
-- Relationships in v1 are implied by shared tags only (Jaccard similarity,
-- computed on read) -- no edges table yet.
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('paper','concept')),
    description TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    mastery INTEGER NOT NULL DEFAULT 0 CHECK(mastery BETWEEN 0 AND 4),
    mastery_updated_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    url TEXT
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
            _seed_achievements(conn)
        row = conn.execute("SELECT COUNT(*) AS c FROM nodes").fetchone()
        if row["c"] == 0:
            _seed_nodes(conn)
    finally:
        conn.close()


def _seed_achievements(conn: sqlite3.Connection) -> None:
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


def _seed_nodes(conn: sqlite3.Connection) -> None:
    from seed_data import SEED_NODES

    conn.executemany(
        """
        INSERT INTO nodes (title, kind, description, tags, mastery, mastery_updated_at, url)
        VALUES (:title, :kind, :description, :tags, 0, NULL, :url)
        """,
        [
            {
                "title": n["title"],
                "kind": n["kind"],
                "description": n.get("description", ""),
                "tags": json.dumps(n["tags"]),
                "url": n.get("url"),
            }
            for n in SEED_NODES
        ],
    )
    conn.commit()
