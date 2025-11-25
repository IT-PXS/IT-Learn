---
title: Nginx（5-静态资源）
tags:
  - Nginx
categories: 运维
cover: /img/index/nginx3.png
top_img: /img/index/nginx3.png
published: false
abbrlink: 21209
date: 2024-11-28 23:11:11
description:
---

## 静态资源处理
1. 静态资源：即指在服务器端真实存在并且能直接拿来展示的一些文件，比如常见的 html 页面、css 文件、js 文件、图 片、视频等资源；
2. 动态资源：即指在服务器端真实存在但是要想获取需要经过一定的业务逻辑处理，根据不同的条件展示在页面不同这 一部分内容，比如说报表数据展示、根据当前登录用户展示相关具体数据等资源

Nginx 处理静态资源的内容，我们需要考虑下面这几个问题：

1. 静态资源的配置指令
2. 静态资源的配置优化
3. 静态资源的压缩配置指令
4. 静态资源的缓存处理
5. 静态资源的访问控制，包括跨域问题和防盗链问题

## 动静分离

让动态网站里的动态网页根据一定规则把不变的资源和经常变的资源区分开来，动静资源做好了拆分以后，我们就可以根据静态资源的特点将其做缓存操作，提高资源响应的速度。

![](Nginx（5-静态资源）/1.png)

![](Nginx（5-静态资源）/2.png)

