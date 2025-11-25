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

## 开发准备

### 运行环境
Ajax 技术需要运行在网站服务器环境中才能生效，我们学习 Ajax 可以使用 Node 创建的服务器作为网站服务器

### 使用 express
创建 js 文件，编写代码

```javascript
// 1、引入 express
// const express = require('express');
import express from 'express';

// 2、创建应用对象
const app = express();

// 3、创建路由规则
// request 请求报文的封装
// response 响应报文的封装
app.get('/', (request, response) => {
    // 设置响应
    response.send('Hello Express');
});

// 4、监听端口启动服务
app.listen(8000, () => {
    console.log("服务已经启动，8000 端口监听中...");
});
```

再次打开终端，键入命令 `node js文件名`

```shell
node 01-express基本使用.js
```

出现服务已经启动，8000 端口监听中...字样，说明启动成功

我们打开浏览器，访问 `http://127.0.0.1:8000/`，出现 `Hello Express` 字样，验证 OK

### 案例前准备
```html
...
<style>
    #result {
        width: 200px;
        height: 100px;
        border: 1px solid #90b;
    }
</style>
...
<button>点击发送请求</button>
<div id="result"></div>
```

对路由规则稍作修改

```javascript
app.get('/server', (request, response) => {
    // 设置响应头，设置允许跨域
    response.setHeader('Access-Control-Allow-Origin', '*');
    // 设置响应体
    response.send('Hello Express');
});
```

按照上述步骤启动 express 后，浏览器访问 `http://127.0.0.1:8000/server`，能够正常访问，并且响应头中出现我们设置的头部信息即可

![](Ajax（2-基本使用）/1.png)

## AJAX 使用
### GET 请求

```js
// 1.创建对象 
const xhr = new XMLHttpRequest();
// 2.初始化，告诉 Ajax 请求方式和请求地址 以何种方式发送请求，向哪发送请求。
xhr.open('GET', 'http://127.0.0.1:8000/server');
// 3.发送请求
xhr.send();
// 4.事件绑定，处理服务器端返回的结果  
//xhr.onreadystatechange = function () {...}
xhr.onload = function () {
	console.log(xhr.responseText);
}
```

响应受到网络环境的影响，发送请求以后不能直接去接收数据（例如网络拥挤导致服务器延迟响应），而是要使用 onload 方法监听服务器的响应状态。responseText 是服务器响应的数据内容

1. `readeyState` 

- `0`：请求未初始化（还没有调用 `open()`）
- `1`：请求已经建立，但是还没有发送（还没有调用 `send()`）
- `2`：请求已经发送
- `3`：请求正在处理中，通常响应中已经有部分数据可以用了
- `4`：响应已经完成，可以获取并使用服务器的响应了

```js
let xhr = new XMLHttpRequest();
// xhr 创建，未初始化
console.log(xhr.readyState); // 0
xhr.open('get', 'http://localhost:3001/readystate');
// xhr 初始化，还未发送
console.log(xhr.readyState); // 1
xhr.onreadystatechange = function () {
    // 时刻监听 ajax 状态码的变化
    console.log(xhr.readyState); // 2 3 4
}
xhr.send();
```

2. `status`：状态码 

```js
let xhr = new XMLHttpRequest();
xhr.open('get', 'http://localhost:3001/http');
xhr.send();

xhr.onreadystatechange = function () {
    // 当 ajax 状态码为 4，意味着服务器成功接收到请求
    // 当 http 状态码为 200，意味着客户端成功接收到数据，交易成功
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.log(xhr.responseText);
    }
}
```

3. `statusText`：状态字符串 

4. `getAllResponseHeaders()`：响应头 

5. `response`：响应体 

**onload 与 onreadystatechange 比较**

| 区别描述                 | `onload` 事件 | `onreadystatechange` 事件 |
| ------------------------ | ------------- | ------------------------- |
| 是否兼容 IE 低版本         | 不兼容        | 兼容                      |
| 是否需要判断 Ajax 状态码 | 不需要        | 需要                      |
| 被调用次数               | 一次          | 多次                      |

**完整代码**

