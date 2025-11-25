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

## 对象的过滤
| 过滤方法 | 描述 |
| :--- | :--- |
| `eq()` | 获取第 N 个元素 |
| `first()` | 获取第一个元素 |
| `last()` | 获取最后一个元素 |
| `hasClass()` | 检查当前的元素是否含有某个特定的类，如果有，则返回 true |
| `filter()` | 筛选出与指定表达式匹配的元素集合 |
| `not()` | 删除与指定表达式匹配的元素 |
| `is()` | 根据选择器、DOM 元素或 jQuery 对象来检测匹配元素集合，如果其中至少有一个元素符合这个给定的表达式就返回 true |
| `has()` | 保留包含特定后代的元素，去掉那些不含有指定后代的元素 |


### first()
```javascript
var $li = $('ul>li');
// 1.ul 下 li 标签第一个
// $li[0].style.backgroundColor = 'red';
$li.first().css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/1.png)

### last()
```javascript
// 2.ul 下 li 标签的最后一个
// $li[$ li.length - 1].style.backgroundColor = 'red';
$li.last().css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/2.png)

### eq()
```javascript
// 3.ul 下 li 标签的第二个
// $li[1].style.backgroundColor = 'red';
$li.eq(1).css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/3.png)

### filter()
```javascript
// 4.ul 下 li 标签中 title 属性为 hello 的
$li.filter('[title=hello]').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/4.png)

### not()
```javascript
// 5.ul 下 li 标签中 title 属性不为 hello 的
// $li.filter('[title!= hello]').css('background-color', 'red');
$li.not('[title=hello]').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/5.png)

但上述的写法，将没有 title 属性的 li 元素也查询了出来，更符合题意的写法如下：

```javascript
// $li.filter('[title]').filter('[title!= hello]').css('background-color', 'red');
// $li.filter('[title!= hello]').filter('[title]').css('background-color', 'red');
$li.filter('[title][title!=hello]').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/6.png)

### has()
```javascript
// 6.ul 下 li 标签中有 span 子标签的
$li.has('span').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/7.png)

### hasClass()、is()
```javascript
// 7.ul 下 li 标签中 class 属性为 box2 的
// if ($li.filter('[class = box2]').hasClass('box2')) {
//     $li.filter('[class = box2]').css('background-color', 'red');
// }
if ($li.filter('[class=box2]').is('.box2')) {
    $li.filter('[class=box2]').css('background-color', 'red');
}
```

![](jQuery（4-对象过滤与查找）/8.png)

## 对象的查找
| 查找方法 | 描述 |
| :--- | :--- |
| `children()` | 取得一个包含匹配的元素集合中每一个元素的所有子元素的元素集合 |
| `find()` | 搜索所有与指定表达式匹配的元素。这个函数是找出正在处理的元素的后代元素的好方法 |
| `siblings()` | 取得一个包含匹配的元素集合中每一个元素的所有唯一同辈元素的元素集合 |
| `next()` | 取得一个包含匹配的元素集合中每一个元素紧邻的后一个同辈元素的元素集合 |
| `nextAll()` | 查找当前元素之后所有的同辈元素 |
| `nextUntil()` | 查找当前元素之后所有的同辈元素，直到遇到匹配的那个元素为止 |
| `prev()` | 取得一个包含匹配的元素集合中每一个元素紧邻的前一个同辈元素的元素集合 |
| `prevAll()` | 查找当前元素之前所有的同辈元素 |
| `prevUntil()` | 查找当前元素之前所有的同辈元素，直到遇到匹配的那个元素为止 |
| `offsetParent()` | 返回第一个匹配元素用于定位的父节点 |
| `parent()` | 取得一个包含着所有匹配元素的唯一父元素的元素集合 |
| `parentsUntil()` | 查找当前元素的所有的父辈元素，直到遇到匹配的那个元素为止 |


### children()
```javascript
var $ul = $('ul');
// 1.ul 标签的第 2 个 span 子标签
$ul.children('span:eq(1)').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/9.png)

