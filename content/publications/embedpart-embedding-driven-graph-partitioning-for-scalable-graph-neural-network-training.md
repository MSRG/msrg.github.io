+++
title = "EmbedPart: Embedding-Driven Graph Partitioning for Scalable Graph Neural Network Training"
year = 2026
authors = ["Nikolai Merkel", "Ruben Mayer", "Volker Markl", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["distributed-machine-learning", "data-management"]
external_url = "https://arxiv.org/abs/2604.01000"
abstract = "Graph Neural Networks (GNNs) are widely used for learning on graph-structured data, but scaling GNN training to massive graphs remains challenging. To enable scalable distributed training, graphs are divided into smaller partitions that are distributed across multiple machines such that inter-machine communication is minimized and computational load is balanced. In practice, existing partitioning approaches face a fundamental trade-off between partitioning overhead and partitioning quality. We propose EmbedPart, an embedding-driven partitioning approach that achieves both speed and quality. Instead of operating directly on irregular graph structures, EmbedPart leverages node embeddings produced during the actual GNN training workload and clusters these dense embeddings to derive a partitioning. EmbedPart achieves more than 100x speedup over Metis while maintaining competitive partitioning quality and accelerating distributed GNN training. Moreover, EmbedPart naturally supports graph updates and fast repartitioning, and can be applied to graph reordering to improve data locality and accelerate single-machine GNN training. By shifting partitioning from irregular graph structures to dense embeddings, EmbedPart enables scalable and high-quality graph data optimization."
+++