```javascript
const result = document.getElementById('result');
// 按钮绑定事件
const button = document.getElementsByTagName('button')[0];
button.onclick = function () {
    // 1、创建对象
    const xhr = new XMLHttpRequest();
    // 2、初始化
    xhr.open('GET', 'http://127.0.0.1:8000/server');
    // 3、发送
    xhr.send();
    // 4、事件绑定，处理服务器端返回的结果
    xhr.onreadystatechange = function () {
        // 服务端返回所有结果
        if (this.readyState === 4) {
            // 2xx 成功
            if (this.status >= 200 && this.status < 300) {
                // 状态码、状态字符串
                console.log(this.status); // 200
                console.log(this.statusText); // OK
                // 响应头
                console.log(this.getAllResponseHeaders()); // content-length: 13  content-type: text/html; charset = utf-8
                // 响应体
                console.log(this.response); // Hello Express
                // 将响应体内容设置为文本
                result.innerHTML = this.response;
            }
        }
    };
}
```

**效果**

![](Ajax（2-基本使用）/2.gif)

#### 设置请求体
```javascript
xhr.open('GET', 'http://127.0.0.1:8000/server?a=100&b=200&c=300');
```

### POST 请求
```javascript
const result = document.getElementById('result');
result.addEventListener('mouseover', function () {
    const xhr = new XMLHttpRequest();
    // 拼接参数
    let params = 'username=' + nameValue + '&age=' + ageValue;
    xhr.open('POST', 'http://127.0.0.1:8000/server');
    // 设置请求参数格式的类型（post 方式必须设置）
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // post 请求的参数写在 send 方法里面
    xhr.send(params);
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
            result.innerHTML = this.response;
        }
    };
});
```

#### 设置请求体
可以设置任意类型、任意格式的数据，只要服务器端有与之对应的处理方式即可

从语法上来说，请求体格式非常灵活；但实际使用场景中，一般会按照特定格式书写（如 JSON）

1. application/x-www-form-urlencoded

```javascript
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
xhr.send('a=100&b=200&c=300');
```

2. application/json

```javascript
let xhr = new XMLHttpRequest();
xhr.open('post', 'http://localhost:3001/json');
let params = {name: 'zhangsan', age: '20', sex: '男'};
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(JSON.stringify(params));
```

### 设置请求头
#### 预定义请求头
在初始化之后、发送请求之前，可以设置请求头信息

```javascript
xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
```

![](Ajax（2-基本使用）/3.png)

#### 自定义请求头
除了可以设置上述预定义的请求头信息，也可以设置自定义的请求头信息

```javascript
xhr.setRequestHeader('name', 'atguigu');
```

### 请求超时
```javascript
// 设置延时发送响应报文
setTimeout(() =>{
    response.send('Hello Ajax');
}, 2000);
```

**效果**

![](Ajax（2-基本使用）/4.gif)

我们这里为模拟超时而设置的延时时间较短，但是一般情况下，请求时间如果过长的话必须要进行处理

如果请求超时，则应该给出相应的超时提醒，一方面可以减少网络带宽资源的占用，一方面也可以提升用户体验

**那么要怎么设置超时的相关信息呢？**

1. 超时时间：`timeout`
2. 超时回调：`ontimeout`

```javascript
// 设置超时时间
xhr.timeout = 1000;
// 设置超时回调
xhr.ontimeout = () => {
    alert('请求超时！');
};
```

**效果**

![](Ajax（2-基本使用）/5.gif)

可以看到，当请求时间超过我们设置的 `timeout` 时长后，就会调用超时回调函数，并且还能看到网络请求状态变成了 `(canceled)`

### 网络异常
除了服务器响应时间较长导致 `请求超时` 之外，还有可能因为我们的网速或者其他网络问题导致请求失败，我们可以添加一个 `onerror` 回调函数，对此类问题进行处理

```javascript
// 设置网络异常回调
xhr.onerror = () => {
    alert("网络异常");
};
```

我们将 Chrome 的网络控制台状态切换为 `offline`，模拟断网环境下的请求

![](Ajax（2-基本使用）/6.gif)

可以看到，这里提示了 `网络异常`，也就是走了 `onerror` 的回调函数，且状态变成了 `(failed) net::ERR_INTERNET_DISCONNECTED`

### 同步异步
```javascript
let xhr = new XMLHttpRequest();
xhr.open('get', 'http://localhost:3001/first');
xhr.send();
console.log('普通同步事件A'); // (1)
setTimeout(() => {
    console.log('时间异步事件A'); // (2)
}, 2000);
setTimeout(() => {
    console.log('时间异步事件B');  // (3)
}, 1000);
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.log('异步请求事件X'); // (4)
        console.log(xhr.responseText);
    }
}
console.log('普通同步事件B'); // (5)
```

