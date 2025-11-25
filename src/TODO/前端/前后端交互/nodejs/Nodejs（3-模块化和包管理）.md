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

## 模块化

### 基本介绍
#### 什么是模块化与模块？
将一个复杂的程序文件依据一定规则（规范）拆分成多个文件的过程称之为模块化。

其中拆分出的每个文件就是一个模块，模块的内部数据是私有的，不过模块可以暴露内部数据以便其他模块使用。

#### 什么是模块化项目？
编码时是按照模块一个一个编码的， 整个项目就是一个模块化的项目。

模块化好处：

1. 防止命名冲突
2. 高复用性
3. 高维护性

### 基本使用
#### 使用案例
1. 创建 me.js

```javascript
//声明函数
function tiemo(){
    console.log('贴膜....');
}
//暴露数据
module.exports = tiemo;
```

2. 创建 index.js

```javascript
//导入模块
const tiemo = require('./me.js');
//调用函数
tiemo();
```

![](Nodejs（3-模块化和包管理）/1.png)

#### 暴露数据
模块暴露数据的方式有两种：

1. module.exports = value
2. exports.name = value

使用注意：

1. module.exports 可以暴露任意数据
2. 不能使用 exports = value 的形式暴露数据，模块内部 module 与 exports 的隐式关系 exports = module.exports = {} ，require 返回的是目标模块中 module.exports 的值

#### 导入模块

在模块中使用 require 传入文件路径即可引入文件

```javascript
const test = require('./me.js');
```

使用注意：

1. 对于自己创建的模块，导入时路径建议写 相对路径 ，且不能省略 ./ 和 ../
2. js 和 json 文件导入时可以不用写后缀，c/c++编写的 node 扩展文件也可以不写后缀，但是一般用不到
3. 如果导入其他类型的文件，会以 js 文件进行处理
4. 如果导入的路径是个文件夹，则会 首先 检测该文件夹下 package.json 文件中 main 属性对应的文件，如果存在则导入，反之如果文件不存在会报错。如果 main 属性不存在，或者 package.json 不存在，则会尝试导入文件夹下的 index.js 和 index.json ，如果还是没找到，就会报错
5. 导入 node.js 内置模块时，直接 require 模块的名字即可，无需加 ./ 和 ../

**require 导入自定义模块的基本流程**

1. 将相对路径转为绝对路径，定位目标文件
2. 缓存检测
3. 读取目标文件代码
4. 包裹为一个函数并执行（自执行函数）。通过 arguments.callee.toString() 查看自执行函数
5. 缓存模块的值
6. 返回 module.exports 的值

## npm
### 基本介绍
npm 全称 Node Package Manager，是 node.js 官方内置的包管理工具。

node.js 在安装时会自动安装 npm，所以如果你已经安装了 node.js，可以通过 npm -v 查看版本号测试，如果显示版本号说明安装成功，反之安装失败

### 基本使用
#### 初始化
创建一个空目录，然后以此目录作为工作目录启动命令行工具，执行 npm init。

npm init 命令的作用是将文件夹初始化为一个包， 交互式创建 package.json 文件

package.json 是包的配置文件，每个包都必须要有 package.json，package.json 内容示例：

