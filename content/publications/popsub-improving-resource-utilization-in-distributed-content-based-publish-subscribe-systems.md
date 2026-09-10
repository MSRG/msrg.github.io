+++
title = "PopSub: Improving Resource Utilization in Distributed Content-based Publish/Subscribe Systems"
year = 2017
authors = ["Pooya Salehi", "Kaiwen Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 11th ACM International Conference on Distributed and Event-based Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3093742.3093915"
abstract = "Distributed content-based publish/subscribe systems provide a selective, scalable, and decentralized approach to data dissemination. In a pub/sub overlay network, hop-by-hop routing allows brokers to correctly forward messages without requiring global knowledge. However, this model causes brokers to forward publications without knowing the volume and distance of matching subscribers, which can result in inefficient resource utilization. In order to raise the scalability of pub/sub, we introduce Popularity-Based Publication Routing for Content-based Pub/Sub (PopSub), which is specifically designed to raise the resource utilization efficiency. We define a utilization metric to measure the impact of forwarding a publication on the overall delivery of the system. Furthermore, we propose a new publication routing algorithm that takes into account broker resources and publication popularity among subscribers. Lastly, we propose three approaches to handle unpopular publications. Based on our evaluations, using real-world workloads and traces, PopSub is able to improve resource efficiency of the brokers by up to 62%, and reduce delivery latency by up to 57% under high load."
+++
