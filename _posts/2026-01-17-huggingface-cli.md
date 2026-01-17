---
title: 'Hugging Face CLI (hf命令) 实用指南'
date: 2026-01-17
permalink: /posts/2026/01/huggingface-cli/
tags:
  - machine learning
  - huggingface
  - cli
---

`huggingface-cli` 是 Hugging Face 官方提供的命令行工具，用于与 Hugging Face Hub 进行交互。随着其功能的不断增强，现在已更名为 `hf` 命令，提供了更简洁、强大的接口。本文将重点介绍 `hf` 命令的具体用法，包括如何使用 hf-mirror 镜像加速下载，以及其他实用的加速措施。

## 核心功能

`hf` 命令行工具的核心功能包括：

1.  **模型和数据集管理**: 下载、上传、列出 Hugging Face Hub 上的模型和数据集。
2.  **空间管理**: 创建和管理 Hugging Face Spaces（用于部署模型和应用）。
3.  **认证管理**: 处理用户登录和令牌管理。
4.  **配置管理**: 设置和查看工具配置。
5.  **镜像加速**: 支持使用镜像源加速下载。

## 安装 `hf` 命令

### 从 PyPI 安装

```bash
pip install -U huggingface_hub
```

安装完成后，您可以通过以下命令验证安装是否成功：

```bash
hf --version
```

## 基本认证

在使用 `hf` 命令与 Hugging Face Hub 交互之前，您需要进行认证：

```bash
hf login
```

这将打开浏览器窗口，引导您完成登录过程。如果您在没有图形界面的环境中，可以使用令牌进行认证：

```bash
hf login --token YOUR_TOKEN_HERE
```

## `hf` 命令基本用法

### 1. 模型和数据集管理

#### 下载模型

```bash
# 下载完整模型
hf download username/model-name

# 下载特定文件
hf download username/model-name --include "*.bin"

# 下载到指定目录
hf download username/model-name --local-dir ./my-model
```

#### 上传模型

```bash
hf upload username/model-name ./my-model
```

#### 列出模型

```bash
hf list models --filter "text-generation"
```

### 2. 空间管理

#### 创建空间

```bash
hf space create --name my-space --type model
```

#### 部署到空间

```bash
hf space deploy --space username/my-space
```

### 3. 配置管理

#### 查看配置

```bash
hf config
```

#### 设置配置

```bash
hf config set cache_dir /path/to/cache
```

## 使用 hf-mirror 镜像加速

由于网络原因，直接从 Hugging Face Hub 下载可能会很慢。使用 hf-mirror 镜像是最有效的加速方法之一。

### 临时使用镜像

在执行命令时通过环境变量指定：

```bash
# Linux/MacOS
export HF_ENDPOINT=https://hf-mirror.com && hf download username/model-name

# Windows (PowerShell)
$env:HF_ENDPOINT="https://hf-mirror.com"; hf download username/model-name

# Windows (CMD)
set HF_ENDPOINT=https://hf-mirror.com && hf download username/model-name
```

### 永久设置镜像

将镜像设置添加到配置文件中：

```bash
hf config set endpoint https://hf-mirror.com
```

或者直接编辑配置文件 `~/.cache/huggingface/token`，添加：

```
endpoint = https://hf-mirror.com
```

## 其他加速措施

### 1. 配置缓存目录

设置较大的缓存目录，避免重复下载：

```bash
hf config set cache_dir /path/to/large-cache
```

### 2. 使用 `--resume-download` 参数

在下载大文件时启用断点续传：

```bash
hf download username/model-name --resume-download
```

### 3. 批量下载优化

对于多个文件的下载，使用 `--include` 或 `--exclude` 参数精确控制：

```bash
hf download username/model-name --include "*.bin" "*.json"
```

### 4. 并行下载

使用 `--parallel` 参数启用并行下载（需要较新版本的 huggingface_hub）：

```bash
hf download username/model-name --parallel
```

### 5. 使用系统代理

如果您有可用的代理，可以通过环境变量设置：

