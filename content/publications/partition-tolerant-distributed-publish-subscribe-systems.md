+++
title = "Partition-Tolerant Distributed Publish/Subscribe Systems"
year = 2011
authors = ["Reza Sherafat Kazemzadeh", "Hans-Arno Jacobsen"]
venue = "2011 IEEE 30th International Symposium on Reliable Distributed Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/srds.2011.21"
abstract = "In this paper, we develop reliable distributed publish/subscribe algorithms that can tolerate concurrent failure of up to d broker machines or communication links. In our approach, d is a configuration parameter which determines the level of fault-tolerance of the system and reliability refers to exactly-once and per-source, in-order delivery of publications to clients with matching subscriptions. We propose protocols to address three problems in presence of broker or link failures: (i) subscription propagation, (ii) publication forwarding, and (iii) broker recovery. Finally, we study the effectiveness of our approach when the number of concurrent failures exceeds d. Through large-scale experimental evaluations with up to 500 brokers, we demonstrate that a system configured with a modest value of d = 3 is able to reliably deliver 97% of publications in presence of failure of up to 17% of its brokers."
+++
