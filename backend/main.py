import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import get_connection, init_db

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Research Star Map")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


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


@app.get("/", response_class=HTMLResponse)
def index():
    # Cache-bust style.css/starmap.js with a version tied to their actual
    # mtime, computed fresh per request -- a hardcoded ?v=N query param
    # silently goes stale the moment those files are edited again without
    # remembering to bump it (this bit us once already: a browser that
    # loaded the page early kept serving a stale cached JS/CSS pair for the
    # rest of the session while a differently-cached tab showed newer code).
    # That fix only helps if this shell HTML itself gets re-fetched, though --
    # explicitly forbid caching the shell too, so a browser can't skip
    # straight past the version-computing code below by reusing an old copy
    # of this response.
    version = str(int(max(
        (STATIC_DIR / "style.css").stat().st_mtime,
        (STATIC_DIR / "starmap.js").stat().st_mtime,
    )))
    html = (STATIC_DIR / "index.html").read_text()
    return HTMLResponse(
        html.replace("__ASSET_VERSION__", version),
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
    )
