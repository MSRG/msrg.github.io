+++
title = "Fugue: Online Elasticity for Distributed Stateful Stream Processing"
year = 2026
authors = ["Yuqiu Zhang", "Yunhao Mao", "Hans-Arno Jacobsen"]
venue = "Proceedings of the VLDB Endowment"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.14778/3836663.3836689"
abstract = "Stateful stream processing engines are critical for real-time analytics but lack efficient mechanisms for runtime elasticity. The dominant \"stop-the-world\" model, used by systems like Apache Flink, requires halting applications globally for a long time, while recent on-the-fly protocols introduce severe trade-offs: proactive approaches impose a continuous resource tax by constantly replicating state, and existing reactive solutions suffer from architectural complexity and external dependencies. This paper introduces Fugue, a novel, self-contained reactive protocol that provides seamless and resource-efficient elasticity. The core of Fugue is a two-phase design that combines a pre-emptive background state transfer with an atomic, lightweight barrier-based cutover. By moving the bulk of an operator's state off the critical path and unifying the final ownership transfer with the system's native exactly-once synchronization mechanism, Fugue guarantees correctness with minimal disruption and steady-state overhead. We implemented Fugue in Apache Flink and our evaluation on realistic benchmarks shows it reduces tail reconfiguration latency by up to 98.6% relative to native Flink while maintaining over 90% of peak throughput. Compared to reactive pull-based baselines, Fugue reduces end-to-end migration latency by up to 93.7%. Compared to proactive replication, it reaches comparable handover performance while avoiding continuous replication overhead. Together, these results demonstrate a strong combination of robustness, performance, and operational simplicity."
+++
