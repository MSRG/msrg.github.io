+++
title = "FractalSort: High Precision Compressed Radix Sort on FPGA"
year = 2026
authors = ["Michael Dang'ana", "Hans-Arno Jacobsen"]
venue = "IEEE Transactions on Computers"
publication_type = "Journal Article"
research = ["data-management"]
external_url = "https://doi.org/10.1109/tc.2026.3653702"
abstract = "State-of-the-art large data set high-precision sorting algorithms typically use hardware-accelerated radix sort. Advances in Dynamic Random Access Memory, Flash and High Bandwidth Memory (HBM) have enabled faster bandwidth intensive merge operations, where distribution-dependent data pre-processing techniques such as stochastic sampling bucketing offer alternatives impacted by increased data passes and vulnerability to data skew.This work addresses these limitations by introducing a compressed radix-sorting scheme for high-precision keys. Whereas radix sort histograms grow exponentially with precision, FractalSort guarantees bounded histogram size through the novel compression scheme which translates into smaller sorting circuits and reduced memory usage. Another key contribution is the novel optimized merge algorithm, which eliminates the need for data pre-processing and bucketing leading to higher bandwidth efficiency and reduced algorithm complexity. Using a tree-based recursive sorting architecture for space efficiency and low latency, the algorithm achieves fast sorting that exceeds the state-of-the-art on the CPU, FPGA, and GPU by 6x, 2.5x, and 3x bandwidth-adjusted throughput on 4GB to 2TB data sets. FractalSort is implemented on Xilinx Virtex UltraScale+ FPGA empirically demonstrating on-chip sorting at 20 Tb/s capable of memory-to-memory sorting of 32-bit keys at 3.2Tb/s using HBM."
+++
