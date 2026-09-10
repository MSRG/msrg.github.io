+++
title = "Balancing Power And Performance In HPC Clouds"
year = 2020
authors = ["Lixia Chen", "Jian Li", "Ruhui Ma", "Haibing Guan", "Hans-Arno Jacobsen"]
venue = "The Computer Journal"
publication_type = "Journal Article"
research = []
external_url = "https://doi.org/10.1093/comjnl/bxz150"
abstract = "With energy consumption in high-performance computing clouds growing rapidly, energy saving has become an important topic. Virtualization provides opportunities to save energy by enabling one physical machine (PM) to host multiple virtual machines (VMs). Dynamic voltage and frequency scaling (DVFS) is another technology to reduce energy consumption. However, in heterogeneous cloud environments where DVFS may be applied at the chip level or the core level, it is a great challenge to combine these two technologies efficiently. On per-core DVFS servers, cloud managers should carefully determine VM placements to minimize performance interference. On full-chip DVFS servers, cloud managers further face the choice of whether to combine VMs with different characteristics to reduce performance interference or to combine VMs with similar characteristics to take better advantage of DVFS. This paper presents a novel mechanism combining a VM placement algorithm and a frequency scaling method. We formulate this VM placement problem as an integer programming (IP) to find appropriate placement configurations, and we utilize support vector machines to select suitable frequencies. We conduct detailed experiments and simulations, showing that our scheme effectively reduces energy consumption with modest impact on performance. Particularly, the total energy delay product is reduced by up to 60%."
+++
