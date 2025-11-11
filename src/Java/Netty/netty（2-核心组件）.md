---
title: Netty（2-核心组件）
tag: 
  - Netty
  - 网络编程
category: Java
description: 
date: 2025-11-02 22:38:34
---

## EventLoopGroup

EventLoopGroup 是一组 EventLoop 的抽象，Netty 为了更好的利用多核 CPU 资源，一般会有多个 EventLoop 同时工作，每个 EventLoop 维护着一个 Selector 实例。

通常一个服务端口即一个 ServerSocketChannel 对应一个 Selector 和一个 EventLoop 线程。BossEventLoop 负责接收客户端的连接并将 SocketChannel 交给 WorkerEventLoopGroup 来进行 IO 处理，如下图所示

![](netty（2-核心组件）\1.png)

1. 事件循环对象（EventLoop）

EventLoop 本质是一个单线程执行器（同时维护了一个 Selector），里面有 run 方法处理 Channel 上源源不断的 io 事件

2. 事件循环组（EventLoopGroup）

EventLoopGroup 是一组 EventLoop，Channel 一般会调用 EventLoopGroup 的 register 方法来绑定其中一个 EventLoop，后续这个 Channel 上的 io 事件都由此 EventLoop 来处理（保证了 io 事件处理时的线程安全）。一个 EventLoopGroup 当中会包含一个或多个 EventLoop，EventLoopGroup 提供 next 接口，可以从一组 EventLoop 里面按照一定规则获取其中一个 EventLoop 来处理任务。

## BossEventLoopGroup 和 WorkerEventLoopGroup

BossEventLoopGroup 通常是一个单线程的 EventLoop，EventLoop 维护着一个注册了 ServerSocketChannel 的 Selector 实例，EventLoop 的实现涵盖 IO 事件的分离和分发（Dispatcher），EventLoop 的实现充当 Reactor 模式中的分发（Dispatcher）的角色。所以通常可以将 BossEventLoopGroup 的线程数参数为 1。

BossEventLoop 只负责处理连接，故开销非常小，连接到来马上按照策略将 SocketChannel 转发给 WorkerEventLoopGroup，WorkerEventLoopGroup 会由 next 选择其中一个 EventLoop 来将这个 SocketChannel 注册到其维护的 Selector 并对其后续的 IO 事件进行处理。

ChannelPipeline 中的每一个 ChannelHandler 都是通过它的 EventLoop（I/O 线程）来处理传递给它的事件的。所以至关重要的是不要阻塞这个线程，因为这会对整体的 I/O 处理产生严重的负面影响。但有时可能需要与那些使用阻塞 API 的遗留代码进行交互。对于这种情况， ChannelPipeline 有一些接受一个 EventExecutorGroup 的 add() 方法。如果一个事件被传递给一个自定义的 EventExecutorGroup（DefaultEventExecutorGroup 的默认实现）。就是在把 ChannelHandlers 添加到 ChannelPipeline 的时候，指定一个 EventExecutorGroup，ChannelHandler 中所有的方法都将会在这个指定的 EventExecutorGroup 中运行。

## Bootstrap、ServerBootstrap

一个 Netty 应用通常由一个 Bootstrap 开始，主要作用是配置整个 Netty 程序，串联各个组件，Netty 中 Bootstrap 类是客户端程序的启动引导类，ServerBootstrap 是服务端启动引导类。

1. NioEventLoopGroup 实际上就是个线程池，一个 EventLoopGroup 包含一个或者多个 EventLoop；
2. 一个 EventLoop 在它的生命周期内只和一个 Thread 绑定；
3. 所有有 EnventLoop 处理的 I/O 事件都将在它专有的 Thread 上被处理；
4. 一个 Channel 在它的生命周期内只注册于一个 EventLoop；
5. 每一个 EventLoop 负责处理一个或多个 Channel；

## Selector

Netty 基于 Selector 对象实现 I/O 多路复用，通过 Selector 一个线程可以监听多个连接的 Channel 事件。

