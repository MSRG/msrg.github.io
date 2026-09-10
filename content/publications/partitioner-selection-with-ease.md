+++
title = "Partitioner Selection with EASE to Optimize Distributed Graph Processing"
year = 2023
authors = ["Nikolai Merkel", "Ruben Mayer", "Tawkir Ahmed Fakir", "Hans-Arno Jacobsen"]
venue = "2023 IEEE 39th International Conference on Data Engineering (ICDE)"
publication_type = "Conference Paper"
research = ["distributed-machine-learning", "data-management"]
tags = ["graph-systems", "graph-processing", "auto-tuning"]
external_url = "https://doi.org/10.1109/icde55515.2023.00185"
abstract = "For distributed graph processing on massive graphs, a graph is partitioned into multiple equally-sized parts which are distributed among machines in a compute cluster. In the last decade, many partitioning algorithms have been developed which differ from each other with respect to the partitioning quality, the run-time of the partitioning and the type of graph for which they work best. The plethora of graph partitioning algorithms makes it a challenging task to select a partitioner for a given scenario. Different studies exist that provide qualitative insights into the characteristics of graph partitioning algorithms that support a selection. However, in order to enable automatic selection, a quantitative prediction of the partitioning quality, the partitioning run-time and the run-time of subsequent graph processing jobs is needed. In this paper, we propose a machine learning-based approach to provide such a quantitative prediction for different types of edge partitioning algorithms and graph processing workloads. We show that training based on generated graphs achieves high accuracy, which can be further improved when using real-world data. Based on the predictions, the automatic selection reduces the end-to-end run-time on average by 11.1% compared to a random selection, by 17.4% compared to selecting the partitioner that yields the lowest cut size, and by 29.1% compared to the worst strategy, respectively. Furthermore, in 35.7% of the cases, the best strategy was selected."
+++
