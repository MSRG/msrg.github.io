+++
title = "MESS+: Dynamically Learned Inference-Time LLM Routing in Model Zoos with Service Level Guarantees"
year = 2025
authors = ["Herbert Woisetschläger", "Ryan Zhang", "Shiqiang Wang", "Hans-Arno Jacobsen"]
venue = "Advances in Neural Information Processing Systems 38"
publication_type = "Conference Paper"
research = ["distributed-machine-learning"]
external_url = "https://doi.org/10.52202/085713-1804"
abstract = "Open-weight large language model (LLM) zoos provide access to numerous high-quality models, but selecting the appropriate model for specific tasks remains challenging and requires technical expertise. Most users simply want factually correct, safe, and satisfying responses without concerning themselves with model technicalities, while inference service providers prioritize minimizing operating costs. These competing interests are typically mediated through service level agreements (SLAs) that guarantee minimum service quality. We introduce MESS+, a stochastic optimization algorithm for cost-optimal LLM request routing while providing rigorous SLA compliance guarantees. MESS+ learns request satisfaction probabilities of LLMs in real-time as users interact with the system, based on which model selection decisions are made by solving a per-request optimization problem. Our algorithm includes a novel combination of virtual queues and request satisfaction prediction, along with a theoretical analysis of cost optimality and constraint satisfaction. Across a wide range of state-of-the-art LLM benchmarks, MESS+ achieves an average of $2\\times$ cost savings compared to existing LLM routing techniques."
+++
