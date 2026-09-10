+++
title = "MERC: Match at Edge and Route intra-Cluster for Content-based Publish/Subscribe Systems"
year = 2015
authors = ["Shuping Ji", "Chunyang Ye", "Jun Wei", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 16th Annual Middleware Conference"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/2814576.2814801"
abstract = "Despite suffering from inefficiency and flexibility limitations, the filter-based routing (FBR) algorithm is widely used in content-based publish/subscribe (pub/sub) systems. To address its limitations, we propose a dynamic destination-based routing algorithm called D-DBR, which decomposes pub/sub into two independent parts: Content-based matching and destination-based multicasting. D-DBR exhibits low event matching cost and high efficiency, flexibility, and robustness for event routing in small scale overlays. To boost scalability, we further complement D-DBR with a new routing algorithm called MERC. MERC divides the overlay into interconnected clusters and applies content-based and destination-based mechanisms to route events inter- and intra-cluster, respectively. We implemented all algorithms in the PADRES pub/sub system. Experimental results show that our algorithms outperform FBR in terms of improving event dissemination throughput by up to 700% and reducing the end-to-end latency by up to 55%."
+++
