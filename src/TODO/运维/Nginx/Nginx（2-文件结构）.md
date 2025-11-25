---
title: Nginx（2-文件结构）
tags:
  - Nginx
categories: 运维
cover: /img/index/nginx3.png
top_img: /img/index/nginx3.png
published: false
abbrlink: 65094
date: 2024-11-27 23:11:11
description:
---

## 目录结构

```shell
[root@localhost ~]# tree /usr/local/nginx
/usr/local/nginx
├── client_body_temp                 # POST 大文件暂存目录
├── conf                             # Nginx 所有配置文件的目录
│   ├── fastcgi.conf                 # fastcgi 相关参数的配置文件
│   ├── fastcgi.conf.default         # fastcgi.conf 的原始备份文件
│   ├── fastcgi_params               # fastcgi 的参数文件
│   ├── fastcgi_params.default       
│   ├── koi-utf
│   ├── koi-win
│   ├── mime.types                   # 媒体类型
│   ├── mime.types.default
│   ├── nginx.conf                   #这是 Nginx 默认的主配置文件，日常使用和修改的文件
│   ├── nginx.conf.default
│   ├── scgi_params                  # scgi 相关参数文件
│   ├── scgi_params.default  
│   ├── uwsgi_params                 # uwsgi 相关参数文件
│   ├── uwsgi_params.default
│   └── win-utf
├── fastcgi_temp                     # fastcgi 临时数据目录
├── html                             # Nginx 默认站点目录
│   ├── 50x.html                     # 错误页面优雅替代显示文件，例如出现 502 错误时会调用此页面
│   └── index.html                   # 默认的首页文件
├── logs                             # Nginx 日志目录
│   ├── access.log                   # 访问日志文件
│   ├── error.log                    # 错误日志文件
│   └── nginx.pid                    # pid 文件，Nginx 进程启动后，会把所有进程的 ID 号写到此文件
├── proxy_temp                       # 临时目录
├── sbin                             # Nginx 可执行文件目录
│   └── nginx                        # Nginx 二进制可执行程序
├── scgi_temp                        # 临时目录
└── uwsgi_temp                       # 临时目录
```

## 配置文件

### 语法

1. ; 结尾
2. {}组织多条指令
3. include 引入
4. #注释
5. $变量

### 内容信息

```plain
# 允许进程数量，建议设置为cpu核心数或者auto自动检测，注意Windows服务器上虽然可以启动多个processes，但是实际只会用其中一个
worker_processes 1; 

events {
    # 单个进程最大连接数（最大连接数=连接数*进程数）
    # 根据硬件调整，和前面工作进程配合起来用，尽量大，但是别把cpu跑到100%就行。
    worker_connections  1024;
}

http {
    # 文件扩展名与文件类型映射表(是conf目录下的一个文件)
    include       mime.types;
    # 默认文件类型，如果mime.types预先定义的类型没匹配上，默认使用二进制流的方式传输
    default_type  application/octet-stream;

    # sendfile指令指定nginx是否调用sendfile 函数（zero copy 方式）来输出文件，对于普通应用，必须设为on。如果用来进行下载等应用磁盘IO重负载应用，可设置为off，以平衡磁盘与网络IO处理速度。
    sendfile        on;
    
    # 长连接超时时间，单位是秒
    keepalive_timeout  65;

   	# 虚拟主机的配置
    server {
      	# 监听端口
        listen       80;
        # 域名，可以有多个，用空格隔开
        server_name  localhost;

		# 配置根目录以及默认页面
        location / {
            root   html;
            index  index.html index.htm;
        }

		# 出错页面配置
        error_page   500 502 503 504  /50x.html;
        # /50x.html文件所在位置
        location = /50x.html {
            root   html;
        }
    }
}
```

```plain
# 全局块，主要设置Nginx服务器整体运行的配置指令
指令名	指令值;

# events块,主要设置,Nginx服务器与用户的网络连接,这一部分对Nginx服务器的性能影响较大
events {	 
    指令名	指令值;
}

# http块，是Nginx服务器配置中的重要部分，代理、缓存、日志记录、第三方模块配置...             
http {		
    指令名	指令值;

  	# server块，是Nginx配置和虚拟主机相关的内容
    server { 
        指令名	指令值;

		# location块，基于Nginx服务器接收请求字符串与location后面的值进行匹配，对特定请求进行处理
        location / { 
            指令名	指令值;
        }
    }
	...
}
```