异步代码虽然需要花费时间去执行，但程序不会等待异步代码执行完成后再继续执行后续代码，而是直接执行后续代码，当后续代码执行完成后再回头看异步代码是否返回结果，如果已有返回结果，再调用事先准备好的回调函数处理异步代码执行的结果。

按照 JS 同步异步的原理，首先执行同步事件，然后执行异步事件。(1) 和 (5) 处都是同步事件，依序执行。(2) 和 (3) 中的 setTimeout 事件本身是同步事件，但是内部接收的函数参数为异步事件，以及异步请求事件 (4)。这些异步事件将被放到异步事件队列中，等待同步事件执行完后按照 “先进先出” 顺序执行。进入异步事件队列的按照时间为：(4)、(3)、(2)，这也是执行顺序。 最后输出结果如下：

![](Ajax（2-基本使用）/7.png)

### 手动取消请求

`abort()` 方法：手动取消请求

```javascript
const btns = document.getElementsByTagName('button');
const btn1 = btns[0];
const btn2 = btns[1];

let xhr = null;
btn1.addEventListener('click', () => {
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://127.0.0.1:8000/server-timeout');
    xhr.send();
});
btn2.addEventListener('click', () => {
    xhr.abort();
});
```

**效果**

![](Ajax（2-基本使用）/8.gif)

### 请求重复发送
如果服务器响应相对比较慢，而用户因为得不到响应而频繁地点击按钮。那么，浏览器短时间内会向服务器发起大量重复的请求，服务器就要对这些请求进行频繁的处理，服务器端的压力就会非常的大

**那么有什么办法可以解决请求重复发送的问题呢？**

思路：发送一个请求之前，查询之前是否有正在进行处理的相同请求，如果有，则取消之前的相同请求，发送一个新的请求。这样保证同一个请求同一时间内只会有一个，这样服务器的压力就会小一些

```javascript
const btns = document.getElementsByTagName('button');
let xhr = null;
// 标识是否正在发送 AJAX 请求
let isSending = false;
btns[0].addEventListener('click', () => {
    // 若上一个请求尚未完成，则手动取消请求
    if (isSending) {
        xhr.abort();
    }
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://127.0.0.1:8000/servertimeout');
    xhr.send();
    xhr.onreadystatechange = () => {
        // 请求响应完毕后，修改变量标识
        if (xhr.readyState === 4) {
            isSending = true;
        }
    };
});
```

**效果**

![](Ajax（2-基本使用）/9.gif)

可以看出，如果频繁的点击按钮，发起同一个请求，则每次发起一个新的请求之前，都会取消上一个请求的发送

### 低版本 IE 浏览器缓存问题

问题：在低版本的 IE 浏览器中，Ajax 请求有严重的缓存问题，即在请求地址不发生变化的情况下，只有第一次请求会真正发送到服务器端，后续的请求都会从浏览器的缓存中获取结果。即使服务器端的数据更新了，客户端依然拿到的是缓存中的旧数据。

解决方案：在请求地址的后面 加请求参数，保证每一次请求中的请求参数的值不相同。

```js
xhr.open('get', 'http://www.example.com?t=' + Math.random());
```

### 服务器响应 JSON 数据

修改 `server.js` 中 `send` 方法中的内容，需要注意的是该方法只能接收字符串和 `buffer`，所以对其需要做转换

```javascript
const data = {
    name:'Hello Ajax'
}
let str = JSON.stringify(data);
response.send(str);
```

```javascript
const result = document.getElementById('result');
window.onkeydown = function () {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:8000/server-json');
    xhr.send();
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
            console.log(this.response);
            result.innerHTML = this.response;
        }
    };
}
```

**效果**

![](Ajax（2-基本使用）/10.gif)

上述返回数据比较简单，获取其中内容相对方便。一旦结果比较复杂，想要提取某些数据，就会很麻烦

这时候就需要对返回结果进行处理

#### 手动转换数据

因为我们服务端返回的是 `json` 字符串内容，所以 `response` 的内容类型也是字符串

这个时候使用 `JSON` 工具方法，可以将 `json` 字符串转换为 `json` 对象

```javascript
let response = this.response;
console.log(typeof response); // string
data = JSON.parse(response);
result.innerHTML = data.name;
```

![](Ajax（2-基本使用）/11.gif)

#### 自动转换数据

```javascript
// 设置响应体类型
xhr.responseType = 'json';
```

这样在获取结果就是 `json` 对象了，不用进行手动转换即可使用

```javascript
let response = this.response;
console.log(typeof response); // object
result.innerHTML = response.name;
```

