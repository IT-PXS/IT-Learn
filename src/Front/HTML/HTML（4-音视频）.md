---
title: HTML（4-音视频）
tag:
  - HTML
category: 前端
description: HTML5原生支持音视频播放，通过audio和video标签实现。它们无需插件，提供控件、源文件指定及播放控制。支持多种编码格式（如MP4、WebM）以确保跨浏览器兼容性，是构建现代富媒体网页内容的核心技术。
date: 2025-04-18 12:42:19
---

## 音频播放

### 基本音频标签

HTML5 的 `<audio>` 标签用于在网页中嵌入音频内容：

```html
<audio src="audio.mp3" controls></audio>
```

### 音频属性

| 属性 | 值 | 说明 |
|------|----|----|
| `src` | URL | 音频文件路径 |
| `controls` | 布尔值 | 显示播放控件 |
| `autoplay` | 布尔值 | 自动播放（受浏览器策略限制） |
| `loop` | 布尔值 | 循环播放 |
| `muted` | 布尔值 | 静音播放 |
| `preload` | `auto`/`metadata`/`none` | 预加载策略 |
| `crossorigin` | `anonymous`/`use-credentials` | 跨域设置 |

### 音频示例

```html
<!-- 基本音频播放 -->
<audio controls>
    <source src="music.mp3" type="audio/mpeg">
    <source src="music.ogg" type="audio/ogg">
    您的浏览器不支持音频播放。
</audio>

<!-- 自动播放（通常被浏览器阻止） -->
<audio autoplay muted>
    <source src="background.mp3" type="audio/mpeg">
</audio>

<!-- 循环播放背景音乐 -->
<audio loop muted>
    <source src="background.mp3" type="audio/mpeg">
</audio>

<!-- 预加载音频 -->
<audio controls preload="metadata">
    <source src="podcast.mp3" type="audio/mpeg">
</audio>
```

### 多格式支持

为了确保跨浏览器兼容性，建议提供多种音频格式：

```html
<audio controls>
    <source src="audio.mp3" type="audio/mpeg">
    <source src="audio.ogg" type="audio/ogg">
    <source src="audio.wav" type="audio/wav">
    <source src="audio.m4a" type="audio/mp4">
    <p>您的浏览器不支持HTML5音频播放。</p>
</audio>
```

## 视频播放

### 基本视频标签

HTML5 的 `<video>` 标签用于在网页中嵌入视频内容：

```html
<video src="video.mp4" controls width="640" height="360"></video>
```

### 视频属性

| 属性 | 值 | 说明 |
|------|----|----|
| `src` | URL | 视频文件路径 |
| `controls` | 布尔值 | 显示播放控件 |
| `autoplay` | 布尔值 | 自动播放 |
| `loop` | 布尔值 | 循环播放 |
| `muted` | 布尔值 | 静音播放 |
| `preload` | `auto`/`metadata`/`none` | 预加载策略 |
| `poster` | URL | 视频封面图片 |
| `width` | 像素 | 视频宽度 |
| `height` | 像素 | 视频高度 |
| `playsinline` | 布尔值 | 内联播放（移动端） |

### 视频示例

```html
<!-- 基本视频播放 -->
<video controls width="640" height="360">
    <source src="video.mp4" type="video/mp4">
    <source src="video.webm" type="video/webm">
    您的浏览器不支持视频播放。
</video>

<!-- 带封面的视频 -->
<video controls poster="thumbnail.jpg" width="640" height="360">
    <source src="video.mp4" type="video/mp4">
</video>

<!-- 自动播放视频（通常需要静音） -->
<video autoplay muted loop playsinline>
    <source src="background.mp4" type="video/mp4">
</video>

<!-- 响应式视频 -->
<video controls style="max-width: 100%; height: auto;">
    <source src="video.mp4" type="video/mp4">
</video>
```

### 多格式支持

```html
<video controls width="640" height="360">
    <source src="video.mp4" type="video/mp4">
    <source src="video.webm" type="video/webm">
    <source src="video.ogv" type="video/ogg">
    <p>您的浏览器不支持HTML5视频播放。</p>
</video>
```

### 字幕和音轨

```html
<video controls width="640" height="360">
    <source src="video.mp4" type="video/mp4">
    
    <!-- 字幕轨道 -->
    <track kind="subtitles" src="subtitles.vtt" srclang="zh" label="中文">
    <track kind="subtitles" src="subtitles-en.vtt" srclang="en" label="English">
    
    <!-- 音轨 -->
    <track kind="audio" src="audio-zh.mp3" srclang="zh" label="中文音轨">
    <track kind="audio" src="audio-en.mp3" srclang="en" label="English Audio">
    
    您的浏览器不支持视频播放。
</video>
```

## 媒体格式

### 音频格式对比

| 格式 | 扩展名 | 优点 | 缺点 | 浏览器支持 |
|------|--------|------|------|------------|
| MP3 | .mp3 | 兼容性最好，文件小 | 有损压缩 | 所有浏览器 |
| OGG | .ogg | 开源，质量好 | 兼容性一般 | Chrome, Firefox |
| WAV | .wav | 无损质量 | 文件大 | 所有浏览器 |
| AAC | .aac/.m4a | 高质量，文件小 | 专利限制 | Safari, Chrome |
| FLAC | .flac | 无损压缩 | 文件大，支持有限 | 现代浏览器 |

### 视频格式对比

| 格式 | 扩展名 | 优点 | 缺点 | 浏览器支持 |
|------|--------|------|------|------------|
| MP4 | .mp4 | 兼容性最好 | 专利限制 | 所有浏览器 |
| WebM | .webm | 开源，质量好 | 兼容性一般 | Chrome, Firefox |
| OGV | .ogv | 开源 | 兼容性差 | Firefox |
| AVI | .avi | 传统格式 | 文件大 | 有限支持 |

### 推荐格式组合

```html
<!-- 音频推荐格式 -->
<audio controls>
    <source src="audio.mp3" type="audio/mpeg">  <!-- 主要格式 -->
    <source src="audio.ogg" type="audio/ogg">   <!-- 备用格式 -->
</audio>

<!-- 视频推荐格式 -->
<video controls>
    <source src="video.mp4" type="video/mp4">   <!-- 主要格式 -->
    <source src="video.webm" type="video/webm"> <!-- 备用格式 -->
</video>
```