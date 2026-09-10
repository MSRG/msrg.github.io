+++
title = "PrestigeBFT: Revolutionizing View Changes in BFT Consensus Algorithms with Reputation Mechanisms"
year = 2024
authors = ["Gengrui Zhang", "Fei Pan", "Sofia Tijanic", "Hans-Arno Jacobsen"]
venue = "2024 IEEE 40th International Conference on Data Engineering (ICDE)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icde60146.2024.00156"
abstract = "Passive view-change protocols are widely employed in BFT algorithms; however, they present the risks of selecting unavailable or slow servers as leaders. To tackle these challenges, we propose PrestigeBFT, a novel BFT consensus algorithm that incorporates an active view-change protocol with reputation mechanisms. PrestigeBFT evaluates a server's reputation based on its past behavior and elects more reputable servers as leaders. Our reputation mechanism incentivizes protocol-abiding behavior while penalizing faulty servers by imposing computational work. PrestigeBFT significantly enhances system availability and efficiency by avoiding unavailable or slow servers being assigned as leaders. Under normal operation, PrestigeBFT achieves $5\\times$ higher throughput than the baseline that uses passive view-change protocols. In addition, PrestigeBFT's throughput remains unaffected under benign faults and witnesses only a 24% drop under a variety of Byzantine faults, whereas the baseline throughput drops by 62% and 69%, respectively. In the long run, while the baseline's availability struggles at 37%, PrestigeBFT progressively improves its availability to over 90%."
+++
