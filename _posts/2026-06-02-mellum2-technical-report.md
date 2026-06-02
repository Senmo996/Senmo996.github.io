---
title: 'Mellum 2 Technical Report 解读：面向软件工程的高效 MoE 代码模型'
date: 2026-06-02
permalink: /posts/2026/06/mellum2-technical-report/
tags:
  - ai
  - llm
  - code-model
---

JetBrains 发布的 Mellum 2 Technical Report 介绍了一个面向软件工程场景的开源权重语言模型：Mellum 2。它不是单纯追求参数规模的模型，而是围绕“IDE 中真实可部署的代码助手”这个目标来设计：既要能写代码、改代码、调试、调用工具、处理多步任务，又要在单卡和高并发环境中保持可接受的推理成本。

报告中最值得关注的一点是，Mellum 2 采用了 12B 总参数、2.5B 每 token 激活参数的 Mixture-of-Experts 架构。它试图把大模型的知识容量和小模型的推理成本结合起来：总参数足够大，能覆盖更多代码和推理知识；每次推理只激活一部分参数，计算成本接近 2.5B dense 模型。

## 一句话总结

Mellum 2 是一个专门为软件工程助手设计的 12B MoE 模型：它用 64 个专家、每 token 激活 8 个专家来扩大容量，用 [GQA](/posts/2026/06/gqa-grouped-query-attention/)、[SWA](/posts/2026/06/swa-sliding-window-attention/)、[MTP](/posts/2026/06/mtp-multi-token-prediction/) 和 [YaRN](/posts/2026/06/yarn-context-extension/) 等技术控制推理成本和长上下文能力，最终发布 Base、Instruct 和 Thinking 三类 checkpoint。

## 为什么 Mellum 2 重要

代码模型的任务边界已经不再只是 autocomplete。一个现代 coding assistant 通常要处理：

- 根据自然语言生成完整函数。
- 修改已有代码。
- 解释错误和调试问题。
- 调用外部工具和函数。
- 在代码仓库中规划多步修改。
- 和用户进行多轮技术对话。
- 在复杂任务中展示推理过程。

这些能力对模型质量要求更高，但 IDE 场景又非常看重延迟和成本。用户不可能接受一个每次响应都很慢的代码助手。因此 Mellum 2 的核心问题不是“怎样做一个最大模型”，而是“怎样在可部署成本内做一个更强的代码模型”。

这也是报告中所有架构选择的主线：每个设计都要经过质量和推理效率的权衡。

## 架构概览

Mellum 2 是 decoder-only Transformer，整体参考 Qwen3-MoE 风格。最终配置如下：

| 配置项 | Mellum 2 |
| :--- | :--- |
| 总参数 | 约 12B |
| 每 token 激活参数 | 约 2.5B |
| Transformer 层数 | 28 |
| Hidden dimension | 2,304 |
| Vocabulary size | 98,304 |
| MoE 专家数 | 64 |
| 每 token 激活专家数 | 8 |
| Query heads | 32 |
| KV heads | 4 |
| Sliding window | 1,024 tokens，3:1 SWA |
| 原生上下文 | 8,192 tokens |
| 长上下文扩展后 | 131,072 tokens |
| MTP head | 1 层，loss 权重 0.1 |

这个配置背后的关键是 MoE。相比 dense 模型，MoE 可以让模型拥有更大的总参数容量，但每个 token 只经过部分专家。报告中 Mellum 2 选择 64 个专家、激活 8 个专家，原因是更少激活专家虽然更快，但质量会下降；更多激活专家质量更好，但延迟更高。8-of-64 是报告中选出的质量和延迟折中点。

## 四个关键技术

### GQA：控制 KV Cache 成本

Mellum 2 使用 32 个 query heads 和 4 个 KV heads。这里的核心技术是 [GQA](/posts/2026/06/gqa-grouped-query-attention/)，也就是 Grouped-Query Attention。

