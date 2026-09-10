+++
title = "Self-Evolving Subscriptions for Content-Based Publish/Subscribe Systems"
year = 2017
authors = ["César Cañas", "Kaiwen Zhang", "Bettina Kemme", "Jörg Kienzle", "Hans-Arno Jacobsen"]
venue = "2017 IEEE 37th International Conference on Distributed Computing Systems (ICDCS)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2017.277"
abstract = "Traditional pub/sub systems cannot adequately handle workloads of applications with dynamic, short-lived subscriptions such as location-based social networks, predictive stock trading, and online games. Subscribers must continuously interact with the pub/sub system to remove and insert subscriptions, thereby inefficiently consuming network and computing resources, and sacrificing consistency. In the aforementioned applications, we recognize that the changes in the subscriptions can follow a predictable pattern over some variable (e.g., time). In this paper, we present a new type of subscription, called evolving subscription, which encapsulates these patterns and allow the pub/sub system to autonomously adapt to the dynamic interests of the subscribers without incurring an expensive re-subscription overhead. We propose a general model for expressing evolving subscriptions and a framework for supporting them in a pub/sub system. To this end, we propose three different designs to support evolving subscriptions, which are evaluated and compared to the traditional resubscription approach in the context of two use cases: online games and high-frequency trading. Our evaluation shows that our solutions can reduce subscription traffic by 96.8% and improve delivery accuracy when compared to the baseline resubscription mechanism."
+++
