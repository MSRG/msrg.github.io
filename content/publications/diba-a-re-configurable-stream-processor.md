+++
title = "DIBA: A Re-Configurable Stream Processor"
year = 2024
authors = ["Mohammadreza Najafi", "Thamir M. Qadah", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "IEEE Transactions on Knowledge and Data Engineering"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1109/tkde.2024.3381192"
abstract = "Stream processing acceleration is driven by the continuously increasing volume and velocity of data generated on the Web and the limitations of storage, computation, and power consumption. Hardware solutions provide better performance and power consumption, but they are hindered by the high research and development costs and the long time to market. In this work, we propose our re-configurable stream processor (Diba), a complete rethinking of a previously proposed customized and flexible query processor that targets real-time stream processing. Diba uses a unidirectional dataflow not dedicated to any specific type of query (operator) on streams, allowing a straightforward placement of processing components on a general data path that facilitates query mapping. In Diba, the concepts of the distribution network and processing components are implemented as two separate entities connected using generic interfaces. This approach allows the adoption of a versatile architecture for a family of queries rather than forcing a rigid chain of processing components to implement such queries. Our experimental evaluations of representative queries from TPC-H yielded processing times of 300, 1220, and 3520 milliseconds for data streams with scale factor sizes of one, four, and ten gigabytes, respectively."
+++
