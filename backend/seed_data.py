# Seed set for the `research` domain only. Deliberately small and verifiable —
# not an exhaustive taxonomy. New achievements are meant to be added over time
# through the UI or by editing this list before a fresh `achievements.db` is built.

SEED_ACHIEVEMENTS = [
    # --- Numerical methods / PDE fundamentals ---
    {
        "title": "Discretize a 1D Heat Equation",
        "description": "Implement a finite-difference solver for the 1D heat equation and verify it against the analytical solution.",
        "tags": ["numerical-methods", "pde"],
        "tier": "bronze",
    },
    {
        "title": "CFL Chaser",
        "description": "Deliberately violate the CFL condition in a solver, observe the numerical instability, then fix it.",
        "tags": ["numerical-methods", "pde"],
        "tier": "bronze",
    },
    {
        "title": "MPM From Scratch",
        "description": "Implement a basic 2D Material Point Method simulation of a falling sand column.",
        "tags": ["numerical-methods", "simulation"],
        "tier": "silver",
    },
    {
        "title": "Convergence Study",
        "description": "Run a grid-refinement study on a PDE solver and confirm the measured convergence order matches theory.",
        "tags": ["numerical-methods", "pde"],
        "tier": "silver",
    },
    {
        "title": "Multigrid or Bust",
        "description": "Implement a multigrid solver (or preconditioned CG) for a Poisson equation and benchmark it against a naive iterative solver.",
        "tags": ["numerical-methods", "pde"],
        "tier": "gold",
    },
    {
        "title": "Stability Proof",
        "description": "Derive and write up a von Neumann stability analysis for a scheme you've implemented.",
        "tags": ["numerical-methods", "pde", "writing"],
        "tier": "gold",
    },
    {
        "title": "Build a Small PDE Toolbox",
        "description": "Assemble a reusable personal library covering at least three PDE solvers (e.g. heat, wave, Poisson) with tests.",
        "tags": ["numerical-methods", "pde", "tooling"],
        "tier": "platinum",
    },
    # --- Deep paper reading ---
    {
        "title": "Three-Sentence Summary",
        "description": "Read one paper and summarize it in exactly three sentences.",
        "tags": ["paper-reading"],
        "tier": "bronze",
    },
    {
        "title": "Figure Detective",
        "description": "Pick one figure from a paper and write up what it shows and why the authors chose that visualization.",
        "tags": ["paper-reading"],
        "tier": "bronze",
    },
    {
        "title": "Methods Deep-Dive",
        "description": "Read a paper's methods section closely enough to redraw its core algorithm as pseudocode from memory.",
        "tags": ["paper-reading"],
        "tier": "silver",
    },
    {
        "title": "Related Work Map",
        "description": "Read a paper plus three of its cited references and sketch how they relate.",
        "tags": ["paper-reading"],
        "tier": "silver",
    },
    {
        "title": "Weekly Reading Streak",
        "description": "Read and summarize one paper a week for four consecutive weeks.",
        "tags": ["paper-reading"],
        "tier": "silver",
    },
    {
        "title": "Critical Review",
        "description": "Write a referee-style critique of a paper: strengths, weaknesses, and one experiment you'd add.",
        "tags": ["paper-reading", "writing"],
        "tier": "gold",
    },
    {
        "title": "Literature Cluster",
        "description": "Read five papers on the same subtopic and write a short synthesis of how the field's approach evolved.",
        "tags": ["paper-reading"],
        "tier": "gold",
    },
    {
        "title": "Reading List Cleared",
        "description": "Finish a self-curated 20-paper reading list end to end, with a summary for each.",
        "tags": ["paper-reading"],
        "tier": "platinum",
    },
    # --- Code reproduction / tooling ---
    {
        "title": "Clone and Run",
        "description": "Get someone else's published research code running locally end-to-end on the provided example.",
        "tags": ["reproduction", "tooling"],
        "tier": "bronze",
    },
    {
        "title": "Environment Tamed",
        "description": "Containerize (Docker) or pin (lockfile) a research codebase's environment so it runs reproducibly.",
        "tags": ["tooling"],
        "tier": "bronze",
    },
    {
        "title": "Reproduce a Figure",
        "description": "Reproduce one key figure or result from a paper using the authors' code or your own reimplementation.",
        "tags": ["reproduction"],
        "tier": "silver",
    },
    {
        "title": "Bug Bounty",
        "description": "Find and fix (or clearly document) a bug in someone else's public research code.",
        "tags": ["reproduction", "tooling"],
        "tier": "silver",
    },
    {
        "title": "Reimplementation From Paper",
        "description": "Reimplement a paper's core method from scratch (not the authors' code) and match reported results within reasonable tolerance.",
        "tags": ["reproduction"],
        "tier": "gold",
    },
    {
        "title": "Tooling Upgrade",
        "description": "Build a reusable tool or script (experiment tracker, plotting utility, benchmark harness) that saves time on future projects.",
        "tags": ["tooling"],
        "tier": "gold",
    },
    {
        "title": "Open-Source It",
        "description": "Clean up a reproduction or tool and publish it publicly with docs and a license.",
        "tags": ["reproduction", "tooling"],
        "tier": "platinum",
    },
    # --- Technical writing / explaining research ---
    {
        "title": "Explain It to a Friend",
        "description": "Explain a concept from your research to a non-specialist in under five minutes.",
        "tags": ["writing", "communication"],
        "tier": "bronze",
    },
    {
        "title": "One-Pager",
        "description": "Write a one-page plain-language summary of a technical topic you're learning.",
        "tags": ["writing"],
        "tier": "bronze",
    },
    {
        "title": "Blog It",
        "description": "Write and publish a short blog post explaining a method or paper in your own words.",
        "tags": ["writing", "communication"],
        "tier": "silver",
    },
    {
        "title": "Slide Deck Distillation",
        "description": "Condense a paper or project into a five-slide deck.",
        "tags": ["writing", "communication"],
        "tier": "silver",
    },
    {
        "title": "Talk Rehearsal",
        "description": "Give a ten-minute practice talk (recorded or to a friend/group) on a research topic and get feedback.",
        "tags": ["communication"],
        "tier": "gold",
    },
    {
        "title": "Technical Note",
        "description": "Write a polished technical note (2-4 pages) on a self-contained result, ready to share.",
        "tags": ["writing"],
        "tier": "platinum",
    },
]

