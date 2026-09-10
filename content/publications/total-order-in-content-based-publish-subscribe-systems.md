+++
title = "Total Order in Content-Based Publish/Subscribe Systems"
year = 2012
authors = ["Kaiwen Zhang", "Vinod Muthusamy", "Hans-Arno Jacobsen"]
venue = "2012 IEEE 32nd International Conference on Distributed Computing Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2012.17"
abstract = "Total ordering is a messaging guarantee increasingly required of content-based pub/sub systems, which are traditionally focused on performance. The main challenge is the uniform ordering of streams of publications from multiple publishers within an overlay broker network to be delivered to multiple subscribers. Our solution integrates total ordering into the pub/sub logic instead of offloading it as an external service. We show that our solution is fully distributed and relies only on local broker knowledge and overlay links. We can identify and isolate specific publications and subscribers where synchronization is required: the overhead is therefore contained to the affected subscribers. Our solution remains safe under the presence of failure, where we show total order to be impossible to maintain. Our experiments demonstrate that our solution scales with the number of subscriptions and has limited overhead for the non-conflicting cases. A holistic comparison with group communication systems is offered to evaluate their relative scalability."
+++
