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

## Express
express 是一个基于 Node.js 平台的极简、灵活的 WEB 应用开发框架，官方网址：[https://www.expressjs.com.cn/](https://www.expressjs.com.cn/)

简单来说，express 是一个封装好的工具包，封装了很多功能，便于我们开发 WEB 应用（HTTP 服务）

### 基本使用
```javascript
// 1、导入 express
const express = require('express');
 
// 2、创建应用对象
const app = express();
 
// 3、创建路由
app.get('/home', (req, res) => {
    res.end('Hello express');
});
 
// 4、监听端口，启动服务
app.listen(3000, () => {
    console.log("服务已经启动，端口 3000 正在监听中...");
});
```

### express 路由
一个路由的组成有请求方法、 路径和回调函数组成

express 中提供了一系列方法，可以很方便的使用路由，使用格式如下：

```javascript
app.<method>(path，callback)
```

```javascript
// 1、导入 express
const express = require('express');
 
// 2、创建应用对象
const app = express();
 
// 创建 get 路由
app.get('/home', (req, res) => {
    res.send('网站首页');
});
 
// 首页路由
app.get('/', (req,res) => {
    res.send('我才是真正的首页');
});
 
// 创建 post 路由
app.post('/login', (req, res) => {
    res.send('登录成功');
});
 
// 匹配所有的请求方法
app.all('/search', (req, res) => {
    res.send('1 秒钟为您找到相关结果约 100,000,000 个');
});
 
// 自定义 404 路由
app.all("*", (req, res) => {
    res.send('<h1>404 Not Found</h1>')
});
 
// 4、监听端口，启动服务
app.listen(3000, () => {
    console.log("服务已经启动，端口 3000 正在监听中...");
});
```

#### 获取请求参数
```javascript
// 1、导入 express
const express = require('express');
 
// 2、创建应用对象
const app = express();
 
//获取请求的路由规则
app.get('/request', (req, res) => {
    //1. 获取报文的方式与原生 HTTP 获取方式是兼容的
    console.log(req.method);
    console.log(req.url);
    console.log(req.httpVersion);
    console.log(req.headers);
    //2. express 独有的获取报文的方式
    //获取查询字符串（问号传参）
    console.log(req.query); // 『相对重要』
    // 获取指定的请求头
    console.log(req.get('host'));
    res.send('请求报文的获取');
});
 
// 4、监听端口，启动服务
app.listen(3000, () => {
    console.log("服务已经启动，端口 3000 正在监听中...");
});
```

#### 获取路由参数
路由参数指的是 URL 路径中的参数（数据）

```javascript
app.get('/:id.html', (req, res) => {
    res.send('商品详情, 商品 id 为' + req.params.id);
});
```

#### 响应设置

```javascript
// 1、导入 express
const express = require('express');
 
// 2、创建应用对象
const app = express();
 
//获取请求的路由规则
app.get("/response", (req, res) => {
    //1. express 中设置响应的方式兼容 HTTP 模块的方式
    res.statusCode = 404;
    res.statusMessage = 'xxx';
    res.setHeader('abc','xyz');
    res.write('响应体');
    res.end('xxx');
    //2. express 的响应方法
    res.status(500); //设置响应状态码
    res.set('xxx','yyy');//设置响应头
    res.send('中文响应不乱码');//设置响应体
    //连贯操作
    res.status(404).set('xxx','yyy').send('你好朋友')
    //3. 其他响应
    res.redirect('http://atguigu.com')//重定向
    res.download('./package.json');//下载响应
    res.json();//响应 JSON
    res.sendFile(__dirname + '/home.html') //响应文件内容
});
 
// 4、监听端口，启动服务
app.listen(3000, () => {
    console.log("服务已经启动，端口 3000 正在监听中...");
});
```

### express 中间件
#### 什么是中间件？
中间件（Middleware）本质是一个回调函数

中间件函数可以像路由回调一样访问请求对象（request）、 响应对象（response）

中间件的作用：使用函数封装公共操作，简化代码

中间件的类型：

1. 全局中间件
2. 路由中间件

#### 定义全局中间件
每一个请求到达服务端之后都会执行全局中间件函数

```javascript
// 声明中间件函数
let recordMiddleware = function(request,response,next){
    //实现功能代码
    //.....
    //执行 next 函数(当如果希望执行完中间件函数之后，仍然继续执行路由中的回调函数，必须调用 next)
    next();
}
```

```javascript
// 应用中间件
app.use(recordMiddleware);
```

#### 多个全局中间件
express 允许使用 app.use() 定义多个全局中间件

```javascript
app.use(function (request, response, next) {
    console.log('定义第一个中间件');
    next();
})
app.use(function (request, response, next) {
    console.log('定义第二个中间件');
    next();
})
```

#### 定义路由中间件
如果只需要对某一些路由进行功能封装 ，则就需要路由中间件

调用格式如下：

```javascript
app.get('/路径',`中间件函数`,(request,response)=>{
 
});
 
app.get('/路径',`中间件函数1`,`中间件函数2`,(request,response)=>{
 
});
```

#### 静态资源中间件
```javascript
// 引入 express 框架
const express = require('express');
// 创建服务对象
const app = express();
 
// 静态资源中间件的设置，将当前文件夹下的 public 目录作为网站的根目录
app.use(express.static('./public')); //当然这个目录中都是一些静态资源
// 如果访问的内容经常变化，还是需要设置路由
// 但是，在这里有一个问题，如果 public 目录下有 index.html 文件，单独也有 index.html 的路由，
// 则谁书写在前，优先执行谁
app.get('/index.html',(request,response)=>{
    respsonse.send('首页');
});
 
// 监听端口
app.listen(3000,()=>{
    console.log('3000 端口启动....');
});
```

1. index.html 文件为默认打开的资源
2. 如果静态资源与路由规则同时匹配，谁先匹配谁就响应，按代码顺序来
3. 路由响应动态资源，静态资源中间件响应静态资源

#### 获取请求体数据
```shell
npm i body-parser
```

```javascript
const bodyParser = require('body-parser');

//处理 querystring 格式的请求体
let urlParser = bodyParser.urlencoded({extended:false}));
//处理 JSON 格式的请求体
let jsonParser = bodyParser.json();

app.post('/login', urlParser, (request,response)=>{
    //获取请求体数据
    //console.log(request.body);
    //用户名
    console.log(request.body.username);
    //密码
    console.log(request.body.userpass);
    response.send('获取请求体数据');
});
```

## Router
1. homeRouter.js

```javascript
// 1. 导入 express
const express = require('express');
// 2. 创建路由器对象
const router = express.Router();
// 3. 在 router 对象身上添加路由
router.get('/', (req, res) => {
    res.send('首页');
})
router.get('/cart', (req, res) => {
    res.send('购物车');
});
// 4. 暴露
module.exports = router;
```

2. index.js

```javascript
const express = require('express');
const app = express();
// 5.引入子路由文件
const homeRouter = require('./routes/homeRouter');
// 6.设置和使用中间件
app.use(homeRouter);
app.listen(3000,()=>{
    console.log('3000 端口启动....');
})
```

## EJS 模板引擎
模板引擎是分离用户界面和业务数据的一种技术。

```shell
npm i ejs --save
```

```javascript
//1.引入 ejs
const ejs = require('ejs');
//2.定义数据
let person = ['张三','李四','王二麻子'];
//3.ejs 解析模板返回结构
//<%= %> 是 ejs 解析内容的标记，作用是输出当前表达式的执行结构
let html = ejs.render(‘<%= person.join(",") %>’, {person:person});
//4.输出结果
console.log(html);
```

```javascript
// 执行 JS 代码
<% code %>
// 输出转义的数据到模板上
<%= code %>
// 输出非转义的数据到模板上
<%- code %>
```

