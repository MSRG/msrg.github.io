+++
title = "LogStore: A Workload-Aware, Adaptable Key-Value Store on Hybrid Storage Systems"
year = 2022
authors = ["Prashanth Menon", "Thamir M. Qadah", "Tilmann Rabl", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "IEEE Transactions on Knowledge and Data Engineering"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1109/tkde.2020.3027191"
abstract = "Due to recent explosion of data volume and velocity, a new array of lightweight key-value stores have emerged to serve as alternatives to traditional databases. The majority of these storage engines, however, sacrifice their read performance in order to cope with write throughput by avoiding random disk access when writing a record in favor of fast sequential accesses. But, the boundary between sequential versus random access is becoming blurred with the advent of solid-state drives (SSDs). In this work, we propose our new key-value store, LogStore, optimized for hybrid storage architectures. Additionally, introduce a novel cost-based data staging model based on log-structured storage, in which recent changes are first stored on SSDs, and pushed to HDD as it ages, while minimizing the read/write amplification for merging data from SSDs and HDDs. Furthermore, we take a holistic approach in improving both the read and write performance by dynamically optimizing the data layout, such as deferring and reversing the compaction process, and developing an access strategy to leverage the strengths of each available medium in our storage hierarchy. Lastly, in our extensive evaluation, we demonstrate that LogStore achieves up to 6x improvement in throughput/latency over LevelDB, a state-of-the-art key-value store."
+++
