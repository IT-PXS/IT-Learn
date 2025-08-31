---
title: CSS（1-基本概念）
tag:
 - CSS
category: 前端
description: CSS（层叠样式表）是用于控制网页样式和布局的语言，通过选择器匹配HTML元素并设置属性（如颜色、字体、间距等）。其核心特性包括层叠性（规则优先级）、继承性（子元素继承父样式）以及盒模型（内容、内边距、边框、外边距）。CSS3进一步引入动画、渐变和响应式设计等高级功能，实现更丰富的视觉效果与适配多端显示。
date: 2025-01-17 12:42:19
---


## CSS

CSS（Cascading Style Sheets）用于控制网页的样式与布局。CSS 提供颜色、布局、背景、字体和边框等属性，它通过“选择器 → 声明（属性: 值）”的方式作用于 HTML 元素，由浏览器依据层叠与优先级进行最终渲染。

**核心概念**

1. 选择器（Selectors）：匹配元素，如 `p`、`.class`、`#id`、`[attr]`，以及组合器（后代、`>` 子代、`+` 相邻、`~` 通用兄弟）、伪类（`:hover`、`:nth-child`）与伪元素（`::before`、`::after`）。
2. 声明与值（Declarations）：如 `color: #333;`、`padding: 12px;`，多条声明置于花括号中，以分号结尾。
3. 盒模型（Box Model）：由 `content`、`padding`、`border`、`margin` 组成，参与尺寸与占位计算。
4. 布局方式：标准流、浮动、定位（`static`、`relative`、`absolute`、`fixed`、`sticky`）、Flexbox、Grid。
* 标准流（Normal Flow）：默认文档流。
* 浮动（Float）：使元素脱离文档流（如 `float: left;`）。
* 定位（Positioning）：`static`（默认）、`relative`、`absolute`、`fixed`、`sticky`。
5. 层叠、继承与优先级：一般优先级为 `!important` > 行内样式 > `#id` > `.class`/属性/伪类 > 标签/伪元素 > 通配符；如 `color` 可继承，`margin` 不继承。


## CSS3

CSS3 是层叠样式表第 3 级的缩写，是 CSS 的高级版本，它用于结构化、风格化和格式化网页。CSS3 增加了一些新功能，所有现代网络浏览器都支持它，CSS3 最重要的特点是将 CSS 标准分割成独立的模块，使之更容易学习和使用。

CSS3 的新功能如下：

1. 组合器：CSS3 有一个新的通用兄弟姐妹组合器，它通过 tilde(~)组合器与兄弟姐妹元素相匹配。
2. CSS 选择器：与 CSS 提供的简单选择器相比，CSS3 的选择器要先进得多，它被称为一系列易于使用和简单的选择器。
3. 伪元素：大量新的伪元素已经被添加到 CSS3 中，以方便深入地进行样式设计。甚至还增加了一个新的双冒号惯例::。
4. 边框样式：最新的 CSS3 也有新的边框样式特性，如 border-radius、image-slice、image-source 和 “width stretch “的值等。
5. 背景样式属性：CSS3 中增加了新的功能，如 background-clip、size、style 和 origin 属性。

**新特性**

1. 选择器增强

- 属性选择器：`input[type="text"]`
- 伪类选择器：`:hover`、`:focus`、`:nth-child(n)`
- 伪元素：`::before`、`::after`

2. 盒模型优化

`box-sizing`：
- `content-box`（默认，宽度不含 `padding` 和 `border`）
- `border-box`（宽度包含 `padding` 和 `border`）

3. 背景与边框

- 多背景：`background: url(bg1.png), url(bg2.png);`
- 圆角：`border-radius: 10px;`
- 阴影：`box-shadow: 5px 5px 10px #000;`
- 渐变：`background: linear-gradient(red, blue);`

4. 动画与过渡

- 过渡（Transition）：平滑变化，如 `transition: all 0.3s ease;`
- 动画（Animation）：关键帧动画 `@keyframes` + `animation` 属性


```css
@keyframes slide {
  from { 
      transform: translateX(0); 
  }
  to { 
      transform: translateX(100px); 
  }
}
.box { 
    animation: slide 2s infinite; 
}
```

5. Flexbox 弹性布局

- 容器属性：`display: flex;`、`justify-content`、`align-items`
- 子项属性：`flex-grow`、`flex-shrink`、`flex-basis`

6. Grid 网格布局

- 定义网格：`display: grid;` + `grid-template-columns`
- 布局控制：`grid-column`、`grid-row`、`gap`

7. 响应式设计（媒体查询）

```css
@media (max-width: 768px) {
    body { 
        font-size: 14px; 
    }
}
```

## 总结

| 编号 |                             CSS                              |                             CSS3                             |
| :--: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|  1   |                CSS 能够对文本和对象进行定位。                | CSS3 能够使网页更有吸引力，而且创建时间更短。CSS3 与 CSS 是向后兼容的。 |
|  2   |                    CSS 中不支持响应式设计                    |          CSS3 是最新的版本，因此它支持响应式设计。           |
|  3   |                    CSS 不能被分割成模块。                    |                   CSS3 可以被分解成模块。                    |
|  4   |              使用 CSS，不能建立 3D 动画和转换。              | 但在 CSS3 中，可以进行各种动画和转换，因为它支持动画和 3D 转换。 |
|  5   |                与 CSS3 相比，CSS 的速度非常慢                |                      CSS3 则比 CSS 快。                      |
|  6   |  在 CSS 中，我们有一套标准的颜色，它只使用基本的颜色方案。   |      CSS3 有一个很好的 HSL RGBA、HSLA 和渐变色的集合。       |
|  7   |             在 CSS 中，我们只能使用单个文本块。              |            但在 CSS3 中，我们可以使用多列文本块。            |
|  8   |                     CSS 不支持媒体查询。                     |                     但 CSS3 支持媒体查询                     |
|  9   |           CSS 代码不被所有类型的现代浏览器所支持。           |      作为最新的版本，CSS3 代码被所有现代浏览器所支持。       |
|  10  |        在 CSS 中，设计师必须手动开发圆滑的梯度和角。         |        但 CSS3 提供了先进的代码来设置圆滑的梯度和角。        |
|  11  | 在 CSS 中没有像阴影文本、文本动画等特殊效果，该动画是在 jQuery 和 JavaScript 中编码的。 | CSS3 有许多先进的功能，如文本阴影、视觉效果以及各种字体样式和颜色。 |
|  12  | 在 CSS 中，用户可以为列表项和列表添加背景色，为列表项设置图像等。 | 而 CSS3 的列表中定义了一个特殊的显示属性。甚至列表项也有计数器重置属性。 |
|  13  |                   CSS 是在 1996 年开发的。                   |           CSS3 是 CSS 的最新版本，于 2005 年发布。           |
|  14  |                     CSS 是内存密集型的。                     |              与 CSS 相比，CSS3 的内存消耗很低。              |

1. CSS 负责网页的基本样式，核心包括选择器、盒模型、浮动和定位。
2. CSS3 扩展了 CSS 的能力，提供动画、弹性布局、网格布局、响应式设计等现代 Web 开发必备功能。Flexbox 和 Grid 极大简化了复杂布局的实现，而媒体查询让网页适配不同设备。