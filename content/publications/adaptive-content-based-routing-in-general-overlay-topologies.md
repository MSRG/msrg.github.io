+++
title = "Adaptive Content-Based Routing in General Overlay Topologies"
slug = "adaptive-content-based-routing-in-general-overlay-topologies"
year = 2008
authors = ["Guoli Li", "Vinod Muthusamy", "Hans-Arno Jacobsen"]
venue = "ACM/IFIP/USENIX International Middleware Conference"
publication_type = "Conference Paper"
research = ["data-management"]
tags = ["publish-subscribe", "content-based-routing", "overlay-networks"]
summary = "Develops content-based publish/subscribe algorithms that support general (cyclic) overlay topologies, enabling adaptive routing and composite event detection, implemented in the PADRES system."
external_url = "https://link.springer.com/chapter/10.1007/978-3-540-89856-6_1"
related_datasets = ["cyclic-overlay-workload"]
+++

Traditional content-based publish/subscribe systems assume acyclic or tree-based
overlay topologies. This paper develops algorithms for general overlay topologies,
allowing publication routes to adapt to dynamic conditions and composite events to
be detected at optimal points in the network. The implementation in PADRES is
evaluated in both a controlled local environment and a wide-area PlanetLab
deployment, with the companion workload package capturing subscription-generation
patterns for stock-style event streams.