## 全局块

### user 指令

| 语法   | user user [group]; |
| ------ | ------------------ |
| 默认值 |                    |
| 位置   | 全局块             |

用于配置运行 Nginx 服务器的 worker 进程的用户和用户组，这样对于系统的权限访问控制的更加精细，也更加安全。该属性也可以在编译的时候指定，语法如下：./configure --user = user --group = group，如果两个地方都进行了设置，最终生效的是配置文件中的配置

**使用案例**

1. 配置文件中设置一个用户信息 www（nginx 的用户权限，需要网页或者某些文件夹的权限要从 root 给到 www）

```tex
user www;
worker_processes 1;
```

2. 创建一个用户：useradd www
3. 创建/root/html/index.html，添加如下内容

```html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
  <style>
      body {
          width: 35em;
          margin: 0 auto;
          font-family: Tahoma, Verdana, Arial, sans-serif;
      }
  </style>
</head>
<body>
  <h1>Welcome to nginx!</h1>
  <p>If you see this page, the nginx web server is successfully installed and
  working. Further configuration is required.</p>
  
  <p>For online documentation and support please refer to
  <a href="http://nginx.org/">nginx.org</a>.<br/>
  Commercial support is available at
  <a href="http://nginx.com/"> nginx.com </a>.</p>
  
  <p> <em> Thank you for using nginx.</em> </p>
  <p> <em> I am WWW </em> </p>
</body>
</html>
```

4. 修改nginx.conf

``` plain
location / {
    root   /root/html;
    index  index.html index.htm;
}
```

5. 测试启动访问，页面会报403拒绝访问的错误，因为当前用户www没有访问/root/html目录的权限
6. 将文件创建到/home/www/html/index.html，修改配置

``` html
location / {
  	root   /home/www/html;
  	index  index.html index.htm;
}
```

7. 再次测试启用访问，能正常访问

### work process指令

1. master_process：用来指定是否开启工作进程

| 语法   | master_process on\|off; |
| ------ | ----------------------- |
| 默认值 | master_process on;      |
| 位置   | 全局块                  |

开启后会出现以下效果：

![](Nginx（2-文件结构）/1.png)

2. worker_processes：用来配置Nginx生成工作进程的数量

这个是Nginx服务器实现并发处理服务的关键所在。理论上worker process的值越大，可以支持的并发处理量也越多，但是这个值的设定是需要受到来自服务器自身的限制，建议将该值和服务器CPU的内核数保持一致

| 语法   | worker_processes num/auto; |
| ------ | -------------------------- |
| 默认值 | 1                          |
| 位置   | 全局块                     |

![](Nginx（2-文件结构）/2.png)

![](Nginx（2-文件结构）/3.png)

### 其他指令

1. daemon：设置Nginx是否以守护进程的方式启动

守护式进程是linux后台执行的一种服务进程，特点是独立于控制终端，不会随着终端关闭而停止。

| 语法   | daemon on\|off; |
| ------ | --------------- |
| 默认值 | daemon on;      |
| 位置   | 全局块          |

2. pid：用来配置Nginx当前master进程的进程号ID存储的文件路径，该属性可以通过./configure --pid-path=PATH来指定

| 语法   | pid file;                            |
| ------ | ------------------------------------ |
| 默认值 | pid /usr/local/nginx/logs/nginx.pid; |
| 位置   | 全局块                               |

3. error_log：用来配置Nginx的错误日志存放路径，该属性可以通过./configure --error-log-path=PATH来指定

其中日志级别的值有：debug、info、notice、warn、error、crit、alert、emerg，建议设置时不要设置为info以下的等级，因为会带来大量的磁盘I/O效果，影响Nginx的性能

| 语法   | error_log file [日志级别];      |
| ------ | ------------------------------- |
| 默认值 | error_log logs/error.log error; |
| 位置   | 全局块、http、server、location  |

