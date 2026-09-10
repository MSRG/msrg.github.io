+++
title = "OrderlessChain: A CRDT-based BFT Coordination-free Blockchain Without Global Order of Transactions"
year = 2023
authors = ["Pezhman Nasirifard", "Ruben Mayer", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 24th International Middleware Conference on ZZZ"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3590140.3629111"
abstract = "Existing permissioned blockchains often rely on coordination-based consensus protocols to ensure the safe execution of applications in a Byzantine environment. Furthermore, the protocols serialize the transactions by ordering them in a global order. The serializ-ability preserves the correctness of the application's state stored on the blockchain. However, coordination-based protocols limit the throughput and scalability and induce high latency. In contrast, application-level correctness requirements exist that are not dependent on the order of transactions, known as invariant-confluence (I-confluence). The I-confluent applications can execute transactions in a coordination-free manner, benefiting from the improved scalability compared to the coordination-based approaches. The safety and liveness of I-confluent applications are studied in non-Byzantine environments, but the correct execution of such applications remains a challenge in Byzantine coordination-free environments. We introduce OrderlessChain, a novel permissioned blockchain based on a novel BFT coordination-free protocol for the safe and live execution of I-confluent applications in a Byzantine environment. We implemented a prototype of our system, and our evaluation results show that our coordination-free approach performs significantly better than coordination-based blockchains."
+++
