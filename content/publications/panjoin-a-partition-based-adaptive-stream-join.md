+++
title = "PanJoin: A Partition-based Adaptive Stream Join"
year = 2018
authors = ["Fei Pan", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["data-management"]
external_url = "https://arxiv.org/abs/1811.05065"
abstract = "In stream processing, stream join is one of the critical sources of performance bottlenecks. The sliding-window-based stream join provides a precise result but consumes considerable computational resources. The current solutions lack support for the join predicates on large windows. These algorithms and their hardware accelerators are either limited to equi-join or use a nested loop join to process all the requests. In this paper, we present a new algorithm called PanJoin which has high throughput on large windows and supports both equi-join and non-equi-join. PanJoin implements three new data structures to reduce computations during the probing phase of stream join. We also implement the most hardware-friendly data structure, called BI-Sort, on FPGA. Our evaluation shows that PanJoin outperforms several recently proposed stream join methods by more than 1000x, and it also adapts well to highly skewed data."
+++
