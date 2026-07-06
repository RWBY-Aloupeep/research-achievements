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

# Starter set for the star map. Real, well-known papers/concepts in
# physics-based animation -- placeholders the user will replace/expand.
# Tags are chosen so shared-tag clusters ("constellations") form naturally:
# MPM, PIC/FLIP, Eulerian fluids, SPH, FEM, and neural/differentiable sim.
SEED_NODES = [
    {
        "title": "A Material Point Method for Snow Simulation",
        "kind": "paper",
        "description": "Stomakhin et al. 2013 -- introduced MPM to graphics for simulating snow.",
        "tags": ["mpm", "hybrid", "simulation", "snow"],
    },
    {
        "title": "Material Point Method (MPM)",
        "kind": "concept",
        "description": "Hybrid Lagrangian-Eulerian method: particles carry state, a background grid handles gradients/collisions.",
        "tags": ["mpm", "hybrid", "lagrangian", "eulerian"],
    },
    {
        "title": "The Particle-in-Cell Method for Fluid Dynamics",
        "kind": "paper",
        "description": "Harlow 1964 -- the original PIC method for fluid simulation.",
        "tags": ["pic", "fluids", "grid", "particle"],
    },
    {
        "title": "FLIP: A Method for Adaptively Zoned Particle-in-Cell Calculations",
        "kind": "paper",
        "description": "Brackbill & Ruppel 1986 -- FLIP, reducing PIC's numerical dissipation.",
        "tags": ["flip", "pic", "particle", "grid", "fluids"],
    },
    {
        "title": "Animating Sand as a Fluid",
        "kind": "paper",
        "description": "Zhu & Bridson 2005 -- brought FLIP into computer graphics for granular/fluid materials.",
        "tags": ["flip", "fluids", "sand", "particle"],
    },
    {
        "title": "PIC/FLIP Transfer Schemes",
        "kind": "concept",
        "description": "How particle and grid representations exchange velocity each step, and the PIC/FLIP blend tradeoff.",
        "tags": ["pic", "flip", "particle", "grid", "fluids"],
    },
    {
        "title": "Stable Fluids",
        "kind": "paper",
        "description": "Jos Stam 1999 -- unconditionally stable semi-Lagrangian advection for real-time Eulerian fluids.",
        "tags": ["eulerian", "fluids", "navier-stokes", "grid"],
    },
    {
        "title": "Navier-Stokes Discretization",
        "kind": "concept",
        "description": "How the incompressible Navier-Stokes equations get discretized on a grid (advect, project, diffuse).",
        "tags": ["navier-stokes", "fluids", "pde", "discretization"],
    },
    {
        "title": "Eulerian vs Lagrangian Methods",
        "kind": "concept",
        "description": "Fixed-grid vs particle-based views of continuum motion, and why hybrids exist.",
        "tags": ["eulerian", "lagrangian", "discretization"],
    },
    {
        "title": "Smoothed Particle Hydrodynamics: Theory and Application to Non-Spherical Stars",
        "kind": "paper",
        "description": "Gingold & Monaghan 1977 -- the original SPH paper, from astrophysics.",
        "tags": ["sph", "particle", "fluids"],
    },
    {
        "title": "Smoothed Particle Hydrodynamics (SPH)",
        "kind": "concept",
        "description": "Meshless Lagrangian method: field quantities interpolated from nearby particles via a smoothing kernel.",
        "tags": ["sph", "particle", "lagrangian", "fluids"],
    },
    {
        "title": "Position Based Fluids",
        "kind": "paper",
        "description": "Macklin & Muller 2013 -- SPH-like fluids solved via position-based constraint projection.",
        "tags": ["sph", "particle", "fluids", "position-based"],
    },
    {
        "title": "Finite Element Method (FEM)",
        "kind": "concept",
        "description": "Discretizing a domain into elements and solving PDEs via a weak/variational formulation over them.",
        "tags": ["fem", "discretization", "elasticity"],
    },
    {
        "title": "Taichi: A Language for High-Performance Computation on Spatially Sparse Data Structures",
        "kind": "paper",
        "description": "Hu et al. 2019 -- a DSL for sparse, differentiable physical simulation on GPUs.",
        "tags": ["differentiable", "dsl", "simulation", "sparse"],
    },
    {
        "title": "ChainQueen: A Real-Time Differentiable Physical Simulator for Soft Robotics",
        "kind": "paper",
        "description": "Hu et al. 2019 -- differentiable MPM for soft-body control and learning.",
        "tags": ["differentiable", "soft-robotics", "mpm", "neural"],
    },
    {
        "title": "DiffTaichi: Differentiable Programming for Physical Simulation",
        "kind": "paper",
        "description": "Hu et al. 2020 -- a system for building differentiable physical simulators.",
        "tags": ["differentiable", "neural", "simulation", "dsl"],
    },
    {
        "title": "Learning to Simulate Complex Physics with Graph Networks",
        "kind": "paper",
        "description": "Sanchez-Gonzalez et al. 2020 -- graph neural networks that learn particle-based simulation.",
        "tags": ["neural", "learning-based", "graph-networks", "simulation"],
    },
    {
        "title": "Differentiable Simulation",
        "kind": "concept",
        "description": "Making a simulator's output differentiable w.r.t. its inputs/parameters, so gradients can drive learning or control.",
        "tags": ["differentiable", "neural", "learning-based", "gradient"],
    },
    {
        "title": "Neural / Learning-Based Simulation",
        "kind": "concept",
        "description": "Replacing or augmenting parts of a physics solver with a learned model (e.g. a graph network).",
        "tags": ["neural", "learning-based", "simulation", "graph-networks"],
    },
]
