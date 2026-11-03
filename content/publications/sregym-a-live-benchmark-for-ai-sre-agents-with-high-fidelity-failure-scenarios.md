+++
title = "SREGym: A Live Benchmark for AI SRE Agents with High-Fidelity Failure Scenarios"
year = 2026
authors = ["Jackson Clark", "Yiming Su", "Saad Mohammad Rafid Pial", "Yifang Tian", "Lily Gniedziejko", "Hans-Arno Jacobsen", "Yinfang Chen", "Tianyin Xu"]
venue = "NeurIPS Evaluations and Datasets Track (accepted; forthcoming)"
publication_type = "Conference Paper"
research = ["distributed-machine-learning"]
preprint_url = "https://arxiv.org/abs/2605.07161"
abstract = "AI agents are increasingly used to diagnose and mitigate failures in production systems, known as agentic Site Reliability Engineering (SRE). Current SRE benchmarks are limited to oversimplistic SRE tasks and are unfortunately hard to extend due to bespoke designs. We present SREGym, a high-fidelity benchmark for SRE agents. SREGym exposes a live system environment built atop real-world cloud-native system stacks, where high-fidelity failure scenarios are simulated through fault injectors. SREGym models the complexity of production environments by simulating (1) a wide range of faults at different layers, (2) various ambient noises, and (3) diverse failure modes such as metastable failures and correlated failures. SREGym is architected as a modular, extensible framework that orchestrates fault and noise injectors across stacks. SREGym currently includes 90 realistic, challenging SRE problems. We use SREGym to evaluate frontier agents and show that their capabilities varies significantly in addressing different kinds of failures, with up to 40% differences in end-to-end results. SREGym is actively maintained as an open-source project and has been used by researchers and practitioners."

# Attribution: https://arxiv.org/abs/2605.07161 and https://tianyin.github.io/pub.html
research_outcomes = [
  { title = "SREGym", url = "https://github.com/SREGym/SREGym", summary = "A live cloud-native benchmark for evaluating how SRE agents diagnose and mitigate injected operational failures." },
]
+++

Accepted to NeurIPS 2026, as listed on the
[co-author's publication page](https://yinfangchen.github.io/publications/).
The full-text link points to the arXiv version; proceedings are forthcoming.
