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

## 基本选择器
| 基本选择器 | 描述 |
| :--- | :--- |
| `#id` | 根据给定的ID匹配一个元素 |
| `element` | 根据给定的元素名匹配所有元素 |
| `.class` | 根据给定的类匹配元素 |
| `*` | 匹配所有元素 |
| `selector1,selector2,selectorN` | 将每一个选择器匹配到的元素合并后一起返回 |


```html
<div id="div1" class="box">div1(class="box")</div>
<div id="div2" class="box">div2(class="box")</div>
<div id="div3">div3</div>
<span class="box">span(class="box")</span>
<br>
<ul>
    <li>AAAAA</li>
    <li title="hello">BBBBB(title="hello")</li>
    <li class="box">CCCCC(class="box")</li>
    <li title="hello">DDDDDD(title="hello")</li>
</ul>
```

### ID 选择器
```javascript
// 1.选择id为div1的元素
$('#div1').css('background-color', 'red');
```

![](jQuery（2-选择器）/1.png)

### 标签选择器
```javascript
// 2.选择所有的div元素
$('div').css('background-color', 'red');
```

![](jQuery（2-选择器）/2.png)

### 属性选择器
```javascript
// 3.选择所有class属性为box的元素
$('.box').css('background-color', 'red');
```

![](jQuery（2-选择器）/3.png)

### 并集选择器
```javascript
// 4.选择所有的div和span元素
$('div,span').css('background-color', 'red');
```

![](jQuery（2-选择器）/4.png)

### 交集选择器
```javascript
// 5.选择所有class属性为box的div元素
$('div.box').css('background-color', 'red');
```

![](jQuery（2-选择器）/5.png)

### 通用选择器
```javascript
// 6.选择所有元素
$('*').css('background-color', 'red');
```

![](jQuery（2-选择器）/6.png)

## 层级选择器
查找子元素，后代元素，兄弟元素的选择器

| 层级选择器 | 描述 |
| :--- | :--- |
| `ancestor descendant` | 在给定的祖先元素下匹配所有的后代元素 |
| `parent > child` | 在给定的父元素下匹配所有的子元素 |
| `prev + next` | 匹配所有紧接在 prev 元素后的 next 元素 |
| `prev ~ siblings` | 匹配 prev 元素之后的所有 siblings 元素 |


```html
<ul>
	<li>AAAAA</li>
	<li class="box">CCCCC</li>
	<li title="hello"><span>BBBBB</span></li>
	<li title="hello"><span class="box">DDDD</span></li>
	<span>EEEEE</span>
</ul>
```

### 后代元素选择器
```javascript
// 1.选中ul下所有的span
$('ul span').css('background', 'red');
```

![](jQuery（2-选择器）/7.png)

### 子元素选择器
```javascript
// 2.选中ul下所有的子元素span
$('ul > span').css('background', 'red');
```

![](jQuery（2-选择器）/8.png)

### 兄弟选择器
```javascript
// 3.选中class为box的下一个li
$('.box + li').css('background', 'red');
```

![](jQuery（2-选择器）/9.png)

```javascript
// 4.选中ul下li的class为box的元素后面的所有兄弟元素
$('ul .box ~ *').css('background', 'red');
```

![](jQuery（2-选择器）/10.png)

## 过滤选择器
在原有选择器匹配的元素中进行进一步过滤的选择器

| 分类 | 过滤选择器 | 描述 |
| :--- | :--- | :--- |
| 基本 | `:first` | 获取第一个元素 |
| | `:last` | 获取最后一个元素 |
| | `:eq(index)` | 匹配一个给定索引值的元素 |
| | `:gt(index)` | 匹配所有大于给定索引值的元素 |
| | `:lt(index)` | 匹配所有小于给定索引值的元素 |
| | `:even` | 匹配所有索引值为偶数的元素，从 0 开始计数 |
| | `:odd` | 匹配所有索引值为奇数的元素，从 0 开始计数 |
| | `:not(selector)` | 去除所有与给定选择器匹配的元素 |
| 内容 | `:contains(text)` | 匹配包含给定文本的元素 |
| | `:has(selector)` | 匹配含有选择器所匹配的元素的元素 |
| | `:empty` | 匹配所有不包含子元素或者文本的空元素 |
| | `:parent` | 匹配含有子元素或者文本的元素 |
| 可见性 | `:hidden` | 匹配所有不可见元素，或者type为hidden的元素 |
| | `:visible` | 匹配所有的可见元素 |
| 属性 | `[attribute]` | 匹配包含给定属性的元素 |
| | `[attribute=value]` | 匹配给定的属性是某个特定值的元素 |
| | `[attribute!=value]` | 匹配所有不含有指定的属性，或者属性不等于特定值的元素 |
| | `[attribute*=value]` | 匹配给定的属性是以包含某些值的元素 |
| | `[selector1][selector2][selectorN]` | 复合属性选择器，需要同时满足多个条件时使用 |


