+++
title = "Variations of the star schema benchmark to test the effects of data skew on query performance"
year = 2013
authors = ["Tilmann Rabl", "Meikel Poess", "Hans-Arno Jacobsen", "Patrick E. O'Neil", "Elizabeth J. O'Neil"]
venue = "Proceedings of the 4th ACM/SPEC International Conference on Performance Engineering"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/2479871.2479927"
abstract = "The Star Schema Benchmark (SSB), now in its third revision, has been widely used to evaluate the performance of database management systems when executing star schema queries. SSB, based on the well known industry standard benchmark TPC-H, shares some of its drawbacks, most notably, its uniform data distributions. Today's systems rely heavily on sophisticated cost-based query optimizers to generate the most efficient query execution plans. A benchmark that evaluates optimizer's capability to generate optimal execution plans under all circumstances must provide the rich data set details on which optimizers rely (uniform and non-uniform distributions, data sparsity, etc.). This is also true for other database system parts, such as indices and operators, and ultimately holds for an end-to-end benchmark as well. SSB's data generator, based on TPC-H's dbgen, is not easy to adapt to different data distributions as its meta data and actual data generation implementations are not separated. In this paper, we motivate the need for a new revision of SSB that includes non-uniform data distributions. We list what specific modifications are required to SSB to implement non-uniform data sets and we demonstrate how to implement these modifications in the Parallel Data Generator Framework to generate both the data and query sets."
+++
