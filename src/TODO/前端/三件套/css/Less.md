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

## 介绍

`less` 是一门 `css` 的预处理语言，`less` 是一个 css 的增强版，通过 `less` 可以编写更少的代码实现更强大的样式。在 `less` 中添加了许多的新特性：像对变量的支持、对 `mixin` 的支持...

`less` 的语法大体上和 `css` 语法一致，但是 `less` 中增添了许多对 `css` 的扩展，所以浏览器无法直接执行 `less` 代码，要执行必须向将 `less` 转换为 `css`，然后再由浏览器执行

![](Less/1.png)

## 基本使用
**html**

![](Less/2.png)

```html
<div class="box1"></div>
<div class="box2"></div>
<div class="box3"></div>
```

**less**

```less
body {
  --height: calc(200px / 2);
  --width: 100px;
  div {
    height: var(--height);
    width: var(--width);
  }
  .box1 {
    background-color: #bfa;
  }
  .box2 {
    background-color: red;
  }
  .box3 {
    background-color: yellow;
  }
}
```

![](Less/3.png)

`Easy LESS` 插件会帮助我们在 `style.less` 所在目录下面生成一个相同名称的 `css` 文件，查看生成的 `style.css` 代码

```css
body {
  --height: calc(200px / 2);
  --width: 100px;
}
body div {
  height: var(--height);
  width: var(--width);
}
body .box1 {
  background-color: #bfa;
}
body .box2 {
  background-color: red;
}
body .box3 {
  background-color: yellow;
}
```

我们直接在 HTML 中引入生成的 `style.css`

```css
<link rel="stylesheet" href="/css/style.css">
```

![](Less/4.png)

## 语法
### 注释
```less
// `less`中的单行注释，注释中的内容不会被解析到`css`中

/*
`css`中的注释，内容会被解析到`css`文件中
*/
```

### 父子关系嵌套
```less
// `less`中的单行注释，注释中的内容不会被解析到`css`中

/*
`css`中的注释，内容会被解析到`css`文件中
*/
body {
  --height: calc(200px / 2);
  --width: 100px;
  div {
    height: var(--height);
    width: var(--width);
  }
  .box1 {
    background-color: #bfa;
    .box2 {
      background-color: red;
      .box3 {
        background-color: yellow;
      }
      >.box4{
        background-color: green;
      }
    }  
  }
}
```

在 `less` 中，父子关系可以直接嵌套，对应的 `css`

```css
/*
`css`中的注释，内容会被解析到`css`文件中
*/
body {
  --height: calc(200px / 2);
  --width: 100px;
}
body div {
  height: var(--height);
  width: var(--width);
}
body .box1 {
  background-color: #bfa;
}
body .box1 .box2 {
  background-color: red;
}
body .box1 .box2 .box3 {
  background-color: yellow;
}
body .box1 .box2 > .box4 {
  background-color: green;
}
```

### 变量
在变量中可以存储一个任意的值，并且我们可以在需要时，任意的修改变量中的值

变量的语法：`@变量名`

1. 直接使用使用变量时，则以 `@变量名` 的形式使用即可
2. 作为类名、属性名或者一部分值使用时，必须以 `@{变量名}` 的形式使用
3. 可以在变量声明前就使用变量（可以但不建议）

```less
@b1:box1;
@b2:box2;
@b3:box3;
@size:200px;
@bc:background-color;
@bi:background-image;
@color:red;
@path:image/a/b/c;

.@{b1}{
  width: @size;
  height: $width;
  @{bc}: @color;
  @{bi}: url("@{path}/1.png");
}

.@{b2}{
  width: @size;
  height: $width;
  @{bc}: @color;
  @{bi}: url("@{path}/2.png");
}

.@{b3}{
  width: @size;
  height: $width;
  @{bc}: @color;
  @{bi}: url("@{path}/3.png");
}
```

```css
.box1 {
  width: 200px;
  height: 200px;
  background-color: red;
  background-image: url("image / a / b / c/1.png");
}
.box2 {
  width: 200px;
  height: 200px;
  background-color: red;
  background-image: url("image / a / b / c/2.png");
}
.box3 {
  width: 200px;
  height: 200px;
  background-color: red;
  background-image: url("image / a / b / c/3.png");
}
```

### 其他
```less
.p1{
  width: @size;
  height: $width;
  &-wrapper{
    background-color: peru;
  }
  // &:hover{
  //   background-color: blue;
  // }
  :hover{
    background-color: blue;
  }
}
.p2:extend(.p1){
  color:@color;
}
.p3{
  .p1();
}
.p4(){
  width: @size;
  height: $width;
}
.p5{
  // .p4();
  .p4;
}
```

```css
.p1,
.p2 {
  width: 200px;
  height: 200px;
}
.p1-wrapper {
  background-color: peru;
}
.p1 :hover {
  background-color: blue;
}
.p2 {
  color: red;
}
.p3 {
  width: 200px;
  height: 200px;
}
.p5 {
  width: 200px;
  height: 200px;
}
```

+ `&` 拼接
+ `:extend()` 对当前选择器扩展指定选择器的样式（选择器分组）
+ `.p1()` 直接对指定的样式进行引用，这里就相当于将 `p1` 的样式在这里进行了复制（`mixin` 混合）。使用类选择器时可以在选择器后边添加一个括号，这时我们实际上就创建了一个 `mixins` 混合函数

### 混合函数
在混合函数中可以直接设置变量，并且可以指定默认值

```less
.test(@w:200px, @h:100px, @bc:red){
  width: @w;
  height: @h;
  background-color: @bc;
}

.p6{
  // .test(200px, 100px, red); // 对应参数位传值
  // .test(@h:200px,@w:100px,@bc:red); // 写明对应属性，可变换顺序
  // .test();
  .test(300px);
}
```

```css
.p6 {
  width: 300px;
  height: 100px;
  background-color: red;
}
```