```javascript
{
  "name": "npm_learn",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

```javascript
{
    "name": "1-npm", #包的名字
    "version": "1.0.0", #包的版本
    "description": "", #包的描述
    "main": "index.js", #包的入口文件
    "scripts": { #脚本配置
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "author": "", #作者
    "license": "ISC" #开源证书
}
```

注意事项：

1. package name（包名）不能使用中文、大写，默认值是文件夹的名称，所以文件夹名称也不能使用中文和大写
2. version（版本号）要求 x.x.x 的形式定义，x 必须是数字，默认值是 1.0.0
3. ISC 证书与 MIT 证书功能上是相同的
4. package.json 可以手动创建与修改
5. 使用 npm init -y 或者 npm init --yes 极速创建 package.json

#### 搜索包
1. 命令行：npm s/search 关键字
2. 网站搜索，网址是 [https://www.npmjs.com/](https://www.npmjs.com/)

#### 下载安装包
```shell
格式
npm install <包名>
npm i <包名>


# 示例
npm install uniq
npm i uniq
```

![](Nodejs（3-模块化和包管理）/2.png)

运行之后文件夹下会增加两个资源：

1. node_modules 文件夹存放下载的包
2. package-lock.json 包的锁文件，用来锁定包的版本

安装 uniq 之后， uniq 就是当前这个包的一个依赖包 ，有时会简称为依赖

比如：我们创建一个包名字为 A，A 中安装了包名字是 B，我们就说 B 是 A 的一个依赖包 ，也会说 A 依赖 B

**require 导入 npm 包基本流程**

1. 在当前文件夹下 node_modules 中寻找同名的文件夹
2. 在上级目录中下的 node_modules 中寻找同名的文件夹，直至找到磁盘根目录

#### 更新包
1. 更新包中的代码
2. 测试代码是否可用
3. 修改 package.json 中的版本号
4. 发布更新

```shell
npm publish
```

#### 删除包
删除包需要满足一定的条件

1. 你是包的作者，发布小于 24 小时
2. 大于 24 小时后，没有其他包依赖，并且每周小于 300 下载量，并且只有一个维护者

```shell
npm unpublish --force
```

### 环境依赖
我们可以在安装时设置选项来区分依赖的类型 ，目前分为两类：

![](Nodejs（3-模块化和包管理）/3.png)

### 全局安装
```shell
npm i -g nodemon
```

全局安装完成之后就可以在命令行的任何位置运行 nodemon 命令，该命令的作用是自动重启 node 应用程序

1. 全局安装的命令不受工作目录位置影响
2. 可以通过 npm root -g 可以查看全局安装包的位置
3. 不是所有的包都适合全局安装， 只有全局类的工具才适合，可以通过查看包的官方文档来确定安装方式

### 安装包依赖
在项目协作中有一个常用的命令就是 npm i ，通过该命令可以依据 package.json 和 package-lock.json 的依赖声明安装项目依赖。

```shell
npm i
npm install
```

项目中可能会遇到版本不匹配的情况，有时就需要安装指定版本的包，可以使用下面的命令的。

```shell
## 格式
npm i <包名@版本号>
## 示例
npm i jquery@1.11.2
```

项目中可能需要删除某些不需要的包，可以使用下面的命令。

```shell
## 局部删除
npm remove uniq
npm r uniq
## 全局删除
npm remove -g nodemon
```

### 配置命名别名
通过配置命令别名可以更简单的执行命令

配置 package.json 中的 scripts 属性，配置完成之后，可以使用别名执行命令

```javascript
{
 .
 .
 .
 "scripts": {
     "server": "node server.js",
     "start": "node index.js",
 },
 .
 .
}
```

```javascript
npm run server
npm run start

//不过 start 别名比较特别，使用时可以省略 run
npm start
```

1. npm start 是项目中常用的一个命令，一般用来启动项目
2. npm run 有自动向上级目录查找的特性，跟 require 函数也一样
3. 对于陌生的项目，我们可以通过查看 scripts 属性来参考项目的一些操作

## cnpm
### 基本介绍
cnpm 是一个淘宝构建的 npmjs.com 的完整镜像，也称为淘宝镜像

cnpm 服务部署在国内阿里云服务器上 ， 可以提高包的下载速度

官方也提供了一个全局工具包 cnpm ，操作命令与 npm 大体相同

```shell
可以通过 npm 来安装 cnpm 工具
npm install -g cnpm --registry=https://registry.npmmirror.com
```

虽然 cnpm 可以提高速度，但是 npm 也可以通过淘宝镜像进行加速，所以 npm 的使用率还是高于 cnpm

### 基本使用
![](Nodejs（3-模块化和包管理）/4.png)

## yarn
### 特点
1. 速度超快：yarn 缓存了每个下载过的包，所以再次使用时无需重复下载。 同时利用并行下载以最大化资源利用率，因此安装速度更快
2. 超级安全：在执行代码之前，yarn 会通过算法校验每个安装包的完整性
3. 超级可靠：使用详细、简洁的锁文件格式和明确的安装算法，yarn 能够保证在不同系统上无差异的工作

### 基本使用
![](Nodejs（3-模块化和包管理）/5.png)

1. npm 的锁文件为 package-lock.json
2. yarn 的锁文件为 yarn.lock