## jQuery 发送 AJAX 请求
1.  jQuery 脚本  

```html
<script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
```

2.  bootstrp 脚本  

```html
<link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.0.2/css/bootstrap.css" rel="stylesheet">
```

### GET 请求
```javascript
$.get(url,[data],[callback],[type])
```

1. `url`：请求的 URL 地址
2. `data`：请求携带的参数
3. `callback`：载入成功时回调函数
4. `type`：设置返回内容格式，xml，html，script，ison，text，_default

```javascript
btns.eq(0).click(() => {
    $.get('http://127.0.0.1:8000/server-jquery', { a: 100, b: 200 }, (data) => {
        console.log(typeof data, data); // object {name: "Hello jquery"}
    }, 'json');
});
```

![](Ajax（2-基本使用）/12.png)

### POST 请求
```plain
$.post(url,[data],[callback],[type])
```

1. `url`：请求的 URL 地址
2. `data`：请求携带的参数
3. `callback`：载入成功时回调函数
4. `type`：设置返回内容格式，xml，html，script，ison，text，_default

```javascript
btns.eq(1).click(() => {
    $.post('http://127.0.0.1:8000/server-jquery', { a: 100, b: 200 }, (data) => {
        console.log(typeof data, data); // string {name: "Hello jquery"}
    });
});
```

![](Ajax（2-基本使用）/13.png)

### 通用方法
```javascript
$.ajax({
    // 请求地址
    url: 'http://127.0.0.1:8000/server-jquery',
    // 请求参数
    data: { a: 100, b: 200 },
    // 请求类型
    type: 'GET',
    // 设置请求参数类型
    contentType: 'application/x-www-form-urlencoded',
    // 头信息
    headers: {
        c: 300,
        d: 400
    },
    // 响应体类型
    dataType: 'json',
    // 设置请求发送前的要做的事情
    beforeSend: function () { 
        // 阻断请求的发送
        return false
    },
    // 请求成功后要做的事情
    success: data => {
        console.log(typeof data, data); // string {name: "Hello jquery"}  开启 dataType 后：object {name: "Hello jquery"}
    },
    // 超时时间
    timeout: 1000,
    // 失败的回调
    error: () => {
        alert('出错了');
    }
});
```

**error 回调**

![](Ajax（2-基本使用）/14.gif)

**error 网络状态**

![](Ajax（2-基本使用）/15.png)

**头信息**

![](Ajax（2-基本使用）/16.png)

## axios 发送 AJAX 请求
### GET 请求

```js
axios.get(url[,config])
```

函数返回结果是一个 `promise` 对象，用 `then` 回调处理

```javascript
axios.defaults.baseURL = 'http://127.0.0.1:8000/';
axios.get('server-axios', {
    // 请求参数
    params: {
        a: 100,
        b: 200
    },
    // 请求头
    headers: {
        c: 300,
        d: 400
    }
}).then(value => {
    console.log(value);
});
```

**请求参数、头信息**

![](Ajax（2-基本使用）/17.png)

**控制台信息**

![](Ajax（2-基本使用）/18.png)

### POST 请求
```js
axios.post(url[,data[,config]])
```

```javascript
axios.post('server-axios', {
    // 请求体
    e: 500,
    f: 600
}, {
    // 请求参数
    params: {
        a: 100,
        b: 200
    },
    // 请求头
    headers: {
        c: 300,
        d: 400
    }
}).then(value => {
    console.log(value);
});
```

**头信息**

![](Ajax（2-基本使用）/19.png)

**请求参数、请求体**

![](Ajax（2-基本使用）/20.png)

### 通用方法
```js
axios(url[, config])
```

```javascript
axios({
    method: 'POST',
    url: 'server-axios',
    // 请求参数
    params: {
        a: 100,
        b: 200
    },
    // 请求头
    headers: {
        c: 300,
        d: 400
    },
    // 请求体
    data: {
        e: 500,
        f: 600
    },
    // 响应体类型
    dataType: 'json'
}).then(response => {
    console.log(response.status); // 200
    console.log(response.statusText); // OK
    console.log(response.headers); // {content-length: "22", content-type: "text/html; charset = utf-8"}
    console.log(typeof response.data, response.data); // object {name: "Hello axios"}
});
```

## fetch 函数发送 AJAX 请求
```javascript
fetch('http://127.0.0.1:8000/server-fetch?a=100&b=100', {
    // 请求方法
    method: 'POST',
    // 请求头
    headers: {
        c: 300,
        d: 400
    },
    // 请求体
    body: 'e=500&f=600'
}).then(response => {
    console.log(response);
});
```

