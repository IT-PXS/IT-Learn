---
title: HTML（3-表单）
tag:
  - HTML
category: 前端
description: HTML表单是网页中用于收集用户输入的关键交互元素。它通过如文本框、单选按钮、下拉菜单等控件，将用户数据打包并发送至服务器进行处理。表单是实现搜索、登录、注册、支付等各类网络功能的基础，是连接用户与网站服务的重要桥梁。
date: 2025-04-17 12:42:19
---


## 表单基础

### 表单结构

HTML表单是用于收集用户输入数据的容器，通过`<form>`标签创建：

```html
<form action="/submit" method="post" enctype="multipart/form-data">
    <!-- 表单内容 -->
</form>
```

### 表单属性

| 属性 | 值 | 说明 |
|------|----|----|
| `action` | URL | 表单提交的目标地址 |
| `method` | `get`/`post` | 数据提交方式 |
| `enctype` | `application/x-www-form-urlencoded` | 默认编码方式 |
| | `multipart/form-data` | 文件上传时使用 |
| | `text/plain` | 纯文本编码 |
| `name` | 字符串 | 表单名称，用于区分多个表单 |
| `target` | `_self`/`_blank`/`_parent`/`_top` | 提交后的响应显示位置 |
| `novalidate` | 布尔值 | 禁用浏览器默认验证 |

### 基本表单示例

```html
<form action="/api/register" method="post">
    <div class="form-group">
        <label for="username">用户名：</label>
        <input type="text" id="username" name="username" required>
    </div>
    
    <div class="form-group">
        <label for="email">邮箱：</label>
        <input type="email" id="email" name="email" required>
    </div>
    
    <div class="form-group">
        <label for="password">密码：</label>
        <input type="password" id="password" name="password" required>
    </div>
    
    <div class="form-group">
        <button type="submit">注册</button>
        <button type="reset">重置</button>
    </div>
</form>
```

## 表单元素详解

### 输入元素 (input)

`<input>`是最常用的表单元素，通过`type`属性定义不同的输入类型：

```html
<!-- 文本输入 -->
<input type="text" name="username" placeholder="请输入用户名">

<!-- 密码输入 -->
<input type="password" name="password" placeholder="请输入密码">

<!-- 邮箱输入 -->
<input type="email" name="email" placeholder="请输入邮箱">

<!-- 数字输入 -->
<input type="number" name="age" min="0" max="120">

<!-- 文件上传 -->
<input type="file" name="avatar" accept="image/*">
```

### 标签元素 (label)

`<label>`用于为表单控件提供描述性标签，提升可访问性：

```html
<!-- 方法1：使用for属性关联 -->
<label for="username">用户名：</label>
<input type="text" id="username" name="username">

<!-- 方法2：嵌套方式 -->
<label>
    用户名：
    <input type="text" name="username">
</label>
```

### 文本域 (textarea)

用于多行文本输入：

```html
<label for="message">留言：</label>
<textarea id="message" name="message" rows="4" cols="50" placeholder="请输入您的留言..."></textarea>
```

### 选择框 (select)

用于下拉选择：

```html
<label for="city">城市：</label>
<select id="city" name="city">
    <option value="">请选择城市</option>
    <option value="beijing">北京</option>
    <option value="shanghai">上海</option>
    <option value="guangzhou">广州</option>
    <option value="shenzhen">深圳</option>
</select>

<!-- 多选下拉框 -->
<label for="interests">兴趣爱好：</label>
<select id="interests" name="interests" multiple size="3">
    <option value="reading">阅读</option>
    <option value="sports">运动</option>
    <option value="music">音乐</option>
    <option value="travel">旅行</option>
</select>
```

### 按钮元素

```html
<!-- 提交按钮 -->
<button type="submit">提交表单</button>

<!-- 重置按钮 -->
<button type="reset">重置表单</button>

<!-- 普通按钮 -->
<button type="button" onclick="handleClick()">点击我</button>

<!-- 图片按钮 -->
<input type="image" src="submit-button.png" alt="提交">

<!-- 传统input按钮 -->
<input type="submit" value="提交">
<input type="reset" value="重置">
<input type="button" value="按钮">
```

### 字段组 (fieldset)

用于将相关表单元素分组：

```html
<form>
    <fieldset>
        <legend>个人信息</legend>
        <label for="name">姓名：</label>
        <input type="text" id="name" name="name">
        
        <label for="email">邮箱：</label>
        <input type="email" id="email" name="email">
    </fieldset>
    
    <fieldset>
        <legend>账户信息</legend>
        <label for="username">用户名：</label>
        <input type="text" id="username" name="username">
        
        <label for="password">密码：</label>
        <input type="password" id="password" name="password">
    </fieldset>
</form>
```

## 输入类型

### 文本类型

