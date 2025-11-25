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

## 基本介绍

1. Node.js 是一个能够在服务器端运行 JavaScript 的开放源代码、跨平台 JavaScript 运行环境
2. Node 采用 Google 开发的 V8 引擎运行 js 代码，使用事件驱动、非阻塞和异步 I/O 模型等技术来提高性能，可优化应用程序的传输量和规模
3. Node 大部分基本模块都用 JavaScript 编写。在 Node 出现之前，JS 通常作为客户端程序设计语言使用，以 JS 写出的程序常在用户的浏览器上运行
4. Node 是事件驱动的，开发者可以在不使用线程的情况下开发出一个能够承载高并发的服务器。其他服务器端语言难以开发高并发应用，而且即使开发出来，性能也不尽人意
5. Node.js 允许通过 JS 和一系列模块来编写服务器端应用和网络相关的应用

- 核心模块包括文件系统 I/O、网络（HTTP、TCP、UDP、DNS、YLS/SSL 等）、二进制数据流、加密算法、数据流等等
- Node 模块的 API 形式简单，降低了编程的复杂度

**编码注意事项**

1. Node.js 中是不能使用 BOM 和 DOM 的 API 的，不过 console 和定时器是可以使用的。
2. Node.js 中顶级对象为 global，也可以用 globalThis 访问顶级对象。

## CommonsJS 规范

### 模块标识

引入外部模块时，使用即为模块标识，可以通过模块标识来找到指定的模块

模块分为两大类：

1. 核心模块：由 Node 引擎提供的模块，标识即为模块的名字
2. 文件模块：由用户自己创建的模块，标识即为文件的路径（绝对、相对路径）

### 模块化

1. 在 Node 中，一个 JS 文件就是一个模块
2. 在 Node 中，每一个 JS 文件中的 JS 代码都是独立运行在一个函数中的，而不是全局作用域

#### 引入模块

1. 在 Node 中，通过 `require()` 函数来引入外部的模块

```js
let md = require("./module");
// 或
let md = require("./module.js");
```

2. 路径如果使用相对路径，必须以 `./` 或 `../` 来开头
3. 使用 `require()` 引入模块以后，该函数会返回一个对象，这个对象代表的是引入的模块

#### 暴露变量或方法

在 Node 中，通过 `exports` 来向外部暴露变量和方法，只需要将需要暴露给外部的变量或方法设置为 `exports` 的属性即可

```js
exports.x = "暴露的x"
```

#### 调用变量或方法

通过引入模块时定义的变量来调用暴露的变量或方法

```js
md.x;
```

#### 全局对象

1. 在 Node 中有一个全局对象 global，它的作用和网页中 Window 类似

- 在全局中创建的变量都会作为 global 的属性保存
- 在全局中创建的函数都会作为 global 的方法保存

- 当 Node 在执行模块中的代码时，它会在代码的外部添加如下代码：

```js
function (exports, require, module, __filename, __dirname) {
	模块中的代码
	console.log(arguments.callee + "");
}
```

2. 实际上模块中的代码都是包装在一个函数中执行的并且在函数执行时，同时传递进了如下 5 个实参：

- exports：用来将变量或函数暴露到外部
- require：函数，用来引入外部的模块
- module：代表的是当前模块本身，exports 就是它的属性
- __filename：当前模块的完整路径
- __dirname：当前模块所在文件夹的完整路径

#### exports 与 module.exports 的区别

1. 前者只能通过 `exports.xxx` 的方式来向外暴露内部变量，如：

```js
exports.xxx = xxx;
```

2. 后者既可以通过 `module.exports.xxx` 的方式，也可以通过直接赋值来向外暴露内部变量，如：

```js
module.exports.xxx = xxx;
module.exports = {};
```

赋值的区分方法：前者是直接修改了变量，而后者是修改了变量的属性（通过画引用数据类型的内存空间图来理解）

### 包

1. 规范允许我们将一组相关的模块组合到一起，形成一组完整的工具

2. 包规范由包结构和包描述文件两个部分组成

- 包结构：用于组织包中的各种文件
- 包描述文件：描述包的相关信息，以供外部读取分析

#### 包结构

包实际上就是一个压缩文件，解压以后还原为目录，包含如下：
- `package.json`：描述文件 **（必须的）**
- `bin`：目录，存放可执行二进制文件
- `lib`：目录，存放 js 代码
- `doc`：目录，存放文档
- `test`：目录，存放单元测试文件

#### 包描述文件

用于表达非代码相关的信息，是一个 JSON 格式的文件，位于包的根目录下，是包的重要组成部分

