+++
title = "Building Fault-Tolerant Overlays With Low Node Degrees for Topic-Based Publish/Subscribe"
year = 2022
authors = ["Chen Chen", "Roman Vitenberg", "Hans-Arno Jacobsen"]
venue = "IEEE Transactions on Dependable and Secure Computing"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1109/tdsc.2021.3080281"
abstract = "We present a new approach for designing reliable and scalable overlay networks to support topic-based pub/sub communication. We propose the ${{\\mathsf {MinAvg}}-{k}{\\mathsf {TCO}}}$ problem parameterized by ${k}$: use the minimum number of edges to create a ${k}$ k-topic-connected overlay(${{k}TCO}$) for pub/sub systems, i.e., for each topic, the sub-overlay induced by nodes interested in the topic is ${k}$-connected. We prove the NP-completeness of ${{\\mathsf {MinAvg}}-{k}{\\mathsf {TCO}}}$ and show a lower-bound for the hardness of its approximation. For ${{\\mathsf {MinAvg}}-{2}{\\mathsf {TCO}}}$, we present GM2, the first polynomial-time algorithm with an approximation ratio. For ${{\\mathsf {MinAvg}}-{k}{\\mathsf {TCO}}}$, where ${k} \\geq {2}$, we propose HararyPT, a simple and efficient heuristic that aligns nodes across different sub-overlays. We experimentally demonstrate the scalability of GM2 and HararyPT with regards to overlay quality under representative pub/sub workloads. GM2 outputs ${{2}TCO}$ with an empirically insignificant increase in the average node degree, e.g., an increase by 4 in a 1000-node network, as compared to the baseline ${{1}TCO}$ produced by the best-known algorithm. Moreover, GM2 reduces the topic diameters by around 50 percent with respect to those in ${{1}TCO}$."
+++
