+++
title = "Data Management"
layout = "area"
weight = 30
accent = "navy"
question = "Can you imagine a distributed system that doesn't manage data in any way, shape, or form?"
blurb = """MSRG advances the frontiers of data management and distributed systems research. We develop **scalable** middleware platforms for efficient **large-scale** data processing and **real-time** event streaming. Our research has pioneered novel approaches to publish/subscribe systems, content-based routing, and filtering techniques that enable efficient data dissemination across distributed applications. In the cloud computing space, we optimize resource allocation and system performance for data-intensive workloads. Our work bridges theoretical computer science with practical distributed computing challenges, delivering innovative solutions that shape the future of middleware systems."""
# Description aligned with https://msrg.org/research/data-management/
+++

Data management brings together MSRG's work on cloud-native systems,
blockchains and distributed ledgers, consensus, and graph data processing.
Across these areas, we study how to make distributed infrastructure more
scalable and efficient.

## Cloud Native Systems

We study concurrent analytical queries in in-memory OLAP databases. Queries
can repeat computations and produce the same intermediate data. Our approach
detects these overlaps online and coordinates execution so queries can share
work and improve throughput.

## Blockchain, Distributed Ledger Technology & Consensus

We develop consensus algorithms, fault-tolerance mechanisms, and consistency
models for high-performance, scalable, available distributed applications.
Our Hyperledger Fabric work examines transaction failures and uses optimization
recommendations and adaptive configuration to improve throughput, latency,
and transaction success.

## Consistency Theory

We investigate reversible operations and Byzantine fault tolerance for
conflict-free replicated data types (CRDTs), developing algorithms that extend
their replication capabilities.

## Graph Processing

Graph partitioning affects distributed processing performance. We use machine
learning to select a partitioner suited to the input graph and its workload.

## Current directions

- Shared execution of concurrent analytical queries
- Consensus and distributed-ledger performance
- Reversible and Byzantine-fault-tolerant CRDTs
- Learning-based graph partitioner selection
