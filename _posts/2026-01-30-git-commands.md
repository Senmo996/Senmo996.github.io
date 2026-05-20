---
title: 'Git常用命令实用指南'
date: 2026-01-30
permalink: /posts/2026/01/git-commands/
tags:
  - linux-command
---

`Git` 是目前世界上最流行的分布式版本控制系统。它不仅能够高效地处理从小型到大型项目的各种版本管理需求，还提供了强大的分支管理、协作开发和历史追溯功能。本文将重点介绍 Git 的常用命令和实用技巧，帮助您在日常开发中更高效地使用 Git。

## 核心概念

在使用 Git 之前，理解以下核心概念至关重要：

1.  **工作区 (Working Directory)**:
    *   您当前正在编辑的文件所在目录。
    *   这里的文件是可见的，但尚未被 Git 跟踪或暂存。
2.  **暂存区 (Staging Area/Index)**:
    *   也称为索引区，是 Git 的一个中间区域。
    *   通过 `git add` 命令将文件从工作区添加到暂存区。
    *   暂存区的文件将被包含在下一次提交中。
3.  **本地仓库 (Local Repository)**:
    *   通过 `git commit` 命令将暂存区的内容提交到本地仓库。
    *   包含项目的完整历史记录和版本信息。
4.  **远程仓库 (Remote Repository)**:
    *   托管在远程服务器（如 GitHub、GitLab）上的仓库。
    *   通过 `git push` 和 `git pull` 命令与本地仓库同步。

## Git 基本指令

### 一、初始化与配置

| 指令                      | 作用                                                              | 备注                                                                         |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `git init`                | 在当前目录初始化一个新的 Git 仓库。                                | 创建一个 `.git` 隐藏目录，用于存储 Git 数据。                                |
| `git clone [仓库地址]`    | 克隆远程仓库到本地。                                              | 例如：`git clone https://github.com/user/repo.git`。                        |
| `git config --global user.name "姓名"` | 设置全局用户名。                                                  | 用于标识提交者。                                                            |
| `git config --global user.email "邮箱"` | 设置全局邮箱。                                                    | 用于标识提交者。                                                            |
| `git config --list`       | 查看当前 Git 配置。                                               |                                                                              |

### 二、基本操作

| 指令                      | 作用                                                              | 备注                                                                         |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `git status`              | 查看工作区和暂存区的状态。                                        | 显示哪些文件被修改、哪些文件被暂存、哪些文件未被跟踪。                       |
| `git add [文件名]`        | 将文件添加到暂存区。                                              | 例如：`git add file.txt` 或 `git add .`（添加所有文件）。                    |
| `git commit -m "提交信息"` | 将暂存区的内容提交到本地仓库。                                    | 提交信息应简洁明了，描述本次提交的内容。                                     |
| `git commit -am "提交信息"` | 跳过暂存区，直接提交所有已跟踪文件的修改。                        | 只适用于已跟踪的文件，新文件仍需先 `git add`。                               |
| `git log`                 | 查看提交历史。                                                    | 显示提交的哈希、作者、日期和提交信息。                                       |
| `git log --oneline`       | 以简洁的一行格式查看提交历史。                                    | 只显示提交哈希的前几位和提交信息。                                           |

### 三、分支管理

| 指令                      | 作用                                                              | 备注                                                                         |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `git branch`              | 查看本地分支列表。                                                | 当前分支前会有 `*` 标记。                                                    |
| `git branch [分支名]`     | 创建新分支。                                                      | 例如：`git branch feature-login`。                                           |
| `git checkout [分支名]`   | 切换到指定分支。                                                  | 例如：`git checkout feature-login`。                                         |
| `git checkout -b [分支名]` | 创建并切换到新分支。                                              | 例如：`git checkout -b feature-login`。                                     |
| `git branch -d [分支名]`  | 删除已合并的分支。                                                | 例如：`git branch -d feature-login`。                                        |
| `git branch -D [分支名]`  | 强制删除分支（即使未合并）。                                      | 请谨慎使用。                                                                |
| `git merge [分支名]`      | 将指定分支合并到当前分支。                                        | 例如：`git merge feature-login`。                                            |
| `git merge --no-ff [分支名]` | 以非快进方式合并分支，保留分支历史。                              | 适用于需要保留分支结构的场景。                                               |

