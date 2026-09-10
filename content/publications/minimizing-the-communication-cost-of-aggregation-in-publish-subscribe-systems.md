+++
title = "Minimizing the Communication Cost of Aggregation in Publish/Subscribe Systems"
year = 2015
authors = ["Navneet Kumar Pandey", "Kaiwen Zhang", "Stéphane Weiss", "Hans-Arno Jacobsen", "Roman Vitenberg"]
venue = "2015 IEEE 35th International Conference on Distributed Computing Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2015.54"
abstract = "Modern applications for distributed publish/subscribe systems often require stream aggregation capabilities along with rich data filtering. When compared to other distributed systems, aggregation in pub/sub differentiates itself as a complex problem which involves dynamic dissemination paths that are difficult to predict and optimize for a priori, temporal fluctuations in publication rates, and the mixed presence of aggregated and non-aggregated workloads. In this paper, we propose a formalization for the problem of minimizing communication traffic in the context of aggregation in pub/sub. We present a solution to this minimization problem by using a reduction to the well-known problem of minimum vertex cover in a bipartite graph. This solution is optimal under the strong assumption of complete knowledge of future publications. We call the resulting algorithm \"Aggregation Decision, Optimal with Complete Knowledge\" (ADOCK). We also show that under a dynamic setting without full knowledge, ADOCK can still be applied to produce a low, yet not necessarily optimal, communication cost. We also devise a computationally cheaper dynamic approach called \"Aggregation Decision with Weighted Publication\" (WAD). We compare our solutions experimentally using two real datasets and explore the trade-offs with respect to communication and computation costs."
+++
