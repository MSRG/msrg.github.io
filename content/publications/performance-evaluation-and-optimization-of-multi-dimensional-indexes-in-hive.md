+++
title = "Performance Evaluation and Optimization of Multi-Dimensional Indexes in Hive"
year = 2018
authors = ["Yue Liu", "Shuai Guo", "Songlin Hu", "Tilmann Rabl", "Hans-Arno Jacobsen", "Jintao Li", "Jiye Wang"]
venue = "IEEE Transactions on Services Computing"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1109/tsc.2016.2594778"
abstract = "Apache Hive has been widely used for big data processing over large scale clusters by many companies. It provides a declarative query language called HiveQL. The efficiency of filtering out query-irrelevant data from HDFS closely affects the performance of query processing. This is especially true for multi-dimensional, high-selective, and few columns involving queries, which provides sufficient information to reduce the amount of bytes read. Indexing (Compact Index, Aggregate Index, Bitmap Index, DGFIndex, and the index in ORC file) and columnar storage (RCFile, ORC file, and Parquet) are powerful techniques to achieve this. However, it is not trivial to choosing a suitable index and columnar storage based on data and query features. In this paper, we compare the data filtering performance of the above indexes with different columnar storage formats by conducting comprehensive experiments using uniform and skew TPC-H data sets and various multi-dimensional queries, and suggest the best practices of improving multi-dimensional queries in Hive under different conditions."
+++
