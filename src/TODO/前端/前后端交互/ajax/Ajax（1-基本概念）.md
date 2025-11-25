---
title: 
series: 
tags:
 
categories: 
cover: /img/index/
top_img: /img/index/
description: 
abbrlink: 7790
date: 2024-10-26 12:42:19
published: false
---

## AJAX 简介

`AJAX` 全称为 `Asynchronous JavaScript And XML`，就是异步的 JS 和 XML

通过 `AJAX` 可以在浏览器中向服务器发送异步请求，最大的优势：无刷新获取数据

### 出现背景

传统网站中存在的问题：

1. 网速慢的情况下，页面加载时间长，用户只能等待
2. 表单提交后，如果一项内容不合格，需要重新填写所有表单内容
3. 页面跳转，重新加载页面，造成资源浪费，增加用户等待时间

### 应用场景

1. 页面上拉加载更多数据
2. 列表数据无刷新分页
3. 表单项离开焦点数据验证
4. 搜索框提示文字下拉列表

### 特点

1. 优点

+ 可以无需刷新页面而与服务器端进行通信
+ 允许你根据用户事件来更新部分页面内容

2. 缺点

+ 没有浏览历史，不能回退
+ 存在跨域问题（同源）
+ SEO（Search Engine Optimization，搜索引擎优化）不友好，爬虫无法爬取

### 运行环境
Ajax 技术需要运行在网站服务器环境中才能生效，我们学习 Ajax 可以使用 Node 创建的服务器作为网站服务器。

## XML 简介

XML 可扩展标记语言，被设计用来传输和存储数据

XML 和 HTML 类似，不同的是 HTML 中都是预定义标签，而 XML 中没有预定义标签，全都是自定义标签，用来表示一些数据

比如说我有一个学生数据：`name="孙悟空";age=18;gender="男";`，用 XML 表示：

```xml
<student>
    <name>孙悟空</name>
    <age>18</age>
    <gender>男</gender>
</student>
```

现在已经被 JSON 取代了。用 JSON 表示：

```json
{"name":"孙悟空","age":18,"gender":"男"}
```

