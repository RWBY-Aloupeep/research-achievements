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

-- Knowledge-graph nodes. Kept as their own concrete tables (like achievements)
-- rather than one polymorphic "nodes" table.
CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'research',
    tags TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    year INTEGER,
    venue TEXT,
    domain TEXT NOT NULL DEFAULT 'research',
    tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'to-read',
    zotero_key TEXT
);

-- Generic cross-module link: (source_type, source_id) -> (target_type, target_id).
-- source_type/target_type are one of 'achievement' | 'concept' | 'paper'.
-- relation_type is free-form (e.g. 'demonstrates', 'introduces', 'prerequisite_of')
-- so new relation kinds don't require a migration.
CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
        row = conn.execute("SELECT COUNT(*) AS c FROM concepts").fetchone()
        if row["c"] == 0:
            _seed_knowledge_graph(conn)
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


def _seed_knowledge_graph(conn: sqlite3.Connection) -> None:
    from seed_data import SEED_CONCEPTS, SEED_EDGES, SEED_PAPERS

    concept_ids = {}
    for c in SEED_CONCEPTS:
        cur = conn.execute(
            "INSERT INTO concepts (name, description, domain, tags) VALUES (?, ?, ?, ?)",
            (c["name"], c["description"], c.get("domain", "research"), json.dumps(c["tags"])),
        )
        concept_ids[c["name"]] = cur.lastrowid

    paper_ids = {}
    for p in SEED_PAPERS:
        cur = conn.execute(
            """
            INSERT INTO papers (title, authors, year, venue, domain, tags, status, zotero_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
            """,
            (
                p["title"],
                p["authors"],
                p.get("year"),
                p.get("venue"),
                p.get("domain", "research"),
                json.dumps(p["tags"]),
                p.get("status", "to-read"),
            ),
        )
        paper_ids[p["title"]] = cur.lastrowid

    achievement_ids = {
        row["title"]: row["id"]
        for row in conn.execute("SELECT id, title FROM achievements").fetchall()
    }

    lookup = {
        "achievement": achievement_ids,
        "concept": concept_ids,
        "paper": paper_ids,
    }

    for e in SEED_EDGES:
        source_id = lookup[e["source_type"]].get(e["source_key"])
        target_id = lookup[e["target_type"]].get(e["target_key"])
        if source_id is None or target_id is None:
            continue
        conn.execute(
            """
            INSERT INTO edges (source_type, source_id, target_type, target_id, relation_type)
            VALUES (?, ?, ?, ?, ?)
            """,
            (e["source_type"], source_id, e["target_type"], target_id, e["relation_type"]),
        )

    conn.commit()
