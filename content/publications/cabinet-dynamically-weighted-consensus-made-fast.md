+++
title = "Cabinet: Dynamically Weighted Consensus Made Fast"
year = 2025
authors = ["Gengrui Zhang", "Shiquan Zhang", "Michail Bachras", "Yuqiu Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the VLDB Endowment"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.14778/3718057.3718071"
abstract = "Conventional consensus algorithms, such as Paxos and Raft, encounter inefficiencies when applied to large-scale distributed systems due to the requirement of waiting for replies from a majority of nodes. To address these challenges, we propose Cabinet, a novel consensus algorithm that introduces dynamically weighted consensus, allocating distinct weights to nodes based on any given failure thresholds. Cabinet dynamically adjusts nodes' weights according to their responsiveness, assigning higher weights to faster nodes. The dynamic weight assignment maintains an optimal system performance, especially in large-scale and heterogeneous systems where node responsiveness varies. We evaluate Cabinet against Raft with distributed MongoDB and PostgreSQL databases using YCSB and TPC-C workloads. The evaluation results show that Cabinet outperforms Raft in throughput and latency under increasing system scales, complex networks, and failures in both homogeneous and heterogeneous clusters, offering a promising high-performance consensus solution."
+++
