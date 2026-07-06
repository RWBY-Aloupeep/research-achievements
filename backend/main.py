import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import get_connection, init_db

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Research Achievement System")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def row_to_dict(row) -> dict:
    d = dict(row)
    d["tags"] = json.loads(d["tags"])
    d["unlocked"] = bool(d["unlocked"])
    d["custom"] = bool(d["custom"])
    return d


class AchievementCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    tags: List[str] = []
    tier: str
    domain: str = "research"


VALID_TIERS = {"bronze", "silver", "gold", "platinum"}
VALID_KINDS = {"paper", "concept"}


def node_to_dict(row) -> dict:
    d = dict(row)
    d["tags"] = json.loads(d["tags"])
    return d


class NodeCreate(BaseModel):
    title: str = Field(min_length=1)
    kind: str
    description: str = ""
    tags: List[str] = []
    url: Optional[str] = None


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    kind: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    url: Optional[str] = None


class MasteryUpdate(BaseModel):
    mastery: int = Field(ge=0, le=4)


@app.get("/api/achievements")
def list_achievements(tags: Optional[str] = None):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM achievements ORDER BY domain, tier, id"
        ).fetchall()
        achievements = [row_to_dict(r) for r in rows]
        if tags:
            wanted = {t.strip() for t in tags.split(",") if t.strip()}
            if wanted:
                achievements = [
                    a for a in achievements if wanted & set(a["tags"])
                ]
        return achievements
    finally:
        conn.close()


@app.get("/api/tags")
def list_tags():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT tags FROM achievements").fetchall()
        tag_set = set()
        for r in rows:
            tag_set.update(json.loads(r["tags"]))
        return sorted(tag_set)
    finally:
        conn.close()


@app.get("/api/stats")
def stats():
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT COUNT(*) AS total, SUM(unlocked) AS unlocked FROM achievements"
        ).fetchone()
        total = row["total"] or 0
        unlocked = row["unlocked"] or 0
        percent = (unlocked / total * 100) if total else 0.0
        residual = 1 - (unlocked / total) if total else 1.0
        return {
            "total": total,
            "unlocked": unlocked,
            "percent": round(percent, 2),
            "residual": round(residual, 6),
        }
    finally:
        conn.close()


@app.post("/api/achievements", status_code=201)
def create_achievement(payload: AchievementCreate):
    if payload.tier not in VALID_TIERS:
        raise HTTPException(400, f"tier must be one of {sorted(VALID_TIERS)}")
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            INSERT INTO achievements (title, description, domain, tags, tier, unlocked, unlocked_at, custom)
            VALUES (?, ?, ?, ?, ?, 0, NULL, 1)
            """,
            (
                payload.title,
                payload.description,
                payload.domain,
                json.dumps(payload.tags),
                payload.tier,
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM achievements WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return row_to_dict(row)
    finally:
        conn.close()


@app.patch("/api/achievements/{achievement_id}/toggle")
def toggle_achievement(achievement_id: int):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM achievements WHERE id = ?", (achievement_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(404, "achievement not found")
        new_unlocked = 0 if row["unlocked"] else 1
        unlocked_at = (
            datetime.now(timezone.utc).isoformat() if new_unlocked else None
        )
        conn.execute(
            "UPDATE achievements SET unlocked = ?, unlocked_at = ? WHERE id = ?",
            (new_unlocked, unlocked_at, achievement_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM achievements WHERE id = ?", (achievement_id,)
        ).fetchone()
        return row_to_dict(row)
    finally:
        conn.close()


@app.delete("/api/achievements/{achievement_id}", status_code=204)
def delete_achievement(achievement_id: int):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM achievements WHERE id = ?", (achievement_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(404, "achievement not found")
        if not row["custom"]:
            raise HTTPException(400, "only custom achievements can be deleted")
        conn.execute("DELETE FROM achievements WHERE id = ?", (achievement_id,))
        conn.commit()
        return None
    finally:
        conn.close()


@app.get("/api/nodes")
def list_nodes():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM nodes ORDER BY id").fetchall()
        return [node_to_dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/nodes/tags")
def list_node_tags():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT tags FROM nodes").fetchall()
        tag_set = set()
        for r in rows:
            tag_set.update(json.loads(r["tags"]))
        return sorted(tag_set)
    finally:
        conn.close()


@app.post("/api/nodes", status_code=201)
def create_node(payload: NodeCreate):
    if payload.kind not in VALID_KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(VALID_KINDS)}")
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            INSERT INTO nodes (title, kind, description, tags, mastery, mastery_updated_at, url)
            VALUES (?, ?, ?, ?, 0, NULL, ?)
            """,
            (payload.title, payload.kind, payload.description, json.dumps(payload.tags), payload.url),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM nodes WHERE id = ?", (cur.lastrowid,)).fetchone()
        return node_to_dict(row)
    finally:
        conn.close()


@app.patch("/api/nodes/{node_id}")
def update_node(node_id: int, payload: NodeUpdate):
    if payload.kind is not None and payload.kind not in VALID_KINDS:
        raise HTTPException(400, f"kind must be one of {sorted(VALID_KINDS)}")
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "node not found")
        updates = payload.model_dump(exclude_unset=True)
        if "tags" in updates:
            updates["tags"] = json.dumps(updates["tags"])
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(
                f"UPDATE nodes SET {set_clause} WHERE id = ?",
                (*updates.values(), node_id),
            )
            conn.commit()
        row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        return node_to_dict(row)
    finally:
        conn.close()


@app.patch("/api/nodes/{node_id}/mastery")
def update_mastery(node_id: int, payload: MasteryUpdate):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "node not found")
        conn.execute(
            "UPDATE nodes SET mastery = ?, mastery_updated_at = ? WHERE id = ?",
            (payload.mastery, datetime.now(timezone.utc).isoformat(), node_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        return node_to_dict(row)
    finally:
        conn.close()


@app.delete("/api/nodes/{node_id}", status_code=204)
def delete_node(node_id: int):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "node not found")
        conn.execute("DELETE FROM nodes WHERE id = ?", (node_id,))
        conn.commit()
        return None
    finally:
        conn.close()


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")
