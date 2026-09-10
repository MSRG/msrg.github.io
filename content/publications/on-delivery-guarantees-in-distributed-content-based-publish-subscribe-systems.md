+++
title = "On Delivery Guarantees in Distributed Content-Based Publish/Subscribe Systems"
year = 2020
authors = ["Pooya Salehi", "Kaiwen Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 21st International Middleware Conference"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3423211.3426400"
abstract = "Distributed overlay-based publish/subscribe systems provide a selective and scalable communication paradigm for connecting components of a distributed application. Existing overlay-based systems only guarantee delivery of notifications to clients that are already known by all brokers in the overlay. Nonetheless, due to the propagation delay, it takes time for a client's interests to be received by all brokers comprising the overlay. The message propagation delay and unclear delivery guarantees during this time increase the complexity of developing distributed applications based on the pub/sub paradigm. In this paper, we propose a collection of message processing and delivery guarantees that allows clients to clearly define the set of publications they receive. Based on our evaluation, these delivery guarantees can reduce buffering requirements on clients by up to 10 times, prevent missing notifications due to the propagation delay, and provide clients with primitive building blocks that simplify application development. We evaluate our proposed routing algorithms and show that a pub/sub system can provide the proposed delivery guarantees without increasing its resource requirements or hindering its throughput."
+++
