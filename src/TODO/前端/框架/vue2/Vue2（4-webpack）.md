---
title: MySQL（3-事务和日志）
tags: MySQL
categories: 数据库
cover: /img/index/mysql.png
top_img: /img/index/mysql.png
published: false
abbrlink: 63240
date: 2024-11-22 22:38:34
description:
---

## Webpack 简介

Webpack 是当下最热门的前端资源模块化管理和打包工具，它可以将很多松散的模块按照依赖和规则打包成符合生产环境部署的前端资源，还可以将按需加载的模块进行代码分割，等到实际需要的时候再异步加载。通过 `loader` 的转换，任何形式的资源都可以视作模块，比如 CommonJs 模块、 AMD 模块、 ES6 模块、CSS、图片、 JSON、Coffeescript、 LESS 等。

Webpack 支持的特性：

1. 支持 CommonJs 和 AMD 模块，意思也就是我们基本可以无痛迁移旧项目。
2. 串联式模块加载器以及插件机制，让其具有更好的灵活性和扩展性，例如提供对 CoffeeScript、ES6 的支持。
3. 可以通过配置或智能分析打包成多个文件，实现公共模块或按需加载。
4. 将样式文件和图片等静态资源也可视为模块进行打包。配合 loader 加载器，可以支持 sass，less 等 CSS 预处理器。
5. 内置有 source map，即使打包在一起依旧方便调试。

## 使用 vue-webpack-simple 模板

**生成项目**

在 git bash 下输入以下命令：

```
vue init webpack-simple my-webpack-simple-demo
```

`webpack-simple` 是项目模板的名称，`my-webpack-simple-demo` 是你要生成的项目名称。

文件树结构如下：

```
├─.babelrc		// babel配置文件
├─.gitignore	
├─index.html		// 主页
├─package.json		// 项目配置文件
├─README.md  
├─webpack.config.js	// webpack配置文件
├─dist			// 发布目录
│   ├─.gitkeep       
├─src			// 开发目录	
│   ├─App.vue		// App.vue组件
│   ├─main.js		// 预编译入口
```

相比于 browserify-simple 模板，多了一个 webpack.config.js 文件。

**package.json**

```
{
  "name": "my-webpack-simple-demo",
  "description": "A Vue.js project",
  "author": "keepfool <crmug@outlook.com>",
  "private": true,
  "scripts": {
    "dev": "webpack-dev-server --inline --hot",
    "build": "cross-env NODE_ENV=production webpack --progress --hide-modules"
  },
  "dependencies": {
    "vue": "^1.0.0",
    "babel-runtime": "^6.0.0"
  },
  "devDependencies": {
    "babel-core": "^6.0.0",
    "babel-loader": "^6.0.0",
    "babel-plugin-transform-runtime": "^6.0.0",
    "babel-preset-es2015": "^6.0.0",
    "babel-preset-stage-2": "^6.0.0",
    "cross-env": "^1.0.6",
    "css-loader": "^0.23.0",
    "file-loader": "^0.8.4",
    "json-loader": "^0.5.4",
    "url-loader": "^0.5.7",
    "vue-hot-reload-api": "^1.2.0",
    "vue-html-loader": "^1.0.0",
    "vue-loader": "^8.2.1",
    "vue-style-loader": "^1.0.0",
    "webpack": "^1.12.2",
    "webpack-dev-server": "^1.12.0"
  }
}
```

开发时依赖 babel、各种 loader 和 webpack，发布时依赖 vue 和 babel-runtime。

scripts 节点同样定义了开发时和发布时的编译命令，和 browserify 不同的是，编译的输入和输出是定义在 webpack.config.js 文件中的。

**webpack.config.js**

```
var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'build.js'
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.html$/,
        loader: 'vue-html'
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url',
        query: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin()
  ])
}
```

webpack.config.js 内容还是比较好理解的，它采用了 CommonJS 的写法，entry 节点配置了编译入口，output 节点配置了输出。这段 entry 和 output 配置的含义是：编译 src/main.js 文件，然后输出到 dist/build.js 文件。

**安装项目依赖**

执行以下命令安装项目依赖：

```
cd my-webpack-simple-demo
npm install
```

注意：和 browserify 不同的是，执行 `npm run dev` 命令后并不会在 dist 目录下生成 build.js 文件，开发环境下 build.js 是在运行内存中的。

**发布**

执行以下命令会生成发布时的 build.js，并且是经过压缩的。

```
npm run build
```

## 使用 vue-webpack 模板

重新打开一个 git bash 窗口，执行以下命令：

```
vue init webpack my-webpack-demo
```

`webpack` 是项目模板，`my-webpack-demo` 是项目名称。

文件目录结构如下

```
├── build/                      # webpack config files
│   └── ...
├── config/                     
│   ├── index.js                # main project config
│   └── ...
├── src/
│   ├── main.js                 # app entry file
│   ├── App.vue                 # main app component
│   ├── components/             # ui components
│   │   └── ...
│   └── assets/                 # module assets (processed by webpack)
│       └── ...
├── static/                     # pure static assets (directly copied)
├── test/
│   └── unit/                   # unit tests
│   │   ├── specs/              # test spec files
│   │   ├── index.js            # test build entry file
│   │   └── karma.conf.js       # test runner config file
│   └── e2e/                    # e2e tests
│   │   ├── specs/              # test spec files
│   │   ├── custom-assertions/  # custom assertions for e2e tests
│   │   ├── runner.js           # test runner script
│   │   └── nightwatch.conf.js  # test runner config file
├── .babelrc                    # babel config
├── .editorconfig.js            # editor config
├── .eslintrc.js                # eslint config
├── index.html                  # index.html template
└── package.json                # build scripts and dependencies
```

**安装依赖**

执行以下两行命令，安装项目依赖：

```
cd my-webpack-demo
npm install
```

**运行示例**

执行以下命令运行示例：

```
npm run dev
```

**发布**

执行以下命令生成发布：

```
npm run build
```

和 vue-simple-webpack 模板不同的是，所有的静态资源，包括 index.html 都生成到 dist 目录下了。