### find()
```javascript
// 2.ul 标签的第 2 个 span 后代标签
$ul.find('span:eq(1)').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/10.png)

### parent()、offsetParent()
```javascript
// 3.ul 标签的父标签
$ul.parent().css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/11.png)

```javascript
// 3.ul 标签的定位父标签
$ul.offsetParent().css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/12.png)

### prev()、prevAll()、next()、nextAll()
```javascript
// 4.id 为 cc 的 li 标签的前一个 li 标签
$('#cc').prev('li').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/13.png)

```javascript
// 4.id 为 cc 的 li 标签的前面所有 li 标签
$('#cc').prevAll('li').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/14.png)

```javascript
// 4.id 为 cc 的 li 标签的后一个 li 标签
$('#cc').next('li').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/15.png)

```javascript
// 4.id 为 cc 的 li 标签的后面所有 li 标签
$('#cc').nextAll('li').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/16.png)

### siblings()
```javascript
// 6.id 为 cc 的 li 标签的所有兄弟 li 标签
$('#cc').siblings('li').css('background-color', 'red');
```

![](jQuery（4-对象过滤与查找）/17.png)

## 练习：爱好选择器
```html
<form>
    你爱好的运动是？<input type="checkbox" id="checkedAllBox"/>全选/全不选
    <br/>
    <input type="checkbox" name="items" value="足球"/> 足球
    <input type="checkbox" name="items" value="篮球"/> 篮球
    <input type="checkbox" name="items" value="羽毛球"/> 羽毛球
    <input type="checkbox" name="items" value="乒乓球"/> 乒乓球
    <br/>
    <input type="button" id="checkedAllBtn" value="全选"/>
    <input type="button" id="checkedNoBtn" value="全不选"/>
    <input type="button" id="checkedRevBtn" value="反选"/>
    <input type="button" id="sendBtn" value="提交"/>
</form>
```

``` javascript
var $checkedAllBox = $('#checkedAllBox'); // ID 选择器
var $items = $(': checkbox [name = items]'); // 表单选择器、过滤选择器、交集选择器
// 1.点击'全选'：选中所有爱好
var $checkedAllBtn = $('#checkedAllBtn');
$checkedAllBtn.click(function () { // click 函数
    $items.prop('checked', true); // prop 操作属性
    $checkedAllBox.prop('checked', true);
});

// 2.点击'全不选'：所有爱好都不勾选
var $checkedNoBtn = $('#checkedNoBtn');
$checkedNoBtn.click(function () {
    $items.prop('checked', false);
    $checkedAllBox.prop('checked', false);
});

// 3.点击'反选'：改变所有爱好的匀选状态
var $checkedRevBtn = $('#checkedRevBtn');
$checkedRevBtn.click(function () {
    $items.each(function () { // each 函数
        this.checked = ! this.checked;
    });
    $checkedAllBox.prop('checked', $ items.not(': checked').length === 0); // not 过滤方法
});

// 4.点击'提交'：提示所有勾送的爱好
var $sendBtn = $('#sendBtn');
$sendBtn.click(function () {
    var arr = [];
    $items.filter(': checked').each(function () { // filter 过滤方法
        arr.push(this.value); // 数组 push 方法
    });
    alert(arr.join(',')); // 数组 join 方法
});

// 5.点击'全选/全不选'：选中所有爱好，或者全不选中
var $checkedAllBox = $('#checkedAllBox');
$checkedAllBox.click(function () {
    $items.prop('checked', this.checked);
});

// 6.点击某个爱好时，必要时更新'全选/全不选'的选中状态
$items.click(function () {
    $checkedAllBox.prop('checked', $ items.not(': checked').length === 0);
});
```

**效果**

![](jQuery（4-对象过滤与查找）/18.gif)

