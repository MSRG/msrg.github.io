+++
title = "Publisher Placement Algorithms in Content-Based Publish/Subscribe"
year = 2010
authors = ["Alex King Yeung Cheung", "Hans-Arno Jacobsen"]
venue = "2010 IEEE 30th International Conference on Distributed Computing Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2010.86"
abstract = "Many publish/subscribe systems implement a policy for clients to join to their physically closest broker to minimize transmission delays incurred on the clients' messages. However, the amount of delay reduced by this policy is only the tip of the iceberg as messages incur queuing, matching, transmission, and scheduling delays from traveling across potentially long distances in the broker network. Additionally, the clients' impact on system load is totally neglected by such a policy. This paper proposes two new algorithms that intelligently relocate publishers on the broker overlay to minimize both the overall end-to-end delivery delay and system load. Both algorithms exploit live publication distribution patterns but with different optimization metrics and computation methodologies to determine the best relocation point. Evaluations on PlanetLab and a cluster testbed show that our algorithms can reduce the average input load of the system by up to 68%, average broker message rate by up to 85%, and average delivery delay by up to 68%."
+++
