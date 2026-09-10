+++
title = "Ksurf: Attention Kalman Filter and Principal Component Analysis for Prediction under Highly Variable Cloud Workloads"
year = 2024
authors = ["Michael Dang'ana", "Hans-Arno Jacobsen"]
venue = "2024 11th International Conference on Electrical Engineering, Computer Science and Informatics (EECSI)"
publication_type = "Conference Paper"
research = []
external_url = "https://doi.org/10.1109/eecsi63442.2024.10776180"
abstract = "Resource estimation and workload forecasting are critical in cloud data centers. Complexity in the cloud provider environment due to varying numbers of virtual machines introduces high variability in workloads and resource usage, making estimations problematic using state-of-the-art models that fail to deal with nonlinear characteristics. High measurement noise and variance affect the estimation of resource metrics of cloud systems across packet networks influenced by external dynamics. An ideal solution to these problems is the Kalman filter, a variance-minimizing estimator, ideal for highly variable data with Gaussian state space noise such as internet workloads. This work provides a new solution by making these contributions: i) it introduces a novel Kalman filter estimator using principal component analysis and an attention mechanism, ii) it evaluates the scheme on a Google Cloud benchmark comparing it to the state-of-the-art Bi-directional Grid Long Short- Term Memory network model on prediction tasks and iii) demonstrates real-time performance through a control task using a cloud-based messaging system with predictive auto-scaling. The new scheme improves prediction accuracy by 37% over state-of-the-art Kalman filters in prediction tasks, reduces the time series prediction error of the neural network model by over 40%, and improves Apache Kafka workload-based scaling stability by 58%."
+++