# Small demo slice for the knowledge-graph preview. Intentionally tiny — just
# enough real, connected nodes to look at a graph, not a real paper library.
SEED_CONCEPTS = [
    {
        "name": "Finite Difference Method",
        "description": "Approximating derivatives with discrete differences on a grid to solve PDEs numerically.",
        "tags": ["numerical-methods", "pde"],
    },
    {
        "name": "CFL Condition",
        "description": "Necessary stability condition bounding time-step size relative to grid spacing in explicit schemes.",
        "tags": ["numerical-methods", "pde"],
    },
    {
        "name": "Von Neumann Stability Analysis",
        "description": "Fourier-mode technique for determining whether a numerical scheme amplifies or damps errors.",
        "tags": ["numerical-methods", "pde"],
    },
    {
        "name": "Multigrid Methods",
        "description": "Hierarchy-of-grids technique for accelerating convergence of iterative linear solvers.",
        "tags": ["numerical-methods", "pde"],
    },
    {
        "name": "Material Point Method",
        "description": "Hybrid Lagrangian-Eulerian method representing continua with particles advected through a background grid.",
        "tags": ["numerical-methods", "simulation"],
    },
]

SEED_PAPERS = [
    {
        "title": "A Material Point Method for Snow Simulation",
        "authors": "Stomakhin, Schroeder, Chai, Teran, Selle",
        "year": 2013,
        "venue": "ACM SIGGRAPH",
        "tags": ["simulation", "mpm"],
        "status": "read",
    },
    {
        "title": "Stable Fluids",
        "authors": "Jos Stam",
        "year": 1999,
        "venue": "SIGGRAPH",
        "tags": ["simulation", "fluids"],
        "status": "to-read",
    },
]

# source_key/target_key are looked up against the title/name declared above
# (or an existing achievement title) at seed time.
SEED_EDGES = [
    {"source_type": "achievement", "source_key": "Discretize a 1D Heat Equation", "relation_type": "demonstrates", "target_type": "concept", "target_key": "Finite Difference Method"},
    {"source_type": "achievement", "source_key": "CFL Chaser", "relation_type": "demonstrates", "target_type": "concept", "target_key": "CFL Condition"},
    {"source_type": "achievement", "source_key": "MPM From Scratch", "relation_type": "demonstrates", "target_type": "concept", "target_key": "Material Point Method"},
    {"source_type": "achievement", "source_key": "Multigrid or Bust", "relation_type": "demonstrates", "target_type": "concept", "target_key": "Multigrid Methods"},
    {"source_type": "achievement", "source_key": "Stability Proof", "relation_type": "demonstrates", "target_type": "concept", "target_key": "Von Neumann Stability Analysis"},
    {"source_type": "concept", "source_key": "CFL Condition", "relation_type": "prerequisite_of", "target_type": "concept", "target_key": "Von Neumann Stability Analysis"},
    {"source_type": "concept", "source_key": "Finite Difference Method", "relation_type": "prerequisite_of", "target_type": "concept", "target_key": "Multigrid Methods"},
    {"source_type": "paper", "source_key": "A Material Point Method for Snow Simulation", "relation_type": "introduces", "target_type": "concept", "target_key": "Material Point Method"},
    {"source_type": "paper", "source_key": "Stable Fluids", "relation_type": "related_to", "target_type": "concept", "target_key": "Finite Difference Method"},
]
