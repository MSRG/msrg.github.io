+++
title = "Reversible conflict-free replicated data types"
year = 2022
authors = ["Yunhao Mao", "Zongxin Liu", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 23rd ACM/IFIP International Middleware Conference"
publication_type = "Conference Paper"
research = ["data-management"]
tags = ["distributed-systems"]
external_url = "https://doi.org/10.1145/3528535.3565252"
abstract = "Conflict-free replicated data types (CRDTs) are popular for optimistic replication and ensuring strong eventual consistency (SEC) in distributed systems. However, reversibility is an underdeveloped functionality for CRDTs, despite its usefulness in system restoration from an erroneous state or undoing unwanted operations. In this paper, we define the concept and design of reversible CRDTs (rCRDTs). Reverse operations compensate for the effect of reversed updates, and they extend existing CRDT interfaces. Three abstractions for reversibility are proposed: reversing a single update, multiple causally related updates, and multiple logically related updates that capture the user intention behind the updates. Moreover, a replicated and distributed key-value store, rKVCRDT, is implemented as a proof of concept that integrates the support of reversible CRDTs. The rCRDTs' evaluation show that although adding reversibility affects the system's performance, the end result depends on multiple factors and varies based on the underlying CRDTs. System designers must consider the trade-off between the benefit of reversibility and the performance impact."
+++
