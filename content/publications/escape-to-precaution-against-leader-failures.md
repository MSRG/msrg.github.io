+++
title = "ESCAPE to Precaution against Leader Failures"
year = 2022
authors = ["Gengrui Zhang", "Hans-Arno Jacobsen"]
venue = "2022 IEEE 42nd International Conference on Distributed Computing Systems (ICDCS)"
publication_type = "Conference Paper"
research = []
external_url = "https://doi.org/10.1109/icdcs54860.2022.00066"
abstract = "Leader-based consensus protocols must undergo a view-change phase to elect a new leader when the current leader fails. The new leader often comes from a candidate server that collects votes from a quorum of servers. However, voting-based election mechanisms intrinsically incite competition in leadership candidacy since candidates may collect only partial votes. This split-vote scenario can result in no leadership winner and thus prolongs the undesired view-change period. In this paper, we investigate a case study of Raft’s leader election and propose a new leader election protocol, called ESCAPE, that fundamentally solves split votes by prioritizing servers based on their log responsiveness. ESCAPE dynamically distributes configurations that offer different priorities to servers through periodic heartbeats. In each assignment, ESCAPE assigns configurations that are more inclined to win an election to servers that have more up-to-date log responsiveness, thereby preparing a pool of prioritized candidates. Consequently, when the next election takes place, the candidate with the highest priority can defeat its counterparts and becomes the next leader without competition. The evaluation results show that ESCAPE progressively reduces the leader election time when the cluster scales up, and the improvement becomes more significant under message loss."
+++