4. include：用来引入其他配置文件，使Nginx的配置更加灵活

| 语法   | include file; |
| ------ | ------------- |
| 默认值 | 无            |
| 位置   | 任何位置      |

## events块

### 指令

1. accept_mutex：用来设置Nginx网络连接序列化

| 语法   | accept_mutex on\|off; |
| ------ | --------------------- |
| 默认值 | accept_mutex on;      |
| 位置   | events                |

这个配置主要可以用来解决常说的"惊群"问题。即在某一个时刻，客户端发来一个请求连接，Nginx后台是以多进程的工作模式，也就是说有多个worker进程会被同时唤醒，但是最终只会有一个进程可以获取到连接，如果每次唤醒的进程数目太多，就会影响Nginx的整体性能。如果将上述值设置为on（开启状态），将会对多个Nginx进程接收连接进行序列号，一个个来唤醒接收，就防止了多个进程对连接的争抢。

2. multi_accept：用来设置是否允许同时接收多个网络连接

| 语法   | multi_accept on\|off; |
| ------ | --------------------- |
| 默认值 | multi_accept off;     |
| 位置   | events                |

如果multi_accept被禁止了，Nginx一个工作进程只能同时接受一个新的连接。否则，一个工作进程可以同时接受所有的新连接

3. worker_connections：用来配置单个worker进程最大的连接数

| 语法   | worker_connections num; |
| ------ | ----------------------- |
| 默认值 | worker_connections 512; |
| 位置   | events                  |

这里的连接数不仅仅包括和前端用户建立的连接数，而是包括所有可能的连接数。另外，number值不能大于操作系统支持打开的最大文件句柄数量。

4. use：用来设置Nginx服务器选择哪种事件驱动来处理网络消息

| 语法   | use method;      |
| ------ | ---------------- |
| 默认值 | 根据操作系统而定 |
| 位置   | events           |

此处所选择事件处理模型是Nginx优化部分的一个重要内容，可选值有select/poll/epoll/kqueue等

### 使用案例

``` plain
events {
	# 设置 Nginx 网络连接序列化
  	accept_mutex on;
  	# 允许同时接收多个网络连接
  	multi_accept on;
  	# 配置单个 worker 进程最大的连接数
  	worker_commections 1024;
  	use epoll;
}
```

## http块

### 定义MIME-Type

浏览器中可以显示的内容有HTML、XML、GIF等种类繁多的文件、媒体等资源，浏览器为了区分这些资源，就需要使用MIME Type。所以说MIME Type是网络资源的媒体类型。Nginx作为web服务器，也需要能够识别前端请求的资源类型

1. include mime.types：相当于把mime.types文件中MIME类型与相关类型文件后缀名的对应关系加入到当前的配置文件中
2. default_type：用来配置Nginx响应前端请求默认的MIME类型

| 语法   | default_type mime-type;  |
| ------ | ------------------------ |
| 默认值 | default_type text/plain; |
| 位置   | http、server、location   |

**使用案例**

```tex
include mime.types;
default_type application/octet-stream;
```

有些时候请求某些接口的时候需要返回指定的文本字符串或者json字符串，如果逻辑非常简单或者干脆是固定的字符串，那么可以使用Nginx快速实现，这样就不用编写程序响应请求了，可以减少服务器资源占用并且响应性能非常快

``` plain
location /get_text	{
  	# 这里也可以设置成 text/plain
    default_type text/html;
    return 200 "This is nginx's text";
}

location /get_json	{
    default_type application/json;
    return 200 '{"name": "TOM", "age": 18}';
}
```

### 服务日志

**日志类型**

Nginx中日志的类型分为access.log和error.log

1. access.log：用来记录用户所有的访问请求。
2. error.log：记录nginx本身运行时的错误信息，不会记录用户的访问请求。

**指令**

Nginx服务器支持对服务日志的格式、大小、输出等进行设置，需要使用到两个指令，分别是access_log和log_format指令。

1. access_log：用来设置用户访问日志的相关属性

