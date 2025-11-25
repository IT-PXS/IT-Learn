---
title: MySQL（3-事务和日志）
tags: MySQL
categories: 数据库
cover: /img/index/mysql.png
top_img: /img/index/mysql.png
published: false
abbrlink: 63240
date: 2024-11-22 22:38:34
description:
---

目前可以发送网络请求的方式：

1. xhr（基于XMLHttpRequest） 存在的问题：配置调用混乱；编码方式复杂；实际开发中经常被JQuery-Ajax代替
2. JQuery-Ajax 存在的问题：Vue开发中不需要调用jQuery这个重量级框架（1w＋行）
3. vue-resource（vue1.x推出） vue2.0之后不在更新和维护，作者推荐了axios
4. fetch 基于promis 但兼容性差

## axios发送网络请求

```html
// 请求方法 1
axios ({
  url: 'http://127.0.0.1:3001/data',
  // params 可选 针对get请求的参数拼接 如：127.0.0.1:3000/data?type=pop
  params: {
    type: "pop",
    page: 1
  }
}).then(res => {
  console.log(res);
})

// 简化方法
axios.get('url').then(
  // 成功的回调
  response => {
    console.log(response.data);
  }
  // 失败的回调
  error => {
    console.log(error.message);
  }
)
```

