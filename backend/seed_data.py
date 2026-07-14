# Starter set for the star map. Real, well-known papers in physics-based
# animation -- placeholders the user will replace/expand. Papers only: the
# "concept" kind (e.g. "Material Point Method (MPM)" as a standalone idea,
# not a specific paper) was tried and then dropped -- concepts have no
# author, which doesn't fit an author-based map, and the user asked to
# remove them entirely rather than special-case them. Tags are chosen so
# shared-tag clusters ("constellations") form naturally: MPM, PIC/FLIP,
# Eulerian fluids, SPH, FEM, and neural/differentiable sim.
SEED_NODES = [
    {
        "title": "A Material Point Method for Snow Simulation",
        "kind": "paper",
        "description": "Stomakhin et al. 2013 -- introduced MPM to graphics for simulating snow.",
        "tags": ["mpm", "hybrid", "simulation", "snow"],
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
        "title": "Stable Fluids",
        "kind": "paper",
        "description": "Jos Stam 1999 -- unconditionally stable semi-Lagrangian advection for real-time Eulerian fluids.",
        "tags": ["eulerian", "fluids", "navier-stokes", "grid"],
    },
    {
        "title": "Smoothed Particle Hydrodynamics: Theory and Application to Non-Spherical Stars",
        "kind": "paper",
        "description": "Gingold & Monaghan 1977 -- the original SPH paper, from astrophysics.",
        "tags": ["sph", "particle", "fluids"],
    },
    {
        "title": "Position Based Fluids",
        "kind": "paper",
        "description": "Macklin & Muller 2013 -- SPH-like fluids solved via position-based constraint projection.",
        "tags": ["sph", "particle", "fluids", "position-based"],
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
]
