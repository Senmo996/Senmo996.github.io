---
title: 'GQA：Grouped-Query Attention 技术介绍'
date: 2026-06-02
permalink: /posts/2026/06/gqa-grouped-query-attention/
tags:
  - ai
  - llm
  - transformer
---

GQA，全称是 Grouped-Query Attention，中文可以理解为“分组查询注意力”。它是 Transformer 注意力机制的一种变体，目标是在尽量保持模型效果的同时，减少推理时的 KV Cache 开销，提高大模型在长上下文和高并发场景下的吞吐。

在 Mellum 2 Technical Report 中，GQA 是 Mellum 2 的核心架构选择之一。报告中给出的最终配置是：32 个 Query heads，4 个 KV heads，head dimension 为 128。作者认为 KV heads 数量是高并发推理吞吐的重要影响因素，因此 Mellum 2 选择了 4 个 KV heads 作为质量和速度之间的折中。

## 从 MHA 到 GQA

标准 Transformer 中常见的是 MHA，也就是 Multi-Head Attention。它会把注意力拆成多个头，每个头都有自己的 Query、Key 和 Value：

```text
Head 1: Q1, K1, V1
Head 2: Q2, K2, V2
Head 3: Q3, K3, V3
...
```

这样做表达能力强，但推理时需要为每个注意力头保存 Key 和 Value。模型越大、上下文越长、并发请求越多，KV Cache 占用就越明显。

另一种极端做法是 MQA，也就是 Multi-Query Attention。MQA 让所有 Query heads 共享同一组 Key 和 Value：

```text
Q1, Q2, Q3, ... 共享 K, V
```

MQA 的 KV Cache 最省，但共享得太激进，可能损失模型质量。

GQA 介于 MHA 和 MQA 之间。它把多个 Query heads 分成若干组，每组共享一套 Key 和 Value：

```text
Group 1: Q1, Q2, Q3, Q4     -> K1, V1
Group 2: Q5, Q6, Q7, Q8     -> K2, V2
Group 3: Q9, Q10, Q11, Q12  -> K3, V3
...
```

这样既减少了 KV heads 数量，又不像 MQA 那样把所有 Query 都压到同一个 KV 表示上。

## GQA 解决什么问题

大模型推理时，生成每一个新 token 都需要访问前面上下文的 Key 和 Value。为了避免重复计算，系统会把历史 token 的 Key 和 Value 缓存在显存中，这就是 KV Cache。

KV Cache 的规模大致和下面几个因素有关：

```text
KV Cache 大小 ~= 层数 x 上下文长度 x KV heads 数量 x head dimension
```

因此，减少 KV heads 数量可以直接降低显存压力。显存压力下降后，高并发场景下可以容纳更多请求，吞吐也会更好。

这就是 GQA 的主要价值：它不是单纯为了让模型更小，而是为了让模型在真实部署中更容易跑得快。

## Mellum 2 为什么使用 GQA

Mellum 2 的目标不是只追求参数规模，而是要在 IDE 场景中低延迟、高吞吐地运行。报告中提到，在高并发服务场景下，KV heads 数量对吞吐影响很大。

Mellum 2 最终采用：

| 配置项 | 数值 |
| :--- | :--- |
| Query heads | 32 |
| KV heads | 4 |
| Head dimension | 128 |
| 注意力形式 | GQA |

报告中对不同 KV heads 数量做了消融实验。8 个 KV heads 会带来明显吞吐下降，2 个 KV heads 又会影响评测质量，因此 4 个 KV heads 成为折中点。

这也是 GQA 的典型工程思路：不是越少越好，而是在“KV Cache 成本”和“注意力表达能力”之间找平衡。

## GQA 的优点

### 1. 降低 KV Cache 显存占用

相比每个 Query head 都有独立 K/V 的 MHA，GQA 只保留较少的 KV heads。上下文越长，这个优势越明显。

### 2. 提高高并发吞吐

在服务器同时处理多个请求时，KV Cache 读写和显存带宽会变成瓶颈。GQA 减少 KV Cache 规模，可以改善吞吐。

### 3. 比 MQA 更保守

MQA 所有 Query heads 共享同一组 K/V，压缩更强。GQA 分组共享 K/V，保留了更多表达能力，通常是更稳妥的折中方案。

### 4. 适合长上下文模型

长上下文会放大 KV Cache 成本。GQA 可以和 [SWA](/posts/2026/06/swa-sliding-window-attention/) 这类局部注意力机制配合使用，一起控制长上下文推理成本。

## GQA 的代价

GQA 并不是没有代价。减少 KV heads 意味着多个 Query heads 要共享同一组 Key 和 Value，模型的注意力表达能力会受到一定约束。

如果 KV heads 太少，可能出现以下问题：

- 复杂任务上的质量下降。
- 长上下文中信息选择能力变弱。
- 某些细粒度代码理解任务变得不稳定。

所以 GQA 的关键不是“尽量减少 KV heads”，而是“找到合适的 KV heads 数量”。Mellum 2 报告中选择 4 个 KV heads，正是因为 2 个太激进，8 个又太慢。

## 和其他技术的关系

GQA 主要处理的是 KV Cache 和显存带宽问题，而不是直接缩短注意力范围。它常和其他技术一起使用：

- [SWA](/posts/2026/06/swa-sliding-window-attention/)：限制大部分层的注意力窗口，减少长上下文计算。
- [YaRN](/posts/2026/06/yarn-context-extension/)：扩展 RoPE 模型的上下文长度。
- [MTP](/posts/2026/06/mtp-multi-token-prediction/)：通过多 token 预测辅助训练，并可服务于推测解码。

## 总结

GQA 是一种面向推理效率的注意力结构。它通过让多个 Query heads 共享较少的 KV heads，显著降低 KV Cache 压力，同时比 MQA 保留更多表达能力。

在 Mellum 2 中，GQA 的作用非常明确：帮助一个 12B 总参数、2.5B 激活参数的模型，在单 H100 和高并发服务场景下保持接近 7B dense 模型的推理成本。对于需要长上下文、低延迟和高吞吐的大模型来说，GQA 是非常关键的工程技术。
