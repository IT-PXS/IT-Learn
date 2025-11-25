---
title: Nginx（3-虚拟主机和代理）
tags:
  - Nginx
categories: 运维
cover: /img/index/nginx3.png
top_img: /img/index/nginx3.png
published: false
abbrlink: 34815
date: 2024-11-28 23:11:11
description:
---

## 虚拟主机

一般的 web 服务器一个 IP 地址的 80 端口只能正确对应一个网站。web 服务器在不使用多个 IP 地址和端口的情况下，如果需要支持多个相对独立的网站就需要一种机制来分辨同一个 IP 地址上的不同网站的请求，这就出现了主机头绑定的方法。即将不同的网站空间对应不同的域名，以连接请求中的域名字段来分发和应答正确的对应空间的文件执行结果。

例如：一台服务器 IP 地址为 192.168.8.101，有两个域名和对应的空间在这台服务器上，使用的都是 192.168.8.101 的 80 端口来提供服务。如果只是简单的将两个域名 A 和 B 的域名记录解析到这个 IP 地址，那么 web 服务器在收到任何请求时反馈的都会是同一个网站的信息，这显然达不到要求。使用主机头绑定域名 A 和 B 到他们对应的空间文件夹 C 和 D，当含有域名 A 的 web 请求信息到达 192.168.8.101 时，web 服务器将执行它对应的空间 C 中的首页文件，并返回给客户端，含有域名 B 的 web 请求信息同理，web 服务器将执行它对应的空间 D 中的首页文件，并返回给客户端，所以在使用主机头绑定功能后就不能使用 IP 地址访问其上的任何网站了，因为请求信息中不存在域名信息，所以会出错。

### 监听不同域名

```tex
# 虚拟主机的配置
server {
    # 监听端口
    listen       80;
    # 域名，可以有多个，用空格隔开
    server_name  test80.xzj520520.cn;

    # 配置根目录以及默认页面
    location / {
        root   /www/test80;
        index  index.html index.htm;
    }

    # 出错页面配置
    error_page   500 502 503 504  /50x.html;
    # /50x.html文件所在位置
    location = /50x.html {
        root   html;
    }   
}

# 虚拟主机的配置
server {
    # 监听端口
    listen       80;
    # 域名，可以有多个，用空格隔开
    server_name  test81.xzj520520.cn;

    # 配置根目录以及默认页面
    location / {
        root   /www/test81;
        index  index.html index.htm;
    }

    # 出错页面配置
    error_page   500 502 503 504  /50x.html;
    # /50x.html文件所在位置
    location = /50x.html {
        root   html;
    }  
}
```

在 host 文件中配置 IP 地址与 test80.xzj520520.cn、test81.xzj520520.cn 的关系，即可访问

### 监听多个端口

```tex
# 虚拟主机的配置
server {
  	# 监听端口
    listen       80;
    # 域名，可以有多个，用空格隔开
    server_name  localhost;

  	# 配置根目录以及默认页面
    location / {
        root   /www/test80;
        index  index.html index.htm;
    }

  	# 出错页面配置
    error_page   500 502 503 504  /50x.html;
    # /50x.html文件所在位置
    location = /50x.html {
        root   html;
    }  
}
    
    
# 虚拟主机的配置
server {
  	# 监听端口
    listen       81;
    # 域名，可以有多个，用空格隔开
    server_name  localhost;

  	# 配置根目录以及默认页面
    location / {
        root   /www/test81;
        index  index.html index.htm;
    }

  	# 出错页面配置
    error_page   500 502 503 504  /50x.html;
    # /50x.html文件所在位置
    location = /50x.html {
        root   html;
    }  
}
```

新建/www/test80 和/www/test81 文件夹等信息，即可访问 test80 和 test81 网页

### 泛域名（TODO）

## 代理模式

### 正向代理

 A 向 C 借钱，由于一些情况不能直接向 C 借钱，于是 A 想了一个办法，他让 B 去向 C 借钱，这样 B 就代替 A 向 C 借钱，A 就得到了 C 的钱，C 并不知道 A 的存在，B 就充当了 A 的代理人的角色。

![](Nginx（3-虚拟主机和代理）/1.png)

1. 访问 http://localhost: 9001/hosp/直接跳转到 http://localhost: 8201（URL 不变）
2. 访问 http://localhost: 9001/cmn/直接跳转到 http://localhost: 8202（URL 不变）

```plain
server	{
    listen 9001;
    server_name localhost;
    
    location ~ /hosp/ {
        proxy_pass http://localhost:8201;
    }
    location ~ /cmn/ {
        proxy_pass http://localhost:8202;
    }
}
```

### 反向代理

 A 向 B 借钱，B 没有拿自己的钱，而是悄悄地向 C 借钱，拿到钱之后再交给 A，A 以为是 B 的钱，他并不知道 C 的存在。

![](Nginx（3-虚拟主机和代理）/2.png)