在高并发推理中，KV Cache 往往是显存和吞吐瓶颈。减少 KV heads 可以降低缓存规模，提高服务吞吐。报告中提到，8 个 KV heads 会明显拖慢吞吐，2 个 KV heads 又会影响质量，因此最终选择 4 个 KV heads。

### SWA：降低长上下文注意力成本

Mellum 2 采用 [SWA](/posts/2026/06/swa-sliding-window-attention/)，每 4 层中有 3 层使用窗口大小为 1,024 tokens 的滑动窗口注意力，剩下 1 层保留完整注意力。

这个设计避免所有层都对完整上下文做 attention，显著降低长输入时的计算压力。同时，全局注意力层仍然保留跨长距离信息流动能力。

### MTP：辅助训练并服务推测解码

Mellum 2 在标准 next-token prediction 之外加入 [MTP](/posts/2026/06/mtp-multi-token-prediction/)，也就是 Multi-Token Prediction。它使用一个额外 transformer layer 来预测未来 1 个 token，loss 权重为 0.1。

报告中强调，MTP head 在常规评测和推理时可以移除，不影响主模型输出；但它可以作为 speculative decoding 的 draft model。换句话说，MTP 一方面改善训练信号，另一方面为推理加速留下接口。

### YaRN：扩展到 128K 上下文

预训练阶段 Mellum 2 的上下文长度是 8,192 tokens。报告随后用 [YaRN](/posts/2026/06/yarn-context-extension/) 把上下文扩展到 131,072 tokens。

这里有一个重要细节：Mellum 2 不是对所有层统一应用 YaRN，而是使用 layer-selective YaRN。具体做法是只对 full attention 层应用 YaRN 频率重映射，SWA 层保持原始 RoPE 参数。原因是 SWA 层始终只看局部窗口，真正需要适应 128K 长距离位置的是全局注意力层。

## 预训练：从通用数据转向代码和数学

Mellum 2 的预训练总量约为 10.65T tokens，数据包括 web/general knowledge、source code 和 mathematical content。训练分三阶段进行，数据比例逐步从通用 web 转向代码和数学：

| 阶段 | Tokens | Web | Code | Math |
| :--- | :--- | :--- | :--- | :--- |
| Phase 1: Foundation | 约 6.18T | 70% | 23% | 6% |
| Phase 2: Quality Uplift | 约 2.79T | 44% | 42% | 14% |
| Phase 3: Capability Sharpening | 约 1.69T | 23% | 59% | 18% |

这个课程设计很符合代码模型训练直觉：早期用更广的数据建立语言和基础知识能力，后期在学习率衰减阶段用高质量代码和数学数据强化核心能力。

报告还提到 Mellum 2 使用了 Fill-in-the-Middle 目标。FIM 对 IDE 代码补全尤其重要，因为真实补全通常不是只看光标前文，还要结合光标后面的代码。

## 训练配方

训练方面，Mellum 2 使用 Muon optimizer，结合 BF16 + FP8 hybrid mixed precision，并采用 Warmup-Hold-Decay 学习率计划。

几个值得注意的点：

- 训练在 32 个节点上进行，每个节点 8 张 H200。
- 全局 batch size 从 2,048 sequences 增长到 4,096 sequences。
- 序列长度为 8,192。
- 完整训练步数为 323,459。
- MoE router 使用 load-balancing loss 和 z-loss 来稳定训练。
- 使用 dropless routing，避免 token 被专家容量限制丢弃。

这些细节说明 Mellum 2 的工程重点不只是模型结构，也包括大规模 MoE 训练的稳定性。

## 长上下文扩展

完成主预训练后，Mellum 2 进行了专门的长上下文扩展，把上下文从 8K 扩到 128K。

长上下文训练数据混合了重新平衡的 Phase 3 预训练数据、agentic SFT 数据，以及 repository-level FIM 示例。后者对代码模型很重要，因为真实 IDE 场景中，模型经常需要根据同一仓库里的多个文件补全当前文件。

