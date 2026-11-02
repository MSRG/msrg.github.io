+++
title = "Root Cause Analysis & AIOps"
slug = "rca-aiops"
aliases = ["/research/distributed-machine-learning/"]
legacy_research_ids = ["rca-aiops"]
layout = "area"
show_section_links = true
weight = 20
accent = "teal"
question = "How can we turn operational telemetry into reliable diagnosis and actionable incident response?"
summary = "Root cause analysis, anomaly detection, and telemetry-grounded repair for reliable microservices and AI agents, alongside distributed AI and machine learning."
publication_blurb = "Recent publications in root cause analysis, AIOps, and our broader distributed AI and machine learning research."
team_blurb = "Current and visiting MSRG members associated with our AIOps and distributed AI/ML research are shown below."
blurb = """MSRG develops methods for **root cause analysis** and **AI for IT operations (AIOps)** in distributed systems. We combine **metrics, logs, and traces** with service dependency graphs and LLM agents to investigate failures and produce actionable diagnoses. Our work connects anomaly detection, incident response, automated repair, and realistic evaluation, with a focus on microservices and the reliability of AI agent executions."""
# Research descriptions are based on the publication abstracts linked below.
acknowledgement = "We acknowledge the support of Bell Mobility and the Natural Sciences and Engineering Research Council of Canada (NSERC) under grant ALLRP614128-25."
supporters = [
  { name = "Bell Mobility", url = "https://www.bell.ca/Mobility", logo = "/images/support/bell.svg", width = 100, height = 60 },
  { name = "Natural Sciences and Engineering Research Council of Canada (NSERC)", url = "https://nserc-crsng.canada.ca/", logo = "/images/support/nserc.png", width = 145, height = 70 }
]
+++

## From telemetry to root causes

A failure in one service can surface as errors, slowdowns, or unusual resource
usage elsewhere. Root cause analysis (RCA) connects these symptoms to the
underlying fault. Doing so requires reasoning across heterogeneous telemetry
and the dependencies between services.

We study how AI for IT operations (AIOps) can help engineers move from detecting
an anomaly to understanding a failure and deciding what to do next. Our research
brings together statistical analysis, graph structure, and LLM agents, with an
emphasis on diagnoses and repair decisions grounded in operational evidence.

<div class="research-diagrams">

{{< figure src="/images/research/aiops-vision.svg" alt="AIOps research vision: observe distributed systems, detect anomalies, diagnose causes, and support incident response, with realistic benchmark evaluation." caption="Research vision: connect operational evidence to diagnosis and response, and evaluate each step in realistic systems." >}}

{{< figure src="/images/research/aiops-technical.svg" alt="GALA+ workflow: telemetry and service dependencies feed initial hypotheses, followed by graph-guided investigation using local evidence, producing diagnoses and incident response recommendations evaluated with SURE-Score." caption="Technical example: GALA+ uses service dependencies and local telemetry to guide LLM investigation; SURE-Score assesses the quality of its outputs." >}}

</div>

## Graph-guided diagnosis and incident response

[GALA](/publications/gala-graph-augmented-llm-agents-for-root-cause-analysis-and-incident-response-in-microservices/),
whose updated framework is called GALA+, uses service dependencies to guide
LLM agents through local metrics, logs, and traces. It produces ranked diagnoses,
incident summaries, and action recommendations. SURE-Score, developed with
industry site reliability engineers, assesses diagnostic quality beyond text
similarity.

## Message-level anomaly detection

Effective investigation starts with finding useful signals in large volumes of
telemetry.
[FAME](/publications/fame-failure-aware-mixture-of-experts-for-message-level-log-anomaly-detection/)
studies anomaly detection at the level of individual log messages. It uses an
LLM during offline preparation to help organize failure domains, then trains
a lightweight router and specialized experts for online detection with limited
labeling effort.

## Telemetry-grounded repair

Diagnosis can also provide context for changing code and configuration.
[ORCA](/publications/orca-observability-grounded-program-repair-for-microservice-incidents/)
compares failure and reference telemetry to build a fault signature, locate
candidate repair sites, and guide patch generation. Its verification process
examines patch correctness, test integrity, and telemetry replay to connect
automated repair with the incident that motivated it.

## Reliable agents and realistic evaluation

AI agents are both tools for incident response and systems whose own failures
need diagnosis.
[AgentChaosBench](/publications/when-agentic-executions-fail-detecting-and-localizing-runtime-faults-from-telemetry/)
studies fault detection and localization from agent
execution telemetry, including faults at tool, model, guardrail, and inter-agent
boundaries.

[SREGym](/publications/sregym-a-live-benchmark-for-ai-sre-agents-with-high-fidelity-failure-scenarios/)
evaluates SRE agents in live cloud-native environments with injected faults and
ambient noise. These complementary settings help us examine whether an agent
can identify a fault, locate its origin, and support incident resolution under
realistic operating conditions.

[GF-Bench](/publications/when-log-parsing-removes-what-matters-detecting-failures-in-distributed-gpu-workloads/)
extends failure detection to distributed GPU workloads, while
[SRE-Marathon](/publications/sre-marathon-a-continuous-change-driven-benchmark-for-autonomous-site-reliability-agents/)
studies continuous operation with overlapping incidents and code or configuration changes.

## Current directions

- Correlating metrics, logs, and traces across service dependencies
- Graph-guided and evidence-grounded LLM investigation
- Connecting root cause diagnosis to remediation and automated repair
- Evaluating diagnostic quality, agent reliability, and operational usefulness

This research connects with our work in [Data Management](/research/data-management/).
We also continue research in **distributed AI and machine learning**, including
resource allocation and scheduling for training and inference, privacy-preserving
and federated learning on embedded and edge devices, and scalable graph processing
and graph neural networks.
