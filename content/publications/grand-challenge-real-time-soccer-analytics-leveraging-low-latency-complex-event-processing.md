+++
title = "Grand challenge: real-time soccer analytics leveraging low-latency complex event processing"
year = 2013
authors = ["Martin Jergler", "Christoph Doblander", "Mohammedreza Najafi", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 7th ACM international conference on Distributed event-based systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/2488222.2488280"
abstract = "In this paper, we present a real-time capable event-based system, which is tailored towards analytical query processing in the context of soccer games. The main challenge is to meet the application's strict real-time and low-latency requirements in face of streams of high-velocity sensor data. We describe a workflow-like architecture for query processing based on a publish/subscribe model. Queries are structured into computational tasks that are arranged sequentially and/or in parallel. Tasks are connected by preallocated ring buffers providing total event ordering and fast as well as decoupled event access. Our evaluation results show the effectiveness of the proposed system in terms of low-latency processing under real-time conditions. Speeding up the system by a factor of 50 compared to real-time introduces almost no latency overhead."
+++
