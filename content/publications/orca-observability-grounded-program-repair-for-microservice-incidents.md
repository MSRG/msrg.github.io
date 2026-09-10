+++
title = "ORCA: Observability-Grounded Program Repair for Microservice Incidents"
year = 2026
authors = ["Yuanchen Gao", "Yifang Tian", "Yiran Li", "Charles Zhang", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["data-management"]
external_url = "https://arxiv.org/abs/2608.17018"
abstract = "Microservice failures are often diagnosed from operational telemetry. However, automated program repair systems usually start from issue reports, localized code context, or failing tests. This mismatch leaves a gap between telemetry-based diagnosis and patch generation. We present ORCA, an observability-grounded APR pipeline for microservice incidents. ORCA first distills the differences in paired failure and reference telemetry into a fault signature, then uses the signature to identify candidate code and deployment-configuration locations. Repair graph agents and an Exploration agent generate unified-diff patch candidates from these locations. ORCA evaluates generated patches with a Telemetry-Grounded Patch Verifier that separates patch validity, syntactic and semantic correctness, test-oracle integrity, and telemetry replay. On a 575-case benchmark, ORCA outperforms all evaluated baselines in terms of cost-effectiveness. Results show that operational telemetry can be transformed from diagnostic evidence into actionable repair context: paired telemetry supports repair-oriented localization, while repair graph agents convert localized code and configuration evidence into constrained patch-generation context for the LLM. Telemetry-grounded verification then exposes repair outcomes that issue- or test-only evaluation would miss."
+++