| 语法   | access_log path [format [buffer=size]]; |
| ------ | --------------------------------------- |
| 默认值 | access_log logs/access.log combined;    |
| 位置   | http、server、location                  |

+ buffer=size：存放访问日志的缓冲区大小
+ flush=time：为缓冲区的日志刷到磁盘的时间
+ gzip[=level]：表示压缩级别
+ [if = condition]：表示其他条件

``` plain
access_log path [format [buffer = size [flush = time]] [if = condition]];
access_log path format gzip [= level] [buffer = size] [flush = time] [if = condition];
access_log syslog: server = address [, parameter = value] [format [if = condition]];
```

**使用案例**

``` plain
access_log off;  # 关闭access_log，即不记录访问日志
access_log /spool/logs/nginx-access.log compression buffer = 32k;
```

2. log_format：用来指定日志的输出格式

| 语法   | log_format name [escape=default \| json\| none] string ...; |
| ------ | ----------------------------------------------------------- |
| 默认值 | log_format combined "...";                                  |
| 位置   | http                                                        |

| 参数                    | 说明                                         | 示例                                                         |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| $remote_addr            | 客户端地址                                   | 211.28.65.253                                                |
| $remote_user            | 客户端用户名称                               | ---                                                          |
| $time_local             | 访问时间和时区                               | 18/Jul/2012:17:00:01 +0800                                   |
| $request                | 请求的URI和HTTP协议                          | "GET /article-10000.html HTTP/1.1"                           |
| $http_host              | 请求地址，即浏览器中你输入的地址（IP或域名） | www.wang.com 192.168.100.100                                 |
| $status                 | HTTP请求状态                                 | 200                                                          |
| $upstream_status        | upstream状态                                 | 200                                                          |
| $body_bytes_sent        | 发送给客户端文件内容大小                     | 1547                                                         |
| $http_referer           | url跳转来源                                  | https://www.baidu.com/                                       |
| $http_user_agent        | 用户终端浏览器等信息                         | "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; SV1; GTB7.0; .NET4.0C; |
| $ssl_protocol           | SSL协议版本                                  | TLSv1                                                        |
| $ssl_cipher             | 交换数据中的算法                             | RC4-SHA                                                      |
| $upstream_addr          | 后台upstream的地址，即真正提供服务的主机地址 | 10.10.10.100:80                                              |
| $request_time           | 整个请求的总时间                             | 0.205                                                        |
| $upstream_response_time | 请求过程中，upstream响应时间                 | 0.002                                                        |

**使用案例**

``` plain
log_format compression '$remote_addr - $ remote_user [$time_local] '
                       '"$request" $status $bytes_sent '
                       '"$http_referer" "$http_user_agent" "$gzip_ratio "';

access_log /spool/logs/nginx-access.log compression buffer = 32k;
```

3. open_log_file_cache：设置日志文件缓存（默认是off）

| 语法   | open_log_file_cache max=N [inactive=time] [min_uses=N] [valid=time];<br />open_log_file_cache off; |
| ------ | ------------------------------------------------------------ |
| 默认值 | open_log_file_cache off;                                     |
| 位置   | http、server、location                                       |

+ max：设置缓存中的最大文件描述符数量，如果缓存被占满，采用 LRU 算法将描述符关闭
+ inactive：设置存活时间，默认是 10s
+ min_uses：设置在 inactive 时间段内，日志文件最少使用多少次后，该日志文件描述符记入缓存中，默认是 1 次
+ valid：设置检查频率，默认 60s
+ off：禁用缓存

**使用案例**

```plain
open_log_file_cache max=1000 inactive=20s valid=1m min_uses=2;
```

### 其他指令

1. sendfile：用来设置 Nginx 服务器是否使用 sendfile()传输文件，该属性可以大大提高 Nginx 处理静态资源的性能

| 语法   | sendfile on\|off;      |
| ------ | ---------------------- |
| 默认值 | sendfile off;          |
| 位置   | http、server、location |

2. keepalive_timeout：用来设置长连接的超时时间

| 语法   | keepalive_timeout time; |
| ------ | ----------------------- |
| 默认值 | keepalive_timeout 75s;  |
| 位置   | http、server、location  |

