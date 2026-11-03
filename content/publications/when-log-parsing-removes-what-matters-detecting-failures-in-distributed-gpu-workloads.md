+++
title = "When Log Parsing Removes What Matters: Detecting Failures in Distributed GPU Workloads"
year = 2026
authors = ["Boyuan Cui", "Yuyang Zeng", "Yifang Tian", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 1st International Workshop on Reliable and trustworthy Automated Software Engineering (RASE '26), pp. 60–63"
publication_type = "Workshop Paper"
research = ["distributed-machine-learning"]
external_url = "https://doi.org/10.1145/3820756.3844919"
# ACM publisher metadata: https://api.crossref.org/works/10.1145/3820756.3844919

# Attribution: data availability statement, https://arxiv.org/abs/2610.14009
# No top-level repository license was present when checked on 2026-10-22.
research_outcomes = [
  { title = "GF-Bench artifacts", url = "https://github.com/cuiboyuan/nccl_log_rca_bench", summary = "Tools for generating multi-GPU failures, collecting NCCL logs, and evaluating anomaly detection, with sample data and scripts to reproduce the experiments." },
]
preprint_url = "https://arxiv.org/abs/2610.14009"
+++

The preprint linked above was revised after publication
and differs from the RASE 2026 paper linked above.

The paper introduces [GF-Bench](https://github.com/cuiboyuan/nccl_log_rca_bench)
for generating controlled faults in distributed GPU workloads and examines how
log parsing affects failure detection.
