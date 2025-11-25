---
title: Java基础（8-IO流）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java IO流是用于执行输入和输出操作的核心机制，包括字节流和字符流两大类。字节流处理二进制数据，如文件和图片，主要类是InputStream和OutputStream；字符流专注文本操作，主要类为Reader和Writer。它们支持文件读写、网络通信等，常用缓冲流提升效率。
published: true
abbrlink: 16634
date: 2025-01-12 22:57:31
---

## IO 流分类

| 分类       | 字节输入流           | 字节输出流            | 字符输入流        | 字符输出流         |
| ---------- | -------------------- | --------------------- | ----------------- | ------------------ |
| 抽象基类   | InputStream          | OutputStream          | Reader            | Writer             |
| 访问文件   | FileInputStream      | FileOutputStream      | FileReader        | FileWriter         |
| 访问数组   | ByteArrayInputStream | ByteArrayOutputStream | CharArrayReader   | CharArrayWriter    |
| 访问管道   | PipedInputStream     | PipedOutputStream     | PipedReader       | PipedWriter        |
| 访问字符串 |                      |                       | StringReader      | StringWriter       |
| 缓冲流     | BufferedInputStream  | BufferedOutputStream  | BufferedReader    | BufferedWriter     |
| 转换流     |                      |                       | InputStreamReader | OutputStreamWriter |
| 对象流     | ObjectInputStream    | ObjectOutputStream    |                   |                    |
| 打印流     |                      | PrintStream           |                   | PrintWriter        |
| 推回输入流 | PushbackInputStream  |                       | PushbackReader    |                    |
| 特殊流     | DataInputStream      | DataOutputStream      |                   |                    |

## 字节流和字符流的区别

字节流按 8 位传输，以字节为单位输入输出数据，字符流按 16 位传输，以字符为单位输入输出数据。但不管文件读写还是网络发送接收，信息的最小存储单元都是字节

| 项           | 字节流                                                       | 字符流                                                       |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 是否使用缓冲 | 否                                                           | 是<br />若频繁对一个资源进行 IO 操作，会先把需要操作的数据暂时放入内存中，以后直接从内存中读取数据，这样可以避免多次的 IO 操作，提高效率 |
| 存在位置     | 可存在于文件、内存中<br />硬盘中的所有文件都是以字节形式存在的 | 只存在于内存中                                               |
| 使用场景     | 适合操作文本文件之外的文件<br />例如：图片、音频、视频       | 适合操作文本文件时使用（效率高，因为有缓存）                 |
| Java 相关类  | InputStream、OutputStream                                    | Reader、Writer                                               |

## Java 序列化

1. 对象的序列化（Serialize），是指将对象转换为字节流的过程
2. 对象的反序列化（Deserialize），则是指将字节流转换为对象的过程

作用：序列化机制可以将对象转换成字节序列，这些字节序列可以保存在磁盘上，也可以在网络中传输，并允许程序将这些字节序列再次恢复成原来的对象。

## Serializable 接口

若对象要支持序列化机制，则它的类需要实现 Serializable 接口，该接口是一个标记接口，它没有提供任何方法，只是标明类是可以序列化的（除了 String、数组和枚举之外，如果实现了这个接口就走 writerOrdinaryObject，否则序列化就抛出异常）。

**序列化实现方式**

若要实现序列化，则需要使用对象流 ObjectInputStream 和 ObjectOutputStream。其中，在序列化时需要调用 ObjectOutputStream 对象的 writeObject()方法，以输出对象序列。在反序列化时需要调用 OjectInputStream 对象的 readObject()方法，将对象序列恢复为对象

**Serializable 接口为什么需要定义 serialVersionUID 变量？**

serialVersionUID 代表序列化的版本，通过定义类的序列化版本，在反序列化时，只要对象中所存的版本和当前类的版本一致，就允许做恢复数据的操作，否则将会抛出序列化版本不一致的错误

serialVersionUID 的值并不重要，无论是 1L 还是 idea 自动生成的，只要序列化的时候对象的 serialVersionUID 和反序列化的时候对象的 serialVersionUID 一致的话就行

如果不定义序列化版本，在反序列化时可能出现冲突的情况：

1. 创建该类的实例，并将这个实例序列化，保存在磁盘上
2. 升级这个类，例如：增加、删除、修改这个类的成员变量
3. 反序列化该类的实例，即从磁盘上恢复修改之前保存的数据

在第 3 步恢复数据的时候，当前的类已经和序列化的数据的格式产生了冲突，可能会发生各种意想不到的问题。增加了序列化版本之后，在这种情况下则可以抛出异常，以提示这种矛盾的存在，提高数据的安全性

## transient 关键字

作用：阻止实例中那些用此关键字修饰的变量序列化，当对象被反序列化时，被 transient 修饰的变量值不会被持久化和恢复（即对于不想进行序列化的字段，可以使用 transient 关键字修饰）

注意：

1. transient 只能修饰变量，不能修饰类和方法
2. transient 修饰的变量，在反序列化后变量值将会被置成类型的默认值。例如，如果是修饰 int 类型，那么反序列化后结果就是 0
3. static 变量属于类而不属于任何对象，所以无论有没有 transient 关键字修饰，均不会被序列化

## 怎么用流打开一个大文件？

打开大文件，应避免直接将文件中的数据全部读取到内存中，可以采取分次读取的方式

1. 使用缓冲流。缓冲流内部维护了一个缓冲区，通过与缓冲区的交互，减少与设备的交互次数。使用缓冲输入流时，它每次会读取一批数据将缓冲区填满，每次调用读取方法并不是直接从设备取值，而是从缓冲区取值，当缓冲区为空时，它会再一次读取数据，将缓冲区填满。使用缓冲输出流时，每次调用写入方法并不是直接写入到设备，而是写入缓冲区，当缓冲区填满时它会自动刷入设备
2. 使用 NIO。NIO 采用内存映射文件的方式来处理输入/输出，NIO 将文件或文件的一段区域映射到内存中，这样就可以像访问内存一样来访问文件了（这种方式模拟了操作系统上的虚拟内存的概念），通过这种方式来进行输入/输出比传统的输入/输出要快得多



