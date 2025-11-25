---
title: Nginx（6-缓存）
tags:
  - Nginx
categories: 运维
cover: /img/index/nginx3.png
top_img: /img/index/nginx3.png
published: false
abbrlink: 50810
date: 2024-11-28 23:11:11
description:
---

## 缓存概念

缓存就是数据交换的缓冲区（Cache），当用户要获取数据的时候，会先从缓存中去查询获取数据，如果缓存中有就会直接返回给用户，如果缓存中没有，则会发请求从服务器重新查询数据，将数据返回给用户的同时将数据放入缓存，下次用户就会直接从缓存中获取数据

![](Nginx（6-缓存）/1.png)

| 场景             | 作用                       |
| ---------------- | -------------------------- |
| 操作系统磁盘缓存 | 减少磁盘机械操作           |
| 数据库缓存       | 减少文件系统的 IO 操作       |
| 应用程序缓存     | 减少对数据库的查询         |
| Web 服务器缓存    | 减少对应用服务器的请求次数 |
| 浏览器缓存       | 减少与后台的交互次数       |

### Nginx 的 web 缓存服务

Nginx 是从 0.7.48 版开始提供缓存功能。Nginx 是基于 Proxy Store 来实现的，其原理是把 URL 及相关组合当做 Key, 在使用 MD5 算法对 Key 进行哈希，得到硬盘上对应的哈希目录路径，从而将缓存内容保存在该目录中。它可以支持任意 URL 连接，同时也支持 404/301/302 这样的非 200 状态码。Nginx 即可以支持对指定 URL 或者状态码设置过期时间，也可以使用 purge 命令来手动清除指定 URL 的缓存

![](Nginx（6-缓存）/2.png)

## 指令
### proxy_cache_path
指定用于设置缓存文件的存放路径

| 语法   | proxy_cache_path path [levels = num]<br />keys_zone = zone_name: zone_size [inactive = time]\[max_size = size]; |
| ------ | ------------------------------------------------------------ |
| 默认值 |                                                              |
| 位置   | http                                                         |

1. path：缓存路径地址
2. levels: 指定该缓存空间对应的目录，最多可以设置 3 层，每层取值为 1|2

```plain
levels=1:2   	# 缓存空间有两层目录，第一次是1个字母，第二次是2个字母
举例说明: itheima[key]通过MD5加密以后的值为 43c8233266edce38c2c9af0694e2107d
levels=1:2   	# 最终的存储路径为/usr/local/proxy_cache/d/07
levels=2:1:2 	# 最终的存储路径为/usr/local/proxy_cache/7d/0/21
levels=2:2:2 	# 最终的存储路径为/usr/local/proxy_cache/7d/10/e2
```

3. keys_zone：用来为这个缓存区设置名称和指定大小

```plain
keys_zone=itcast:200m  # 缓存区的名称是itcast,大小为200M,1M大概能存储8000个keys
```

4. inactive：指定缓存的数据多次时间未被访问就将被删除

```plain
inactive=1d   # 缓存数据在1天内没有被访问就会被删除
```

5. max_size：设置最大缓存空间，如果缓存空间存满，默认会覆盖缓存时间最长的资源

```plain
max_size=20g
```

**使用案例**

```tex
http {
  	proxy_cache_path /usr/local/proxy_cache keys_zone=itcast:200m levels=1:2:1 inactive=1d max_size=20g;
}
```

### proxy_cache

该指令用来开启或关闭代理缓存，如果是开启则自定义使用哪个缓存区来进行缓存

| 语法   | proxy_cache zone_name\|off; |
| ------ | --------------------------- |
| 默认值 | proxy_cache off;            |
| 位置   | http、server、location      |

zone_name：指定使用缓存区的名称

### proxy_cache_key
该指令用来设置 web 缓存的 key 值，Nginx 会根据 key 值 MD5 哈希存缓存

| 语法   | proxy_cache_key key;                            |
| ------ | ----------------------------------------------- |
| 默认值 | proxy_cache_key $scheme$ proxy_host$request_uri; |
| 位置   | http、server、location                          |

### proxy_cache_valid
该指令用来对不同返回状态码的 URL 设置不同的缓存时间，如果设置多个，会从上往下找，以第一个为准

