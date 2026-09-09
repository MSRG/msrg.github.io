+++
title = "Can Graph Reordering Speed Up Graph Neural Network Training? An Experimental Study"
year = 2024
authors = ["Nikolai Merkel", "Pierre Toussing", "Ruben Mayer", "Hans-Arno Jacobsen"]
venue = "arXiv Preprint"
publication_type = "ArXiv Preprint"
research = ["distributed-machine-learning"]
tags = ["graph-systems", "performance", "distributed-training"]
summary = "Experimental study of how graph reordering strategies affect GNN training on CPU and GPU systems."
external_url = "https://arxiv.org/abs/2409.11129"
+++

This paper studies whether graph reordering can reduce the cost of training
graph neural networks. The work compares multiple reordering strategies across
two state-of-the-art GNN systems and looks at how the payoff changes with model
shape, feature size, and accelerator choice.

The result is a systems-focused view of reordering: it can improve training
time, but the value depends heavily on the workload and on how much time is
spent preparing the graph layout in the first place.
