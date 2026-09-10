+++
title = "Parallel Index-based Stream Join on a Multicore CPU"
year = 2020
authors = ["Amirhesam Shahvarani", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 2020 ACM SIGMOD International Conference on Management of Data"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3318464.3380576"
abstract = "Indexing sliding window content to enhance the performance of streaming queries can be greatly improved by utilizing the computational capabilities of a multicore processor. Conventional indexing data structures optimized for frequent search queries on a prestored dataset do not meet the demands of indexing highly dynamic data as in streaming environments. In this paper, we introduce an index data structure, called the partitioned in-memory merge tree, to address the challenges that arise when indexing highly dynamic data, which are common in streaming settings. Utilizing the specific pattern of streaming data and the distribution of queries, we propose a low-cost and effective concurrency control mechanism to meet the demands of high-rate update queries. To complement the index, we design an algorithm to realize a parallel index-based stream join that exploits the computational power of multicore processors. Our experiments using an octa-core processor show that our parallel stream join achieves up to 5.5 times higher throughput than a single-threaded approach."
+++
