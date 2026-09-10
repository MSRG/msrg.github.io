+++
title = "Prosecutor: an efficient BFT consensus algorithm with behavior-aware penalization against Byzantine attacks"
year = 2021
authors = ["Gengrui Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 22nd International Middleware Conference"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3464298.3484503"
abstract = "Current leader-based Byzantine fault-tolerant (BFT) protocols aim to improve the efficiency for achieving consensus while tolerating failures; however, Byzantine servers are able to repeatedly impair BFT systems as faulty servers launch attacks without costs. In this paper, leveraging Proof-of-Work and Raft, we propose a new BFT consensus protocol called Prosecutor that dynamically penalizes suspected faulty behavior and suppresses Byzantine servers over time. Prosecutor obstructs Byzantine servers from being elected in leader election by imposing hash computation on new election campaigns. Furthermore, Prosecutor applies message authentication to achieve secure log replication and maintains a similar message-passing scheme as Raft. The evaluation results show that the penalization mechanism progressively suppresses and marginalizes Byzantine servers if they repeatedly launch malicious attacks."
+++
