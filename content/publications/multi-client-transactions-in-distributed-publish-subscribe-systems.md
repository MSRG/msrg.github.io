+++
title = "Multi-Client Transactions in Distributed Publish/Subscribe Systems"
year = 2018
authors = ["Martin Jergler", "Kaiwen Zhang", "Hans-Arno Jacobsen"]
venue = "2018 IEEE 38th International Conference on Distributed Computing Systems (ICDCS)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2018.00022"
abstract = "Transactional operation processing among clients is increasingly required of publish/subscribe (pub/sub) systems in enterprise settings. For instance, in workflow management, dispatching or consolidating process instances require publications and (un-) subscriptions by different clients to be executed according to ACID semantics. As pub/sub systems are usually optimized for performance and scalability, such properties are often neglected, which results in unexpected system behavior. In this paper, we provide a model for supporting multiclient transactions in pub/sub. We formalize ACID properties for pub/sub, and define a consistency model and isolation level required in the aforementioned scenarios. We present three approaches for two transaction types: S-TX, where a coordinator has full static knowledge about all operations in a transaction, and D-TX/D-TXNI, where operations by other clients are dynamic and unknown to the coordinator. We describe algorithms realizing these approaches and experimentally evaluate them by comparing to a baseline mechanism, which simulates these guarantees partially with manual waits between operations. Our results show that the uncertainty introduced by the dynamic behavior renders D-TX/D-TXNI costly, and suitable only for small configurations or rare occasions. S-TX, in contrast, offers enriched semantics for many applications in a scalable manner without disrupting regular event routing."
+++
