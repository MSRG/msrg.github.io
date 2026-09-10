+++
title = "MESS+: Energy-Optimal Inferencing in Language Model Zoos with Service Level Guarantees"
year = 2024
authors = ["Ryan Zhang", "Herbert Woisetschläger", "Shiqiang Wang", "Hans-Arno Jacobsen"]
venue = "Workshop on Adaptive Foundation Models at NeurIPS 2024"
publication_type = "Workshop Paper"
research = ["distributed-machine-learning"]
external_url = "https://openreview.net/forum?id=OoReeQpwmW"
abstract = "Open-weight large language model (LLM) zoos allow users to quickly integrate state-of-the-art models into systems. Despite increasing availability, selecting the most appropriate model for a given task still largely relies on public benchmark leaderboards and educated guesses. This can be unsatisfactory for both inference service providers and end users, where the providers usually prioritize cost efficiency, while the end users usually prioritize model output quality for their inference requests. In commercial settings, these two priorities are often brought together in Service Level Agreements (SLA). We present MESS+, an online stochastic optimization algorithm for energy-optimal model selection from a model zoo, which works on a per-inference-request basis. For a given SLA that requires high accuracy, we are up to 2.5x more energy efficient with MESS+ than with randomly selecting an LLM from the zoo while maintaining SLA quality constraints."
+++
