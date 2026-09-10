+++
title = "Krysha: Cost-Efficient Resource Orchestration for Geo-Distributed Serverless Microservices"
year = 2026
authors = ["Yuqiu Zhang", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 35th International Symposium on High-Performance Parallel and Distributed Computing"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/3806645.3807589"
abstract = "The convergence of microservice architectures and serverless computing promises an elastic and cost-efficient model for modern cloud applications that often span multiple geo-distributed regions. However, prevailing serverless orchestrators that prioritize resource utilization or simple cold-start mitigation often prove suboptimal concerning SLO compliance and cost-efficiency in this emerging use case. In this paper, we present Krysha, an adaptive orchestration framework that jointly optimizes function scheduling and resource allocation for geo-distributed serverless microservices. Krysha employs a novel bi-level scheduling strategy: global-level early-binding to regions for fast function dispersion, coupled with regional-level late-binding to compute nodes for optimized resource use and cost. Moreover, Krysha achieves fine-grained resource allocation by decoupling CPU and memory provisioning and applying in-place vertical scaling on individual function instances. These capabilities are guided by a comprehensive cost model and practical online optimization techniques. Our extensive evaluation shows that Krysha can achieve up to 74.7% cost savings in scaled deployments compared to state-of-the-art alternatives while maintaining SLO requirements."
+++
