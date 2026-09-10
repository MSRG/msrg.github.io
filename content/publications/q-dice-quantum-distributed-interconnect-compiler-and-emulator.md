+++
title = "Q-DICE: Quantum Distributed Interconnect Compiler and Emulator"
year = 2026
authors = ["Michael Silver", "Zachary Vernec", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["quantum-computing-systems"]
tags = ["quantum-systems"]
external_url = "https://arxiv.org/abs/2606.11340"
abstract = "As distributed quantum computing (DQC) offers a leading path towards scalable quantum computation, the ability to benchmark distributed algorithms under realistic conditions becomes critical for system co-design. However, without access to physical systems, researchers lack tools to evaluate distribution protocols. We introduce Q-DICE (Quantum Distributed Interconnect Compiler and Emulator), a hardware-aware emulation environment for benchmarking distributed quantum circuits on classical simulators and on NISQ-era monolithic hardware. This work provides three core contributions: (1) a programmatic scheme to construct distributed QPU backends, utilizing two novel techniques - QPU slicing and stitching - to facilitate distributed circuit mapping, (2) a methodology for modeling nonlocal link noise using physically motivated Kraus operators and stochastic error channels, and (3) a boundary-aware circuit mapping algorithm enforcing distributed QPU topology constraints during transpilation. Together, these components constitute a distribution-aware compiler and noise-modeling engine that faithfully enforces the physical limitations of distributed quantum hardware within existing execution environments. We validate Q-DICE against a multitude of experimentally demonstrated quantum circuits, including a distributed Grover's search on optically linked trapped-ion hardware, achieving a worst-case fidelity deviation of 4% between simulated and experimental results. These findings demonstrate Q-DICE's capacity to accurately reproduce real distributed quantum system behavior across platforms, streamlining experimentation with distributed quantum algorithms and architectures."
+++