3. keepalive_requests：用来设置一个 keep-alive 连接使用的次数

| 语法   | keepalive_requests num; |
| ------ | ----------------------- |
| 默认值 | keepalive_requests 100; |
| 位置   | http、server、location  |

## server 块和 location 块

一个 http 块可以放多个 server 块，一个 server 块可以放多个 location 块

```plain
server {
    listen       80; #监听的端口
    server_name  localhost; #服务名称 可以为localhost,ip,域名
    location / {
        root   html;  #资源所对应的目录
        index  index.html index.htm; #访问的页面
    }
   
    error_page   500 502 503 504 404  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

### listen 指令

用来配置监听端口

| 语法   | listen address [: port] [default_server]...;<br />listen port [default_server]...; |
| ------ | ------------------------------------------------------------ |
| 默认值 | listen *: 80 \| *: 8000                                        |
| 位置   | server                                                       |

```html
listen 127.0.0.1:8000; # 等于listen localhost:8000，监听指定的IP和端口
listen 127.0.0.1;	# 监听指定IP的所有端口
listen 8000;	# 监听指定端口上的连接
listen *:8000;	# 监听指定端口上的连接
```

default_server 属性是标识符，用来将此虚拟主机设置为默认主机。默认主机指的是如果没有匹配到对应的 address: port，则会默认执行的，如果不指定默认使用的是第一个 server

```plain
server {
    listen 8080;
    server_name 127.0.0.1;
    location / {
        root html;
        index index.html;
    }
}

server {
  	listen 8080 default_server;
  	server_name localhost;
  	default_type text/plain;
  	return 444 'This is a error request';
}
```

### server_name

server_name：用来设置虚拟主机服务名称

| 语法   | server_name name ....;<br />name 可以提供多个，中间用空格分隔 |
| ------ | ------------------------------------------------------------ |
| 默认值 | server_name "";                                              |
| 位置   | server                                                       |

#### 精确匹配

server 中可以配置多个域名，例如：server_name test81.hhh.cn test82.hhh.cn

```plain
server {
  	listen 80;
  	server_name www.itcast.cn www.itheima.cn;
  	...
}
```

hosts 是一个没有扩展名的系统文件，可以用记事本等工具打开，其作用就是将一些常用的网址域名与其对应的 IP 地址建立一个关联“数据库”，当用户在浏览器中输入一个需要登录的网址时，系统会首先自动从 hosts 文件中寻找对应的 IP 地址，一旦找到，系统会立即打开对应网页，如果没有找到，则系统会再将网址提交 DNS 域名解析服务器进行 IP 地址的解析。

因为域名是要收取一定的费用，所以我们可以使用修改 hosts 文件来制作一些虚拟域名来使用，通过修改/ect/hosts 文件来添加

```plain
127.0.0.1 www.itcast.cn
127.0.0.1 www.itheima.cn
```

#### 通配符匹配

1. 使用通配符匹配的方式如下：server_name *.hhh.cn
2. 使用通配符结束匹配的方式如下：server_name www.hhh.*

**注意**

1. 通配符不能出现在域名的中间，只能出现在开头或结尾
2. 精确匹配的优先级大于通配符匹配和正则匹配

```plain
server {
    listen       80;
    server_name  *.example.org;
    ...
}

