---
title: MySQL（基础知识）
tag: MySQL
category: 数据库
description: MySQL是一个广泛使用的开源关系型数据库管理系统，适用于多种应用场景。MySQL基础知识涵盖数据库和表的创建与管理、数据类型、常用SQL语句（如SELECT、INSERT、UPDATE、DELETE等）及其使用方法。
published: false
abbrlink: 40028
date: 2024-11-09 22:38:34
---

## 环境配置

### 服务启动

1. 打开运行窗口，输入services.msc，打开服务窗口，查看是否下载了MySQL

![](D:\blog\hexo\source\_posts\数据库\mysql\MySQL（环境配置）\1.png)

2. 使用管理员权限打开运行窗口，输入cmd，使用以下命令打开/关闭服务

+ net start mysql：打开MySQL服务
+ net stop mysql：关闭MySQL服务

### 登录退出

**登录**

1. mysql  -u用户名  -p密码

2. mysql  -u用户名  -p

3. mysql  -hIP地址  -u用户名  -p密码

4. mysql  --host=IP地址  --user=用户名  --password=密码

+ u后面写的是用户名
+ p后面写的是密码

**退出**

1. quit
1. exit

### 备份数据

mysqldump  -u用户名  -p密码  数据库名称>保存路径;

### 还原数据

1. 登录数据库
2. 创建数据库
3. 使用数据库
4. 执行文件：source  文件路径;