```html
<div id="div1" class="box">class为box的div1</div>
<div id="div2" class="box">class为box的div2</div>
<div id="div3">div3</div>
<span class="box">class为box的span</span>
<br/>
<ul>
    <li>AAAAA</li>
    <li title="hello">BBBBB</li>
    <li class="box">CCCCC</li>
    <li title="hello">DDDDDD</li>
    <li title="two">BBBBB</li>
    <li style="display: none">我本来是隐藏的</li>
</ul>
```

### :first
```javascript
// 1.选择第一个div
$('div:first').css('background', 'red');
```

![](jQuery（2-选择器）/11.png)

### :last
```javascript
// 2.选择最后一个class为box的元素
$('.box:last').css('background', 'red');
```

![](jQuery（2-选择器）/12.png)

### :not
```javascript
// 3.选择所有class属性不为box的div
$('div:not(.box)').css('background', 'red');
```

![](jQuery（2-选择器）/13.png)

### :eq、:gt、:lt
多个选择器是依次执行的，不是同时执行的

```javascript
// 4.选择第二个和第三个li元素
// $('li:eq(1),li:eq(2)').css('background', 'red');
// $('li:gt(0):lt(2)').css('background', 'red');
$('li:lt(3):gt(0)').css('background', 'red');
```

![](jQuery（2-选择器）/14.png)

### :contains
```javascript
// 5.选择内容为BBBBB的li
$('li:contains("BBBBB")').css('background', 'red');
```

![](jQuery（2-选择器）/15.png)

### :hidden
```javascript
// 6.选择隐藏的li
$('li:hidden').show().css('background', 'red');
```

![](jQuery（2-选择器）/16.png)

### [attribute]
```javascript
// 7.送择有title属性的li元素
$('li[title]').css('background', 'red');
```

![](jQuery（2-选择器）/17.png)

### [attribute=value]
```javascript
// 8.选择所有属性title为hello的li元素
$('li[title=hello]').css('background', 'red');
```

![](jQuery（2-选择器）/18.png)

### :odd
```javascript
$('#data tbody > tr:odd').css('backgroundColor', '#ccf');
```

![](jQuery（2-选择器）/19.png)

## 表单选择器
表单和表单对象属性

| 表单选择器 | 描述 |
| :--- | :--- |
| `:input` | 匹配所有 input, textarea, select 和 button 元素 |
| `:text` | 匹配所有的单行文本框 |
| `:password` | 匹配所有密码框 |
| `:radio` | 匹配所有单选按钮 |
| `:checkbox` | 匹配所有复选框 |
| `:submit` | 匹配所有提交按钮 |
| `:reset` | 匹配所有重置按钮 |
| `:button` | 匹配所有按钮 |
| **表单对象属性** | **描述** |
| `:enabled` | 匹配所有可用元素 |
| `:disabled` | 匹配所有不可用元素 |
| `:checked` | 匹配所有选中的被选中元素(复选框、单选框等，不包括select中的option) |
| `:selected` | 匹配所有选中的option元素 |


```html
<form>
    用户名：<input type="text"/><br>
    密码：<input type="password"/><br>
    爱好：
    <input type="checkbox" checked="checked"/>篮球
    <input type="checkbox" checked="checked"/>足球
    <input type="checkbox" checked="checked"/>羽毛球<br>
    性别：
    <input type="radio" name="sex" value='male'/>男
    <input type="radio" name="sex" value='female'/>女<br>
    邮箱：<input type="text" name="email" disabled="disabled"/><br>
    所在地：I
    <select>
        <option value="1">北京</option>
        <option value="2" selected="selected">天津</option>
        <option value="3">河北</option>
    </select><br>
    <input type="submit" value="提交"/>
</form>
```

### :text、:disabled
```javascript
// 1.选择不可用的文本输入框
$(':text:disabled').css('background-color', 'red');
```

![](jQuery（2-选择器）/20.png)

### :submit、:checkbox、:checked
```javascript
// 3.显示选择的城市名称
$(':submit').click(function () {
    alert($('select>option:selected').html());
});
```

![](jQuery（2-选择器）/21.png)