```plain
http {
    # 定义一组服务器
    upstream lb	{
        server 127.0.0.1:8080 weight=1;
        server 127.0.0.1:8081 weight=1;
    }
    
    server	{
        location / {
            proxy_pass http://lb;
        }
    }
}
```

### 指令

1. proxy_pass：该指令用来设置被代理服务器地址，可以是主机名称、IP 地址加端口号形式

| 语法   | proxy_pass url; |
| ------ | --------------- |
| 默认值 |                 |
| 位置   | location        |

```plain
server {
  	listen 80;
  	server_name localhost;
  	location /	{
        #proxy_pass http://192.168.200.146;
        proxy_pass http://192.168.200.146/;
  	}
}
当客户端访问 http://localhost/index.html,效果是一样的
```

```tex
server	{
  	listen 80;
  	server_name localhost;
  	location /server {
        #proxy_pass http://192.168.200.146;
        proxy_pass http://192.168.200.146/;
  	}
}
当客户端访问 http://localhost/server/index.html
这个时候，第一个proxy_pass就变成了http://localhost/server/index.html
第二个proxy_pass就变成了http://localhost/index.html效果就不一样了。
```

2. proxy_set_header：该指令可以更改 Nginx 服务器接收到的客户端请求的请求头信息，然后将新的请求头发送给代理服务器

| 语法   | proxy_set_header field value;                                |
| ------ | ------------------------------------------------------------ |
| 默认值 | proxy_set_header Host $proxy_host;<br />proxy_set_header Connection close; |
| 位置   | http、server、location                                       |

+ 被代理服务器（192.168.44.112）

```plain
server {
    listen  8080;
    server_name localhost;
    default_type text/plain;
    return 200 $http_username;
}
```

+ 代理服务器（192.168.44.11）

```plain
server {
    listen  8080;
    server_name localhost;
    location /server {
        proxy_pass http://192.168.44.112/;
        proxy_set_header username TOM;
    }
}
```

![](Nginx（3-虚拟主机和代理）/3.png)

3. proxy_redirect：该指令是用来重置头信息中的“Location”和“Refresh”的值

| 语法   | proxy_redirect redirect replacement;<br />proxy_redirect default;<br />proxy_redirect off; |
| ------ | ------------------------------------------------------------ |
| 默认值 | proxy_redirect default;                                      |
| 位置   | http、server、location                                       |

```plain
proxy_redirect redirect replacement;
redirect：目标Location的值
replacement：要替换的值

proxy_redirect default;
default：将location块的uri变量作为replacement,将proxy_pass变量作为redirect进行替换

proxy_redirect off;
关闭proxy_redirect的功能
```

+ 服务端（192.168.44.112）

```plain
server {
    listen  8081;
    server_name localhost;
    if (!-f $request_filename)	{
      	return 302 http://192.168.44.112;
    }
}
```

+ 代理服务端（192.168.44.111）

```plain
server {
  	listen  8081;
  	server_name localhost;
  	location / {
        proxy_pass http://192.168.44.112;
        proxy_redirect http://192.168.44.111 http://192.168.33.112;
  	}
}
```

### SSL 证书

HTTPS 是一种通过计算机网络进行安全通信的传输协议。它经由 HTTP 进行通信，利用 SSL/TLS 建立全通信，加密数据包，确保数据的安全性。

1. SSL（Secure Sockets Layer）安全套接层
2. TLS（Transport Layer Security）传输层安全

上述这两个是为网络通信提供安全及数据完整性的一种安全协议，TLS 和 SSL 在传输层和应用层对网络连接进行加密

#### 语法

1. ssl：用来在指定的服务器开启 HTTPS，可以使用 listen 443 ssl

| 语法   | ssl on\|off; |
| ------ | ------------ |
| 默认值 | ssl off;     |
| 位置   | http、server |

```tex
server {
	listen 443 ssl;
}
```

2. ssl_certificate：为当前这个虚拟主机指定一个带有 PEM 格式证书的证书

| 语法   | ssl_certificate file; |
| ------ | --------------------- |
| 默认值 |                       |
| 位置   | http、server          |

3. ssl_certificate_key：用来指定 PEM secret key 文件的路径

| 语法   | ssl_certificate_key file; |
| ------ | ------------------------- |
| 默认值 |                           |
| 位置   | http、server              |

4. ssl_session_cache：用来配置用于 SSL 会话的缓存

| 语法   | ssl_session_cache off\|none\|[builtin[: size]] [shared: name: size]; |
| ------ | ------------------------------------------------------------ |
| 默认值 | ssl_session_cache none;                                      |
| 位置   | http、server                                                 |

+ off：禁用会话缓存，客户端不得重复使用会话
+ none：禁止使用会话缓存，客户端可以重复使用，但是并没有在缓存中存储会话参数
+ builtin：内置 OpenSSL 缓存，仅在一个工作进程中使用
+ shared：所有工作进程之间共享缓存，缓存的相关信息用 name 和 size 来指定

