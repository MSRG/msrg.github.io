+++
title = "Scalable Multiway Stream Joins in Hardware"
year = 2020
authors = ["Mohammadreza Najafi", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "IEEE Transactions on Knowledge and Data Engineering"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1109/tkde.2019.2916860"
abstract = "Efficient real-time analytics are an integral part of an increasing number of data management applications, such as computational targeted advertising, algorithmic trading, and Internet of Things. In this paper, we focus primarily on accelerating stream joins, which are arguably one of the most commonly used and resource-intensive operators in stream processing. We propose a scalable circular pipeline design (Circular-MJ) in hardware to orchestrate a multiway join while minimizing data flow disruption. In this circular design, each new tuple (given its origin stream) starts its processing from a specific join core and passes through all respective join cores in a pipeline sequence to produce the final results. We also present a novel two-stage pipeline stream join (Stashed-MJ) that uses a best-effort buffering technique (referred to as stash) to maintain intermediate results. If an overwrite is detected in the stash, our design automatically resorts to recomputing intermediate results. Finally, we present a parallelized version of our multiway stream join by integrating our proposed pipelines into a parallel unidirectional flow-based architecture (Parallel-MJ). Our experimental results demonstrate a linear throughput scaling with respect to the numbers of streams and processing cores."
+++
