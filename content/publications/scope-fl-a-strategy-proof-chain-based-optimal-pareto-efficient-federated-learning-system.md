+++
title = "SCOPE-FL: A Strategy-proof Chain-based Optimal pareto efficient Federated Learning System"
year = 2026
authors = ["Seyed Salar Ghazi", "Kaiwen Zhang", "Mehdi feizi", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["distributed-machine-learning"]
external_url = "https://arxiv.org/abs/2606.18384"
abstract = "Hierarchical Federated Learning (HFL) enables scalable collaborative model training across distributed devices while preserving data privacy. However, existing HFL client selection mechanisms suffer from a fundamental strategic inefficiency. By prioritizing stability over Pareto efficiency (PE), they produce suboptimal resource allocations, and without strategy proofness (SP), participants are incentivized to misrepresent their true preferences, both failures degrading system overall welfare in the Pareto sense in practice. To address it, we propose SCOPE-FL (Strategy-proof Chain-based Optimal pareto efficient Federated Learning), a synchronous HFL framework that formulates client selection as a two-sided school choice problem solved through the Top Trading Cycle (TTC) algorithm that simultaneously guarantees PE and SP. For reward distribution, SCOPE-FL employs a scalable Shapley value approximation based on One-Round Reconstruction (OR), ensuring compensation proportional to each client's contribution. The entire mechanism executes via blockchain smart contracts, providing the tamper-proof environment required for the SP guarantees to hold in practice. A comprehensive evaluation on MNIST, Fashion-MNIST, and CIFAR-10 demonstrates that SCOPE-FL outperforms state-of-the-art approaches, including DA, IAS, and other methods across model accuracy, convergence rate, and reward efficiency, while achieving communication latency comparable to DA and blockchain overhead significantly lower than DA at scale."
+++
