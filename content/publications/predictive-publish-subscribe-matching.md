+++
title = "Predictive publish/subscribe matching"
year = 2010
authors = ["Vinod Muthusamy", "Haifeng Liu", "Hans-Arno Jacobsen"]
venue = "Proceedings of the Fourth ACM International Conference on Distributed Event-Based Systems"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1145/1827418.1827423"
abstract = "A new publish/subscribe capability is presented: the ability to predict the likelihood that a subscription will be matched at some point in the future. Knowing that some phenomenon of interest is about to take place, applications can take proactive steps to prevent the situation from occurring altogether, or speculatively begin reacting to the event even before it has transpired. A publish/subscribe matching algorithm is developed in which composite subscriptions consisting of temporal and logical operators are efficiently represented by a set of finite state machines and rules. The algorithm trains a Markov model to an application's event workload, and predicts the probability that a given subscription will match within a window in the future event stream. Evaluations demonstrate that the memory and processing costs of the algorithm scale well with the number of subscriptions, and the prediction precision is high, especially when the workload characteristics do not change rapidly. Furthermore, a comparison with a hand-crafted Markov model using real data traces shows that the algorithm consumes much less memory and processing power, yet still delivers prediction precision that approaches that of the hand-crafted model. This is especially impressive since the algorithms lack any of the domain expertise embedded in the hand-crafted model."
+++
