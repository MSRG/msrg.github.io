+++
title = "How Reliable Are Streams? End-to-End Processing-Guarantee Validation and Performance Benchmarking of Stream Processing Systems"
year = 2024
authors = ["Jawad Tahir", "Ruben Mayer", "Christoph Doblander", "Hans-Arno Jacobsen"]
venue = "Proceedings of the VLDB Endowment"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.14778/3712221.3712227"
abstract = "Stream processing systems (SPSs) provide processing guarantees to ensure reliability under failure. However, no related work exists that empirically validates these guarantees. In this paper, we present PGVal, a tool that can end-to-end validate guarantees of SPSs. Additionally, we introduce new metrics for SPSs, such as reliability, reliable throughput, and failure cost, in addition to a refined definition of latency that results in improved measurements. We benchmark three popular SPSs, namely Kafka Streams, Apache Storm , and Apache Flink. Our results show that the reliability of SPSs depends on many characteristics, such as data rate, data partitions, processing topology, and parallelism factor. An SPS configuration may not continue to provide reliable outputs when any of these characteristics vary. PGVal can also inject faults into SPSs to observe their impact on reliability and performance. We provide a comprehensive failure model for fault-tolerance benchmarking of SPSs and report on the impact of faults on the reliability and performance of SPSs. Our experiments show that SPSs' reliability and performance drop varies by fault. Lastly, we provide suggestions to increase the reliability and performance of these systems."
+++
