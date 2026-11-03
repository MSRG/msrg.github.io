+++
title = "GALA: Graph-Augmented LLM Agents for Root Cause Analysis and Incident Response in Microservices"
aliases = ["/publications/gala-can-graph-augmented-large-language-model-agentic-workflows-elevate-root-cause-analysis/"]
year = 2026
authors = ["Yifang Tian", "Yaming Liu", "Zichun Chong", "Zihang Huang", "Yiran Li", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 41st IEEE/ACM International Conference on Automated Software Engineering (ASE '26), pp. 55–67"
publication_type = "Conference Paper"
research = ["distributed-machine-learning", "data-management"]
external_url = "https://doi.org/10.1145/3832783.3834335"
tags = ["GALA", "GALA: Can Graph-Augmented Large Language Model Agentic Workflows Elevate Root Cause Analysis?"]
# Keep the consolidated earlier manuscript title searchable.
# ACM publisher metadata: https://api.crossref.org/works/10.1145/3832783.3834335
abstract = "Microservice root cause analysis (RCA) requires correlating failures across heterogeneous telemetry within complex service dependency graphs. Existing methods often rely on a single telemetry modality; recent LLM-based approaches can suffer from unconstrained exploration and hallucination; and most systems stop at fault ranking without producing actionable incident response. We present GALA+, a graph-augmented LLM agentic framework centered on graph-guided investigation, which uses service dependencies to bound exploration and refine diagnosis through localized multi-modal evidence. For initial hypothesis generation, GALA+ combines complementary telemetry signals with STRIX, a novel trace- and graph-structure-aware scoring module. GALA+ then produces ranked diagnoses, incident summaries, and stratified action recommendations. We further introduce SURE-Score, a human-guided evaluation framework co-developed with industry SRE experts for assessing RCA-specific output quality beyond conventional text similarity metrics. On two microservice benchmarks, GALA+ consistently achieves the strongest overall results, surpassing the best LLM-based baseline by more than 25 percentage points in AC@1, while also receiving the highest ratings from both SURE-Score and independent human SRE evaluation."

# Attribution: https://arxiv.org/abs/2608.08968; repository README describes release scope.
research_outcomes = [
  { title = "GALA evaluation artifacts", url = "https://github.com/EvanTian233/GALA-for-RCA", summary = "Annotated incident reports, example outputs, a supplementary technical report, and third-party baseline frameworks. The core GALA implementation is not publicly released." },
]
preprint_url = "https://arxiv.org/abs/2608.08968"
+++

The preprint linked above describes the GALA+ framework.

This record consolidates the GALA work and its updated GALA+ framework.
The [earlier preprint](https://arxiv.org/abs/2508.12472) circulated under the title
*GALA: Can Graph-Augmented Large Language Model Agentic Workflows Elevate Root Cause Analysis?*.
