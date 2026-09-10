+++
title = "Out-of-Core Edge Partitioning at Linear Run-Time"
year = 2022
authors = ["Ruben Mayer", "Kamil Orujzade", "Hans-Arno Jacobsen"]
venue = "2022 IEEE 38th International Conference on Data Engineering (ICDE)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icde53745.2022.00242"
abstract = "Graph edge partitioning is an important prepro-cessing step to optimize distributed computing jobs on graph-structured data. The edge set of a given graph is split into $k$ equally-sized partitions, such that the replication of vertices across partitions is minimized. Out-of-core edge partitioning algorithms are able to tackle the problem with low memory over-head. Existing out-of-core algorithms mainly work in a streaming manner and can be grouped into two types. While stateless streaming edge partitioning is fast and yields low partitioning quality, stateful streaming edge partitioning yields better quality, but is expensive, as it requires a scoring function to be evaluated for every edge on every partition, leading to a time complexity of O(|E| \\*k). In this paper, we propose 2PS-L, a novel out-of-core edge partitioning algorithm that builds upon the stateful streaming model, but achieves linear run-time i.e.,O(|E|)). 2PS-L consists of two phases. In the first phase, vertices are separated into clusters by a lightweight streaming clustering algorithm. In the second phase, the graph is re-streamed and vertex clustering from the first phase is exploited to reduce the search space of graph partitioning to only two target partitions for every edge. Our evaluations show that 2PS-L can achieve better partitioning quality than existing stateful streaming edge partitioners while having a much lower run-time. As a consequence, the total run-time of partitioning and subsequent distributed graph processing can be significantly reduced."
+++
