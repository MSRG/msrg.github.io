+++
title = "Making CRDTs Not So Eventual"
year = 2024
authors = ["Yunhao Mao", "Gengrui Zhang", "Zongxin Liu", "Pezhman Nasirifard", "Sofia Tijanic", "Hans-Arno Jacobsen"]
venue = "Proceedings of the VLDB Endowment"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.14778/3705829.3705850"
abstract = "Conflict-free replicated data types (CRDTs) are highly available and performant data replication solutions for distributed applications. However, their eventual consistency guarantees are often insufficient for ensuring application correctness, especially in the presence of Byzantine failures. Naively applying traditional consensus and Byzantine fault tolerance (BFT) protocols to CRDT updates for stronger guarantees, while intuitive, negates the performance benefits of CRDTs. We introduce a novel programming model called reliable CRDTs that expands CRDTs with additional guarantees: users can query strongly or eventually consistent values, enforce a total order among selected operations, and define data-type level invariants while remaining operational in the presence of Byzantine failures. Reliable CRDTs enable the use of CRDTs in scenarios where strong consistency is needed while maintaining their performance advantages. We present an implementation of reliable CRDTs named Janus. It enhances CRDTs with the aforementioned features by functioning as a middleware that facilitates CRDT communication and asynchronously runs a BFT consensus protocol. Our evaluation demonstrates that Janus achieves 21× higher throughput than naively applying state-of-the-art BFT protocols such as HotStuff achieves, and it remains responsive even under heavy loads."
+++
