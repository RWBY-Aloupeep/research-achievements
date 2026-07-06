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
