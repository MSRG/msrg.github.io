+++
title = "Overlay Design for Topic-Based Publish/Subscribe under Node Degree Constraints"
year = 2016
authors = ["Chen Chen", "Yoav Tock", "Hans-Arno Jacobsen"]
venue = "2016 IEEE 36th International Conference on Distributed Computing Systems (ICDCS)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2016.79"
abstract = "It is important to build overlays for topic-based publish/subscribe (pub/sub) under resource constraints. In a topic-connected overlay (TCO), each topic t induces a connected sub-overlay among all nodes interested in t. Existing work merely consider how to optimize a complete TCO and implicitly commit the unrealistic assumption of unlimited resources. In contrast, we make maximum use of restricted node degree budgets to build a partial TCO. We formalize the notion of TCO support to capture the quality of the pub/sub overlay. Furthermore, we demonstrate that partial TCOs usually exhibit significantly better cost-effectiveness in practice. We propose two problems of maximizing TCO support in a partial TCO: (1) PTCOA with a bounded average node degree and (2) PTCOM under the maximum node degree constraint. We design two greedy algorithms, which achieve the constant approximation ratios of (1-e-1) for PTCOA and (1-e-1/6) for PTCOM, respectively. Empirical evaluation demonstrates the scalability of our algorithms under a variety of pub/sub workloads. Given practical data sets extracted from Facebook and Twitter, our algorithms produce an 80% TCO with fewer than 20% of the node degree budget as a complete TCO. We also show experimentally that it is promising to design decentralized protocols to compute a partial TCO for pub/sub."
+++
