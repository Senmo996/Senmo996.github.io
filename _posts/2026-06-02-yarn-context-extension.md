---
title: 'YaRN：大模型长上下文扩展技术介绍'
date: 2026-06-02
permalink: /posts/2026/06/yarn-context-extension/
tags:
  - ai
  - llm
  - transformer
---

YaRN 是一种用于扩展大语言模型上下文窗口的技术，全称来自论文 “Yet another RoPE extensioN”。它主要服务于使用 RoPE 位置编码的 Transformer 模型，目标是在不从零训练长上下文模型的情况下，把模型可处理的上下文长度扩展到更大的范围。

在 Mellum 2 Technical Report 中，YaRN 被用于把 Mellum 2 的上下文从预训练阶段的 8,192 tokens 扩展到 131,072 tokens，也就是约 128K。更关键的是，Mellum 2 不是对所有层统一应用 YaRN，而是使用 layer-selective YaRN：只对全局注意力层应用 YaRN 频率重映射，SWA 层保持原始 RoPE 参数。

## 为什么长上下文扩展很难

Transformer 需要知道 token 的位置信息。很多现代大模型使用 RoPE，也就是 Rotary Position Embedding。RoPE 把位置信息编码到 Query 和 Key 中，让注意力机制能够感知 token 之间的相对位置。

问题是：如果模型预训练时只看过 8K 上下文，那么直接把它拿去处理 128K 上下文，位置编码就会进入训练时没有充分覆盖的区域，模型可能无法稳定理解远距离 token。

这类问题常见表现包括：

- 长上下文中间信息丢失。
- 越到长距离位置，注意力越不稳定。
- 检索任务和长文 QA 能力下降。
- 代码仓库级上下文无法可靠利用。

YaRN 的作用，就是让 RoPE 模型更平滑地适应更长的位置范围。

## YaRN 的核心思想

RoPE 可以看作一组不同频率的位置旋转。上下文变长时，如果不调整这些频率，模型在新位置上的表现可能不稳定。

YaRN 通过重新映射 RoPE 的频率，让模型能更好地处理超出原始训练长度的位置。和简单地把 RoPE base 调大相比，YaRN 更强调平滑扩展和保留原有短上下文能力。

可以简单理解为：

```text
原始 RoPE：适合模型训练过的上下文长度
YaRN：调整 RoPE 频率，让模型能外推到更长上下文
```

它不是让模型凭空获得长上下文能力。通常还需要一段 long-context extension training，让模型在新上下文长度下继续适应。

## Mellum 2 的 layer-selective YaRN

Mellum 2 的特别之处在于它结合了 [SWA](/posts/2026/06/swa-sliding-window-attention/)。

Mellum 2 每 4 层中有 3 层是 SWA，窗口大小为 1,024 tokens；剩下 1 层是 full attention。对于 SWA 层来说，它们始终只看固定大小的局部窗口，不需要真正处理 128K 范围内的全局位置关系。

因此报告中采用了 layer-selective YaRN：

```text
SWA 层：保持原始 RoPE 参数
Full Attention 层：应用 YaRN 频率重映射
```

这个设计很重要。它避免了无谓地扰动局部窗口层，同时让真正需要跨长距离建模的全局层适应 128K 上下文。

## Mellum 2 的长上下文扩展结果

报告中对三种方案做了对比：

| 方案 | 思路 |
| :--- | :--- |
| Layer-selective YaRN | 只对全局注意力层应用 YaRN |
| Uniform RoPE base bump | 所有层统一调整 RoPE base |
| Unchanged RoPE base | 保持原始 RoPE 参数 |

在 64K evaluation context 下，报告中给出的 RULER 结果是：

| 方案 | RULER score |
| :--- | :--- |
| Layer-selective YaRN | 0.64 |
| Uniform RoPE base bump | 0.52 |
| Unchanged RoPE base | 0.33 |

报告也提醒，绝对分数受评测提示格式问题影响，应主要看方案之间的相对排名。即便如此，layer-selective YaRN 明显优于统一调整 RoPE 或完全不调整。

## 为什么只改全局层更合理

这个设计可以从注意力范围理解。

SWA 层的注意力范围固定在 1,024 tokens 左右。对它来说，当前位置是 20K、60K 还是 120K，并不重要；它实际处理的是局部邻域。

Full attention 层不同。它要处理跨越很远距离的 token，比如：

- 文件开头的类型定义和文件末尾的调用。
- 多文件上下文中的依赖关系。
- 长对话早期的用户约束。
- 仓库级代码补全中的跨文件引用。

这些层才真正需要适应 128K 的位置范围，因此 YaRN 应用于 full attention 层更符合结构分工。

## 长上下文扩展还需要训练

YaRN 不是只改参数就结束。Mellum 2 在应用 layer-selective YaRN 后，还进行了专门的长上下文训练。

报告中提到，长上下文训练使用了重新平衡的 Phase 3 预训练数据，并加入 agentic SFT 数据和 repository-level 的 FIM 示例。这样做是为了让模型在长上下文下仍然保留 IDE 代码补全能力。

报告还观察到，RULER 质量在约 30B long-context training tokens 后基本接近平台期，但训练继续到约 117B tokens，因为 MoE router 的负载均衡仍在继续改善。

这说明长上下文扩展不只影响位置编码，也会影响模型内部路由和计算分配。

## YaRN 的优点

### 1. 避免从零训练长上下文模型

从零训练 128K 模型成本很高。YaRN 允许在已有短上下文模型基础上扩展上下文。

### 2. 更好保留短上下文能力

好的上下文扩展方法不能只追求长，还要避免破坏模型在常见短输入上的能力。YaRN 的目标之一就是平衡这两点。

### 3. 适合 RoPE 系模型

很多现代 LLM 使用 RoPE，因此 YaRN 可以应用在较多模型架构上。

### 4. 可以和 SWA 混合

Mellum 2 展示了一个有用经验：当模型同时有 SWA 和 full attention 时，可以只对 full attention 层做 YaRN。

## YaRN 的局限

YaRN 不能替代长上下文数据和训练。如果模型没有在长文档、长代码仓库、长对话上继续适应，只调整位置编码通常不够。

另外，扩展上下文后还要关注：

- 长上下文评测是否可靠。
- 模型是否真的利用远距离信息。
- 长输入下的推理成本是否可接受。
- 注意力机制和 KV Cache 是否成为瓶颈。

因此，YaRN 常常需要和 [GQA](/posts/2026/06/gqa-grouped-query-attention/)、[SWA](/posts/2026/06/swa-sliding-window-attention/) 等效率技术一起使用。

## 和其他技术的关系

- [GQA](/posts/2026/06/gqa-grouped-query-attention/)：减少 KV Cache 成本，帮助长上下文部署。
- [SWA](/posts/2026/06/swa-sliding-window-attention/)：限制多数层注意力窗口，降低长上下文计算。
- [MTP](/posts/2026/06/mtp-multi-token-prediction/)：辅助训练，并可支持推测解码。

## 总结

YaRN 是一种面向 RoPE 模型的长上下文扩展技术。它通过调整位置编码频率，让模型更好地适应超过原始训练长度的上下文。

Mellum 2 的关键经验是 layer-selective YaRN：只对 full attention 层应用 YaRN，而让 SWA 层保持原始 RoPE 参数。这个设计符合模型结构本身的分工，也在报告中的消融实验里取得了更好的长上下文表现。
