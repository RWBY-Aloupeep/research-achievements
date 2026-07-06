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

The map is also split into a handful of regions — the biggest sub-categories the tag data implies.
These are found by average-linkage agglomerative clustering (merge the two most similar clusters
repeatedly until the best remaining merge falls below `CLUSTER_MERGE_THRESHOLD`), so the number
and membership of regions is computed, not chosen by hand. Similarity for clustering is
IDF-weighted (a tag that appears on nearly everything, like "fluids", counts for less than a rare,
specific one, like "sph") — plain Jaccard let one tag turn into a hub that merged unrelated methods
into a single 9-star blob. Every star belongs to exactly one region (its primary cluster), which is
where it's pulled toward on the map; a region is labeled with its most distinguishing tag (same
IDF weighting) and drawn as a faint dashed boundary, purely for the "constellation" framing —
there's no `category` field in the schema and tags stay flat and multi-valued for
filtering/highlighting.

v1 has no explicit paper-to-paper edges (citations, etc.) and no Zotero/Semantic Scholar import —
relationships are implied entirely by shared tags. Both are possible future additions, not built
here.

### Notes on choices made without asking

- Similarity/clustering is computed client-side in `starmap.js` from the full node list rather
  than a dedicated backend endpoint — the node count is small enough that this is simpler than
  adding a `/api/similarity` route.
- "Visible constellation line" threshold is a plain shared-tag count (>= 2), not a tuned Jaccard
  cutoff. Easy to retune later if the map looks too sparse/dense.
- Region-merge threshold (`CLUSTER_MERGE_THRESHOLD = 0.25` in `starmap.js`) was picked by testing
  values against the seed set until PIC/FLIP split cleanly from SPH without fragmenting the
  differentiable/neural group into singletons. Retune if it drifts as more stars get added.
- Links weaker than `similarity >= 0.08` are dropped from the force layout (not from clustering) —
  otherwise many faint cross-region similarities added enough combined pull to drag regions back
  together despite the per-region anchoring force.
- Region anchors are placed evenly around a circle rather than, say, a treemap/grid — simplest
  layout that keeps regions visually separated without hard rectangular boundaries.
- Per-tag completion (shown next to the tag filter once a tag is active) reuses the same overall
  "sky illuminated" formula (`sum(mastery) / (4 * count)`) restricted to the filtered stars,
  rather than a separate stat.
