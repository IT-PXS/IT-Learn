---
title: Nginx（4-负载均衡）
tags:
  - Nginx
categories: 运维
cover: /img/index/nginx3.png
top_img: /img/index/nginx3.png
published: false
abbrlink: 43142
date: 2024-11-28 23:11:11
description:
---

## 负载均衡方式

### 用户手动选择

这种方式比较原始，只要实现的方式就是在网站主页上面提供不同线路、不同服务器链接方式，让用户来选择自己访问的具体服务器，来实现负载均衡

![](Nginx（4-负载均衡）/1.png)

### DNS 轮询

域名系统（服务）协议（DNS）是一种分布式网络目录服务，主要用于域名与 IP 地址的相互转换。

大多域名注册商都支持对同一个主机名添加多条 A 记录，这就是 DNS 轮询，DNS 服务器将解析请求按照 A 记录的顺序，随机分配到不同的 IP 上，这样就能完成简单的负载均衡。DNS 轮询的成本非常低，在一些不重要的服务器，被经常使用

![](Nginx（4-负载均衡）/2.png)

虽然 DNS 轮询成本低廉，但是 DNS 负载均衡存在明显的缺点

1. 可靠性低

假设一个域名 DNS 轮询多台服务器，如果其中的一台服务器发生故障，那么所有的访问该服务器的请求将不会有所回应，即使你将该服务器的 IP 从 DNS 中去掉，但是由于各大宽带接入商将众多的 DNS 存放在缓存中，以节省访问时间，导致 DNS 不会实时更新。所以 DNS 轮流上一定程度上解决了负载均衡问题，但是却存在可靠性不高的缺点。

2. 负载均衡不均衡

DNS 负载均衡采用的是简单的轮询负载算法，不能区分服务器的差异，不能反映服务器的当前运行状态，不能做到为性能好的服务器多分配请求，另外本地计算机也会缓存已经解析的域名到 IP 地址的映射，这也会导致使用该 DNS 服务器的用户在一定时间内访问的是同一台 Web 服务器，从而引发 Web 服务器减的负载不均衡。

负载不均衡则会导致某几台服务器负荷很低，而另外几台服务器负荷确很高，处理请求的速度慢，配置高的服务器分配到的请求少，而配置低的服务器分配到的请求多。

### 四/七层负载均衡

![](Nginx（4-负载均衡）/3.png)

1. 四层负载均衡指的是 OSI 七层模型中的传输层，主要是基于 IP+PORT 的负载均衡
2. 七层负载均衡指的是在应用层，主要是基于虚拟的 URL 或主机 IP 的负载均衡

区别：

1. 四层负载均衡数据包是在底层就进行了分发，而七层负载均衡数据包则在最顶端进行分发，所以四层负载均衡的效率比七层负载均衡的要高。
2. 四层负载均衡不识别域名，而七层负载均衡识别域名。

#### 七层负载均衡

Nginx 要实现七层负载均衡需要用到 proxy_pass 代理模块配置。Nginx 默认安装支持这个模块，我们不需要再做任何处理。Nginx 的负载均衡是在 Nginx 的反向代理基础上把用户的请求根据指定的算法分发到一组

![](Nginx（4-负载均衡）/7.png)

```plain
server	{
    listen 9001;
    default_type text/html;
    location /	{
        return 200 '<h1>192.168.44.112:9001</h1>';
    }
}
server	{
    listen 9002;
    default_type text/html;
    location /	{
        return 200 '<h1>192.168.44.112:9002</h1>';
    }
}
server	{
    listen 9003;
    default_type text/html;
    location /	{
        return 200 '<h1>192.168.44.112:9003</h1>';
    }
}
```

```plain
upstream backend {
    server 192.168.44.112:9001;
    server 192.168.44.112:9002;
    server 192.168.44.112:9003;
}
  
server	{
    listen 8083;
    server_name localhost;
    location /	{
       proxy_pass http://backend;
    }
}
```

#### 四层负载均衡

Nginx 在 1.9 之后，增加了一个 stream 模块，用来实现四层协议的转发、代理、负载均衡等。stream 模块的用法跟 http 的用法类似，允许我们配置一组 TCP 或者 UDP 等协议的监听，然后通过 proxy_pass 来转发我们的请求，通过 upstream 添加多个后端服务，实现负载均衡。

四层协议负载均衡的实现，一般都会用到 LVS、HAProxy、F5 等，要么很贵要么配置很麻烦，而 Nginx 的配置相对来说更简单，更能快速完成工作

注意：需要添加 stream 模块的支持

```plain
stream {
    upstream redisbackend {
        server 192.168.200.146:6379;
        server 192.168.200.146:6378;
    }
    
    upstream tomcatbackend {
        server 192.168.200.146:8080;
    }
    
    server {
        listen  81;
        proxy_pass redisbackend;
    }
    
    server {
        listen	82;
        proxy_pass tomcatbackend;
    }
}
```

## 负载均衡指令

1. upstream：用来定义一组服务器，可以是监听不同端口的服务器，并且可以是同时监听 TCP 和 Unix Socket 的服务器，服务器可以指定不同的权重，默认为 1

| 语法   | upstream name {...} |
| ------ | ------------------- |
| 默认值 |                     |
| 位置   | http                |

