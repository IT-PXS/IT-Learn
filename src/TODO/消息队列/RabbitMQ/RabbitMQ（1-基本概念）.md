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

## 环境配置

### 部署方式

1. Master-slave 主从共享数据的部署方式

将多个消息服务器 Broker 连接共享一块消息存储空间，其中 Master 节点负责消息的写入。客户端会将消息写入到 Master 节点，一旦 Master 挂掉，slave 节点继续服务，从而形成高可用。

![](RabbitMQ（1-基本概念）/7.png)

2. Master-slave 主从同步部署方式

该模式写入消息同样在 Master 节点上，但是主结点会同步数据到 slave 节点形成副本，和 zookeeper 或者 redis 主从机制很类似。这样可以达到负载均衡的效果，如果消费者有多个，就可以到不同的节点进行消费，但是消息的拷贝和同步会占用很大的贷款和网络资源。在 rabbitMQ 中会有使用

![](RabbitMQ（1-基本概念）/8.png)

3. 多主集群同步部署模式

和上述方式区别不大，但是该方式任意节点都可以进行写入

![](RabbitMQ（1-基本概念）/9.png)

4. 多主集群转发部署模式

如果插入的数据是 Broker1，元数据信息会存储数据的相关描述和记录存放的位置（队列），它会对描述信息也就是元数据进行同步；

如果消费者在 Broker2 中进行消费，发现自己没有对应的消息，就会在自己的元数据信息中去查询，如果查询到了直接返回。如果没有查询到就会将该消息的信息携带在请求中转发到其他节点去询问，直到找到所需的信息为止。

场景：比如买火车票或者黄牛买演唱会门票，比如第一个黄牛没有顾客说要买的演唱会门票，但是他会去联系其他的黄牛询问，如果有就返回

![](RabbitMQ（1-基本概念）/10.png)

5. Master-slave 与 Broker-cluster 组合的方案

实现多主多从的热备机制来完成消息的高可用以及数据的热备机制，在生产规模达到定的阶段的时候，这种使用的频率比较高。

![](RabbitMQ（1-基本概念）/11.png)

### 添加用户

![](RabbitMQ（1-基本概念）/1.png)

1. 超级管理员（administrator）：可登录管理控制台，可查看所有的信息，并且可以对用户、策略进行操作
2. 监控者（monitoring）：可登录管理控制台，同时可以查看 rabbitmq 节点的相关信息（进程数，内存使用情况，磁盘使用情况等）
3. 策略制定者（policymaker）：可登录管理控制台，同时可以对 policy 进行管理，但无法查看节点的相关信息
4. 普通管理者（management）：仅可登录管理控制台，无法看到节点信息，也无法对策略进行管理
5. 其他：无法登录管理控制台，通常就是普通的生产者和消费者

### 分配权限

![](RabbitMQ（1-基本概念）/13.png)

1. none：不能访问 management plugin

2. management：查看自己相关节点信息

* 列出自己可以通过 AMQP 登入的虚拟机
* 查看自己的虚拟机节点 virtual hosts 的 queues，exchanges 和 bindings 信息
* 查看和关闭自己的 channels 和 connections
* 查看有关自己的虚拟机节点 virtual hosts 的统计信息。包括其他用户在这个节点 virtual hosts 中的活动信息

3. Policymaker

* 包含 management 所有权跟
* 查看和创建和删除自己的 virtual hosts 所属的 policies 和 parameters 信息

4. Monitoring

* 包含 management 所有权限
* 罗列出所有的 virtual hosts，包括不能登录的 virtual hosts
* 查看其他用户的 connections 和 channels 信息
* 查看节点级别的数据如 clustering 和 memory 使用情况
* 查看所有的 virtual hosts 的全局统计信息。

5. Administrator

* 最高权限
* 可以创建和删除 virtual hosts
* 可以查看，创建和删除 users
* 查看创建 permissions
* 关闭所有用户的 connections

### 创建 Virtual Hosts

![](RabbitMQ（1-基本概念）/2.png) ![](RabbitMQ（1-基本概念）/3.png) ![](RabbitMQ（1-基本概念）/4.png)

## RabbitMQ

### 基本概念

RabbitMQ 是一个消息中间件：它接受并转发消息。你可以把它当做一个快递站点，当你要发送一个包裹时，你把你的包裹放到快递站，快递员最终会把你的快递送到收件人那里，按照这种逻辑 RabbitMQ 是一个快递站，一个快递员帮你传递快件。RabbitMQ 与快递站的主要区别在于：它不处理快件而是接收，存储和转发消息数据。

