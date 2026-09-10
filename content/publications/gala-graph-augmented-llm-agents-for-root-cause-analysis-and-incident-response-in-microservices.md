+++
title = "GALA: Graph-Augmented LLM Agents for Root Cause Analysis and Incident Response in Microservices"
year = 2026
authors = ["Yifang Tian", "Yaming Liu", "Zichun Chong", "Zihang Huang", "Yiran Li", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["distributed-machine-learning", "data-management"]
external_url = "https://arxiv.org/abs/2608.08968"
abstract = "Microservice root cause analysis (RCA) requires correlating failures across heterogeneous telemetry within complex service dependency graphs. Existing methods often rely on a single telemetry modality; recent LLM-based approaches can suffer from unconstrained exploration and hallucination; and most systems stop at fault ranking without producing actionable incident response. We present GALA+, a graph-augmented LLM agentic framework centered on graph-guided investigation, which uses service dependencies to bound exploration and refine diagnosis through localized multi-modal evidence. For initial hypothesis generation, GALA+ combines complementary telemetry signals with STRIX, a novel trace- and graph-structure-aware scoring module. GALA+ then produces ranked diagnoses, incident summaries, and stratified action recommendations. We further introduce SURE-Score, a human-guided evaluation framework co-developed with industry SRE experts for assessing RCA-specific output quality beyond conventional text similarity metrics. On two microservice benchmarks, GALA+ consistently achieves the strongest overall results, surpassing the best LLM-based baseline by more than 25 percentage points in AC@1, while also receiving the highest ratings from both SURE-Score and independent human SRE evaluation."
+++
