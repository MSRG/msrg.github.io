+++
title = "DL-Store: A Distributed Hybrid OLTP and OLAP Data Processing Engine"
year = 2016
authors = ["Kaiwen Zhang", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "2016 IEEE 36th International Conference on Distributed Computing Systems (ICDCS)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2016.71"
abstract = "There has been a recent push in the database community towards supporting real-time analytical queries (OLAP) while sustaining a large volume of fine-grained updates (OLTP). Supporting these types of workloads require both an efficient data storage layer as well as a distributed architecture. In this demo, we address the latter point with our Distributed Lineage-based Data Store (DL-Store), which is a distributed data processing engine. DL-Store is built on top of L-Store, which is a lineage-based storage architecture designed to handle mixed OLTP and OLAP workloads, and provides scalability and elasticity by supporting multiple L-Store nodes. To maintain the desired consistency semantics, DL-Store employs a distributed transaction handler component which can horizontally scaled by provisioning additional transaction manager nodes. We leverage partitioning in the record space of the transactions to minimize communication across transaction managers while ensuring consistent execution. The demo shows our implementation of DL-Store over Apache Spark using a variety of use cases."
+++
