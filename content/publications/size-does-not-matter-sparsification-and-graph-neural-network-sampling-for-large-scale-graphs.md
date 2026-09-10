+++
title = "Size Does (Not) Matter? Sparsification and Graph Neural Network Sampling for Large-scale Graphs"
year = 2024
authors = ["Jana Vatter", "Maurice L. Rochau", "Ruben Mayer", "Hans-Arno Jacobsen"]
venue = "VLDB Workshops"
publication_type = "Conference Paper"
research = ["distributed-machine-learning"]
external_url = "https://vldb.org/workshops/2024/proceedings/LSGDA/LSGDA24.06.pdf"
abstract = "With the ever-growing size of real-world graphs, optimizing Graph Neural Network (GNN) training has become essential. Two key methods for this are graph sparsification and GNN sampling, both aim at reducing graph size while preserving valuable information. The question arises what kind of information should be preserved and what a reasonable graph size is. We propose combining random graph sparsification with GNN sampling, showing that this approach can significantly reduce training time while maintaining accuracy. Our experiments demonstrate that sparsification to around 40% of the original graph and sampling with a fanout parameter of 4 yields the best results in terms of training time and accuracy. Beyond training time, also inference time can be decreased up to 75% which enables scalability for time-critical applications such as fraud detection. Finally, we identify open challenges and new research directions, including sampling-aware graph reduction methods, mining new graph datasets, and the prevention of bias."
abstract_license_url = "https://creativecommons.org/licenses/by-nc-nd/4.0/"
+++