**请求参数、头信息**

![](Ajax（2-基本使用）/21.png)

**请求体信息**

![](Ajax（2-基本使用）/22.png)

**控制台信息**

![](Ajax（2-基本使用）/23.png)

如果我们只想要响应体内容，可以修改 `then` 回调

```javascript
...
.then(response => {
    return response.text();
}).then(response => {
    console.log(typeof response, response); // string {"name": "Hello fetch"}
});
```

如果明确响应体内容为 json 字符串，可以按如下修改，将会返回一个 object 对象

```javascript
...
.then(response => {
    return response.json();
}).then(response => {
    console.log(typeof response, response); // object {"name": "Hello fetch"}
});
```

## 跨域问题
### 同源策略
同源策略（Same-Origin Policy）最早由 Netscape 公司提出，是浏览器的一种安全策略

同源：协议、域名、端口号必须完全相同，**违背同源策略就是跨域**

**server.js 代码**

```javascript
const express = require('express');
const app = express();

app.get('/home', (request, response) => {
    // 响应一个页面
    response.sendFile(__dirname + '/11-同源策略.html');
});
app.get('/data', (request, response) => {
    response.send('用户数据');
});

app.listen(9000, () => {
    console.log("服务已经启动，9000 端口监听中...");
});
```

**js 代码**

```javascript
const xhr = new XMLHttpRequest();
// 这里因为是满足同源策略的，所以 url 可以简写
xhr.open('GET', '/data');
xhr.send();
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        console.log(xhr.response);// 用户数据
    }
};
```

### 如何解决跨域
#### JSONP
JSONP （JSON with Padding），是一个非官方的跨域解决方案，纯粹凭借程序员的聪明才智开发出来，只支持 get 请求

**JSONP 怎么工作的？**

在网页有一些标签天生具有跨域能力，比如：img 、link、 iframe、script

```html
<script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/axios/0.21.1/axios.min.js"></script>
```

JSONP 就是利用 script 标签的跨域能力来发送请求的，我们在 HTML 里加入以下内容

1. html 代码

```html
<div id="result"></div>
<script>
    function handle(data) {
        const result = document.getElementById('result');
        result.innerHTML = data.name;
    }
</script>
<script src="./js/app.js"></script>
```

2. app.js 代码

```javascript
const data = {
    name: 'JSONP'
};
handle(data);
```

我们使用 `live-server` 服务启动项目后，可以获取到 `app.js` 对应的 HTTP 地址

![](Ajax（2-基本使用）/24.png)

我们替换下 `app.js` 的 src 地址

```html
<script src="http://127.0.0.1:5500/12-JSONP/js/app.js"></script>
```

我们是不是可以将这个 `script` 脚本的 src 地址看成是服务端的方法地址？

不就是跟之前引入的 `jQuery` 和 `axios` 的 src 地址类似么，既然如此我们当然可以在服务端编写一个路由规则

```javascript
app.all('/server-jsonp', (request, response) => {
    response.send('hello jsonp'); 
});
```

控制台报错

```shell
Uncaught SyntaxError: Unexpected identifier
```

但是查看下网络响应体信息，实际上是获取到的

![](Ajax（2-基本使用）/25.png)

因为 `script` 标签需要的是一个 JS 脚本代码，而现在获取到的却是一串字符，是无法进行解析的，所以我们需要修改服务端响应内容

```javascript
const data = {
    name: 'JSONP'
};
let str = JSON.stringify(data);
// end 方法不会有特殊响应头
// 为了方便拼接，用模板字符串
response.end(`handle(${str})`); // 返回结果是一个函数调用
```

这次内容正常呈现，查看控制台没有报错信息，而且请求内容是我们编写的一串 JS 代码

![](Ajax（2-基本使用）/26.png)

**JSONP 的使用**

1. HTML 代码

```html
用户名：<input type="text" id="username">
<p></p>
<script>
    //声明handle函数
    function handle(data) {
        var input = document.querySelector('input');
        input.style.border = "solid 1px #f00";
        //修改p标签的提示文本
        var p = document.querySelector('p');
        p.innerHTML = data.msg;
    }
</script>
<script>
    const input = document.querySelector('input');
    input.onblur = () => {
        let username = this.username;
        // 1、创建一个 script 标签
        var script = document.createElement('script');
        // 2、设置 src 属性
        script.src = 'http://127.0.0.1:8000/check-username';
        // 3、将 script 插入文档中
        document.body.appendChild(script);
    };
</script>
```

