+++
title = "Optimizing key-value stores for hybrid storage architectures"
year = 2014
authors = ["Prashanth Menon", "Tilmann Rabl", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "CASCON"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://dl.acm.org/citation.cfm?id=2735582"
abstract = "Flash-based solid state drives (SSDs) are increas-ingly becoming a popular choice as a storage de-vice within database management systems and key-value stores alike. SSDs offer fast throughput and low latency access to data, but their price-per-byte cost often makes them uneconomical for exclusive use, especially in the era of big data workloads. A common solution to this problem is to augment existing database systems by adding smaller SSDs that target only performance-critical areas. We be-lieve this hybrid approach to be a stop-gap solution. Rather than simply extending existing systems with SSDs, in this work we completely re-architect how a key-value database operates in a hybrid stor-age setting with both small but fast SSDs and slower but high-capacity HDDs. We formulate an accurate I/O cost model to study how popular key-value stores behave under several varying represen-tative workloads. Based on these studies and tak-ing a holistic approach, we design a system that dynamically optimizes the data layout and access strategy that leverages the strengths of each avail-able storage medium."
+++