当向一个 Selector 中注册 Channel 后，Selector 内部的机制就可以自动不断地查询（Select）这些注册的 Channel 是否有已就绪的 I/O 事件（例如可读，可写，网络连接完成等），这样程序就可以很简单地使用一个线程高效地管理多个 Channel

## Future、ChannelFuture

Netty 中所有的 IO 操作都是异步的，不能立刻得知消息是否被正确处理。但是可以过一会等它执行完成或者直接注册一个监听，具体的实现就是通过 Future 和 ChannelFutures，他们可以注册一个监听，当操作执行成功或失败时监听会自动触发注册的监听事件

## Channel

Netty 网络通信的组件，能够用于执行网络 I/O 操作。通过 Channel 可获得当前网络连接的通道的状态、网络连接的配置参数（例如接收缓冲区大小）

Channel 提供异步的网络 I/O 操作(如建立连接，读写，绑定端口)，异步调用意味着任何 I/O 调用都将立即返回，并且不保证在调用结束时所请求的 I/O 操作已完成。调用立即返回一个 ChannelFuture 实例，通过注册监听器到 ChannelFuture 上，可以 I/O 操作成功、失败或取消时回调通知调用方

支持关联 I/O 操作与对应的处理程序，不同协议、不同的阻塞类型的连接都有不同的 Channel 类型与之对应，常用的 Channel 类型：

1. NioSocketChannel，异步的客户端 TCP Socket 连接。
2. NioServerSocketChannel，异步的服务器端 TCP Socket 连接。
3. NioDatagramChannel，异步的 UDP 连接。
4. NioSctpChannel，异步的客户端 Sctp 连接。
5. NioSctpServerChannel，异步的 Sctp 服务器端连接，这些通道涵盖了 UDP 和 TCP 网络 IO 以及文件 IO。

当服务端和客户端建立一个新的连接时， 一个新的 Channel 将被创建，同时它会被自动地分配到它专属的 ChannelPipeline。

## ChannelHandler

ChannelHandler 是一个接口，处理 I/O 事件或拦截 I/O 操作，并将其转发到其 ChannelPipeline（业务处理链）中的下一个处理程序。

ChannelHandler 用来处理 Channel 上的各种事件，分别为入站、出站两种。所有 ChannelHandler 被连成一串，就是 Pipeline。

![](netty（2-核心组件）\2.png)

```java
public class ChannelInboundHandlerAdapter extends ChannelHandlerAdapter implements ChannelInboundHandler { 
	// 通道注册事件
	public void channelRegistered(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelRegistered();
    }
	// 通道注销事件
    public void channelUnregistered(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelUnregistered();
    }
	// 通道就绪事件 
	public void channelActive(ChannelHandlerContext ctx) throws Exception { 
		ctx.fireChannelActive(); 
	}
	// 通道读取数据事件 
	public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception { 
		ctx.fireChannelRead(msg); 
	}
	// 通道读取数据完毕事件
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.fireChannelReadComplete();
    }
    // 通道发生异常事件
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        ctx.fireExceptionCaught(cause);
    }
}
```

## Pipeline、ChannelPipeline

ChannelPipeline 是一个 Handler 的集合，它负责处理和拦截 inbound 或者 outbound 的事件和操作，相当于一个贯穿 Netty 的链。（也可以这样理解：ChannelPipeline 是保存 ChannelHandler 的 List，用于处理或拦截 Channel 的入站事件和出站操作）

ChannelPipeline 实现了一种高级形式的拦截过滤器模式，使用户可以完全控制事件的处理方式，以及 Channel 中各个的 ChannelHandler 如何相互交互。在 Netty 中每个 Channel 都有且仅有一个 ChannelPipeline 与之对应

![](netty（2-核心组件）\3.png)

![](netty（2-核心组件）\4.png)

**调用顺序**

