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

## BOM
BOM：浏览器对象模型

BOM 可以使我们通过 JS 来操作浏览器，在 BOM 中为我们提供了一组对象，用来完成对浏览器的操作 BOM 对象

### Window
代表的是整个浏览器的窗口，同时 window 也是网页中的全局对象

### Navigator
代表的当前浏览器的信息，通过该对象可以来识别不同的浏览器

### Location
代表当前浏览器的地址栏信息，通过 Location 可以获取地址栏信息，或者操作浏览器跳转页面

### History
代表浏览器的历史记录，可以通过该对象来操作浏览器的历史记录由于隐私原因

该对象不能获取到具体的历史记录，只能操作浏览器向前或向后翻页，而且该操作只在当次访问时有效

### Screen
代表用户的屏幕的信息，通过该对象可以获取到用户的显示器的相关的信息

![](JS（6-BOM）/1.png)

这些 BOM 对象在浏览器中都是作为 window 对象的属性保存的，可以通过 window 对象来使用，也可以直接使用

```javascript
console.log(window); // [object Window]
console.log(navigator); // [object Navigator]
console.log(location); // [object Object]
console.log(history); // [object History]
console.log(screen); // [object Screen]
```

## Navigator
![](JS（6-BOM）/2.png)

由于历史原因，`Navigator` 对象中的大部分属性都已经不能帮助我们识别浏览器了

```javascript
console.log(navigator.appName); //Chrome/Firefox/Edge/IE11：Netscape；IE10 及以下：Microsoft Internet Explorer
```

那既然如此，我们要怎么判断不同的浏览器呢？

一般我们只会使用 `userAgent` 来判断浏览器的信息，`userAgent` 是一个字符串

这个字符串中包含有用来描述浏览器信息的内容，不同的浏览器会有不同的 `userAgent`

```javascript
console.log(navigator.userAgent);
// Chrome： Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36
// Firefox：Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv: 90.0) Gecko/20100101 Firefox/90.0
// Edge：   Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 Edg/92.0.902.67
// IE11：   Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; rv: 11.0) like Gecko
// IE10：   Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729)
// IE9：    Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729)
// IE8：    Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729)
// IE7/IE5：Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729)
```

我们可以根据 `userAgent` 中特有的标识符来判断是哪个浏览器

```javascript
var ua = navigator.userAgent;
if (/edg/i.test(ua)) {
    alert("Edge浏览器");
} else if (/firefox/i.test(ua)) {
    alert("火狐浏览器");
} else if (/chrome/i.test(ua)) {
    alert("谷歌浏览器");
} else if (/msie/i.test(ua)) {
    alert("IE浏览器");
}
```

在 IE11 中已经将微软和 IE 相关的标识都已经去除了，所以我们基本已经不能通过 `userAgent` 来识别一个浏览器是否是 IE 了

那么，我们要怎么判断统一是否是 IE 呢？

还是要 _找特殊_ ，我们根据之前知识，知道 `currentStyle` 和 `attchEvent` 是 IE 所特有的

除此之外，还有个 `ActiveXObject` 也是 IE 中所特有的，我们可以根据这个来做判断

```javascript
// 利用 `ActiveXObject` 是 IE 中特有的属性，以及通过 `window.属性 == undefined` 特点来判断是否是 IE
if(window.ActiveXObject){
    alert("IE浏览器");
} else{
    alert("非IE浏览器");
}
```

我们直接在 IE 中进行测试

![](JS（6-BOM）/3.png)

不是说 `ActiveXObject` 也是 IE 中所特有的吗？怎么不行呢？

我们在 IE11 中打印下 `window.ActiveXObject` 是否等于 `true`

```javascript
// 利用两次使用 `!!` 将任意值转换成 bool 值
console.log(!!window.ActiveXObject); // false
```

我们换种方式，利用 `in` 来判断 window 中是否包含某个属性

```javascript
console.log("ActiveXObject" in window); // true
```

我们来完善下对 IE11 的判断逻辑

```javascript
var ua = navigator.userAgent;
if (/edg/i.test(ua)) {
    alert("Edge浏览器");
} else if (/firefox/i.test(ua)) {
    alert("火狐浏览器");
} else if (/chrome/i.test(ua)) {
    alert("谷歌浏览器");
} else if (/msie/i.test(ua)) {
    alert("IE浏览器");
} else if ("ActiveXObject" in window) {
    alert("IE11浏览器");
}
```

## History
![](JS（6-BOM）/4.png)

### length
`length` 属性，可以获取到当次访问的链接数量

```javascript
alert(history.length);
// 访问 History 页面：1
// 访问 Test02 页面并跳转至 History 页面：2
// 访问 Test01 页面并跳转至 History 页面：3
```

### back()
可以用来回退到上一个页面，作用和浏览器的回退按钮一样

```javascript
history.back();
```

![](JS（6-BOM）/5.gif)

### forward()
可以跳转下一个页面，作用和浏览器的前进按钮一样

```javascript
history.forward();
```

![](JS（6-BOM）/6.gif)

### go()
可以用来跳转到指定的页面，它需要一个整数作为参数

1. 1：表示向前跳转一个页面，相当于 `forward()`
2. 2：表示向前跳转两个页面
3. -1：表示向后跳转一个页面，相当于 `back()`
4. -2：表示向后跳转两个页面

```javascript
history.go(2);
```

![](JS（6-BOM）/7.gif)

```javascript
history.go(-2);
```

![](JS（6-BOM）/8.gif)

## Location
如果直接打印 `location`，则可以获取到地址栏的信息（当前页面的完整路径）

```javascript
alert(location); // http://127.0.0.1:8848/Demo/17-04-Location.html
```

如果直接将 `location` 属性修改为一个完整的路径，或相对路径则我们页面会自动跳转到该路径，并且会生成相应的历史记录

```javascript
location = "http://www.baidu.com";
```

![](JS（6-BOM）/9.gif)

```javascript
location = "17-03-History.html";
```

![](JS（6-BOM）/10.gif)

![](JS（6-BOM）/11.png)

### assign()
用来跳转到其他的页面，作用和直接修改 `location` 一样

会生成历史记录， 能使用回退按钮回退

```javascript
location.assign("http://www.baidu.com");
```

![](JS（6-BOM）/12.gif)

### replace()
可以使用一个新的页面替换当前页面，调用完毕也会跳转页面

不会生成历史记录，不能使用回退按钮回退

```javascript
location.replace("17-03-History.html");
```

![](JS（6-BOM）/13.gif)

### reload()
用于重新加载当前页面，作用和刷新按钮（F5）一样

```javascript
location.reload();
```

![](JS（6-BOM）/14.gif)

如果在方法中传递一个 `true`，作为参数，则会强制清空缓存刷新页面（Ctrl + F5）

```javascript
location.reload(true);
```

![](JS（6-BOM）/15.gif)