将 [http://192.168.8.101:8080](http://192.168.8.101:8080) 中的图片放到 nginx 中的/images/www/resources 文件夹中，直接访问 nginx

```plain
server {
    listen       80;
    server_name  localhost;

    location / {
        proxy_pass http://192.168.8.101:8080;
    }
    
    location /images {
        root   /www/resources;
        index  index.html index.htm;
    }
    
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

## 资源优化

### 指令

1. sendfile：用来开启高效的文件传输模式

| 语法   | sendfile on\|off;      |
| ------ | ---------------------- |
| 默认值 | sendfile off;          |
| 位置   | http、server、location |

请求静态资源的过程：客户端通过网络接口向服务端发送请求，操作系统将这些客户端的请求传递给服务器端应用程序，服务器端应用程序会处理这些请求，请求处理完成以后，操作系统还需要将处理得到的结果通过网络适配器传递回去。

![](Nginx（5-静态资源）/3.png)

2. tcp_nopush：该指令必须在 sendfile 打开的状态下才会生效，主要是用来提升网络包的传输效率

| 语法   | tcp_nopush on\|off;    |
| ------ | ---------------------- |
| 默认值 | tcp_nopush off;        |
| 位置   | http、server、location |

3. tcp_nodeplay：该指令必须在 keep-alive 连接开启的情况下才会生效，来提高网络包传输的实时性

| 语法   | tcp_nodelay on\|off;   |
| ------ | ---------------------- |
| 默认值 | tcp_nodelay on;        |
| 位置   | http、server、location |

![](Nginx（5-静态资源）/4.png)

**经过刚才的分析，“tcp_nopush "和”tcp_nodelay“看起来是" 互斥的”，那么为什么要将这两个值都打开？**

三个指令都开启的好处是，sendfile 可以开启高效的文件传输模式，tcp_nopush 开启可以确保在发送到客户端之前数据包已经充分“填满”， 这大大减少了网络开销，并加快了文件发送的速度。 然后，当它到达最后一个可能因为没有“填满”而暂停的数据包时，Nginx 会忽略 tcp_nopush 参数， 然后，tcp_nodelay 强制套接字发送数据。由此可知，TCP_NOPUSH 可以与 TCP_NODELAY 一起设置，它比单独配置 TCP_NODELAY 具有更强的性能

### 使用案例

```tex
sendfile on;
tcp_nopush on;
tcp_nodelay on;
```

## 静态资源压缩

假如在满足上述优化的前提下，我们传送一个 1M 的数据和一个 10M 的数据那个效率高？答案显而易见，传输内容小，速度就会快。那么问题又来了，同样的内容，如果把大小降下来，就是 "压缩"

在 Nginx 的配置文件中可以通过配置 gzip 来对静态资源进行压缩，相关的指令可以配置在 http 块、server 块和 location 块中，Nginx 可以通过以下方式进行解析和处理

1. ngx_http_gzip_module 模块
2. ngx_http_gzip_static_module 模块
3. ngx_http_gunzip_module 模块

### 指令

1. gzip：该指令用于开启或者关闭 gzip 功能

注意：只有该指令为打开状态，下面的指令才有效果

| 语法   | gzip on\|off;          |
| ------ | ---------------------- |
| 默认值 | gzip off;              |
| 位置   | http、server、location |

```plain
http {
    gzip on;
}
```

2. gzip_types：该指令可以根据响应页的 MIME 类型选择性地开启 Gzip 压缩功能

| 语法   | gzip_types mime-type ...; |
| ------ | ------------------------- |
| 默认值 | gzip_types text/html;     |
| 位置   | http、server、location    |

所选择的值可以从 mime.types 文件中进行查找，也可以使用 "*" 代表所有。

```plain
http {
  	gzip_types application/javascript;
}
```

3. gzip_comp_level 指令：该指令用于设置 Gzip 压缩程度，级别从 1-9，1 表示压缩程度最低、压缩效率最高，9 相反

| 语法   | gzip_comp_level level; |
| ------ | ---------------------- |
| 默认值 | gzip_comp_level 1;     |
| 位置   | http、server、location |

```plain
http {
  	gzip_comp_level 6;
}
```

4. gzip_vary：该指令用于设置使用 Gzip 进行压缩发送是否携带“Vary: Accept-Encoding”头域的响应头部，主要是告诉接收方，所发送的数据经过了 Gzip 压缩处理

| 语法   | gzip_vary on\|off;     |
| ------ | ---------------------- |
| 默认值 | gzip_vary off;         |
| 位置   | http、server、location |

![](Nginx（5-静态资源）/5.png)

5. gzip_buffers：该指令用于处理请求压缩的缓冲区数量和大小

| 语法   | gzip_buffers num size;       |
| ------ | ---------------------------- |
| 默认值 | gzip_buffers 32 4k \| 16 8k; |
| 位置   | http、server、location       |

+ num：指定 Nginx 服务器向系统申请缓存空间个数
+ size：每个缓存空间的大小。主要实现的是申请 number 个每个大小为 size 的内存空间。这个值的设定一般会和服务器的操作系统有关，所以建议此项不设置，使用默认值即可
6. gzip_disable：针对不同种类客户端发起的请求，可以选择性地开启和关闭 Gzip 功能

| 语法   | gzip_disable regex ...; |
| ------ | ----------------------- |
| 默认值 |                         |
| 位置   | http、server、location  |

regex：根据客户端的浏览器标志(user-agent)来设置，支持使用正则表达式。指定的浏览器标志不使用 Gzip，该指令一般是用来排除一些明显不支持 Gzip 的浏览器。

```plain
gzip_disable "MSIE [1-6]\.";
```

7. gzip_http_version：针对不同的 HTTP 协议版本，可以选择性地开启和关闭 Gzip 功能

该指令是指定使用 Gzip 的 HTTP 最低版本，该指令一般采用默认值即可。

| 语法   | gzip_http_version 1.0\|1.1; |
| ------ | --------------------------- |
| 默认值 | gzip_http_version 1.1;      |
| 位置   | http、server、location      |

8. gzip_min_length：该指令针对传输数据的大小，可以选择性地开启和关闭 Gzip 功能

| 语法   | gzip_min_length length; |
| ------ | ----------------------- |
| 默认值 | gzip_min_length 20;     |
| 位置   | http、server、location  |

9. gzip_proxied：该指令设置是否对服务端返回的结果进行 Gzip 进行压缩

| 语法   | gzip_proxied off\|expired\|no-cache\|no-store\|private\|no_last_modified\|no_etag\|auth\|any; |
| ------ | ------------------------------------------------------------ |
| 默认值 | gzip_proxied off;                                            |
| 位置   | http、server、location                                       |

+ off：关闭 Nginx 服务器对后台服务器返回结果的 Gzip 压缩
+ expired：启用压缩，如果 header 头中包含“Expires”头信息
+ no-cache：启用压缩，如果 header 头中包含“Cache-Control: no-cache”头信息
+ no-store：启用压缩，如果 header 头中包含“Cache-Control: no-store”头信息
+ private：启用压缩，如果 header 头中包含“Cache-Control: private”头信息
+ no_last_modified：启用压缩，如果 header 头中不包含 “Last-Modified”头信息
+ no_etag：启用压缩，如果 header 头中不包含“ETag” 头信息
+ auth：启用压缩，如果 header 头中包含“Authorization” 头信息
+ any：无条件启用压缩

### 使用案例

```plain
gzip on;  			  			# 开启gzip功能
gzip_types *;		  			# 压缩源文件类型,根据具体的访问资源类型设定
gzip_comp_level 6;	  			# gzip压缩级别
gzip_min_length 1024; 			# 进行压缩响应页面的最小长度,content-length
gzip_buffers 4 16K;	  			# 缓存空间大小
gzip_http_version 1.1;  		# 指定压缩响应所需要的最低HTTP请求版本
gzip_vary  on;		  			# 往头信息中添加压缩标识
gzip_disable "MSIE [1-6]\."; 	# 对IE6以下的版本都不进行压缩
gzip_proxied  off;	  			# nginx作为反向代理压缩服务端返回数据的条件
```

### Gzip 和 sendfile 共存问题

开启 sendfile 以后，在读取磁盘上的静态资源文件的时候，可以减少拷贝的次数，可以不经过用户进程将静态文件通过网络设备发送出去，但是 Gzip 要想对资源压缩，是需要经过用户进程进行操作的。所以如何解决两个设置的共存问题。可以使用 ngx_http_gzip_static_module 模块的 gzip_static 指令来解决。

gzip_static：检查与访问资源同名的.gz 文件时，response 中以 gzip 相关的 header 返回.gz 文件的内容

| 语法   | gzip_static on\|off\|always; |
| ------ | ---------------------------- |
| 默认值 | gzip_static off;             |
| 位置   | http、server、location       |

on 和 always 的区别：

1. on：浏览器的版本支持是才会压缩
2. always：无论浏览器的版本是否支持都会进行压缩

## 缓存处理

### web 缓存类型

Web 缓存是指一个 Web 资源（如 html 页面、图片、js 数据等）存在于 Web 服务器和客户端（浏览器）之间的副本。缓存会根据进来的请求保存输出内容的副本；当下一个请求来到的时候，如果是相同的 URL，缓存会根据缓存机制决定是直接使用副本响应访问请求，还是向源服务器再次发送请求。比较常见的就是浏览器会缓存访问过网站的网页，当再次访问这个 URL 地址的时候，如果网页没有更新，就不会再次下载网页，而是直接使用本地缓存的网页。只有当网站明确标识资源已经更新，浏览器才会再次下载网页

1. 客户端缓存：浏览器缓存
2. 服务端缓存：Nginx、Redis、Memcached 等

### 浏览器缓存

**相关字段**

| header        | 说明                                            |
| ------------- | ----------------------------------------------- |
| Expires       | 缓存过期的日期和时间                            |
| Cache-Control | 设置和缓存相关的配置信息                        |
| Last-Modified | 请求资源最后修改时间                            |
| ETag          | 请求变量的实体标签的当前值，比如：文件的 MD5 值 |

**执行流程**

![](Nginx（5-静态资源）/6.png)

1. 用户首次通过浏览器发送请求到服务端获取数据，客户端是没有对应的缓存，所以需要发送 request 请求来获取数据；
2. 服务端接收到请求后，获取服务端的数据及服务端缓存的允许后，返回 200 的成功状态码并且在响应头上附上对应资源以及缓存信息；
3. 当用户再次访问相同资源的时候，客户端会在浏览器的缓存目录中查找是否存在响应的缓存文件
4. 如果没有找到对应的缓存文件，则走(2)步
5. 如果有缓存文件，接下来对缓存文件是否过期进行判断，过期的判断标准是(Expires),
6. 如果没有过期，则直接从本地缓存中返回数据进行展示
7. 如果 Expires 过期，接下来需要判断缓存文件是否发生过变化
8. 判断的标准有两个，一个是 ETag(Entity Tag), 一个是 Last-Modified
9. 判断结果是未发生变化，则服务端返回 304，直接从缓存文件中获取数据
10. 如果判断是发生了变化，重新从服务端获取数据，并根据缓存协商(服务端所设置的是否需要进行缓存数据的设置)来进行数据缓存。

### 指令

1. expires：该指令用来控制页面缓存的作用，可以通过该指令控制 HTTP 应答中的“Expires”和“Cache-Control”

| 语法   | expires [modified] time<br />expires epoch\|max\|off; |
| ------ | ----------------------------------------------------- |
| 默认值 | expires off;                                          |
| 位置   | http、server、location                                |

+ time：可以整数或负数，指定过期时间。如果是负数，Cache-Control 则为 no-cache（弱缓存）；如果为整数或 0，则 Cache-Control 的值为 max-age = time
+ epoch：指定 Expires 的值为“1 January,1970,00:00:01 GMT”(1970-01-01 00:00:00)，Cache-Control 的值 no-cache
+ max：指定 Expires 的值为“31 December2037 23:59:59GMT”(2037-12-31 23:59:59) ，Cache-Control 的值为 10 年
+ off：默认不缓存。
2. add_header：用来添加指定的响应头和响应值

| 语法   | add_header name value [always]; |
| ------ | ------------------------------- |
| 默认值 |                                 |
| 位置   | http、server、location          |

+ Cache-Control: must-revalidate：可缓存但必须再向源服务器进行确认
+ Cache-Control: no-cache：缓存前必须确认其有效性
+ Cache-Control: no-store：不缓存请求或响应的任何内容
+ Cache-Control: no-transform：代理不可更改媒体类型
+ Cache-Control: public：可向任意方提供响应的缓存
+ Cache-Control: private：仅向特定用户返回响应
+ Cache-Control: proxy-revalidate：要求中间缓存服务器对缓存的响应有效性再进行确认
+ Cache-Control: max-age = \<seconds>：响应最大 Age 值
+ Cache-Control: s-maxage = \<seconds>：公共缓存服务器响应的最大 Age 值

## 跨域

### 同源策略

同源：协议、域名(IP)、端口相同即为同源

```plain
http://192.168.200.131/user/1
https://192.168.200.131/user/1
不

http://192.168.200.131/user/1
http://192.168.200.132/user/1
不

http://192.168.200.131/user/1
http://192.168.200.131:8080/user/1
不

http://www.nginx.com/user/1
http://www.nginx.org/user/1
不

http://192.168.200.131/user/1
http://192.168.200.131:8080/user/1
不

http://www.nginx.org:80/user/1
http://www.nginx.org/user/1
满足
```

### 跨域问题

![](Nginx（5-静态资源）/7.png)

```html
<html>
  <head>
        <meta charset="utf-8">
        <title>跨域问题演示</title>
        <script src="jquery.js"></script>
        <script>
            $(function(){
                $("#btn").click(function(){
                    $.get('http://192.168.200.133:8080/getUser',function(data){
                        alert(JSON.stringify(data));
                    });
                });
            });
        </script>
  </head>
  <body>
        <input type="button" value="获取数据" id="btn"/>
  </body>
</html>
```

```plain
server	{
    listen  8080;
    server_name localhost;
    location /getUser {
        default_type application/json;
        return 200 '{"id":1,"name":"TOM","age":18}';
    }
}

server	{
  	listen 	80;
  	server_name localhost;
  	location / {
        root html;
        index index.html;
  	}
}
```

![](Nginx（5-静态资源）/8.png)

### 解决方法

使用 add_header 添加请求头信息

| 语法   | add_header name value; |
| ------ | ---------------------- |
| 默认值 |                        |
| 位置   | http、server、location |

1. Access-Control-Allow-Origin：允许跨域访问的源地址信息，可以配置多个（多个用逗号分隔），也可以使用*代表所有源
2. Access-Control-Allow-Methods：允许跨域访问的请求方式，值可以为 GET、POST、PUT、DELETE...，可以根据需要设置，多个用逗号分隔

```plain
location /getUser {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods GET,POST,PUT,DELETE;
    default_type application/json;
    return 200 '{"id":1,"name":"TOM","age":18}';
}
```

## 防盗链

盗链是指服务提供商自己不提供服务的内容，通过技术手段绕过其它有利益的最终用户界面（如广告），直接在自己的网站上向最终用户提供其它服务提供商的服务内容，骗取最终用户的浏览和点击率。受益者不提供资源或提供很少的资源，而真正的服务提供商却得不到任何的收益。

### 使用案例

101 为服务站点，102 为网关服务器，103 访问 102 进行盗链

1. 102 的 nginx.config

```plain
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;

    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        location / {
        	# 访问101服务站点
            proxy_pass http://192.168.8.101:8080;
        }
           
        location ^~/images/ {
            root   /www/resources;
        }
       
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

2. 103 的 nginx.config

```plain
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        location / {
            proxy_pass http://192.168.8.102;
        }
         
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

![](Nginx（5-静态资源）/9.png)

### 实现原理

当浏览器向 web 服务器发送请求的时候，一般都会带上 Referer 来告诉浏览器该网页是从哪个页面链接过来的。后台服务器可以根据获取到的这个 Referer 信息来判断是否为自己信任的网站地址，如果是则放行继续访问，如果不是则可以返回 403(服务端拒绝访问)的状态信息

![](Nginx（5-静态资源）/10.png)

![](Nginx（5-静态资源）/11.png)

**valid_referers**

可以同时携带多个参数，表示多个 referer 头部都生效，nginx 会通过查看 referer 自动和 valid_referers 后面的内容进行匹配，如果匹配到了就将 $invalid_referer变量置0，如果没有匹配到，则将$invalid_referer 变量置为 1，匹配的过程中不区分大小写

| 语法   | valid_referers none\|blocked\|server_names\|string... |
| ------ | ----------------------------------------------------- |
| 默认值 |                                                       |
| 位置   | server、location                                      |

1. none：允许没有 referer 信息的请求访问
2. blocked：请求头 referer 字段不为空，但是值可以为空（值被代理或者防火墙删除了），并且允许 refer 允许“http://”或“https://”以外的请求
3. server_names：若 referer 中站点域名与 server_name 中本机域名某个匹配，则允许该请求访问
4. 其他字符串类型：检测 referer 与字符串是否匹配，如果匹配则允许访问，可以采用通配符*
5. 正则表达式：若 referer 的值匹配上了正则，则允许访问，正则表达式需要以~开头

```plain
server {
    server_name referer.test.com;
    listen 80;

    error_log logs/myerror.log debug;
    root html;
    location / {
        valid_referers 	none 
              			server_names
                       	*.test.com 
                		www.test.org.cn/nginx/;
        if ($invalid_referer) {
            return 403; # 返回错误码
        }
        return 200 'valid\n';
    }
}

# none：表示没有 referer 的可以访问
# server_names：表示本机 server_name 也就是 referer.test.com 可以访问
# *.test.com：匹配上了正则的可以访问
# www.test.org.cn/nginx/：该页面发起的请求可以访问
```

invalid_referer 变量：

1. 允许访问时变量值为空
2. 不允许访问时变量值为 1

### 防盗链配置

在 102.config 设置 invalid_referer 变量

```plain
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        location / {
            proxy_pass http://192.168.8.101:8080;
        }    
        
        location ^~/images/ {
          	# valid_referers 指令，配置是否允许 referer 头部以及允许哪些 referer 访问。192.168.8.102不是ip而是域名（去掉http:// 前缀）
            valid_referers 192.168.8.102; 
            if ($invalid_referer) {  # 注意这里if后要加空格
                return 403; ## 返回错误码
            }         
            root   /www/resources;
        }
        
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

![](Nginx（5-静态资源）/12.png)

![](Nginx（5-静态资源）/13.png)

## Rewrite

### 地址重写与转发

1. 地址重写浏览器地址会发生变化而地址转发则不变
2. 一次地址重写会产生两次请求，而一次地址转发只会产生一次请求
3. 地址重写到的页面必须是一个完整的路径而地址转发则不需要
4. 地址重写因为是两次请求，所以 request 范围内属性不能传递给新页面；而地址转发因为是一次请求，所以可以传递值
5. 地址转发速度快于地址重写

### 常用全局变量

| 变量               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| $args              | 变量中存放了请求URL中的请求指令。比如http://192.168.200.133:8080?arg1=value1&arg2=value2中的"arg1=value1&arg2=value2"，功能和$ query_string 一样 |
| $http_user_agent   | 变量存储的是用户访问服务的代理信息（如果通过浏览器访问，记录的是浏览器的相关版本信息） |
| $host              | 变量存储的是访问服务器的 server_name 值                        |
| $document_url      | 变量存储的是当前访问地址的URI，比如http://192.168.200.133/server?id=10&name=zhangsan中的"/server"，功能和$ uri 一样 |
| $document_root     | 变量存储的是当前请求对应 location 的 root 值，如果未设置，默认指向 Nginx 只带 html 目录所在位置 |
| $content_length    | 变量存储的是请求头中的 Content-Length 的值                     |
| $content_type      | 变量存储的是请求头中的 Content-Type 的值                       |
| $http_cookie       | 变量存储的是客户端的 cookie 信息，可以通过 add_header Set-Cookie 'cookieName = cookieValue'来添加 cookie 数据 |
| $limit_rate        | 变量中存储的是 Nginx 服务器对网络连接速率的限制，即 Nginx 配置中对 limit_rate 指令设置的值，默认是 0，不限制 |
| $remote_addr       | 变量中存储的是客户端的 IP 地址                                 |
| $remote_port       | 变量中存储了客户端与服务端建立连接的端口号                   |
| $remote_user       | 变量中存储了客户端的用户名，需要有认证模块才能获取           |
| $scheme            | 变量中存储了访问协议                                         |
| $server_addr       | 变量中存储了服务端的地址                                     |
| $server_name       | 变量中存储了客户端请求到达的服务器的名称                     |
| $server_port       | 变量中存储了客户端请求到达的服务器的端口号                   |
| $server_protocol   | 变量中存储了客户端请求协议的版本，比如 " HTTP/1.1 "             |
| $request_body_file | 变量中存储了发给后端服务器的本地文件资源的名称               |
| $request_method    | 变量中存储了客户端的请求方式，比如 " GET "、“POST”请求          |
| $request_filename  | 变量中存储了当前请求的资源文件的路径名                       |
| $request_uri       | 变量中存储了当前请求的 URI，并且携带请求参数，比如 http://192.168.200.133/server?id = 10&name = zhangsan 中的 "/server?id = 10&name = zhangsan " |

### 指令

1. set：该指令用来设置一个新的变量

| 语法   | set $variable value; |
| ------ | -------------------- |
| 默认值 |                      |
| 位置   | server、location、if |

+ variable：变量的名称，该变量名称要用 "$" 作为变量的第一个字符，且不能与 Nginx 服务器预设的全局变量同名。
+ value：变量的值，可以是字符串、其他变量或者变量的组合等。

```plain
server	{
    listen 8081;
    server_name localhost;

    location /server {
        set $name TOM;
        set $age 18;
        default_type text/plain;
        return 200 $name=$age;
    }
}
```

2. if：该指令用来支持条件判断，并根据条件判断结果选择不同的 Nginx 配置

| 语法   | if(condition) {...} |
| ------ | ------------------- |
| 默认值 |                     |
| 位置   | server、location    |

condition 为判定条件，支持以下写法：

+ 变量名。如果变量名对应的值为空或者是 0，if 都判断为 false, 其他条件为 true。

```plain
if ($param){
	
}
```

+ 使用 "=" 和 "!=" 比较变量和字符串是否相等，满足条件为 true，不满足为 false

```plain
if ($request_method = POST){
  	return 405;
}
```

+ 使用正则表达式对变量进行匹配，匹配成功返回 true，否则返回 false。变量与正则表达式之间使用 "“,”\*“,”!“,”!*" 来连接 <font style="background-color:#FBDE28;">（TODO）</font>

"~" 代表匹配正则表达式过程中区分大小写

"~*" 代表匹配正则表达式过程中不区分大小写

"!" 和 "!*" 刚好和上面取相反值，如果匹配上返回 false，匹配不上返回 true

```plain
if ($http_user_agent ~ MSIE){
  	#$http_user_agent的值中是否包含MSIE字符串，如果包含返回true
}
```

注意：正则表达式字符串一般不需要加引号，但是如果字符串中包含 "}“或者是”;" 等字符时，就需要把引号加上

+ 判断请求的文件是否存在使用 "-f" 和 "!-f"

当使用 "-f" 时，如果请求的文件存在返回 true，不存在返回 false。

当使用 "!-f" 时，如果请求文件不存在，但该文件所在目录存在返回 true, 文件和目录都不存在返回 false, 如果文件存在返回 false

```plain
if (-f $request_filename){
	#判断请求的文件是否存在
}
if (!-f $request_filename){
	#判断请求的文件是否不存在
}
```

+ 判断请求的目录是否存在使用 "-d" 和 "!-d"

当使用 "-d" 时，如果请求的目录存在，if 返回 true，如果目录不存在则返回 false

当使用 "!-d" 时，如果请求的目录不存在但该目录的上级目录存在则返回 true，该目录和它上级目录都不存在则返回 false, 如果请求目录存在也返回 false

+ 判断请求的目录或者文件是否存在使用 "-e" 和 "!-e"

当使用 "-e"，如果请求的目录或者文件存在时，返回 true，否则返回 false

当使用 "!-e"，如果请求的文件和文件所在路径上的目录都不存在返回 true，否则返回 false

+ 判断请求的文件是否可执行使用 "-x" 和 "!-x"

当使用 "-x"，如果请求的文件可执行，返回 true, 否则返回 false

当使用 "!-x"，如果请求文件不可执行，返回 true, 否则返回 false

3. break：该指令用于中断当前相同作用域中的其他 Nginx 配置。与该指令处于同一作用域的 Nginx 配置中，位于它前面的指令配置生效，位于后面的指令配置无效。并且 break 还有另外一个功能就是终止当前的匹配，并把当前的 URI 的本 location 中进行重定向访问

| 语法   | break;               |
| ------ | -------------------- |
| 默认值 |                      |
| 位置   | server、location、if |

```plain
location / {
  	if ($param)	{
        set $id $1;
        break;
        limit_rate 10k;
  	}
}
```

4. return：该指令用于完成对请求的处理，直接向客户端返回响应状态代码。在 return 后的所有 Nginx 配置都是无效的。

| 语法   | return code [text];<br />return code URL;<br />return URL; |
| ------ | ---------------------------------------------------------- |
| 默认值 |                                                            |
| 位置   | server、location、if                                       |

+ code：为返回给客户端的 HTTP 状态代理。可以返回的状态代码为 0~999 的任意 HTTP 状态代理
+ text：为返回给客户端的响应体内容，支持变量的使用
+ URL：为返回给客户端的 URL 地址

```plain
location /testreturn {
    default_type application/json;
    return 200 '{id:1,name:zs}';
}

location /testurl {
    default_type application/json;
    return 200 https://www.baidu.com;
}
```

5. rewrite：该指令通过正则表达式的使用来改变 URI。可以同时存在一个或者多个指令，按照顺序依次对 URL 进行匹配和处理。

| 语法   | rewrite regex replacement [flag]; |
| ------ | --------------------------------- |
| 默认值 |                                   |
| 位置   | server、location、if              |

+ regex：用来匹配 URI 的正则表达式
+ replacement：匹配成功后，用于替换 URI 中被截取内容的字符串。如果该字符串是以 "http://" 或者 "https://" 开头的，则不会继续向下对 URI 进行其他处理，而是直接返回重写后的 URI 给客户端。

+ flag：用来设置 rewrite 对 URI 的处理行为，可选值有如下：

```tex
last：本条规则匹配完成后继续向下匹配新的 location URI 规则
break：本条规则匹配完成后终止，不在匹配任何规则
redirect：返回 302 临时重定向
permanent：返回 301 临时重定向
```

```tex
location /rewrite {
    rewrite ^/rewrite/url\w*$ https://www.baidu.com;
    rewrite ^/rewrite/(test)\w*$ /$1;
    rewrite ^/rewrite/(demo)\w*$ /$2;
}

location /test {
    default_type text/plain;
    return 200 test_sucess;
}

location /demo {
    default_type text/plain;
    return 200 demo_sucess;
}
```

6. rewrite_log：该指令配置是否开启 URL 重写日志的输出功能。

| 语法   | rewrite_log on\|off;       |
| ------ | -------------------------- |
| 默认值 | rewrite_log off;           |
| 位置   | http、server、location、if |

```plain
rewrite_log on;
error_log logs/error.long notice;
```

开启后，URL 重写的相关日志将以 notice 级别输出到 error_log 指令配置的日志文件汇总。

### 使用案例

#### 域名跳转

```plain
server {
  	listen 80;
  	server_name www.hm.com;
  	location /	{
        root /usr/local/nginx/html/hm;
        index index.html;
  	}
}
```

通过 Rewrite 完成将 www.360buy.com 的请求跳转到 www.jd.com

```plain
server {
  	listen 80;
  	server_name www.360buy.com;
  	rewrite ^/ http://www.jd.com permanent;
}
```

1. 在域名跳转的过程中携带请求的 URI

```plain
server {
  	listen 80;
  	server_name www.itheima.com;
  	rewrite ^(.*) http://www.hm.com$1 permanent;
}
```

2. 通过 Rewrite 实现多个域名的跳转

```plain
server	{
  	listen 80;
  	server_name www.360buy.com www.jingdong.com;
  	rewrite ^(.*) http://www.jd.com$1 permanent;
}
```

#### 域名镜像

上述案例中，将 www.360buy.com 和 www.jingdong.com 都能跳转到 www.jd.com，那么 www.jd.com 我们就可以把它起名叫主域名，其他两个就是我们所说的镜像域名，当然如果我们不想把整个网站做镜像，只想为其中某一个子目录下的资源做镜像，我们可以在 location 块中配置 rewrite 功能

```plain
server {
  	listen 80;
  	server_name rewrite.myweb.com;
    
  	location ^~ /source1{
		rewrite ^/resource1(.*) http://rewrite.myweb.com/web$1 last;
  	}
    
  	location ^~ /source2{
		rewrite ^/resource2(.*) http://rewrite.myweb.com/web$1 last;
  	}
}
```

#### 独立域名

为每一个模块设置独立的域名

```plain
http://search.hm.com  访问商品搜索模块
http://item.hm.com	  访问商品详情模块
http://cart.hm.com	  访问商品购物车模块
```

```plain
server	{
  	listen 80;
  	server_name search.hm.com;
  	rewrite ^(.*) http://www.hm.com/bbs$1 last;
}

server	{
  	listen 81;
  	server_name item.hm.com;
  	rewrite ^(.*) http://www.hm.com/item$1 last;
}

server	{
  	listen 82;
  	server_name cart.hm.com;
  	rewrite ^(.*) http://www.hm.com/cart$1 last;
}
```

#### 目录自动添加 "/"

```plain
server {
  	listen	80;
  	server_name localhost;
  	location / {
        root html;
        index index.html;
  	}
}
```

通过 [http://192.168.200.133](http://192.168.200.133) 直接就能访问，地址后面不需要加/，但是如果将上述的配置修改为如下内容

```plain
server {
  	listen	80;
  	server_name localhost;
  	location /hm {
        root html;
        index index.html;
  	}
}
```

这个时候，要想访问上述资源，按照上述的访问方式，我们可以通过 [http://192.168.200.133/hm/](http://192.168.200.133/hm/) 来访问，但是如果地址后面不加斜杠，页面就会出问题。如果不加斜杠，Nginx 服务器内部会自动做一个 301 的重定向，重定向的地址会有一个指令叫 `server_name_in_redirect on|off;` 来决定重定向的地址：

```plain
如果该指令为on，重定向的地址为:  http://server_name/目录名/;
如果该指令为off，重定向的地址为:  http://原URL中的域名/目录名/;
```

所以就拿刚才的地址来说，[http://192.168.200.133/hm](http://192.168.200.133/hm) 如果不加斜杠，那么按照上述规则，如果指令 server_name_in_redirect 为 on，则 301 重定向地址变为 [http://localhost/hm/](http://localhost/hm/,)，如果为 off，则 301 重定向地址变为 [http://192.168.200.133/hm/](http://192.168.200.133/ht/)。后面这个是正常的，前面地址就有问题。

注意 server_name_in_redirect 指令在 Nginx 的 0.8.48 版本之前默认都是 on，之后改成了 off，所以现在我们这个版本不需要考虑这个问题，但是如果是 0.8.48 以前的版本并且 server_name_in_redirect 设置为 on

可以使用 rewrite 功能为末尾没有斜杠的 URL 自动添加一个斜杠

```plain
server {
  	listen	80;
  	server_name localhost;
  	server_name_in_redirect on;
  	location /hm {
        if (-d $request_filename)	{
            rewrite ^/(.*)([^/])$ http://$host/$1$2/ permanent;
        }
  	}
}
```

#### 合并目录

搜索引擎优化（SEO）是一种利用搜索引擎的搜索规则来提供目的网站的有关搜索引擎内排名的方式。我们在创建自己的站点时，可以通过很多中方式来有效的提供搜索引擎优化的程度。其中有一项就包含 URL 的目录层级一般不要超过三层，否则的话不利于搜索引擎的搜索也给客户端的输入带来了负担，但是将所有的文件放在一个目录下又会导致文件资源管理混乱并且访问文件的速度也会随着文件增多而慢下来，这两个问题是相互矛盾的

举例，网站中有一个资源文件的访问路径时 /server/11/22/33/44/20.html，也就是说 20.html 存在于第 5 级目录下，如果想要访问该资源文件，客户端的 URL 地址就要写成 [http://www.web.name/server/11/22/33/44/20.html](http://www.web.name/server/11/22/33/44/20.html)。但是这个是非常不利于 SEO 搜索引擎优化的，同时客户端也不好记。使用 rewrite 我们可以进行如下配置

```plain
server {
  	listen 80;
  	server_name www.web.name;
  	location /server {
        rewrite ^/server-([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)\.html$ /server/$1/$2/$3/$4/$5.html last;
  	}
}
```

客户端只需要输入 [http://www.web.name/server-11-22-33-44-20.html](http://www.web.name/server-11-22-33-44-20.html) 就可以访问到 20.html 页面了