| 语法   | proxy_cache_valid [code...] time; |
| ------ | --------------------------------- |
| 默认值 |                                   |
| 位置   | http、server、location            |

```plain
proxy_cache_valid 200 302 10m; 	# 为200和302的响应URL设置10分钟缓存，
proxy_cache_valid 404 1m;		# 为404的响应URL设置1分钟缓存
proxy_cache_valid any 1m;		# 对所有响应状态码的URL都设置1分钟缓存
```

### proxy_cache_min_uses
该指令用来设置资源被访问多少次后被缓存

| 语法   | proxy_cache_min_uses num; |
| ------ | ------------------------- |
| 默认值 | proxy_cache_min_uses 1;   |
| 位置   | http、server、location    |

### proxy_cache_methods
该指令用户设置缓存哪些 HTTP 方法，默认缓存 HTTP 的 GET 和 HEAD 方法，不缓存 POST 方法。

| 语法   | proxy_cache_methods GET\|HEAD\|POST; |
| ------ | ------------------------------------ |
| 默认值 | proxy_cache_methods GET HEAD;        |
| 位置   | http、server、location               |

### proxy_no_cache
该指令是用来定义不将数据进行缓存的条件

| 语法   | proxy_no_cache string...; |
| ------ | ------------------------- |
| 默认值 |                           |
| 位置   | http、server、location    |

### proxy_cache_bypass
该指令是用来设置不从缓存中获取数据的条件

| 语法   | proxy_cache_bypass string...; |
| ------ | ----------------------------- |
| 默认值 |                               |
| 位置   | http、server、location        |

上述两个指令都有一个指定的条件，这个条件可以是多个，并且多个条件中至少有一个不为空且不等于 "0"，则条件满足成立

1. $cookie_nocache

指的是当前请求的 cookie 中键的名称为 nocache 对应的值

2. $arg_nocache

指的是当前请求的参数中属性名为 nocache 对应的属性值

3. $arg_comment

指的是当前请求的参数中属性名为 comment 对应的属性值

**使用案例**

```plain
log_format params $cookie_nocache | $arg_nocache | $arg_comment;

server	{
  	listen	8081;
  	server_name localhost;
  	location /	{
        access_log logs/access_params.log params;
        add_header Set-Cookie 'nocache=999';
        root html;
        index index.html;
  	}
}
```

请求：[http://192.168.44.111:8081?nocache = 111&comment = 222](http://192.168.44.111:8081/?nocache=111&comment=222)

## 使用案例
### 添加缓存
![](Nginx（6-缓存）/3.png)

1. 未添加缓存配置

```plain
http {
  	upstream backend {
    	server 192.168.200.146:8080;
  	}
    
  	server {
    	listen       8080;
        server_name  localhost;
        location / {
            proxy_pass http://backend/js/;
        }
  	}
}
```

2. 添加缓存配置

```plain
http {
  	proxy_cache_path /usr/local/proxy_cache levels=1:2:1 keys_zone=itcast:200m inactive=1d max_size=20g;
  	
    upstream backend {
    	server 192.168.200.146:8080;
  	}
    
  	server {
    	listen       8080;
        server_name  localhost;
        location / {
            proxy_cache itcast;
            proxy_cache_key itheima;
            proxy_cache_min_uses 5;
            proxy_cache_valid 200 5d;
            proxy_cache_valid 404 30s;
            proxy_cache_valid any 1m;
            add_header nginx-cache "$upstream_cache_status";
            proxy_pass http://backend/js/;
        }
  	}
}
```

### 删除缓存
#### 删除缓存目录
```plain
rm -rf /usr/local/proxy_cache/......
```

#### 使用第三方模块（TODO）
### 设置资源不缓存
对于一些经常发生变化的数据。如果进行缓存的话，就很容易出现用户访问到的数据不是服务器真实的数据。所以对于这些资源我们在缓存的过程中就需要进行过滤，不进行缓存

```plain
server	{
  	listen	8080;
  	server_name localhost;
    
  	location / {
    	if ($request_uri ~ /.*\.js$) {
            set $nocache 1;
        }
    	proxy_no_cache $nocache $cookie_nocache $arg_nocache $arg_comment;
        proxy_cache_bypass $nocache $cookie_nocache $arg_nocache $arg_comment;
  	}
}
```

