+++
title = "Analyzing Initialization Strategies for the Local Unitary Cluster Jastrow Ansatz within the Quantum-Centric Supercomputing Framework"
year = 2026
authors = ["Grier M. Jones", "Maforikan J. Amoussou", "Maximilian O. Leach", "Hans-Arno Jacobsen"]
venue = "arXiv"
publication_type = "ArXiv Preprint"
research = ["quantum-computing-systems"]
external_url = "https://arxiv.org/abs/2606.14933"
abstract = "In this study, we analyze the choice of local unitary cluster Jastrow (LUCJ) ansatz initialization and sensitivity of the sample-based quantum diagonalization (SQD) algorithm within the quantum-centric supercomputing (QCSC) framework. We examine six initialization strategies, including those based on coupled-cluster singles and doubles (CCSD), Møller-Plesset second-order perturbation theory (MP2), data-driven coupled-cluster (DDCC), and trivial (zeroes and random) initializations, across twelve molecular systems and three basis sets (STO-3G, cc-pVDZ, and aug-cc-pVDZ). We find that while the mean absolute percentage errors (MAPEs) between the alternative and CCSD-initialized t2-amplitudes span many orders of magnitude, the resulting SQD energies are largely insensitive to this variation. In particular, most initializations recover energies within chemical accuracy (+/-1.6 mEh) of the CCSD reference, with convergence improving as the basis set size increases. Notably, random initialization achieves performance competitive with CCSD across all basis sets, while zeroes initialization, despite having smaller deviations from CCSD, yields the worst energy agreement. Our results highlight that the proximity to the CCSD initialization is not a reliable predictor of the quality of electronic energies. These findings establish that configuration recovery within SQD, rather than circuit initialization, is the dominant factor governing energy accuracy, and suggest that computationally cheaper initialization strategies are viable alternatives to CCSD for QCSC workflows"
+++
