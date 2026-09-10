+++
title = "FabricCRDT: A Conflict-Free Replicated Datatypes Approach to Permissioned Blockchains"
year = 2019
authors = ["Pezhman Nasirifard", "Ruben Mayer", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 20th International Middleware Conference"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3361525.3361540"
abstract = "With the increased adaption of blockchain technologies, permissioned blockchains such as Hyperledger Fabric provide a robust ecosystem for developing production-grade decentralized applications. However, the additional latency between executing and committing transactions, due to Fabric's three-phase transaction lifecycle of Execute-Order-Validate (EOV), is a potential scalability bottleneck. The added latency increases the probability of concurrent updates on the same keys by different transactions, leading to transaction failures caused by Fabric's concurrency control mechanism. The transaction failures increase the application development complexity and decrease Fabric's throughput. Conflict-free Replicated Datatypes (CRDTs) provide a solution for merging and resolving conflicts in the presence of concurrent updates. In this work, we introduce FabricCRDT, an approach for integrating CRDTs to Fabric. Our evaluations show that in general, FabricCRDT offers higher throughput of successful transactions than Fabric, while successfully committing and merging all conflicting transactions without any failures."
+++
