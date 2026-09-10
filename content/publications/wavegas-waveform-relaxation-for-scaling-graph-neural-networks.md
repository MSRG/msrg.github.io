+++
title = "WaveGAS: Waveform Relaxation for Scaling Graph Neural Networks"
year = 2025
authors = ["Jana Vatter", "Mykhaylo Zayats", "Marcos Martínez Galindo", "Vanessa López", "Ruben Mayer", "Hans-Arno Jacobsen", "Hoang Thanh Lam"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["distributed-machine-learning"]
external_url = "https://arxiv.org/abs/2502.19986"
abstract = "With the ever-growing size of real-world graphs, numerous techniques to overcome resource limitations when training Graph Neural Networks (GNNs) have been developed. One such approach, GNNAutoScale (GAS), uses graph partitioning to enable training under constrained GPU memory. GAS also stores historical embedding vectors, which are retrieved from one-hop neighbors in other partitions, ensuring critical information is captured across partition boundaries. The historical embeddings which come from the previous training iteration are stale compared to the GAS estimated embeddings, resulting in approximation errors of the training algorithm. Furthermore, these errors accumulate over multiple layers, leading to suboptimal node embeddings. To address this shortcoming, we propose two enhancements: first, WaveGAS, inspired by waveform relaxation, performs multiple forward passes within GAS before the backward pass, refining the approximation of historical embeddings and gradients to improve accuracy; second, a gradient-tracking method that stores and utilizes more accurate historical gradients during training. Empirical results show that WaveGAS enhances GAS and achieves better accuracy, even outperforming methods that train on full graphs, thanks to its robust estimation of node embeddings."
+++
