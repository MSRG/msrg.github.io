+++
title = "Why Do My Blockchain Transactions Fail?: A Study of Hyperledger Fabric"
year = 2021
authors = ["Jeeta Ann Chacko", "Ruben Mayer", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 2021 International Conference on Management of Data"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3448016.3452823"
abstract = "Permissioned blockchain systems promise to provide both decentralized trust and privacy. Hyperledger Fabric is currently one of the most wide-spread permissioned blockchain systems and is heavily promoted both in industry and academia. Due to its optimistic concurrency model, the transaction failure rates in Fabric can become a bottleneck. While there is active research to reduce failures, there is a lack of understanding on their root cause and, consequently, a lack of guidelines on how to configure Fabric optimally for different scenarios. To close this gap, in this paper, we first introduce a formal definition of the different types of transaction failures in Fabric. Then, we develop a comprehensive testbed and benchmarking system, HyperLedgerLab, along with four different chaincodes that represent realistic use cases and a chaincode/workload generator. Using HyperLedgerLab, we conduct exhaustive experiments to analyze the impact of different parameters of Fabric such as block size, endorsement policies, and others, on transaction failures. We further analyze three recently proposed optimizations from the literature, Fabric++, Streamchain and FabricSharp, and evaluate under which conditions they reduce the failure rates. Finally, based on our results, we provide recommendations for Fabric practitioners on how to configure the system and also propose new research directions."
+++