server {
    listen       80;
    server_name  mail.*;
    ...
}
```

#### 正则匹配

| 代码  | 说明                                                      |
| ----- | --------------------------------------------------------- |
| ^     | 匹配搜索字符串的开始位置                                  |
| $     | 匹配搜索字符串的结束位置                                  |
| .     | 匹配除换行符\n 之外的任何单个字符                          |
| \     | 转义字符，将下一个字符标记为特殊字符                      |
| [xyz] | 字符集，与任意一个指定字符匹配                            |
| [a-z] | 字符范围，匹配指定范围内的任何字符                        |
| \w    | 与以下任意字符匹配 A-Z a-z 0-9 和下划线，等于 [A-Za-z0-9_] |
| \d    | 数字字符匹配，等于 [0-9]                                   |
| {n}   | 正好匹配 n 次                                               |
| {n,}  | 至少匹配 n 次                                               |
| {n, m} | 匹配至少 n 次至多 m 次                                        |
| *     | 0 次或多次，等于{0,}                                       |
| +     | 1 次或多次，等于{1,}                                       |
| ?     | 0 次或 1 次，等于{0,1}                                       |

正则匹配格式，必须以~开头，例如：server_name ~^www\d+\.example\.net$

1. 如果开头没有~，则 nginx 认为是精确匹配，~后面不能加空格
2. 如果匹配字符中含有*号，则会被认为是通配符匹配，不过非法的通配符格式
3. 在逻辑上，需要添加^和$锚定符号

**注意**

1. 正则匹配格式中.为正则元字符，如果需要匹配.，则需要反斜线转义。
2. 如果正则匹配中含有{和}，则需要双引号引用起来，避免 nginx 报错
3. 正则表达式命名捕获的变量可以在 nginx 进行引用

```plain
server {
    server_name  ~^(www\.)?(?<domain>.+)$;

    location / {
        root  /sites/$domain;
    }
}
```

#### 特殊匹配

1. server_name "";： 匹配 Host 请求头不存在的情况。
2. server_name "-"; ：无任何意义。
3. server_name "\*"; ：它被错误地解释为万能的名称。 它从不用作通用或通配符服务器名称。相反，它提供了 server_name_in_redirect 指令现在提供的功能。 现在不建议使用特殊名称 "*"，而应使用 server_name_in_redirect 指令。 

#### 匹配顺序

1. 精确的名字
2. 以\*号开头的最长通配符名称，例如：*.example.org
3. 以\*号结尾的最长通配符名称，例如：mail.*
4. 第一个匹配的正则表达式（在配置文件中出现的顺序）
5. 被默认的 default_server 处理，如果没有指定默认找第一个 server

#### 优化

1. 尽量使用精确匹配
2. 当定义大量 server_name 时或特别长的 server_name 时，需要在 http 级别调整 server_names_hash_max_size 和 server_names_hash_bucket_size，否则 nginx 将无法启动

### location

| 语法   | location [ =\|~\|~*\|^~\|@ ] uri {...} |
| ------ | -------------------------------------- |
| 默认值 |                                        |
| 位置   | server、location                       |

#### 匹配规则

nginx 服务器在搜索匹配 location 的时候，是先使用不包含正则表达式进行匹配，找到一个匹配度最高的一个，然后在通过包含正则表达式的进行匹配，如果能匹配到直接访问，匹配不到，就使用刚才匹配度最高的那个 location 来处理请求

```plain
location [ = | ~ | ~* | ^~] uri {
}
```

1. =：用于不含正则表达式的 uri 前，要求请求字符串与 uri 严格匹配，如果匹配成功，就停止继续向下搜索并立即处理该请求

```plain
server {
  	listen 80;
  	server_name 127.0.0.1;
  	location = /abc	{
        default_type text/plain;
        return 200 "access success";
  	}
}

# 可以匹配到
http://192.168.200.133/abc
http://192.168.200.133/abc?p1=TOM
# 匹配不到
http://192.168.200.133/abc/
http://192.168.200.133/abcdef
```

2. ~：用于表示 uri 包含正则表达式，并且区分大小写
3. ~*：用于表示 uri 包含正则表达式，并且不区分大小写

```plain
server {
  	listen 80;
  	server_name 127.0.0.1;
  	location ~ ^/abc\w$	{
        default_type text/plain;
        return 200 "access success";
  	}
}

server {
  	listen 80;
  	server_name 127.0.0.1;
  	location ~* ^/abc\w$ {
        default_type text/plain;
        return 200 "access success";
  	}
}
```

4. ^~：用于不含正则表达式的 uri 前，要求 Nginx 服务器找到标识 uri 和请求字符串匹配度最高的 location 后，立即使用此 location 处理请求，而不再使用 location 块中的正则 uri 和请求字符串做匹配

注意：如果 uri 包含正则表达式，则必须要有~或者~*标识

```plain
server {
  	listen 80;
  	server_name 127.0.0.1;
  	location ^~ /abc {
        default_type text/plain;
        return 200 "access success";
  	}
}
```

5. 不带符号，要求必须以指定模式开始

```plain
server {
  	listen 80;
  	server_name 127.0.0.1;
  	location /abc {
        default_type text/plain;
        return 200 "access success";
  	}
}

