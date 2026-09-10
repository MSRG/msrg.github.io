+++
title = "Epoch-based Optimistic Concurrency Control in Geo-replicated Databases"
year = 2026
authors = ["Yunhao Mao", "Harunari Takata", "Michail Bachras", "Yuqiu Zhang", "Shiquan Zhang", "Gengrui Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the ACM on Management of Data"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3802052"
abstract = "Achieving high-performance transaction processing in geo-replicated OLTP databases is challenging due to the extensive over-coordination in distributed atomic commitment, concurrency control, and fault-tolerant replication protocols. To address this issue, we introduce Minerva, a unified distributed concurrency control protocol designed for highly scalable multi-leader replication. Minerva employs a novel epoch-based asynchronous replication protocol that decouples data propagation from the commitment process, enabling continuous transaction replication. Optimistic concurrency control is used to allow replicas to execute transactions concurrently and to commit without coordination. For conflict detection during validation, we construct a conflict graph and use a maximum weight independent set search algorithm to select the optimal subset of non-conflicting transactions for commitment, minimizing the number of invalid transactions. Finally, we deterministically re-execute conflicting transactions, ensuring serializability while eliminating aborts. Our evaluation demonstrates that Minerva outperforms state-of-the-art replicated databases, achieving over 3x higher throughput in scalability experiments and 2.8x higher throughput in a high-latency network simulation with the TPC-C benchmark."
+++