```html
<!-- 文本输入 -->
<input type="text" placeholder="请输入文本">

<!-- 密码输入 -->
<input type="password" placeholder="请输入密码">

<!-- 邮箱输入 -->
<input type="email" placeholder="请输入邮箱">

<!-- URL输入 -->
<input type="url" placeholder="请输入网址">

<!-- 电话输入 -->
<input type="tel" pattern="[0-9]{11}" placeholder="请输入手机号">

<!-- 搜索输入 -->
<input type="search" placeholder="搜索...">

<!-- 数字输入 -->
<input type="number" min="0" max="100" step="1" placeholder="请输入数字">
```

### 日期时间类型

```html
<!-- 日期选择 -->
<input type="date">

<!-- 时间选择 -->
<input type="time">

<!-- 日期时间选择 -->
<input type="datetime-local">

<!-- 月份选择 -->
<input type="month">

<!-- 周选择 -->
<input type="week">
```

### 选择类型

```html
<!-- 单选按钮 -->
<div>
    <label>性别：</label>
    <input type="radio" id="male" name="gender" value="male">
    <label for="male">男</label>
    <input type="radio" id="female" name="gender" value="female">
    <label for="female">女</label>
</div>

<!-- 复选框 -->
<div>
    <label>兴趣爱好：</label>
    <input type="checkbox" id="reading" name="interests" value="reading">
    <label for="reading">阅读</label>
    <input type="checkbox" id="sports" name="interests" value="sports">
    <label for="sports">运动</label>
    <input type="checkbox" id="music" name="interests" value="music">
    <label for="music">音乐</label>
</div>
```

### 其他类型

```html
<!-- 颜色选择 -->
<input type="color" name="theme-color">

<!-- 范围滑块 -->
<input type="range" min="0" max="100" value="50" name="volume">

<!-- 文件上传 -->
<input type="file" name="document" multiple accept=".pdf,.doc,.docx">

<!-- 隐藏字段 -->
<input type="hidden" name="token" value="abc123">

<!-- 图像按钮 -->
<input type="image" src="submit.png" alt="提交" name="submit">
```

## 表单验证

### HTML5内置验证

```html
<!-- 必填字段 -->
<input type="text" required>

<!-- 最小/最大长度 -->
<input type="text" minlength="3" maxlength="20">

<!-- 模式匹配 -->
<input type="text" pattern="[A-Za-z]{3}" title="请输入3个字母">

<!-- 数值范围 -->
<input type="number" min="0" max="100">

<!-- 邮箱格式 -->
<input type="email" required>

<!-- URL格式 -->
<input type="url" required>
```

### 验证属性详解

| 属性 | 说明 | 示例 |
|------|------|------|
| `required` | 必填字段 | `<input required>` |
| `minlength` | 最小长度 | `<input minlength="3">` |
| `maxlength` | 最大长度 | `<input maxlength="20">` |
| `pattern` | 正则表达式 | `<input pattern="[0-9]{11}">` |
| `min` | 最小值 | `<input type="number" min="0">` |
| `max` | 最大值 | `<input type="number" max="100">` |
| `step` | 步长 | `<input type="number" step="0.1">` |

### 自定义验证消息

```html
<input type="text" 
       required 
       pattern="[A-Za-z]{3}" 
       title="请输入3个字母"
       oninvalid="this.setCustomValidity('请按照要求输入3个字母')"
       oninput="this.setCustomValidity('')">
```


## HTML5表单特性

### 新的输入类型

HTML5引入了多种新的输入类型，提供更好的用户体验：

```html
<!-- 日期时间相关 -->
<input type="date" name="birthday">
<input type="time" name="meeting-time">
<input type="datetime-local" name="event-time">
<input type="month" name="start-month">
<input type="week" name="work-week">

<!-- 数值相关 -->
<input type="number" name="age" min="0" max="120">
<input type="range" name="satisfaction" min="1" max="10">

<!-- 特殊类型 -->
<input type="color" name="theme-color">
<input type="search" name="query">
<input type="tel" name="phone">
<input type="url" name="website">
```

### 表单属性增强

```html
<!-- 占位符文本 -->
<input type="text" placeholder="请输入您的姓名">

<!-- 自动完成 -->
<input type="text" autocomplete="name">

<!-- 自动聚焦 -->
<input type="text" autofocus>

<!-- 只读 -->
<input type="text" readonly value="只读内容">

<!-- 禁用 -->
<input type="text" disabled>

<!-- 表单验证 -->
<input type="email" required>
<input type="text" pattern="[A-Za-z]{3}">
```

### 数据列表 (datalist)

```html
<label for="browser">选择浏览器：</label>
<input list="browsers" id="browser" name="browser">

<datalist id="browsers">
    <option value="Chrome">
    <option value="Firefox">
    <option value="Safari">
    <option value="Edge">
    <option value="Opera">
</datalist>
```

### 输出元素 (output)

```html
<form oninput="result.value = parseInt(a.value) + parseInt(b.value)">
    <input type="number" id="a" name="a" value="0"> +
    <input type="number" id="b" name="b" value="0"> =
    <output name="result" for="a b">0</output>
</form>
```