### 四、远程操作

| 指令                      | 作用                                                              | 备注                                                                         |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `git remote -v`           | 查看远程仓库信息。                                                | 显示远程仓库的名称和 URL。                                                   |
| `git remote add [名称] [URL]` | 添加远程仓库。                                                    | 例如：`git remote add origin https://github.com/user/repo.git`。            |
| `git push [远程名] [分支名]` | 将本地分支推送到远程仓库。                                        | 例如：`git push origin main`。                                               |
| `git push -u [远程名] [分支名]` | 推送并设置上游分支。                                            | 下次推送时只需 `git push`。                                                  |
| `git pull [远程名] [分支名]` | 从远程仓库拉取并合并到本地分支。                                  | 相当于 `git fetch` + `git merge`。                                           |
| `git fetch [远程名]`      | 从远程仓库获取最新数据，但不合并。                                | 可以先查看远程更新，再决定是否合并。                                         |

### 五、撤销与恢复

| 指令                      | 作用                                                              | 备注                                                                         |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `git checkout -- [文件名]` | 撤销工作区中文件的修改（恢复到暂存区或上一次提交的状态）。          | 例如：`git checkout -- file.txt`。                                           |
| `git reset HEAD [文件名]`  | 将文件从暂存区移除，但保留工作区的修改。                          | 例如：`git reset HEAD file.txt`。                                            |
| `git reset --soft HEAD~1`  | 撤销上一次提交，但保留修改在暂存区。                              | 适用于重新提交。                                                             |
| `git reset --mixed HEAD~1` | 撤销上一次提交，将修改保留在工作区（默认）。                      |                                                                              |
| `git reset --hard HEAD~1`  | 撤销上一次提交，并丢弃所有修改。                                  | 请谨慎使用，修改将无法恢复。                                                 |
| `git revert [提交哈希]`    | 创建一个新的提交，撤销指定提交的修改。                            | 保留完整历史，推荐用于公共分支。                                             |

### 六、查看与比较

| 指令                      | 作用                                                              | 备注                                                                         |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `git diff`                | 查看工作区与暂存区的差异。                                        |                                                                              |
| `git diff --cached`       | 查看暂存区与本地仓库的差异。                                      |                                                                              |
| `git diff [分支A] [分支B]` | 查看两个分支之间的差异。                                          | 例如：`git diff main feature-login`。                                        |
| `git show [提交哈希]`     | 查看指定提交的详细信息。                                          | 显示提交的修改内容、作者、日期等。                                           |
| `git blame [文件名]`      | 查看文件每一行的修改历史。                                        | 显示每一行是由谁、在哪个提交中修改的。                                       |

## 常用场景示例

### 场景 1: 开始新项目

```bash
# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/user/repo.git

# 推送到远程
git push -u origin main
```

### 场景 2: 开发新功能

```bash
# 创建并切换到新分支
git checkout -b feature-login

# 进行开发，修改文件

# 查看状态
git status

# 添加修改的文件
git add .

# 提交
git commit -m "Add login feature"

# 切换回主分支
git checkout main

# 合并功能分支
git merge feature-login

# 推送到远程
git push origin main

# 删除功能分支
git branch -d feature-login
```

### 场景 3: 修复错误

```bash
# 发现错误，查看修改
git diff

# 撤销某个文件的修改
git checkout -- file.txt

# 如果已经提交，可以使用 revert
git revert HEAD

# 或者使用 reset（谨慎使用）
git reset --hard HEAD~1
```

### 场景 4: 协作开发

```bash
# 拉取最新代码
git pull origin main

# 创建分支进行开发
git checkout -b feature-new

# 开发并提交
git add .
git commit -m "Add new feature"

# 推送分支到远程
git push -u origin feature-new

# 在 GitHub 上创建 Pull Request
# 等待代码审查和合并
```

## Git 配置优化

### 1. 设置别名

为常用命令设置别名，提高效率：

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

