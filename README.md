# research-achievements

A personal research-management tool: an achievement wall for the `research` domain, plus a
"star map" knowledge visualization where papers and concepts are stars that light up as you
learn them.

## Setup

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --app-dir backend --reload --port 8000
```

Then open `http://localhost:8000` (achievement wall) or `http://localhost:8000/static/starmap.html`
(star map). SQLite data lives in `achievements.db` at the project root (gitignored) and is
seeded automatically on first run.

## Star map

Each star is a `paper` or `concept` node with free-form tags and a 0-4 mastery level
(unlit / glimmer / shine / bright / blazing). Star positions come from a force-directed layout
where tag overlap (Jaccard similarity) pulls related stars together into constellations — there
is no hand-assigned layout or category tree. A faint line is drawn between stars that share 2+
tags; lower overlap still affects layout but isn't drawn, to keep the map from turning into a
hairball.

v1 has no explicit paper-to-paper edges (citations, etc.) and no Zotero/Semantic Scholar import —
relationships are implied entirely by shared tags. Both are possible future additions, not built
here.

### Notes on choices made without asking

- Similarity/clustering is computed client-side in `starmap.js` from the full node list rather
  than a dedicated backend endpoint — the node count is small enough that this is simpler than
  adding a `/api/similarity` route.
- "Visible constellation line" threshold is a plain shared-tag count (>= 2), not a tuned Jaccard
  cutoff. Easy to retune later if the map looks too sparse/dense.
- Per-tag completion (shown next to the tag filter once a tag is active) reuses the same overall
  "sky illuminated" formula (`sum(mastery) / (4 * count)`) restricted to the filtered stars,
  rather than a separate stat.
