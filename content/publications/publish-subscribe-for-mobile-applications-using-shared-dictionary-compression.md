+++
title = "Publish/Subscribe for Mobile Applications Using Shared Dictionary Compression"
year = 2016
authors = ["Christoph Doblander", "Kaiwen Zhang", "Hans-Arno Jacobsen"]
venue = "2016 IEEE 36th International Conference on Distributed Computing Systems (ICDCS)"
publication_type = "Conference Paper"
research = ["data-management"]
external_url = "https://doi.org/10.1109/icdcs.2016.70"
abstract = "Publish/Subscribe is known as a scalable and efficient data dissemination mechanism. In a mobile environment, there is an added challenge for the pub/sub system to economizemobile bandwidth, which is especially precious in areas not wellcovered by mobile providers. While well-known compressionmethods such as GZip or Deflate are generally useful in suchsituations, we propose using Shared Dictionary Compression(SDC) to achieve a greater level of bandwidth efficiency. SDCrequires a dictionary, generated upfront, to be shared betweentwo communicating peers before it can be used. We proposea design where brokers forming the pub/sub overlay can be incharge of generating and propagating the shared dictionary. Oursolution employs an adaptive algorithm, executed at the brokers, which creates and maintains the dictionaries over time. Withthis approach, it is possible to reduce the required bandwidth byup to 88% including the introduced dictionary overhead. Ourdemo shows this approach applied to a smartphone applicationcommunicating with a publish/subscribe broker using the MQTTprotocol."
+++