报告中一个有意思的观察是：RULER 指标在约 30B long-context training tokens 后基本接近平台期，但训练继续到约 117B tokens，因为 MoE router 的负载均衡还在继续改善。这说明长上下文扩展不仅是位置编码问题，也会影响 MoE 路由动态。

## 后训练：Instruct 与 Thinking

Mellum 2 从同一个 long-context checkpoint 出发，训练了两个 SFT 变体：

- Instruct：直接回答，不显式输出推理过程。
- Thinking：先输出 reasoning trace，再给出最终答案。

两个变体使用相同基础 checkpoint 和数据来源，但 chat template、loss masking 和 reasoning trace 处理方式不同。SFT 后，报告又对两个模型分别进行 RLVR，也就是 Reinforcement Learning with Verifiable Rewards。

选择 RLVR 而不是 RLHF 的原因是：训练数据中的任务可以用程序化方式验证，例如代码测试、数学答案校验、工具调用状态校验等。这样不需要额外训练 reward model，奖励信号更直接。

## 部署效率

Mellum 2 的架构目标是匹配或超过 Qwen2.5-7B 的推理速度。报告中使用单张 H100 80GB、vLLM、动态 FP8 quantization 进行测试，输入/输出长度采用代码补全工作负载形状：平均输入 2,304 tokens，平均输出 256 tokens。

结果如下：

| 模型 | 单请求输出速度 | 并发吞吐 |
| :--- | :--- | :--- |
| Qwen2.5-7B | 193 tokens/s | 4,283 tokens/s |
| Mellum 2 | 192 tokens/s | 5,179 tokens/s |
| Qwen3-8B | 169 tokens/s | 2,897 tokens/s |

可以看到，Mellum 2 在单请求速度上几乎持平 Qwen2.5-7B，在高并发吞吐上领先 21%。这正好对应报告的设计目标：在接近 2.5B dense 每 token 计算成本下，获得更大的模型容量。

## 我的理解

Mellum 2 这篇报告的价值，不在于提出某一个全新的单点技术，而在于展示了一套面向真实部署的模型设计方法。

它的核心思路可以概括为：

1. 用 MoE 扩大总参数容量，但控制每 token 计算量。
2. 用 GQA 降低 KV Cache 成本。
3. 用 SWA 降低长上下文 attention 成本。
4. 用 MTP 改善训练信号，并为推测解码准备 draft。
5. 用 layer-selective YaRN 扩展长上下文，而不是粗暴调整所有层。
6. 用 SFT + RLVR 把 base model 转成真实可用的代码助手。

这是一种非常工程化的路线：每个组件都不是孤立炫技，而是服务于 IDE 代码助手的延迟、吞吐、长上下文和工具使用需求。

## 延伸阅读

报告中涉及的几个关键技术，我已经单独整理成文章：

- [GQA：Grouped-Query Attention 技术介绍](/posts/2026/06/gqa-grouped-query-attention/)
- [SWA：Sliding Window Attention 技术介绍](/posts/2026/06/swa-sliding-window-attention/)
- [MTP：Multi-Token Prediction 技术介绍](/posts/2026/06/mtp-multi-token-prediction/)
- [YaRN：大模型长上下文扩展技术介绍](/posts/2026/06/yarn-context-extension/)

如果只看 Mellum 2 的架构创新，建议按 GQA、SWA、MTP、YaRN 这个顺序阅读；如果更关心训练和后训练，可以重点看报告中的 pre-training curriculum、long-context extension 和 RLVR 部分。

## 总结

Mellum 2 是一个典型的“以部署为导向”的代码模型。它没有走单纯堆大 dense 参数的路线，而是通过 MoE、GQA、SWA、MTP 和 YaRN 等组合技术，在质量、上下文长度和推理效率之间做系统折中。

对于关注代码模型、IDE agent、长上下文推理和高效部署的人来说，这篇技术报告很值得细读。它展示的不是一个单点技巧，而是一整套从架构、数据、训练、后训练到推理 benchmark 的工程闭环。