```bash
# HTTP 代理
export HTTP_PROXY=http://proxy-server:port
export HTTPS_PROXY=http://proxy-server:port

# SOCKS 代理
export ALL_PROXY=socks5://proxy-server:port
```

### 6. 使用 hf-transfer 加速

`hf-transfer` 是 Hugging Face 官方开发的高性能下载加速工具，通过多线程和断点续传技术显著提高下载速度。

#### 安装 hf-transfer

```bash
pip install hf-transfer
```

#### 启用 hf-transfer

安装完成后，通过设置环境变量启用：

```bash
# Linux/MacOS
export HF_HUB_ENABLE_HF_TRANSFER=1 && hf download username/model-name

# Windows (PowerShell)
$env:HF_HUB_ENABLE_HF_TRANSFER=1; hf download username/model-name

# Windows (CMD)
set HF_HUB_ENABLE_HF_TRANSFER=1 && hf download username/model-name
```

#### 永久启用 hf-transfer

将环境变量添加到系统配置文件中：

```bash
# Linux/MacOS: 添加到 ~/.bashrc 或 ~/.zshrc
echo 'export HF_HUB_ENABLE_HF_TRANSFER=1' >> ~/.bashrc
source ~/.bashrc

# Windows: 在系统环境变量中添加
# HF_HUB_ENABLE_HF_TRANSFER = 1
```

#### 与镜像结合使用

`hf-transfer` 可以与 hf-mirror 镜像结合使用，获得最佳下载速度：

```bash
export HF_ENDPOINT=https://hf-mirror.com && export HF_HUB_ENABLE_HF_TRANSFER=1 && hf download username/model-name
```

## 常用场景示例

### 场景 1: 快速下载大模型

```bash
# 使用镜像和 hf-transfer 加速下载 Llama 3 模型
export HF_ENDPOINT=https://hf-mirror.com && export HF_HUB_ENABLE_HF_TRANSFER=1 && hf download meta-llama/Llama-3-8B --local-dir ./llama3 --resume-download
```

### 场景 2: 上传本地模型到 Hub

```bash
# 登录后上传模型
hf login
hf upload my-username/my-model ./local-model
```

### 场景 3: 批量下载数据集

```bash
# 使用镜像加速下载 GLUE 数据集
export HF_ENDPOINT=https://hf-mirror.com && hf download glue --local-dir ./glue-dataset --include "**/train.json"
```

## 高级配置

### 配置文件结构

`hf` 命令的配置文件位于 `~/.cache/huggingface/token`，您可以手动编辑它来设置更多选项：

```ini
[DEFAULT]
endpoint = https://hf-mirror.com
cache_dir = /path/to/cache
user_agent = hf-cli/0.1.0
```

### 环境变量优先级

配置的优先级从高到低为：
1. 命令行参数
2. 环境变量
3. 配置文件
4. 默认值

## 故障排除

### 常见问题及解决方案

| 问题 | 解决方案 |
| :--- | :--- |
| 下载速度慢 | 使用 hf-mirror 镜像或代理 |
| 下载中断 | 使用 `--resume-download` 参数 |
| 认证失败 | 重新运行 `hf login` 或检查令牌权限 |
| 上传失败 | 检查网络连接和存储空间 |

### 查看详细日志

使用 `--debug` 参数查看详细日志，帮助诊断问题：

```bash
hf download username/model-name --debug
```

## 总结

`hf` 命令是 Hugging Face 生态系统中不可或缺的工具，它简化了与 Hugging Face Hub 的交互过程。通过本文介绍的方法，您可以：

1. 熟练使用 `hf` 命令的各种功能
2. 通过 hf-mirror 镜像显著加速下载速度
3. 使用 hf-transfer 工具进一步提升下载性能
4. 应用其他优化措施最大化效率
5. 解决常见的使用问题

特别是结合使用 hf-mirror 镜像和 hf-transfer 工具，可以获得最佳的下载体验，即使在网络条件不佳的情况下也能高效地获取 Hugging Face Hub 上的资源。

无论您是在本地开发还是在服务器上部署模型，掌握这些技巧都能大大提高您的工作效率。