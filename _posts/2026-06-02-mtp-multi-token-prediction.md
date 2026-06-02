---
title: 'MTP：Multi-Token Prediction 技术介绍'
date: 2026-06-02
permalink: /posts/2026/06/mtp-multi-token-prediction/
tags:
  - ai
  - llm
  - transformer
---

MTP，全称是 Multi-Token Prediction，中文可以理解为“多 token 预测”。传统语言模型训练时通常只预测下一个 token，而 MTP 会额外要求模型预测更远的未来 token。它的目标是让模型在训练阶段学到更强的前瞻性表示，同时还能为推测解码提供一个天然的 draft model。

在 Mellum 2 Technical Report 中，MTP 是一个很有工程价值的设计：Mellum 2 使用一个额外的 MTP transformer layer 来预测未来 1 个 token，损失权重为 `0.1`。这个 MTP head 在评测和常规推理时会被移除，不影响主模型输出；但它可以作为推测解码中的 draft model。

## 标准 next-token prediction

大语言模型最常见的训练目标是 next-token prediction。给定一段前文，模型预测下一个 token：

```text
输入：The function returns
目标：the
```

训练过程会不断让模型学习：

```text
P(token_t | token_1, token_2, ..., token_{t-1})
```

这种训练方式简单、稳定，也非常通用。但它只直接监督下一个 token，对更远未来的建模主要靠隐式学习。

## MTP 做了什么

MTP 在 next-token prediction 之外，再加一个或多个“未来 token”的预测目标。

以预测未来 1 个额外 token 为例，模型除了预测当前位置的下一个 token，还要预测再往后的 token：

```text
普通目标：预测 token_{t+1}
MTP 目标：额外预测 token_{t+2}
```

Mellum 2 使用的是一个额外的 MTP head。这个 head 接收主模型隐藏状态，再通过一个额外 transformer layer 进行未来 token 预测。

报告中的配置可以概括为：

| 配置项 | Mellum 2 设置 |
| :--- | :--- |
| MTP 层数 | 1 |
| 额外预测距离 | 1 个未来 token |
| MTP loss 权重 | 0.1 |
| 推理时是否保留 | 常规评测和推理时移除 |
| 额外用途 | 作为推测解码 draft model |

## 为什么 MTP 有用

### 1. 让隐藏状态包含更多未来信息

如果模型只预测下一个 token，它可能更关注局部最直接的输出。MTP 迫使模型的隐藏状态对更远一步的结果也有帮助，因此可能学到更稳定的语义和结构表示。

对于代码模型，这一点尤其重要。生成代码时，当前 token 往往受到后续结构影响，例如括号、缩进、类型、返回值和控制流。

### 2. 改善代码和推理任务

Mellum 2 报告中提到，在一个 14B MoE 模型、105B token 的消融实验中，加入 MTP 只增加约 7% 训练时间，但在 HumanEval、MMLU、MMLU-Pro、GSM8K 等任务上带来了明显提升。

这说明 MTP 不只是推理加速组件，也能作为辅助训练目标改善模型能力。

### 3. 可用于推测解码

推测解码的基本思路是：先用一个较小或较快的 draft model 生成候选 token，再让主模型验证这些候选。如果候选通过验证，就可以一次接受多个 token，从而减少主模型逐 token 计算的次数。

MTP head 本身就被训练来预测未来 token，因此天然适合作为 draft model。Mellum 2 报告中明确提到，MTP head 可以作为内置 draft，用于 speculative decoding。

## MTP 和推测解码的关系

推测解码通常需要两个模型：

```text
Draft model：快速提出候选 token
Target model：验证候选 token
```

如果额外训练一个 draft model，会增加训练和部署复杂度。MTP 的一个优势是：它可以把 draft 能力内置在主模型旁边。

可以把它理解为：

```text
主模型：负责最终质量
MTP head：负责快速猜测未来 token
```

常规推理时可以移除 MTP head；需要推测解码时，则可以把它拿来生成候选。

## 为什么 MTP head 推理时可以移除

MTP 是辅助训练目标，不是主模型输出路径的一部分。主模型仍然按普通 next-token prediction 的方式生成下一个 token。

因此在评测主模型能力时，可以移除 MTP head，避免额外计算。MTP 对主模型的影响已经通过训练阶段的梯度更新写入了模型参数。

这和很多辅助损失类似：训练时帮助模型学得更好，部署时不一定要保留辅助模块。

## MTP 的代价

MTP 也有成本：

- 训练时需要额外计算。
- 需要设置合适的 loss 权重。
- 如果未来 token 预测目标设计不当，可能干扰主 next-token 目标。
- 多预测太远可能带来不稳定或收益下降。

Mellum 2 采用的是相对克制的设计：只加一个 MTP layer，预测一个额外未来 token，loss 权重为 0.1。这种方式既能引入辅助信号，又不会让 MTP 压过主训练目标。

## 和其他技术的关系

- [GQA](/posts/2026/06/gqa-grouped-query-attention/)：主要优化 KV Cache 和高并发吞吐。
- [SWA](/posts/2026/06/swa-sliding-window-attention/)：主要优化长上下文注意力成本。
- [YaRN](/posts/2026/06/yarn-context-extension/)：负责把上下文扩展到更长范围。

MTP 和这些技术关注点不同。GQA、SWA、YaRN 主要服务于架构和上下文效率；MTP 同时服务于训练质量和解码加速。

## 总结

MTP 是一种简单但有效的辅助训练技术。它让模型不只学习预测下一个 token，还学习预测更远一步的未来 token。

在 Mellum 2 中，MTP 的设计非常工程化：一个额外 transformer layer、loss 权重 0.1、常规推理时可移除、需要时可作为 speculative decoding 的 draft model。它让模型训练质量和推理加速能力同时受益，是 Mellum 2 架构中很值得关注的一项技术。
