---
title: Nacos（1-环境搭建）
series: SpringCloud
tags:
  - SpringCloud
categories: Java
cover: /img/index/nacos.png
top_img: /img/index/nacos.png
published: true
abbrlink: 50492
date: 2025-03-15 22:38:34
description: Nacos 是阿里巴巴开源的动态服务发现、配置管理与服务管理平台。环境配置包括 Nacos 的安装部署、数据库存储模式选择（嵌入式或 MySQL）、集群与多环境配置、权限控制及参数优化，确保服务高可用与配置中心高效稳定运行，适用于微服务架构。
---

## 环境配置

Nacos 有两种运行模式：standalone 和 cluster，启动前需要在配置文件上进行修改

1. standalone：单机模式
2. cluster：集群模式

![](Nacos（1-环境搭建）/1.png)

启动成功后，访问 localhost: 8848/nacos，用户名：nacos，密码：nacos

![](Nacos（1-环境搭建）/2.png)

## 搭建集群

Nacos 的集群需要 3 个或 3 个以上的节点，并且确保这三个节点之间是可以互相访问的

1. 搭建数据库，初始化数据库表结构

在 conf 目录下，提供了 nacos-mysql.sql 语句，进行数据库的初始化

创建 nacos_config 数据库，导入 sql 文件

![](Nacos（1-环境搭建）/3.png)

2. 修改 cluster.config 文件

修改 cluster.config.example 文件名为 cluster.config

![](Nacos（1-环境搭建）/4.png)

打开 cluster.config 文件，将三个 nacos 服务端地址都添加到里面

![](Nacos（1-环境搭建）/5.png)

3. 修改 application.properties 文件

![](Nacos（1-环境搭建）/6.png)

```properties
# 指定数据源为 MySQL
spring.datasource.platform=mysql

### Count of DB:
# 数据库实例数量
db.num=1

# 数据库连接信息，如果是 MySQL 8.0+ 版本需要添加 serverTimezone=Asia/Shanghai
### Connect URL of DB:
db.url.0=jdbc:mysql://127.0.0.1:3306/nacos_config?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&serverTimezone=Asia/Shanghai
db.user.0=root
db.password.0=1234
```

4. 复制 nacos 文件，修改其端口号

![](Nacos（1-环境搭建）/7.png)

修改 3 个文件夹的 application.properties 文件，server.port 为你设置集群的端口号

5. 修改 start.cmd 为 cluster 模式

![](Nacos（1-环境搭建）/8.png)

结果：启动 3 个 nacos 服务，成功后可以看到以下信息

![](Nacos（1-环境搭建）/9.png)

