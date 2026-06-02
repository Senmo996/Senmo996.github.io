---
title: 'Linux 中软链接命令 ln -s 实用指南'
date: 2026-06-02
permalink: /posts/2026/06/linux-soft-link-ln/
tags:
  - linux-command
---

在 Linux 中，软链接也叫符号链接（Symbolic Link），可以理解为一个指向另一个文件或目录的快捷方式。它本身只是保存了目标路径，并不保存目标文件的真实内容。软链接常用于目录迁移、版本切换、共享配置文件、统一访问路径等场景，是日常开发和服务器运维中非常实用的命令。

创建软链接主要使用 `ln -s` 命令。`ln` 是 link 的缩写，默认创建硬链接，加上 `-s` 参数后才会创建软链接。

## 基本语法

```bash
ln -s 源文件或源目录 软链接名称
```

参数顺序非常重要：

- 第一个参数是已经存在的目标，也就是被指向的文件或目录。
- 第二个参数是要创建出来的软链接名称。

例如：

```bash
ln -s /opt/apps/myapp/current /usr/local/bin/myapp
```

这条命令会创建 `/usr/local/bin/myapp`，它指向 `/opt/apps/myapp/current`。

## 软链接和硬链接的区别

Linux 中有两种常见链接：软链接和硬链接。

| 类型 | 创建命令 | 是否可链接目录 | 是否可跨文件系统 | 目标删除后是否可用 |
| :--- | :--- | :--- | :--- | :--- |
| 软链接 | `ln -s source link` | 可以 | 可以 | 不可用，会变成失效链接 |
| 硬链接 | `ln source link` | 通常不可以 | 不可以 | 仍然可用 |

软链接更像快捷方式，保存的是路径；硬链接更像给同一个文件内容增加了另一个名字。日常使用中，如果你需要链接目录、跨磁盘链接文件、保留一个更易读的访问路径，通常选择软链接。

## 创建文件软链接

假设有一个配置文件：

```bash
/etc/nginx/sites-available/example.conf
```

想让 Nginx 在 `sites-enabled` 目录中启用它，可以创建软链接：

```bash
sudo ln -s /etc/nginx/sites-available/example.conf /etc/nginx/sites-enabled/example.conf
```

查看结果：

```bash
ls -l /etc/nginx/sites-enabled/example.conf
```

输出中如果出现类似下面的内容，就表示软链接创建成功：

```bash
example.conf -> /etc/nginx/sites-available/example.conf
```

箭头左边是软链接，右边是它指向的目标。

## 创建目录软链接

软链接也经常用于目录。例如，把一个较大的数据目录放在数据盘中，但在项目目录下保留一个固定入口：

```bash
ln -s /data/datasets ./datasets
```

之后访问 `./datasets`，就等同于访问 `/data/datasets`：

```bash
cd ./datasets
ls
```

这种方式常用于：

- 把大文件目录迁移到其他磁盘。
- 给复杂路径创建一个简短入口。
- 让多个项目共享同一个数据目录。
- 保持程序配置中的路径不变。

## 使用相对路径创建软链接

软链接的目标路径既可以是绝对路径，也可以是相对路径。

绝对路径示例：

```bash
ln -s /home/user/project/config.yaml config.yaml
```

相对路径示例：

```bash
ln -s ../shared/config.yaml config.yaml
```

需要注意的是，软链接中的相对路径是相对于软链接所在目录来解析的，而不是相对于你执行命令时所在的目录。为了减少路径错误，在不确定时可以优先使用绝对路径。

## 查看软链接指向

### 使用 `ls -l`

```bash
ls -l link_name
```

如果是软链接，会看到：

```bash
link_name -> /path/to/source
```

### 使用 `readlink`

```bash
readlink link_name
```

只输出软链接保存的目标路径。

如果想查看最终解析后的真实路径，可以使用：

```bash
readlink -f link_name
```

`readlink -f` 会继续追踪多层软链接，直到找到最终目标。

## 删除软链接

删除软链接可以使用 `rm` 或 `unlink`：

```bash
rm link_name
```

或者：

```bash
unlink link_name
```

删除软链接不会删除它指向的原始文件或目录。

如果软链接指向的是目录，删除时不要在链接名后面加 `/`：

```bash
rm datasets
```

不要写成：

```bash
rm -r datasets/
```

带上斜杠后，命令可能会进入目标目录处理内容，容易造成误删。

## 覆盖或更新软链接

如果软链接已经存在，再次创建同名软链接时通常会报错：

```bash
ln: failed to create symbolic link 'app': File exists
```

可以先删除旧链接，再创建新链接：

```bash
rm app
ln -s /opt/releases/v2 app
```

也可以使用 `-f` 参数强制覆盖：

```bash
ln -sf /opt/releases/v2 app
```

