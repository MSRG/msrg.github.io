+++
title = "Highly-available content-based publish/subscribe via gossiping"
year = 2016
authors = ["Pooya Salehi", "Christoph Doblander", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 10th ACM International Conference on Distributed and Event-based Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/2933267.2933303"
abstract = "Many publish/subscribe systems are based on a tree topology as their message dissemination overlay. However, in trees, even a single broker failure can cause delivery disruption. Hence, a repair mechanism is required, along with message retransmission to prevent message loss. During repair and recovery, the latency of message delivery can temporarily increase. To address this problem, we present an epidemic protocol to allow a content-based publish/subscribe system to keep delivering messages with low latency, while failed brokers are recovering. Using a broker similarity metric, which takes into account the content space and the overlay topology, we control and direct gossip messages around failed brokers. We compare our approach against a deterministic reliable publish/subscribe approach and an alternative epidemic approach. Based on our evaluations, we show that in our approach, the delivery ratio and latency of message deliveries are close to the deterministic approach, with up to 70% less message overhead than the alternative epidemic approach. Furthermore, our approach is able to provide a higher message delivery ratio than the deterministic alternative at high failure rates or when broker failures follow a non-uniform distribution."
+++