### AMQP 协议
RabbitMQ 是一种遵循 AMQP 协议的分布式消息中间件。AMQP 全称 “Advanced Message Queuing Protocol”，高级消息队列协议。它是应用层协议的一个开发标准，为面向消息的中间件设计。

下图是采用 AMQP 协议的生产者和消费者建立和释放连接的流程图：

![](RabbitMQ（1-基本概念）/12.png)

### 工作原理

![](RabbitMQ（1-基本概念）/5.png)

1. Broker：就是 RabbitMQ 服务，用于接收和分发消息，接受客户端的连接，实现 AMQP 实体服务。
2. Virtual host：出于多租户和安全因素设计的，把 AMQP 的基本组件划分到一个虚拟的分组中，类似于网络中的 namespace 概念。当多个不同的用户使用同一个 RabbitMQ server 提供的服务时，可以划分出多个 vhost，每个用户在自己的 vhost 创建 exchange 或 queue 等。（虚拟节点，用于进行逻辑隔离，最上层的消息路由，一个虚拟主机理由可以有若干个 Exhange 和 Queue，同一个虚拟主机里面不能有相同名字的 Exchange）
3. Connection：连接，生产者/消费者与 Broker 之间的 TCP 网络连接。
4. Channel：网络信道，如果每一次访问 RabbitMQ 都建立一个 Connection，在消息量大的时候建立连接的开销将是巨大的，效率也较低。Channel 是在 connection 内部建立的逻辑连接，如果应用程序支持多线程，通常每个 thread 创建单独的 channel 进行通讯，AMQP method 包含了 channel id 帮助客户端和 message broker 识别 channel，所以 channel 之间是完全隔离的。Channel 作为轻量级的 Connection 极大减少了操作系统建立 TCP connection 的开销。
5. Message：消息，服务与应用程序之间传送的数据，由 Properties 和 body 组成，Properties 可是对消息进行修饰，比如消息的优先级，延迟等高级特性，Body 则就是消息体的内容。
6. Exchange：交换机，是 message 到达 broker 的第一站，用于根据分发规则、匹配查询表中的 routing key，分发消息到 queue 中去，不具备消息存储的功能。常用的类型有：direct、topic、fanout。
7. Bindings：exchange 和 queue 之间的虚拟连接，binding 中可以包含 routing key，Binding 信息被保存到 exchange 中的查询表中，用于 message 的分发依据。
8. Routing key：是一个路由规则，虚拟机可以用它来确定如何路由一个特定消息
9. Queue：消息队列，保存消息并将它们转发给消费者进行消费。

### 四大核心概念

1. 生产者：产生数据发送消息的程序是生产者。
2. 交换机：交换机是 RabbitMQ 非常重要的一个部件，一方面它接收来自生产者的消息，另一方面它将消息推送到队列中。交换机必须确切知道如何处理它接收到的消息，是将这些消息推送到特定队列还是推送到多个队列，亦或者是把消息丢弃，这个是由交换机类型决定的。
3. 队列：队列是 RabbitMQ 内部使用的一种数据结构，尽管消息流经 RabbitMQ 和应用程序，但它们只能存储在队列中。队列仅受主机的内存和磁盘限制的约束，本质上是一个大的消息缓冲区。许多生产者可以将消息发送到一个队列，许多消费者可以尝试从一个队列接收数据。
4. 消费者：消费与接收具有相似的含义。消费者大多时候是一个等待接收消息的程序。请注意生产者，消费者和消息中间件很多时候并不在同一机器上。同一个应用程序既可以是生产者又是可以是消费者。

![](RabbitMQ（1-基本概念）/6.png)

### 组件

1. ConnectionFactory（连接管理器）：应用程序与 rabbit 之间建立连接的管理器，程序代码中使用
2. Channel（信道）：消息推送使用的通道
3. Exchange（交换器）：用于接收、分配消息
4. Queue（队列）：用于存储生产者的消息
5. RoutingKey（路由键）：用于把生产者的数据分配到交换器上
6. BindingKey（绑定键）：用于把交换器的消息绑定到队列上

### 广播类型

1. fanout：所有 bind 到此 exchange 的 queue 都可以接收消息，很像子网广播，每台子网内的主机都获得了一份复制的消息，fanout 交换机转发消息是最快的
2. direct：通过 routingKey 和 exchange 中的 bindingKey 决定的那个唯一的 queue 可以接收消息
3. topic：所有符合 routingKey 所 bind 的 queue 可以接收消息