`package.json` 主要含有：name、description、version、keywords、maintainers、contributors、bugs、licenses、repositories、dependencies 等

**注意：任何 JSON 文件中都不可以写注释**

#### NPM

npm 可实现第三方模块的发布、安装和依赖等

npm 命令：
- `npm -v`：查看 npm 的版本
- `npm version`：查看所有模块的版本
- `npm init -y`：初始化 npm 且跳过手动设置（如需手动设置需去除-y）
- `npm search 包名`：搜索包
- `npm install/i 包名`：安装包
- `npm remove/r 包名`：删除包
- `npm install 包名 --save`：安装包并添加到依赖中
- `npm install`：下载当前项目所依赖的包
- `npm install 包名 -g`：全局安装包（一般都是一些工具）

在安装包的时候，可能发现文件夹中并没有新增文件夹，可能是因为缺少了 `package.json` 文件，可通过初始化命令添加

#### CNPM

- 即为淘宝提供的 npm 镜像 [网站](http://npm.taobao.org/)
- 作用：解决 npm 下载缓慢问题

#### 寻找包流程

node 在使用模块名字来引入模块时，会首先在当前目录的 `node_modules` 中寻找是否含有该模块
- 如果有则直接使用，如果没有则去上一层目录的 `node_modules` 中寻找
- 如果有则直接使用，如果没有则再去上一层目录的 `node_modules` 中寻找，直到找到为止
- 如果找到磁盘的根目录依然没有，则报错

## Buffer（缓冲器）

Buffer 是一个类似于数组的对象 ，用于表示固定长度的字节序列，其元素为 16 进制的两位数，每个元素表示内存中的一个字节，因此可以直接通过 Buffer 来创建内存中的空间

Buffer 本质是一段内存空间，专门用来处理二进制数据 。

![](Nodejs（1-基本概念）/1.png)

### 特点

1. Buffer 大小固定且无法调整
2. Buffer 性能较好，可以直接对计算机内存进行操作
3. 每个元素的大小为 1 字节（byte）

![](Nodejs（1-基本概念）/2.png)

### 基本使用

1. 创建 bufffer

```javascript
// 1、alloc
// 创建了一个长度为 10 字节的 Buffer，相当于申请了 10 字节的内存空间，每个字节的值为 0
let buf = Buffer.alloc(10);
console.log(buf); // <Buffer 00 00 00 00 00 00 00 00 00 00>
 
// 2、Buffer.allocUnsafe
// 创建了一个长度为 10 字节的 Buffer，buffer 中可能存在旧的数据, 可能会影响执行结果，所以叫unsafe
let buf_2 = Buffer.allocUnsafe(10);
console.log(buf_2); // <Buffer 00 00 00 00 00 00 00 00 00 00>
 
// 3、通过字符串创建 Buffer
let buf_3 = Buffer.from('hello');
console.log(buf_3); // <Buffer 68 65 6c 6c 6f>

// 4、通过数组创建 Buffer
let buf_4 = Buffer.from([105, 108, 111, 118, 101, 121, 111, 117]);
console.log(buf_4); // <Buffer 69 6c 6f 76 65 79 6f 75>
```

2. buffer 与字符串的转化

```javascript
let buf_4 = Buffer.from([105, 108, 111, 118, 101, 121, 111, 117]);
console.log(buf_4.toString()); // iloveyou
```

3. buffer 的读写

```javascript
let buf = Buffer.from('hello');
console.log(buf[0]); // 104
console.log(buf[0].toString(2)); // 1101000
```

## FS 模块

### 简介

1. 文件系统（File System）是通过 Node 中的 `fs` 模块来操作系统中的文件
2. 该模块提供了一些标准文件访问 API 来打开、读取、写入文件，以及与其交互
3. 该模块中的所有的操作都有 同步 和 异步 两种形式

- 同步：会阻塞程序的执行（带 Sync）
- 异步：不会阻塞程序的执行，通过回调函数将结果返回（不带 Sync）

4. 该模块是核心模块，直接引入无需下载

### 普通操作

#### 文件打开

使用 `fs.openSync()` 来打开文件（该方法会返回一个文件的描述符作为结果，可以通过该描述符来对文件进行各种操作），参数为：

- path：文件路径
- flags：操作的类型（w，r）

```js
let fd = fs.openSync("./file/test1.txt", "w");
```

#### 文件写入

使用 `fs.writeSync()` 来写入文件，参数为：

- fd：文件描述符
- string：要写入的内容
- position：写入的起始位置（可选）
- encoding：写入的编码，默认为 utf-8（可选）

```js
fs.writeSync(fd, "测试文件的第一行文字");
```

#### 文件关闭

使用 `fs.closeSync()` 来关闭文件，参数为：

- fd：文件描述符

```js
fs.closeSync(fd);
```

#### 异步使用

使用异步 API 时，只需要在同步的基础上增加回调函数即可，回调函数需要通过参数来返回相应的值，参数通常有：

- err：错误对象，若没有错误即为 null
- fd：文件描述符

```js
// 打开文件
fs.open("./file/test2.txt", "w", function (err, fd){
    if(!err){
        // 写入内容
        fs.write(fd, "异步操作的第一行文字", function (err){
            if(!err){
                console.log("成功添加内容");
            }
            // 关闭文件
            fs.close(fd, function (err){
                console.log(err);
            })
        })
    }
})
```

### 文件写入

#### 异步写入

```javascript
// 1、导入fs模块
const fs = require('fs');
 
// 2、写入文件
fs.writeFile('./座右铭.txt', '三人行，必有我师焉', err => {
    if (err) {
        console.log("写入失败");
        return;
    }
    console.log("写入成功");
});
```

![](Nodejs（1-基本概念）/3.png)

#### 同步写入

```javascript
// writeFileSync没有 callback 参数。
fs.writeFileSync('./data.txt', 'test');
```

writeFileSync 没有 callback 参数。

#### 追加写入

```javascript
// appendFile/appendFileSync 追加写入
fs.appendFile('./座右铭.txt','择其善者而从之，其不善者而改之', err => {
    if (err) {
        console.log("追加写入失败");
        return;
    }
    console.log("追加写入成功");
});
```

#### 流式写入

```javascript
let ws = fs.createWriteStream('./观书有感.txt');
ws.write('半亩方塘一鉴开\r\n');
ws.write('天光云影共徘徊\r\n');
ws.write('问渠那得清如许\r\n');
ws.write('为有源头活水来\r\n');
//关闭该可写流
ws.end();
```

程序打开一个文件是需要消耗资源的，流式写入可以减少打开关闭文件的次数。

流式写入方式适用于大文件写入或者频繁写入的场景，writeFile 适合于写入频率较低的场景。

使用 `ws.once()` 可以为对象绑定一个一次性的事件来监听可写流的关闭与否

```js
ws.once("open", function (){
    console.log("可写流打开了~~");
})
ws.once("close", function (){
    console.log("可写流关闭了~~");
})
```

### 文件读取

#### 异步读取

```javascript
// 读取文件
fs.readFile('./观书有感.txt', 'utf-8',(err, data) => {
    if(err) throw err;
    console.log(data);
});
```

#### 同步读取

```javascript
let data2 = fs.readFileSync('./观书有感.txt', 'utf-8');
```

#### 流式读取

```javascript
//创建读取流对象
let rs = fs.createReadStream('./观书有感.txt', 'utf-8');
// 监听是否开始关闭
rs.once("open", function (){
    console.log("可读流打开了");
})
rs.once("close", function (){
    console.log("可读流关闭了");
    ws.end();
})
//每次取出 64k 数据后执行一次 data 回调
rs.on('data', data => {
    console.log(data);
    console.log(data.length);
});
//读取完毕后, 执行 end 回调
rs.on('end', () => {
    console.log('读取完成')
})
```

![](Nodejs（1-基本概念）/4.png)

### 文件移动与重命名

```javascript
fs.rename('./观书有感.txt', './论语/观书有感.txt', (err) =>{
    if(err) throw err;
    console.log('移动完成')
});
fs.renameSync('./座右铭.txt', './论语/我的座右铭.txt');
```

### 文件删除

```javascript
fs.unlink('./data.txt', err => {
    if(err) throw err;
    console.log('删除成功');
});
fs.unlinkSync('./data1.txt');
```

### 文件夹操作

#### 创建文件夹

```javascript
//异步创建文件夹
fs.mkdir('./page', err => {
    if(err) throw err;
    console.log('创建成功');
});
//递归异步创建
fs.mkdir('./1/2/3', {recursive: true}, err => {
    if(err) throw err;
    console.log('递归创建成功');
});
//递归同步创建文件夹
fs.mkdirSync('./x/y/z', {recursive: true});
```

#### 读取文件夹

```javascript
//异步读取
fs.readdir('./论语', (err, data) => {
    if(err) throw err;
    console.log(data);
});
//同步读取
let data = fs.readdirSync('./论语');
console.log(data);
```

#### 删除文件夹

```javascript
//异步删除文件夹
fs.rmdir('./page', err => {
    if(err) throw err;
    console.log('删除成功');
});
//异步递归删除下面的文件夹
fs.rmdir('./1', {recursive: true}, err => {
    if(err) {
        console.log(err);
    }
    console.log('递归删除')
});
//同步递归删除下面的文件夹
fs.rmdirSync('./x', {recursive: true})
```

### 查看资源状态

```javascript
//异步获取状态
fs.stat('./观书有感.txt', (err, data) => {
    if(err) throw err;
    console.log(data);
});
//同步获取状态
let data = fs.statSync('./观书有感.txt');
```

## Path 模块

__dirname 与 require 类似，都是 Node.js 环境中的'全局'变量。

\__dirname 保存着 当前文件所在目录的绝对路径 ，可以使用  \_\_dirname 与文件名拼接成绝对路径。

使用 fs 模块的时候，尽量使用 __dirname 将路径转化为绝对路径，这样可以避免相对路径产生的 Bug

```javascript
let data = fs.readFileSync(__dirname + '/观书有感.txt', 'utf-8');
```

```javascript
const path = require('path');
 
//获取路径分隔符
console.log(path.sep); // \
//拼接绝对路径
console.log(path.resolve(__dirname, 'test')); // D:\study\nodejs\projects\node_learn\test
//解析路径
let pathname = 'D:/program file/nodejs/node.exe';
console.log(path.parse(pathname));
//获取路径基础名称
console.log(path.basename(pathname)) // node.exe
//获取路径的目录名
console.log(path.dirname(pathname)); // D:/program file/nodejs
//获取路径的扩展名
console.log(path.extname(pathname)); // .exe
```

## 事件

Node.js 是单进程单线程应用程序，但是因为 V8 引擎提供的异步执行回调接口，通过这些接口可以处理大量的并发，所以性能非常高。

Node 的所有 API 都支持回调函数

Node.js 基本上所有的事件机制都是用设计模式中观察者模式实现

```js
//1.引入事件events模块
var events=require('events')

//2.创建一个EventEmitter对象
var emitter=new events.EventEmitter();

//3.emitter.on(eventName,handler)监听事件
emitter.on('connect',function(){
	console.log('连接成功')
})

//4.emitter.emit(eventName)触发事件
setTimeout(function(){
	emitter.emit('connect')
},1000)
```

注意：

1. event 事件的执行顺序只和其触发的先后顺序有关
2. event 允许同一个事件名同时绑定多个监听器，且依次触发
3. eventEmitter 的每个事件允许传入若干个参数

```js
on(event,listener) 为一个指定的事件注册监听器

emit(event,[arg1],[arg2],[arg3]...)按监听器的顺序执行执行每个监听器

addListener(event, listener)为指定事件添加一个监听器到监听器数组的尾部

once(event,listener)为指定事件添加一个单次监听器

removeListener(event,listener)移除指定事件的某一个监听器

removeAllListeners(event)移除指定事件所有的监听器

listeners(event)返回指定事件的监听器数组

listenerCount(emitter,event)返回指定事件当前监听器的数量
语法：events.EventEmitter.listenerCount(emitter,event)

setMaxListeners(n)设置最大的监听器个数  默认为10个
```

```js
//引入事件events模块
var events=require('events')

//创建一个EventEmitter对象
var emitter=new events.EventEmitter();

//emitter.on(eventName,handler)监听事件
emitter.on('connect',function(a,b){
	console.log('连接成功')
	console.log(a)
	console.log(b)
})

//emitter.emit(eventName)触发事件
setTimeout(function(){
	emitter.emit('connect','钟离','胡桃')
},1000)
```

**on 和 addListener 区别：**

- on 监听的事件不能移除
- addListener 监听事件可以使用 removeListener 或 removeAllListener 进行移除

```js
var events=require('events');
var emitter=new events.EventEmitter();

function listener1(){
	console.log('监听器1')
}
function listener2(){
	console.log('监听器2')
}
function listener3(){
	console.log('监听器3')
}

emitter.addListener('connect',listener1)
emitter.addListener('connect',listener2)
emitter.addListener('connect',listener3)

emitter.emit('connect')

//listeners返回一个事件数组
console.log(emitter.listeners('connect'))
//[ [Function: listener1], [Function: listener2], [Function: listener3] ]

var listenerNum=events.EventEmitter.listenerCount(emitter,'connect');
console.log(`当前监听器的数量为：${listenerNum}`)//当前监听器的数量为：3

//移除指定的单个监听器removeListener(eventName,Listener)
emitter.removeListener('connect',listener2)
console.log(emitter.listeners('connect'))
//[ [Function: listener1], [Function: listener3] ]

//移除指定所有的建ring器removeAllListeners(eventName)
emitter.removeAllListeners('connect')
console.log(emitter.listeners('connect'))
```

