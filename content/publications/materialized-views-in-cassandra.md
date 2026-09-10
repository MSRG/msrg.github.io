+++
title = "Materialized views in Cassandra"
year = 2014
authors = ["Tilmann Rabl", "Hans-Arno Jacobsen"]
venue = "CASCON"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://dl.acm.org/citation.cfm?id=2735581"
abstract = "Many web companies deal with enormous data sizes and request rates beyond the capabilities of traditional database systems. This has led to the de-velopment of modern Big Data Platforms (BDPs). BDPs handle large amounts of data and activity through massively distributed infrastructures. To achieve performance and availability at Internet scale, BDPs restrict querying capability, and pro-vide weaker consistency guarantees than traditional ACID transactions. The reduced functionality as found in key-value stores is sufficient for many web applications. An important requirement of many big data sys-tems is an online view of the current status of the data and activity. Typical big data systems such as key-value stores only allow a key-based access. In order to enable more complex querying mecha-nisms, while satisfying necessary latencies materi-alized views are employed. The efficiency of the maintenance of these views is a key factor of the usability of the system. Expensive operations such as full table scans are impractical for small, fre-quent modifications on Internet-scale data sets. In this paper, we present an efficient implementation of materialized views in key-value stores that en-ables complex query processing and is tailored for efficient maintenance."
+++