2. 服务端代码

```javascript
app.all('/check-username', (request, response) => {
    const data = {
        exist: 1,
        msg:'用户名已存在'
    };
    let str = JSON.stringify(data);
    response.end(`handle(${str})`); 
});
```

3. 效果

![](Ajax（2-基本使用）/27.gif)

**jQuery 发送 JSONP 请求**

```javascript
$.getJSON(url,[data],[fn])
```

* url：发送请求地址
* data：待发送 key/value 参数
* callback：载入成功时回调函数

1. HTML 代码

```html
<button>点击发送请求</button><br><br>
<div id="result"></div>
<script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script>
    $('button').eq(0).click(() => {
        $.getJSON('http://127.0.0.1:8000/server-jsonp-jquery?callback=?', data => {
            $('#result').html(data.msg);
        });
    });
</script>
```

2. 服务端代码

```javascript
app.all('/server-jsonp-jquery', (request, response) => {
    const data = {
        exist: 1,
        msg:'用户名已存在'
    };
    let str = JSON.stringify(data);
    response.end(`(${str})`);
});
```

此时并没有任何输出，但是请求参数中自动生成了一个 `callback` 的参数

![](Ajax（2-基本使用）/28.png)

因为我们现在是通过 `live-server` 服务的 5500 端口访问的 `nodemon` 服务的 8000 端口，也就是说现在是跨域访问

所以需要返回一个 JS 脚本代码，但是我们就需要一个字符串作为返回结果啊，怎么办呢？

按照 `jsonp` 原生代码思路，我们是一定要返回一个 JS 脚本代码的，那么 `callback` 参数就排上用场了，我们需要改造下服务端代码

```javascript
// 接收 callback 参数
var cb = request.query.callback;
response.end(`${cb}(${str})`);
```

3. 效果

![](Ajax（2-基本使用）/29.gif)

我们可以看到响应体内容已经自动获取了 `callback` 参数和服务端返回结果

#### CORS
CORS（Cross-Origin Resource Sharing），跨域资源共享。CORS 是官方的跨域解决方案，它的特点是不需要在客户端做任何特殊的操作，完全在服务器中进行处理，支持 get 和 post 请求。跨域资源共享标准新增了一组 HTTP 首部字段，允许服务器声明哪些源站通过浏览器有权限访问哪些资源

**CORS 怎么工作的？**

CORS 是通过设置一个响应头来告诉浏览器，该请求允许跨域，浏览器收到该响应以后就会对响应放行

**CORS 的使用**

1. HTML 代码

```html
<button>点击发送请求</button><br><br>
<div id="result"></div>
<script>
    const btn = document.getElementsByTagName('button')[0];
    const result = document.querySelector('#result');
    btn.addEventListener('click', function () {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://127.0.0.1:8000/server-cors');
        xhr.send();
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
                result.innerHTML = this.response;
            }
        };
    });
</script>
```

2. 服务端代码

```javascript
app.all('/server-cors', (request, response) => {
    response.send('Hello cors');
});
```

3. 效果

![](Ajax（2-基本使用）/30.png)



![](Ajax（2-基本使用）/31.png)

我们要想进行跨域请求，必须在服务端返回结果时设置允许跨域的响应头

```javascript
// 设置响应头，允许跨域
response.setHeader('Access-Control-Allow-Origin', '*');
```

除此之外，还有一些 HTTP 响应首部字段

**HTTP 响应首部字段**

| HTTP 响应首部字段 | 作用 |
| :--- | :--- |
| `Access-Control-Allow-Origin` | 指定了允许访问该资源的外域 URI |
| `Access-Control-Expose-Headers` | 让服务器把允许浏览器访问的头放入白名单 |
| `Access-Control-Max-Age` | 指定了 preflight 请求的结果能够被缓存多久 |
| `Access-Control-Allow-Credentials` | 是否允许浏览器读取 response 的内容 |
| `Access-Control-Allow-Methods` | 指明了实际请求所允许使用的 HTTP 方法 |
| `Access-Control-Allow-Headers` | 指明了实际请求中允许携带的首部字段 |


我们一般这么使用，允许跨域、带有自定义头部信息、任意方法

```javascript
response.setHeader("Access-Control-Allow-Origin", "*"); 
response.setHeader("Access-Control-Allow-Headers", "*"); 
response.setHeader("Access-Control-A1low-Method", "*");
```

