+++
title = "A Scalable Circular Pipeline Design for Multi-Way Stream Joins in Hardware"
year = 2018
authors = ["Mohammadreza Najafi", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "2018 IEEE 34th International Conference on Data Engineering (ICDE)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icde.2018.00130"
abstract = "Efficient real-time analytics are an integral part of a growing number of data management applications such as computational targeted advertising, algorithmic trading, and Internet of Things. In this paper, we primarily focus on accelerating stream joins, arguably one of the most commonly used and resource-intensive operators in stream processing. We propose a scalable circular pipeline design (Circular-MJ) in hardware to orchestrate multi-way join while minimizing data flow disruption. In this circular design, each new tuple (given its origin stream) starts its processing from a specific join core and passes through all respective join cores in a pipeline sequence to produce final results. We further present a novel two-stage pipeline stream join (Stashed-MJ) that uses a best-effort buffering technique (stash) to maintain intermediate results. In a case that an overwrite is detected in the stash, our design automatically resorts to recomputing intermediate results. Our experimental results demonstrate a linear throughput scaling with respect to the number of execution units in hardware."
+++
