+++
title = "DualTable: A hybrid storage model for update optimization in Hive"
year = 2015
authors = ["Songlin Hu", "Wantao Liu", "Tilmann Rabl", "Shuo Huang", "Ying Liang", "Zheng Xiao", "Hans-Arno Jacobsen", "Xubin Pei", "Jiye Wang"]
venue = "2015 IEEE 31st International Conference on Data Engineering"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icde.2015.7113381"
abstract = "Hive is the most mature and prevalent data warehouse tool providing SQL-like interface in the Hadoop ecosystem. It is successfully used in many Internet companies and shows its value for big data processing in traditional industries. However, enterprise big data processing systems as in Smart Grid applications usually require complicated business logics and involve many data manipulation operations like updates and deletes. Hive cannot offer sufficient support for these while preserving high query performance. Hive using the Hadoop Distributed File System (HDFS) for storage cannot implement data manipulation efficiently and Hive on HBase suffers from poor query performance even though it can support faster data manipulation. There is a project based on Hive issue Hive-5317 to support update operations, but it has not been finished in Hive's latest version. Since this ACID compliant extension adopts same data storage format on HDFS, the update performance problem is not solved. In this paper, we propose a hybrid storage model called DualTable, which combines the efficient streaming reads of HDFS and the random write capability of HBase. Hive on DualTable provides better data manipulation support and preserves query performance at the same time. Experiments on a TPC-H data set and on a real smart grid data set show that Hive on DualTable is up to 10 times faster than Hive when executing update and delete operations."
+++