如果一个入站 IO 事件被触发，这个事件会从第一个开始依次通过 ChannelPipeline 中的 ChannelInBoundHandler，先添加的先执行。若是一个出站 I/O 事件，则会从最后一个开始依次通过 ChannelPipeline 中的 ChannelOutboundHandler，后添加的先执行，然后通过调用在 ChannelHandlerContext 中定义的事件传播方法传递给最近的 ChannelHandler。

在 ChannelPipeline 传播事件时，它会测试 ChannelPipeline 中的下一个 ChannelHandler 的类型是否和事件的运动方向相匹配。如果某个 ChannelHandler 不能处理则会跳过，并将事件传递到下一个 ChannelHandler，直到它找到和该事件所期望的方向相匹配的为止

```java
ChannelPipeline p = ...;
p.addLast("1", new InboundHandlerA());
p.addLast("2", new InboundHandlerB());
p.addLast("3", new OutboundHandlerA());
p.addLast("4", new OutboundHandlerB());
p.addLast("5", new InboundOutboundHandlerX());
```

当一个事件进入 inbound 时 handler 的顺序是 1，2，3，4，5；当一个事件进入 outbound 时，handler 的顺序是 5，4，3，2，1。在这个最高准则下，ChannelPipeline 跳过特定 ChannelHandler 的处理：

1. 3，4 没有实现 ChannelInboundHandler，因而一个 inbound 事件的处理顺序是 1，2，5。
2. 1，2 没有实现 ChannelOutBoundhandler，因而一个 outbound 事件的处理顺序是 5，4，3。
3. 5 同时实现了 ChannelInboundHandler 和 channelOutBoundHandler，所以它同时可以处理 inbound 和 outbound 事件。

## ChannelHandlerContext

保存 Channel 相关的所有上下文信息，同时关联一个 ChannelHandler 对象。即 ChannelHandlerContext 中包含一个具体的事件处理器 ChannelHandler，同时 ChannelHandlerContext 中也绑定了对应的 pipeline 和 Channel 的信息，方便对 ChannelHandler 进行调用。

ChannelHandlerContext 代表了 ChannelHandler 和 ChannelPipeline 之间的关联，每当有 ChannelHandler 添加到 ChannelPipeline 中时，都会创建 ChannelHandlerContext。

ChannelHandlerContext 的主要功能是管理它所关联的 ChannelHandler 和在同一个 ChannelPipeline 中的其他 ChannelHandler 之间的交互。事件从一个 ChannelHandler 到下一个 ChannelHandler 的移动是由 ChannelHandlerContext 上的调用完成的。

![](netty（2-核心组件）\5.png)

但是有些时候不希望总是从 ChannelPipeline 的第一个 ChannelHandler 开始事件，我们希望从一个特定的 ChannelHandler 开始处理。

你必须引用于此 ChannelHandler 的前一个 ChannelHandler 关联的 ChannelHandlerContext，利用它调用与自身关联的 ChannelHandler 的下一个 ChannelHandler。

```java
ChannelHandlerContext ctx = ...;   // 获得 ChannelHandlerContext 引用
// write()将会把缓冲区发送到下一个 ChannelHandler  
ctx.write(Unpooled.copiedBuffer("Netty in Action", CharsetUtil.UTF_8));
 
//流经整个 pipeline
ctx.channel().write(Unpooled.copiedBuffer("Netty in Action", CharsetUtil.UTF_8));
```

如果我们想有一些事件流全部通过 ChannelPipeline，有两个不同的方法可以做到：

1. 调用 Channel 的方法
2. 调用 ChannelPipeline 的方法

这两个方法都可以让事件流全部通过 ChannelPipeline，无论从头部还是尾部开始，因为它主要依赖于事件的性质。如果是一个 “ 入站 ” 事件，它开始于头部；若是一个 “ 出站 ” 事件，则开始于尾部。

那为什么你可能会需要在 ChannelPipeline 某个特定的位置开始传递事件呢？

1. 减少因为让事件穿过那些对它不感兴趣的 ChannelHandler 而带来的开销
2. 避免事件被那些可能对它感兴趣的 ChannlHandler 处理

## ChannelOption

![](netty（2-核心组件）\6.png)