+++
title = "Geo-Distribution of Flexible Business Processes over Publish/Subscribe Paradigm"
slug = "geo-distribution-of-flexible-business-processes"
year = 2016
authors = ["Martin Jergler", "Mohammad Sadoghi", "Hans-Arno Jacobsen"]
venue = "Middleware"
publication_type = "Conference Paper"
research = ["data-management"]
tags = ["business-process-management", "publish-subscribe", "geo-distribution"]
external_url = "https://dl.acm.org/citation.cfm?id=2988351"
related_datasets = ["geo-distribution-of-flexible-business-processes"]
abstract = "An increasing amount of business processes are inherently knowledge-intense and require ad-hoc decision making. Flexible modeling approaches such as the Case Management Model and Notation (CMMN) were designed to support such scenarios. At the same time, many processes involve participants and data from different organizations across the globe. Often, legal regulations such as data privacy render centralized execution engines impractical because data must be processed where it is collected. Instead, distributed approaches to coordinate process and data are necessary for supporting geo-scale execution. In this paper, we present a fully geo-distributed workflow engine that implements the core execution semantics of CMMN, the Guard-Stage-Milestone (GSM) meta-model, and supports locality of process data by distributing data and control-flow management over a loosely-coupled publish/subscribe infrastructure. We present a novel context-aware mapping (CAM) of GSM into Workflow Units (WFUs), representing the unit of distribution in our system. We have developed our distributed workflow execution engine over PADRES, an enterprise-grade event management system. Evaluation results show that our approach scales well with process size and degree of distribution and that CAM improves throughput and latency by up to 5X compared to the baseline mapping (BLM)."
+++
