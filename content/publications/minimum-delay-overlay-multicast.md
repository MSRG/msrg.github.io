+++
title = "Minimum-delay overlay multicast"
year = 2013
authors = ["Kianoosh Mokhtarian", "Hans-Arno Jacobsen"]
venue = "2013 Proceedings IEEE INFOCOM"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/infcom.2013.6566975"
abstract = "Delivering delay-sensitive data to a group of receivers with minimum latency is a fundamental problem for various distributed applications. In this paper, we study multicast routing with minimum end-to-end delay to the receivers. The delay to each receiver in a multicast tree consist of the time that the data spends in overlay links as well as the latency incurred at each overlay node, which has to send out a piece of data several times over a finite-capacity network connection. The latter portion of the delay, which is proportional to the degree of nodes in the tree, can be a significant portion of the total delay as we show in the paper. Yet, it is often ignored or only partially addressed by previous multicast algorithms. We formulate the actual delay to the receivers in a multicast tree and consider minimizing the average and the maximum delay in the tree. We show the NP-hardness of these problems and prove that they cannot be approximated in polynomial time to within any reasonable approximation ratio. We then present a number of efficient algorithms to build a multicast tree in which the average or the maximum delay is minimized. These algorithms cover a wide range of overlay sizes for both versions of our problem. The effectiveness of our algorithms is demonstrated through comprehensive experiments on different real-world datasets, and using various overlay network models. The results confirm that our algorithms can achieve much lower delays (up to 60% less) and up to orders of magnitude faster running times (i.e., supporting larger scales) than previous minimum-delay multicast approaches."
+++