2. server：用来指定后端服务器的名称和一些参数，可以使用域名、IP、端口

| 语法   | server name [param] |
| ------ | ------------------- |
| 默认值 |                     |
| 位置   | upstream            |

## 负载均衡状态

| 状态         | 概述                              |
| ------------ | --------------------------------- |
| down         | 当前的 server 暂时不参与负载均衡    |
| backup       | 预留的备份服务器                  |
| max_fails    | 允许请求失败的次数                |
| fail_timeout | 经过 max_fails 失败后，服务暂停时间 |
| max_conns    | 限制最大的接收连接数              |

1. down：将该服务器标记为永久不可用，那么该代理服务器将不参与负载均衡
2. backup：将该服务器标记为备份服务器，当主服务器不可用时，将用来传递请求
3. max_conns：用来设置代理服务器同时活动链接的最大数量，默认为 0，表示不限制，使用该配置可以根据后端服务器处理请求的并发量来进行设置，防止后端服务器被压垮
4. max_fails：设置允许请求代理服务器失败的次数，默认为 1
5. fail_timeout：设置经过 max_fails 失败后，服务暂停的时间，默认是 10 秒

```plain
upstream backend {
  	server 192.168.44.112:9001 down;
  	server 192.168.44.112:9002 backup;
  	server 192.168.44.112:9003 max_fails=3 fail_timeout=15;
}

server {
  	listen 8083;
  	server_name localhost;
  	location /	{
		proxy_pass http://backend;
  	}
}
```

## 负载均衡策略

| 算法名称   | 说明             |
| ---------- | ---------------- |
| 轮询       | 默认方式         |
| weight     | 权重方式         |
| ip_hash    | 依据 IP 分配方式   |
| least_conn | 依据最少连接方式 |
| url_hash   | 依据 URL 分配方式  |
| fair       | 依据响应时间方式 |

### 轮询

将请求按顺序轮流地分配到后端服务器上，它均衡地对待后端的每一台服务器，而不关心服务器实际的连接数和当前的系统负载

```plain
upstream app {
    server 127.0.0.1:57800;
    server 127.0.0.1:57700;
}
```

![](Nginx（4-负载均衡）/4.png)

### 加权轮询

不同的后端服务器可能机器的配置和当前系统的负载并不相同，因此它们的抗压能力也不相同，给不同的机器分配不同的权重，并将请求顺序按照权重分配到后端

```plain
upstream app {
    # 负载均衡应用服务器A: 权重为10,10s内连接请求失败2次,
    # nginx在10s内认为server是不可用的，将不在发送请求给这台服务器
    server 127.0.0.1:57800 weight=2 max_fails=2 fail_timeout=10s;
    server 127.0.0.1:57700 weight=5 max_fails=2 fail_timeout=10s;
}
```

![](Nginx（4-负载均衡）/5.png)

### ip_hash

<font style="color:rgb(51, 51, 51);"> 根据获取客户端的 IP 地址，通过哈希函数计算得到一个数值，用该数值对服务器列表的大小进行取模运算，得到的结果便是客户端要访问服务器的序号 </font>

```plain
upstream app {
    ip_hash; 
    server 127.0.0.1:57800;
    server 127.0.0.1:57700;
}
```

![](Nginx（4-负载均衡）/6.png)

### least_conn

最少连接，把请求转发给连接数较少的后端服务器。轮询算法是把请求平均的转发给各个后端，使它们的负载大致相同；但是，有些请求占用的时间很长，会导致其所在的后端负载较高。这种情况下，least_conn 这种方式就可以达到更好的负载均衡效果。

```plain
upstream backend	{
  	least_conn;
  	server 192.168.44.112:9001;
  	server 192.168.44.112:9002;
  	server 192.168.44.112:9003;
}

server {
  	listen 8083;
  	server_name localhost;
  	location /	{
		proxy_pass http://backend;
  	}
}
```

### url_hash

按访问 url 的 hash 结果来分配请求，使每个 url 定向到同一个后端服务器，要配合缓存命中来使用。同一个资源多次请求，可能会到达不同的服务器上，导致不必要的多次下载，缓存命中率不高，以及一些资源时间的浪费。而使用 url_hash，可以使得同一个 url（也就是同一个资源请求）会到达同一台服务器，一旦缓存住了资源，再此收到请求，就可以从缓存中读取。

```plain
upstream backend	{
  	hash &request_uri;
  	server 192.168.44.112:9001;
  	server 192.168.44.112:9002;
  	server 192.168.44.112:9003;
}

server {
  	listen 8083;
  	server_name localhost;
  	location /	{
		proxy_pass http://backend;
  	}
}
```

```html
http://192.168.44.111:8083/a
http://192.168.44.111:8083/b
http://192.168.44.111:8083/c
```

### fair

fair 采用的不是内建负载均衡使用的轮换的均衡算法，而是可以根据页面大小、加载时间长短智能的进行负载均衡

```plain
upstream backend{
  	fair;
  	server 192.168.44.112:9001;
  	server 192.168.44.112:9002;
  	server 192.168.44.112:9003;
}

server {
  	listen 8083;
  	server_name localhost;
  	location /	{
		proxy_pass http://backend;
  	}
}
```