5. ssl_session_timeout：开启 SSL 会话功能后，设置客户端能够反复使用存储再缓存中的会话参数时间

| 语法   | ssl_session_timeout time; |
| ------ | ------------------------- |
| 默认值 | ssl_session_timeout 5m;   |
| 位置   | http、server              |

6. ssl_ciphers：指定允许的密码，密码指定为 OpenSSL 支持的格式

| 语法   | ssl_ciphers ciphers;          |
| ------ | ----------------------------- |
| 默认值 | ssl_ciphers HIGH:! aNULL:! MD5; |
| 位置   | http、server                  |

7. ssl_prefer_server_ciphers：指定是否服务器密码优先客户端密码

| 语法   | ssl_perfer_server_ciphers on\|off; |
| ------ | ---------------------------------- |
| 默认值 | ssl_perfer_server_ciphers off;     |
| 位置   | http、server                       |

#### 配置 https

```plain
server {
    listen       443 ssl;
    server_name  localhost;

    ssl_certificate      server.cert;
    ssl_certificate_key  server.key;

    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;

    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;

    location / {
        root   html;
        index  index.html index.htm;
    }
}
```

![](Nginx（3-虚拟主机和代理）/4.png)

```plain
server {
  	listen 443 ssl;
  	server_name localhost;  # 接收所有访问443端口的请求
  	ssl_certificate 7706851_www.xzj520520.cn.pem;
  	ssl_certificate_key 7706851_www.xzj520520.cn.key;
}
```

由于 http 协议默认的端口是 80，而 https 默认的端口是 443，如果想让 http 的访问跳转到 https 的访问，可以做如下配置，配置完后需要重启 nginx

```plain
server {
  	listen 80;
  	server_name www.xzj520520.cn xzj520520.cn; # 换成自己的域名
  	...
  	return 301 https://$server_name$request_uri;	
}
```

### 系统调优

#### 相关概念

反向代理值 Buffer 和 Cache，Buffer 翻译过来是 "缓冲"，Cache 翻译过来是 "缓存"。

![](Nginx（3-虚拟主机和代理）/5.png)

1. 相同点：

+ 两种方式都是用来提供 IO 吞吐效率，都是用来提升 Nginx 代理的性能

2. 不同点：

+ 缓冲主要用来解决不同设备之间数据传递速度不一致导致的性能低的问题，缓冲中的数据一旦此次操作完成后，就可以删除。
+ 缓存主要是备份，将被代理服务器的数据缓存一份到代理服务器，这样的话，客户端再次获取相同数据的时候，就只需要从代理服务器上获取，效率较高，缓存中的数据可以重复使用，只有满足特定条件才会删除

#### 语法

1. proxy_buffering：用来开启或者关闭代理服务器的缓冲区

| 语法   | proxy_buffering on\|off; |
| ------ | ------------------------ |
| 默认值 | proxy_buffering on;      |
| 位置   | http、server、location   |

2. proxy_buffers：用来指定单个连接从代理服务器读取响应的缓冲区的个数和大小

| 语法   | proxy_buffers num size;                     |
| ------ | ------------------------------------------- |
| 默认值 | proxy_buffers 8 4k \| 8k;（与系统平台有关） |
| 位置   | http、server、location                      |

+ num：缓冲区的个数
+ size：每个缓冲区的大小，缓冲区的总大小就是 num*size

3. proxy_buffer_size：用来设置从被代理服务器获取的第一部分响应数据的大小，保持与 proxy_buffers 中的 size 一致即可，当然也可以更小

| 语法   | proxy_buffer_size size;                       |
| ------ | --------------------------------------------- |
| 默认值 | proxy_buffer_size 4k \| 8k;（与系统平台有关） |
| 位置   | http、server、location                        |

4. proxy_busy_buffers_size：用来限制同时处于 BUSY 状态的缓冲总大小

| 语法   | proxy_busy_buffers_size size;      |
| ------ | ---------------------------------- |
| 默认值 | proxy_busy_buffers_size 8k \| 16k; |
| 位置   | http、server、location             |

5. proxy_temp_path：当缓冲区存满后，仍未被 Nginx 服务器完全接受，响应数据就会被临时存放在磁盘文件上

注意：path 最多设置三层

| 语法   | proxy_temp_path path;       |
| ------ | --------------------------- |
| 默认值 | proxy_temp_path proxy_http; |
| 位置   | http、server、location      |

6. proxy_temp_file_write_size：用来设置磁盘上缓冲文件的大小

| 语法   | proxy_temp_file_write_size size;      |
| ------ | ------------------------------------- |
| 默认值 | proxy_temp_file_write_size 8k \| 16k; |
| 位置   | http、server、location                |

#### 通用网址配置

```html
proxy_buffering on;
proxy_buffers 4 32k;
proxy_busy_buffers_size 64k;
proxy_temp_file_write_size 64k;
```