如果目标链接可能是目录软链接，建议加上 `-n`，避免命令跟随旧链接进入目录：

```bash
ln -sfn /opt/releases/v2 app
```

在发布系统中，还可以先创建一个临时链接，再原子替换：

```bash
ln -s /opt/releases/v2 app.new
mv -T app.new app
```

这样可以减少切换过程中的短暂不可用时间。

## 常用参数说明

| 参数 | 作用 |
| :--- | :--- |
| `-s` | 创建软链接 |
| `-f` | 如果目标链接已存在，先删除再创建 |
| `-n` | 如果目标是目录软链接，不跟随它 |
| `-v` | 显示创建过程 |
| `-T` | 将目标当作普通文件处理，常用于避免目录歧义 |

常见组合：

```bash
ln -s 源路径 链接名
ln -sf 源路径 链接名
ln -sfn 源路径 链接名
```

其中 `ln -sfn` 在更新目录软链接时最常用。

## 常见使用场景

### 1. 软件版本切换

服务器中经常把不同版本放在不同目录，然后用 `current` 指向当前版本：

```bash
/opt/myapp/releases/v1
/opt/myapp/releases/v2
/opt/myapp/current -> /opt/myapp/releases/v2
```

创建或更新：

```bash
ln -sfn /opt/myapp/releases/v2 /opt/myapp/current
```

程序始终访问 `/opt/myapp/current`，发布新版本时只需要切换软链接。

### 2. 命令入口

如果一个脚本路径较深，可以把它链接到系统命令目录：

```bash
sudo ln -s /opt/tools/deploy.sh /usr/local/bin/deploy
```

之后可以直接执行：

```bash
deploy
```

前提是脚本本身有执行权限：

```bash
chmod +x /opt/tools/deploy.sh
```

### 3. 共享配置文件

多个项目使用同一份配置时，可以通过软链接统一管理：

```bash
ln -s /home/user/shared/.env /home/user/project/.env
```

修改 `/home/user/shared/.env` 后，项目中的 `.env` 也会看到同样的内容。

### 4. 数据目录迁移

当项目目录所在磁盘空间不足时，可以把真实数据移动到大容量磁盘，再创建软链接：

```bash
mv ./data /mnt/big-disk/data
ln -s /mnt/big-disk/data ./data
```

对程序来说，访问路径仍然是 `./data`，但真实数据已经存放在 `/mnt/big-disk/data`。

## 失效软链接

如果软链接指向的目标被删除或移动，软链接本身仍然存在，但会变成失效链接，也叫 dangling symlink。

示例：

```bash
ln -s /tmp/not-exist-file demo-link
ls -l demo-link
```

此时 `demo-link` 指向的目标不存在，访问它会失败。

可以使用下面的命令查找当前目录下的失效软链接：

```bash
find . -xtype l
```

如果确认不再需要，可以删除：

```bash
find . -xtype l -delete
```

执行批量删除前，建议先只运行 `find . -xtype l` 查看结果，确认无误后再加 `-delete`。

## 权限注意事项

软链接本身通常显示为：

```bash
lrwxrwxrwx
```

这并不代表任何人都可以访问目标文件。真正生效的是目标文件或目标目录的权限。

例如：

```bash
ls -l link_name
ls -l /path/to/source
```

如果访问软链接失败，需要检查目标路径上的每一级目录权限，以及目标文件本身的读写执行权限。

## 常见问题

### 参数顺序写反

错误示例：

```bash
ln -s link_name /path/to/source
```

正确写法：

```bash
ln -s /path/to/source link_name
```

可以记住：先写真实目标，再写链接名字。

### 创建后提示目标不存在

软链接允许指向一个暂时不存在的路径。因此创建成功不代表目标一定存在。可以使用：

```bash
readlink -f link_name
```

如果没有输出，或者路径无法解析，说明目标路径可能有问题。

### 链接目录时覆盖失败

更新目录软链接时，优先使用：

```bash
ln -sfn /new/path link_name
```

其中 `-n` 可以避免命令跟随旧的目录软链接。

### 删除软链接会不会删除原文件

不会。只要删除的是软链接本身，原文件或原目录不会被删除。

```bash
rm link_name
```

但不要对目录软链接使用带斜杠的递归删除命令。

## 总结

`ln -s` 是 Linux 中创建软链接的核心命令，基本格式是：

```bash
ln -s 源路径 链接名
```

日常使用时重点记住几件事：

1. 软链接类似快捷方式，保存的是目标路径。
2. 创建命令的顺序是先写源路径，再写链接名。
3. 删除软链接不会删除原始文件或目录。
4. 更新目录软链接时推荐使用 `ln -sfn`。
5. 相对路径是相对于软链接所在目录解析的。

熟练掌握软链接后，可以更灵活地管理文件路径、配置文件、项目目录和软件版本，在开发和运维中都非常有用。
