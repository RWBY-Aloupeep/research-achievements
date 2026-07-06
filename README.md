# research-achievements

A personal research-management tool: a "star map" where papers and concepts are stars that
light up as you learn them.

This started as two separate things — an achievement wall (discrete unlock/lock milestones) and
a star map (5-level mastery per paper/concept). The achievement wall was retired: almost every
achievement was really just "understand/build/reproduce one specific thing," which a star's
mastery level already expresses more precisely, per-paper, on a finer scale. The star map is now
the whole app.

## Setup

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn main:app --app-dir backend --reload --port 8000
```

Then open `http://localhost:8000`. SQLite data lives in `achievements.db` at the project root
(gitignored, name is a holdover from the retired achievement wall) and is seeded automatically
on first run.

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
- The mastery-level guide (what 0-4 actually mean) is a collapsed-by-default section rather than
  always-on text, so it doesn't compete with the map for attention once you know it by heart.
