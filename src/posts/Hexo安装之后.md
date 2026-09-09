---
title: Hexo安装之后
date: 2026-08-13 18:22:40
updated: 2026-08-30 17:03:08
categories: [Hexo]
tags: [Hexo]
---

Welcome to [Hexo](https://hexo.io/)! This is your very first post. Check [documentation](https://hexo.io/docs/) for more info. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).

# 基本指令

## 创建新文章

```bash
$ hexo new "My New Post"
```

More info: [Writing](https://hexo.io/docs/writing.html)

## 本地运行

```bash
$ hexo server//可以缩写为hexo s
```

More info: [Server](https://hexo.io/docs/server.html)

## 生成静态文件

```bash
$ hexo generate//可以缩写为hexo g
```

More info: [Generating](https://hexo.io/docs/generating.html)

## 部署到远程站点

```bash
$ hexo deploy//可以缩写为hexo d
$ 可以合并快速运行 hexo g -d
```

More info: [Deployment](https://hexo.io/docs/one-command-deployment.html)

# ShokaX主题使用页面

[ShokaX示例页面](https://docs.shokax.kaitaku.xyz/features/contenttags/)
[ShokaX Astro Blog Theme指南](https://docs.astro.kaitaku.xyz/guides/)

# 管理与设置（基于shokax主题）

[参考文献](https://preview.astro.kaitaku.xyz/)

<!--astro下的shokax，计划升级https://docs.astro.kaitaku.xyz/start/guides/-->
<!--https://github.com/theme-shoka-x/astro-blog-shokax-->

## 文章置顶

在文章的 frontmatter 中添加 sticky: true 即可将文章设置为置顶。

## 文章分类功能

在文章的 frontmatter 中添加 categories: 类名 即可设置文章分类。

## 统计字数与阅读次数

# 写作方式

通过hexo n "文章标题"创建新文章文件

## 文章Front-Matter

title: 文章标题
date: 2026-08-27 17:08:13
castegories:

- 分类1
- 分类2
  tags:
- 标签1
- 标签2

## 图片管理与插入

在根目录的\_config.yml文件中，找到 post_asset_folder 这个配置项，将其值设置为 true。配置后，每次使用 hexo new "文章标题" 命令创建新文章时，Hexo 就会在 source/\_posts 目录下，自动创建一个与文章同名的文件夹，可以用于存放属于该文章的图片，以方便进行管理

### 插入图片

Markdown 支持插入本地图片、网络图片或 Base64 编码图片。

案例

```markdown
![本地图片](../assets/images/Hexo安装之后/ExampleImage.png "本地图片示例")
![网络图片](https://example.com/image.png "网络图片示例")
```

![这里是图片描述](../assets/images/Hexo安装之后/ExampleImage.png)

## 代码块

通过

````cpp
    可以通过使用
    ```语言名称
      代码内容
    ```
    这样的方式插入代码块。   注c++类型应该写为cpp。
````

```python
def greet(name):
return f"Hello, {name}!"
print(greet("World"))
```

## 插入链接

使用 [文本](链接) 格式插入超链接。

[访问Google](https://www.google.com)
复制

## 行内代码

用反引号（`）包裹代码片段。

这是一个 `console.log("Hello World")` 示例。

## 文字特效

++下划线++
++波浪线++{.wavy}
++着重点++{.dot}
++紫色下划线++{.primary}
++绿色波浪线++{.wavy .success}
++黄色着重点++{.dot .warning}
~~删除线~~
~~红色删除线~~{.danger}
==荧光高亮==
[赤橙黄绿青蓝紫]{.rainbow}
[红色]{.red}
[粉色]{.pink}
[橙色]{.orange}
[黄色]{.yellow}
[绿色]{.green}
[靛青]{.aqua}
[蓝色]{.blue}
[紫色]{.purple}
[灰色]{.grey}
快捷键 [Ctrl]{.kbd} + [C]{.kbd .red}
H~2~0
29^th^

## spoiler 隐藏文字

!!黑幕黑幕黑幕黑幕黑幕黑幕!! ： 鼠标滑过显示内容
!!模糊模糊模糊模糊模糊模糊!!{.bulr} ： 选中文字显示内容

## label 标签块

[default]{.label}
[primary]{.label .primary}
[info]{.label .info}
[:heavy_check_mark:success]{.label .success}
[warning]{.label .warning}
[:broken_heart:danger]{.label .danger}