# 以下访问都是正确的
http://192.168.200.133/abc
http://192.168.200.133/abc?p1=TOM
http://192.168.200.133/abc/
http://192.168.200.133/abcdef
```

#### 优先级

```plain
（1）location = / {}
=为精确匹配 /，主机名后面不能带任何字符串，比如访问 / 和 /data，则 / 匹配，/data 不匹配
再比如 location = /abc，则只匹配/abc，/abc/和/abcd不匹配。

（2）location / {}
因为所有的地址都以 / 开头，所以这条规则将匹配到所有请求 比如访问 / 和 /data, 则 / 匹配， /data 也匹配，
若location /abc，则即匹配/abc、/abcd/ 同时也匹配 /abc/。
但若后面是正则表达式会和最长字符串优先匹配（最长匹配）

（3）location /documents/ {}
匹配任何以 /documents/ 开头的地址，匹配符合以后，还要继续往下搜索其它 location
只有其它 location后面的正则表达式没有匹配到时，才会采用这一条

（4）location ^~ /images/ {}
匹配任何以 /images/ 开头的地址，匹配符合以后，停止往下搜索正则，采用这一条

（5）location ~* \.(gif|jpg|jpeg)$ {}
匹配所有以 gif、jpg或jpeg 结尾的请求
然而，所有请求 /images/ 下的图片会被 location ^~ /images/ 处理，因为 ^~ 的优先级更高，所以到达不了这一条正则

（6）location ~ /images/abc {}
匹配以/images/abc 开头的，优先级次之，只有去掉 location ^~ /images/ 才会采用这一条

（7）location /images/abc/1.html {}
匹配/images/abc/1.html 文件，如果和正则 ~ /images/abc/1.html 相比，正则优先级更高
```

1. location =
2. location 完整路径
3. location ^~ 路径
4. location ~,~* 正则顺序
5. location 部分起始路径
6. location /

#### 使用案例

1. 直接匹配网站根，通过域名访问网站首页比较频繁，使用这个会加速处理，比如说官网。这里是直接转发给后端应用服务器了，也可以是一个静态首页

```plain
location = / {
    proxy_pass http://127.0.0.1:8080/; 
}
```

2. 处理静态文件请求，这是 nginx 作为 http 服务器的强项，有两种配置模式，目录匹配或后缀匹配，任选其一或搭配使用

```plain
location ^~ /static/ {
    root /webroot/static/;
}

location ~* \.(html|gif|jpg|jpeg|png|css|js|ico)$ {
    root /webroot/res/;
}
```

3. 通用规则，用来转发动态请求到后端应用服务器

```plain
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
}
```

### root 和 alias

1. root：设置 Nginx 服务器接收到请求以后查找资源的根目录路径

| 语法   | root path;             |
| ------ | ---------------------- |
| 默认值 | root html;             |
| 位置   | http、server、location |

```plain
location /images {
  	root /usr/local/nginx/html;
}
```

2. alias：用来更改 location 的 URI

| 语法   | alias path; |
| ------ | ----------- |
| 默认值 |             |
| 位置   | location    |

```plain
location /images {
  	# 错误结果
  	#alias /usr/local/nginx/html;
  	# 正确结果
  	alias /usr/local/nginx/html/images;
}
```

**root 与 alias 的区别**

在/usr/local/nginx/html 目录下创建一个 images 目录, 并在目录下放入一张图片 mv.png 图片，访问路径为：http://192.168.200.133/images/mv.png，如果使用 alias /usr/local/nginx/html 方法，则会出现 404 的错误

1. root 的处理结果是：root 路径+location 路径
2. alias 的处理结果是：使用 alias 路径替换 location 路径
3. 如果 location 路径是以/结尾，则 alias 也必须是/结尾，root 没有要求

### index

| 语法   | index file ...;        |
| ------ | ---------------------- |
| 默认值 | index index.html;      |
| 位置   | http、server、location |

设置网站的默认首页，index 后面可以跟多个设置，如果访问的时候没有指定具体访问的资源，则会依次进行查找，找到第一个为止

```plain
location / {
  	root /usr/local/nginx/html;
  	index index.html index.htm;
}

