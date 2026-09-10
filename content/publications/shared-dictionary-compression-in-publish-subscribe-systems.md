+++
title = "Shared dictionary compression in publish/subscribe systems"
year = 2016
authors = ["Christoph Doblander", "Tanuj Ghinaiya", "Kaiwen Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 10th ACM International Conference on Distributed and Event-based Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/2933267.2933308"
abstract = "Publish/subscribe is known as a scalable and efficient data dissemination mechanism. Its efficiency comes from the optimized routing algorithms, yet few works exist on employing compression to save bandwidth, which is especially important in mobile environments. State of the art compression methods such as GZip or Deflate can be generally employed to compress messages. In this paper, we show how to reduce bandwidth even further by employing Shared Dictionary Compression (SDC) in pub/sub. However, SDC requires a dictionary to be generated and disseminated prior to compression, which introduces additional computational and bandwidth overhead. To support SDC, we propose a novel and lightweight protocol for pub/sub which employs a new class of brokers, called sampling brokers. Our solution generates, and disseminates dictionaries using the sampling brokers. Dictionary maintenance is performed regularly using an adaptive algorithm. The evaluation of our proposed design shows that it is possible to compensate for the introduced overhead and achieve significant bandwidth reduction over Deflate."
+++
