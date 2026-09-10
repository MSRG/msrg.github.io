+++
title = "Energy vs Privacy: Estimating the Ecological Impact of Federated Learning"
year = 2023
authors = ["René Schwermer", "Ruben Mayer", "Hans-Arno Jacobsen"]
venue = "Proceedings of the 14th ACM International Conference on Future Energy Systems"
publication_type = "Conference Paper"
research = ["distributed-machine-learning"]
external_url = "https://doi.org/10.1145/3575813.3597344"
abstract = "The increasing usage of edge devices and stricter data privacy regulations motivate the use of federated learning (FL). At the same time, more and more stakeholders are concerned about the ecological impact of machine learning and its associate network traffic. The current research in FL does not investigate the impact of different network constraints and privacy-enhancing techniques, such as differential privacy, on the network traffic and energy consumption of the clients. Most experiments run either on virtual machines or on one machine with simulated clients. In such environments, it is challenging to measure each client’s network and energy usage. Therefore, we built our \"Distributed Edge Device Testbed\" (DEDT) and evaluate a convolutional neural network trained on the MNIST data set under different network constraints on DEDT, with differential privacy and with an increasing amount of participating clients. For each experiment, we quantify the network traffic, energy consumption, and training time. The results show the importance of experiments on physically separated nodes and the need to improve software-based power monitoring. The estimated energy consumption deviates by up to 35 % from the measured ones. The accuracy of the estimated network traffic depends on the monitored network interface and gives an error of 18 % for virtual machines in combination with monitoring the Ethernet interface. The training time also increases linearly with the number of participating clients."
+++