访问该location的时候，可以通过 http://ip:port/，地址后面如果不添加任何内容，
则默认依次访问index.html和index.htm，找到第一个来进行返回
```

### error_page

| 语法   | error_page code ... [=[response]] uri; |
| ------ | -------------------------------------- |
| 默认值 |                                        |
| 位置   | http、server、location...              |

**使用案例**

1. 可以指定具体跳转的地址

```plain
server {
  	error_page 404 http://www.itcast.cn;
}
```

2. 可以指定重定向地址

```plain
server {
    error_page 404 /50x.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root html;
    }
}
```

3. 使用 location 的@符合完成错误信息展示

```plain
server {
  	error_page 404 @jump_to_error;
    
  	location @jump_to_error {
        default_type text/plain;
        return 404 'Not Found Page...';
  	}
}
```

4. 使用 response 用来将相应代码更改为另外一个

```plain
server {
  	error_page 404 =200 /50x.html;

  	location = /50x.html {
        root html;
  	}
}

这样的话，当返回404找不到对应的资源的时候，在浏览器上可以看到，最终返回的状态码是200，
这块需要注意下，编写error_page后面的内容，404后面需要加空格，200前面不能加空格
```

## 基础配置实例
![](Nginx（2-文件结构）/4.png)

```plain
# 配置允许运行Nginx工作进程的用户和用户组
#user www;
# 配置运行Nginx进程生成的worker进程数
worker_processes 2;
# 配置Nginx服务器运行对错误日志存放的路径
error_log logs/error.log;
# 配置Nginx服务器允许时记录Nginx的master进程的PID文件路径和名称
pid logs/nginx.pid;
# 配置Nginx服务是否以守护进程方法启动
#daemon on;

events {
  	# 设置Nginx网络连接序列化
  	accept_mutex on;
  	# 设置Nginx的worker进程是否可以同时接收多个请求
  	multi_accept on;
  	# 设置Nginx的worker进程最大的连接数
  	worker_connections 1024;
  	# 设置Nginx使用的事件驱动模型
  	use epoll;
}

http {
  	# 定义MIME-Type
  	include mime.types;
  	default_type application/octet-stream;
  	# 配置允许使用sendfile方式运输
  	sendfile on;
  	# 配置连接超时时间
  	keepalive_timeout 65;
  	# 配置请求处理日志格式
  	log_format server1 '===>server1 access log';
  	log_format server2 '===>server2 access log';
  	include /data/www/conf/*.conf;
}
```

```plain
server {
    # 配置监听端口和主机名称
    listen 8081;
    server_name localhost;
    # 配置请求处理日志存放路径
    access_log /data/www/myweb/server1/logs/access.log server1;
    # 配置错误页面
    error_page 404 /404.html;

    # 配置处理/server1/location1请求的location
    location /server1/location1 {
        root /data/www/myweb;
        index index_sr1_location1.html;
    }

    # 配置处理/server1/location2请求的location
    location /server1/location2 {
        root /data/www/myweb;
        index index_sr1_location2.html;
    }

    # 配置错误页面转向
    location = /404.html {
        root /data/www/myweb;
        index 404.html;
    }
}
```

```plain
server {
    # 配置监听端口和主机名称
    listen 8082;
    server_name localhost;
    # 配置请求处理日志存放路径
    access_log /data/www/myweb/server2/logs/access.log server2;
    # 配置错误页面,对404.html做了定向配置
    error_page 404 /404.html;

    # 配置处理/server1/location1请求的location
    location /server2/location1 {
        root /data/www/myweb;
        index index_sr2_location1.html;
    }

    # 配置处理/server2/location2请求的location
    location /server2/location2 {
        root /data/www/myweb;
        index index_sr2_location2.html;
    }

    # 配置错误页面转向
    location = /404.html {
        root /data/www/myweb;
        index 404.html;
    }
}
```

