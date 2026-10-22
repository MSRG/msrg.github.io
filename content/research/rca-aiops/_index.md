+++
title = "Root Cause Analysis & AIOps"
slug = "rca-aiops"
layout = "area"
weight = 40
accent = "teal"
question = "How can we turn operational telemetry into reliable diagnosis and actionable incident response?"
summary = "Root cause analysis, anomaly detection, and telemetry-grounded repair for reliable microservices and AI agents."
blurb = """MSRG develops methods for **root cause analysis** and **AI for IT operations (AIOps)** in distributed systems. We combine **metrics, logs, and traces** with service dependency graphs and LLM agents to investigate failures and produce actionable diagnoses. Our work connects anomaly detection, incident response, automated repair, and realistic evaluation, with a focus on microservices and the reliability of AI agent executions."""
# Research descriptions are based on the publication abstracts linked below.
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

## Graph-guided diagnosis and incident response

[GALA](/publications/gala-can-graph-augmented-large-language-model-agentic-workflows-elevate-root-cause-analysis/)
combines statistical causal inference with iterative LLM reasoning over metrics,
logs, and traces. It investigates both root cause identification and
human-readable remediation guidance.

[GALA+](/publications/gala-graph-augmented-llm-agents-for-root-cause-analysis-and-incident-response-in-microservices/)
uses service dependencies to guide investigation and focus agents on local,
multimodal evidence. Its outputs include ranked diagnoses, incident summaries,
and action recommendations. The work also introduces SURE-Score, developed
with industry site reliability engineers to assess diagnostic quality beyond
text similarity.

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
[When Agentic Executions Fail](/publications/when-agentic-executions-fail-detecting-and-localizing-runtime-faults-from-telemetry/)
introduces AGENTCHAOSBENCH to study fault detection and localization from agent
execution telemetry, including faults at tool, model, guardrail, and inter-agent
boundaries.

[SREGym](/publications/sregym-a-live-benchmark-for-ai-sre-agents-with-high-fidelity-failure-scenarios/)
evaluates SRE agents in live cloud-native environments with injected faults and
ambient noise. These complementary settings help us examine whether an agent
can identify a fault, locate its origin, and support incident resolution under
realistic operating conditions.

## Current directions

- Correlating metrics, logs, and traces across service dependencies
- Graph-guided and evidence-grounded LLM investigation
- Connecting root cause diagnosis to remediation and automated repair
- Evaluating diagnostic quality, agent reliability, and operational usefulness

This research connects our work in
[Data Management](/research/data-management/) and
[Distributed Machine Learning](/research/distributed-machine-learning/).
