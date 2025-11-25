---
title: Nginx（1-环境配置和指令）
tags:
  - Nginx
categories: 运维
cover: /img/index/
top_img: /img/index/
published: false
abbrlink: 63883
date: 2024-11-26 23:11:11
description:
---

## 环境配置

### Windows

#### 启动

1. 直接双击nginx.exe，双击后一个黑色的弹窗一闪而过
2. 打开cmd命令窗口，切换到nginx解压目录下，输入命令nginx.exe，回车即可

直接在浏览器地址栏输入网址http://localhost:80回车，出现以下页面说明启动成功！

![](Nginx（1-环境配置和指令）/1.png)

#### 配置文件
nginx的配置文件是conf目录下的nginx.conf，默认配置的监听端口为80，如果80端口被占用可以修改为未被占用的端口即可。

当我们修改了nginx的配置文件nginx.conf 时，不需要关闭nginx后重新启动nginx，只需要执行命令：nginx -s reload即可让改动生效

#### 关闭
如果使用cmd命令窗口启动nginx， 关闭cmd窗口是不能结束nginx进程的，可使用两种方法关闭nginx

1. 输入nginx命令：
+ nginx -s stop（快速停止nginx） 
+ nginx -s quit（完整有序的停止nginx）
2. 使用taskkill命令：taskkill /f /t /im nginx.exe（taskkill是用来终止进程的）
+ /f：强制终止
+ /t：终止指定的进程和任何由此启动的子进程。
+ /im：指定的进程名称 

### Linux

## 常用命令

1. nginx -?,-h：打开帮助信息
2. nginx -s reopen：重启nginx
3. nginx -s reload：重新加载nginx配置文件，然后优雅地重启nginx
4. nginx -s stop：强制停止nginx服务
5. nginx -s quit：优雅地停止nginx服务（即处理完所有请求后再停止服务）
6. nginx -t：检测配置文件是否有语法错误，然后退出
7. nginx -T：检测配置文件是否有语法错误，转储并退出
8. nginx -q：在检测配置文件期键屏蔽非错误信息
9. nginx -v：显示版本信息并退出
10. nginx -V：显示版本和配置选项信息，然后退出
11. nginx -p prefix：设置前缀路径（默认是/usr/share/nginx）
12. nginx -c filename：设置配置文件（默认是/etc/nginx/nginx.conf）
13. nginx -g directives：设置配置文件外的全局指令
14. killall nginx：杀死所有nginx进程