使用示例：

```bash
git st          # 等同于 git status
git co main     # 等同于 git checkout main
git ci -m "msg" # 等同于 git commit -m "msg"
```

### 2. 设置默认分支名

将默认分支名从 `master` 改为 `main`：

```bash
git config --global init.defaultBranch main
```

### 3. 配置编辑器

设置 Git 使用的默认编辑器：

```bash
# 使用 VS Code
git config --global core.editor "code --wait"

# 使用 Vim
git config --global core.editor "vim"

# 使用 Notepad++ (Windows)
git config --global core.editor "'C:/Program Files/Notepad++/notepad++.exe' -multiInst -notabbar -nosession -noPlugin"
```

### 4. 配置差异工具

设置图形化的差异比较工具：

```bash
# 使用 VS Code
git config --global diff.tool vscode
git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'

# 使用 Beyond Compare (Windows)
git config --global diff.tool bc3
git config --global difftool.bc3.cmd '"C:/Program Files/Beyond Compare 3/BCompare.exe" "$LOCAL" "$REMOTE"'
```

## 高级技巧

### 1. 交互式暂存

使用 `git add -i` 进入交互式暂存模式，可以选择性地暂存文件的某些部分：

```bash
git add -i
```

或者使用 `git add -p` 逐块查看和暂存修改：

```bash
git add -p
```

### 2. 储藏 (Stash)

临时保存工作区的修改，以便切换分支或处理其他任务：

```bash
# 保存当前修改
git stash

# 查看储藏列表
git stash list

# 应用最近的储藏
git stash pop

# 应用指定的储藏
git stash apply stash@{0}

# 删除储藏
git stash drop stash@{0}

# 清除所有储藏
git stash clear
```

### 3. 变基 (Rebase)

使用变基来整理提交历史：

```bash
# 将当前分支变基到 main 分支
git rebase main

# 交互式变基，可以修改提交历史
git rebase -i HEAD~3
```

### 4. 挑选 (Cherry-pick)

将某个提交应用到当前分支：

```bash
git cherry-pick [提交哈希]
```

### 5. 标签 (Tag)

为重要的版本打标签：

```bash
# 创建轻量标签
git tag v1.0.0

# 创建带注释的标签
git tag -a v1.0.0 -m "Version 1.0.0 release"

# 查看标签
git tag

# 推送标签到远程
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

## 常见问题解决

### 1. 合并冲突

当合并分支时出现冲突，Git 会标记冲突的文件：

```bash
# 查看冲突文件
git status

# 手动编辑文件，解决冲突
# 保留需要的代码，删除冲突标记

# 添加解决后的文件
git add [冲突文件]

# 完成合并
git commit
```

### 2. 撤销已推送的提交

如果已经推送到远程，需要谨慎处理：

```bash
# 方法 1: 使用 revert（推荐）
git revert HEAD
git push origin main

# 方法 2: 使用 reset（需要强制推送，谨慎使用）
git reset --hard HEAD~1
git push -f origin main
```

### 3. 忘记添加文件到提交

如果提交后发现忘记添加某个文件：

```bash
# 添加忘记的文件
git add forgotten-file.txt

# 修改上一次提交
git commit --amend --no-edit
```

### 4. 查看文件历史

查看某个文件的修改历史：

```bash
# 查看文件的提交历史
git log --follow [文件名]

# 查看文件每次提交的差异
git log -p [文件名]
```

## 总结

Git 是现代软件开发中不可或缺的工具。通过本文介绍的常用命令和技巧，您可以：

1.  熟练使用 Git 的基本操作（初始化、提交、分支、合并等）
2.  高效地进行团队协作开发
3.  灵活地处理各种版本控制场景
4.  配置和优化 Git 以适应个人工作习惯
5.  解决常见的 Git 使用问题

掌握 Git 不仅能够提高开发效率，还能帮助您更好地管理项目历史和协作流程。建议在实际项目中多加练习，逐步深入理解 Git 的工作原理和高级功能。

无论您是个人开发者还是团队成员，熟练使用 Git 都将为您的开发工作带来巨大的便利。
