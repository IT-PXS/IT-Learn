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

## 核心组件

1. Broker：接受和分发消息的应用，RabbitMQ Server 就是 Message Broker
2. virtual host：出于多租户和安全因素设计的，把 AMQP 的基本组件划分到一个虚拟的分组中，类似于网络中的 namespace 概念，当多个不同的用户使用同一个 RabbitMQ server 提供的服务时，可以划分出多个 vhost 创建 exchange/queue 等
3. Connection：publisher/consumer 和 broker 之间的 TCP 连接
4. Channel：如果每一次访问 RabbitMQ 都建议一个 Connection，在消息量大的时候建立 TCP Connection 的开销将是巨大的，效率也较低。Channel 是在 connection 内部建立的逻辑连接，如果应用程序支持多线程，通常每个 thread 创建单独的 channel 进行通讯，AMQP method 包含了 channel id 帮助客户端和 message broker 识别 channel，所以 channel 之间是完全隔离的
5. Exchange：message 到达 broker 的第一站，根据分发规则，匹配查询表中的 routing key，分发消息到 queue 中去。
6. Queue：消息最终被送到这里等待 consumer 取走
7. Binding：exchange 和 queue 之间的虚拟连接，binding 中可以包含 routing key，Binding 信息被保存到 exchange 中的查询表中，用于 message 的分发依据

## 工作模式

1. 简单模式

一个生产者，一个消费者，一个队列。生产者将消息发送到队列，消费者从队列中接收消息。这种模式简单直观，适用于一对一的消息传递场景。

2. 工作队列模式

一个生产者对应多个消费者，消息通过轮询或公平分发的方式被消费者获取。这种模式适用于需要并行处理消息的场景，通过多个消费者共同分担处理压力，提高系统的吞吐量和响应速度。

3. 发布/订阅模式

生产者将消息发送到 Exchange，Exchange 将消息广播到一个或多个队列，每个队列有一个或多个消费者监听。这种模式适用于需要将消息广播给多个消费者的场景，如实时日志收集、事件通知等。

4. 路由模式

生产者将消息发送到带有路由键的 Exchange，Exchange 根据路由键将消息路由到匹配的队列。这种模式可以实现消息的精确传递，只有符合特定路由键的队列才能接收到消息。适用于需要将消息按照不同规则发送到不同队列的场景。

5. 主题模式

与路由模式类似，但使用模糊匹配的方式。路由键是一个由点分隔的字符串，队列在绑定 Exchange 时可以使用通配符来匹配路由键。这种模式提供了更灵活的消息路由机制，可以根据消息的不同属性将其路由到不同的队列。

## 死信队列

DLX（Dead-Letter-Exchange）：当消息在一个队列中变成死信之后，它能重新被发送到另一个交换器中，这个交换器就是 DLX，绑定 DLX 的队列称之为死信队列

导致死信队列的原因：

1. 消息被拒绝（Reject/Nack）且 requeue = false
2. 消息 TTL 过期
3. 队列满了，无法再添加

## 如何保证消息不丢失？

### 出现场景

RabbitMQ 丢失消息的情况：

1. 生产者丢消息：生产者将数据发送到 RabbitMQ 的时候，可能在传输过程中因为网络等问题而将数据丢失了
2. RabbitMQ 自己丢消息：如果没有开启 RabbitMQ 的持久化，那么 RabbitMQ 一旦重启数据就丢了，所以必须开启持久化将消息持久化到磁盘，这样就算 RabbitMQ 挂了，恢复之后会自动读取之前存储的数据，一般数据会不丢失，除非极其罕见的情况，RabbitMQ 还没来得及持久化自己就挂了，这样可能导致一部分数据丢失
3. 消费端丢消息：消费者消费时，刚消费到还没有处理，结果消费者就挂了，这样重启之后，RabbitMQ 就认为你已经消费过了，然后就丢了数据

### 解决方法

#### 生产者丢消息

1. 可以选择使用 RabbitMQ 的事务功能：生产者发送数据之前开启事务，然后发送消息，如果消息没有被 RabbitMQ 接收到，那么生产者会收到异常报错，这时就可以回滚事务，然后尝试重新发送，如果收到了消息，那么就可以提交事务。这种方式有明显的缺点，即 RabbitMQ 事务开启后，就会变为同步阻塞操作，生产者会阻塞等待是否发送成功，太耗性能会造成吞吐量的下降
2. 可以开启 confirm 模式：在生产者那里设置开启了 confirm 模式之后，每次写的消息都会分配一个唯一的 id，如果写入了 RabbitMQ 之后，RabbitMQ 会给你回传一个 ack 消息，告诉你这个消息发送 OK 了。如果 RabbitMQ 没能处理这个消息，会回调你一个 nack 接口，告诉你这个消息失败了，你可以进行重试，而且你可以结合这个机制知道自己在内存里维护每个消息的 id，如果超过一定时间还没接收到这个消息的回调，那么你可以进行重发

区别：事务机制是同步的，你提交了一个事务之后会阻塞住，但是 confirm 机制是异步的，发送消息之后可以接着发送下一个消息，然后 RabbitMQ 会回调告知成功与否，一般在生产者避免丢失时，都是用 confirm 机制

#### RabbitMQ 丢消息

1. 设置消息持久化到磁盘：创建 Queue 的时候将其设置为持久化的，这样就可以保证 RabbitMQ 持久化 Queue 的元数据，但是不会持久化 Queue 里面的数据。发送消息的时候将消息的 deliveryMode 设置为 2，这样消息就会被设为持久化，此时 RabbitMQ 就会将消息持久化到磁盘上，必须要同时开启这两个才可以
2. ACK 确认机制：持久化可以跟生产的 confirm 机制配合起来，只有消息持久化到了磁盘之后，才会通知生产者 ack，这样就算是在持久化之前 RabbitMQ 挂了，数据丢了，生产者收不到 ack 回调也会进行消息重发
3. 设置集群镜像模式：通过配置 RabbitMQ 的集群镜像模式，可以实现在集群中的多个节点上同步队列和交换机的状态。当一个节点发生故障时，其他节点可以继续提供服务，从而确保消息的可靠性和稳定性。

#### 消费端丢消息

使用 RabbitMQ 提供的 ack 机制，首先关闭 RabbitMQ 的自动 ack，然后每次在确保处理完这个消息之后，在代码里手动调用 ack，这样就可以避免消息还没有处理完就 ack

## 如何保证消息不被重复消费？

### 出现场景

在保证 MQ 消息不重复的情况下，消费者消息消费成功后，在给 MQ 发送消息确认的时候出现了网络异常（或者是服务中断），MQ 没有接收到确认，此时 MQ 不会将发送的消息删除，为了保证消息被消费，当消费者网络稳定后，MQ 就会继续给消费者投递之前的内容，这时消费者就接收到了两条一样的消息

```java
@GetMapping("/rabbitmq/sendToClient")
public String sendToClient() {
    String message = "server message sendToClient";
    for (int i = 0; i < 10000; i++) {
        amqpTemplate.convertAndSend("queueName3",message+": "+i);
    }
    return message;
}

// @RabbitListener 注解到类和方法都可以
// 发送的队列名称
@RabbitListener(queues = "queueName3")
@RabbitHandler
public void receiveMessage(String message) {
    System.out.println("接收者2--接收到queueName3队列的消息为："+message);
}
```

启动消费者服务，然后中断消费服务，此时消费到了第 7913 个消息

![](D:\blog\hexo\source\_posts\心得\消息队列\RabbitMQ\8.png)

此时查看 MQ 的消息，现在 MQ 队列中应该还有 2087 个消息，但现在有 2088 个消息，说明最后一个消息被消费了没有被 MQ 服务确认

![](D:\blog\hexo\source\_posts\心得\消息队列\RabbitMQ\9.png)

![](D:\blog\hexo\source\_posts\心得\消息队列\RabbitMQ\10.png)

要保证消息不被重复消费，其实就是要保证消息消费时的幂等性

### 解决方法

1. 让生产者发送每条数据的时候，里面加一个全局唯一的 id，然后根据这个 id 进行查询，如果没有消费过就进行处理，如果消费过了就别处理
2. 写数据时，先根据主键查一下这条数据是否存在，如果已经存在则 update
3. 如果是写 redis 就没有问题，因为 set 操作是天然幂等性的

**消息生产者服务**

```java
/**
 * @Description:  发送消息 模拟消息重复消费
 *  消息重复消费情景：消息生产者已把消息发送到 mq，消息消费者在消息消费的过程中突然因为网络原因或者其他原因导致消息消费中断
 *  消费者消费成功后，在给 MQ 确认的时候出现了网络波动，MQ 没有接收到确认，
 *  为了保证消息被消费，MQ 就会继续给消费者投递之前的消息。这时候消费者就接收到了两条一样的消息
*/
@GetMapping("/rabbitmq/sendMsgNoRepeat")
public String sendMsgNoRepeat() {
    String message = "server message sendMsgNoRepeat";
    for (int i = 0; i <10000 ; i++) {
        Message msg = MessageBuilder.withBody((message+"--"+i).getBytes()).setMessageId(UUID.randomUUID()+"").build();
        amqpTemplate.convertAndSend("queueName4",msg);
    }
    return message;
}
```

**消息消费者服务**

1. 将 id 存入 String 中（单消费者场景）

这样一个队列，redis 数据只有一条，每次消息过来都覆盖之前的消息，但是消费者多的情况下不使用，这样可能会存在问题：一个消息被多个消费者消费

```java
@RabbitListener(queues = "queueName4")
@RabbitHandler
public void receiveMessage(Message message) throws UnsupportedEncodingException {
    String messageId = message.getMessageProperties().getMessageId();
    String msg = new String(message.getBody(),"utf-8");

    String messageRedisValue = redisUtil.get("queueName4","");
    if (messageRedisValue.equals(messageId)) {
        return;
    }
    System.out.println("消息："+msg+", id:"+messageId);
    redisUtil.set("queueName4",messageId);//以队列为 key，id 为 value
}
```

2. 将 id 存入 list 中（多消费者场景）

这个方案可以解决多消费者的问题，但是随着 MQ 的消息增多，redis 数据越来越多，需要去清除 redis 数据

```java
@RabbitListener(queues = "queueName4")
@RabbitHandler
public void receiveMessage1(Message message) throws UnsupportedEncodingException {
    String messageId = message.getMessageProperties().getMessageId();
    String msg = new String(message.getBody(),"utf-8");

    List<String> messageRedisValue = redisUtil.lrange("queueName4");
    if (messageRedisValue.contains(messageId)) {
        return;
    }
    System.out.println("消息："+msg+", id:"+messageId);

    redisUtil.lpush("queueName4",messageId);//存入 list
}
```

3. 将 id 为 key 值增量存入 String 中并设置过期时间

以消息 id 为 key，消息内容为 value 存入 String 中，设置过期时间（可承受的 redis 服务器异常时间，比如设置过期时间为 10 分钟，如果 redis 服务器断了 20 分钟，那么已消费的数据都会丢了）

```java
@RabbitListener(queues = "queueName4")
@RabbitHandler
public void receiveMessage2(Message message) throws UnsupportedEncodingException {
    String messageId = message.getMessageProperties().getMessageId();
    String msg = new String(message.getBody(),"utf-8");

    String messageRedisValue = redisUtil.get(messageId,"");
    if (msg.equals(messageRedisValue)) {
        return;
    }
    System.out.println("消息："+msg+", id:"+messageId);

    redisUtil.set(messageId,msg,10L);//以 id 为 key，消息内容为 value，过期时间 10 分钟
}
```

## 如何保证消息的顺序性？

### 出现场景

对某个订单的增删改操作，比如：有三条 binlog 执行顺序是增加、修改、删除，消费者愣是换了顺序给执行成删除、修改、增加，这样是不行的

对于 RabbitMQ 来说，导致上面顺序错乱的原因通常是消费者是集群部署，不同的消费者消费到了同一订单的不同消息，如：消费者 A 执行了增加，消费者 B 执行了修改，消费者 C 执行了删除，但是消费者 C 比消费者 B 快，消费者 B 比消费者 A 快，就会导致消费 binlog 执行到数据库的时候顺序错乱

![](D:\blog\hexo\source\_posts\心得\消息队列\RabbitMQ\11.png)

### 解决方法

由于不同的消息都发送到了同一个 Queue 中，多个消费者都消费同一个 Queue 的消息。我们可以给 RabbitMQ 创建多个 Queue，每个消费者固定消费一个 Queue 的消息，生产者发送消息的时候，同一个订单号的消息发送到同一个 Queue 中，由于同一个 Queue 的消息是一定会保证有序的，那么同一个订单号的消息就只会被一个消费者顺序消费，从而保证了消息的顺序性

![](D:\blog\hexo\source\_posts\心得\消息队列\RabbitMQ\12.png)

## 如何解决大量消息在 MQ 里长时间积压？

### 出现场景

1. 生产消息的速度长时间远大于消费的速度：这是消息堆积最常见的原因。当生产者发送消息的速度远超过消费者能够处理的速度时，消息就会在队列中逐渐堆积。
2. 消费者出现异常或故障：如果消费者在处理消息的过程中出现异常或故障，无法正常消费消息，那么这些消息就会滞留在队列中，导致消息堆积。
3. 消费者与队列间的订阅问题：如果消费者与队列之间的订阅关系出现问题，比如消费者未能正确连接到队列或者订阅关系丢失，那么消息就无法被消费者正常消费，从而导致堆积。
4. 消费者的消费能力降低：即使消费者正常工作，但如果其处理消息的能力降低，比如由于资源限制或性能瓶颈导致处理速度变慢，也会导致消息等待消费的时间过长，从而在队列中堆积。
5. 网络故障：如果 RabbitMQ 集群中的节点之间出现网络故障，可能导致消息无法正常传输或同步，从而导致消息堆积。
6. 队列配置不当：队列的配置，如消息确认模式、队列长度限制等，如果设置不当，也可能导致消息堆积。

### 解决方法

1.  生产者 

* 给消息设置年龄，超时就丢弃
* 考虑使用队列最大长度限制
* 减少发布频率

2. 消费者

* 增加消费者的处理能力，如：优化代码，使用 JDK 的队列缓存数据，多线程去处理（一般考虑顺序问题，采用单线程）
* 建立新的 queue，消费者同时订阅新旧 queue，采用订阅模式
* 默认情况下，RabbitMQ 消费者为单线程串行消费，设置并发消费两个关键属性：concurrentConsumers 和 prefetchCount，concurrentConsumers：设置的是每个 listener 在初始化的时候设置的并发消费者的个数；prefetchCount：每次从 broker 里面取的待消费的消息的个数

```properties
spring.rabbitmq.listener.concurrency=m
spring.rabbitmq.listener.prefetch=n
```

3. 复杂修复

* 先修复 consumer 的问题，确保其恢复消费速度，然后将现有 consumer 都停掉
* 新建一个 topic，partition 是原来的 10 倍，临时建立好原先 10 倍的 queue 数量
* 然后写一个临时的分发数据的 consumer 程序，这个程序部署上去消费积压的数据，消费之后不做耗时的处理，直接均匀轮询写入临时建立好的 10 倍数量的 queue
* 接着临时征用 10 倍的机器来部署 consumer，每一批 consumer 消费一个临时 queue 的数据，这种做法相当于是临时将 queue 资源和 consumer 资源扩大 10 倍，以正常的 10 倍速度来消费数据
* 等快速消费完积压数据之后，得恢复原先部署的架构，重新用原先的 consumer 机器来消费消息

## 如何保证消息队列的高可用？

### 单机模式

单机模式平常使用在开发或者本地测试场景，一般测试是不是能够正确地处理消息，生产上基本没人去用单机模式，风险很大

### 普通集群模式

启动多个 RabbitMQ 实例，在你创建的 queue，只会放在一个 RabbitMQ 实例上，但是每个实例都同步 queue 的元数据，在消费的时候完了，如果连接到了另外一个实例，那么这个实例会从 queue 所在实例上拉取数据过来

问题：没做到所谓的分布式，就是个普通集群。因为这导致你要么消费者每次随机连接一个实例然后拉取数据，要么固定连接那个 queue 所在实例消费数据，前者有数据拉取的开销，后者导致单实例性能瓶颈。而且如果那个放 queue 的实例宕机了，会导致接下来其他实例就无法从那个实例拉取，如果开启了消息持久化，让 RabbitMQ 落地存储消息的话，消息不一定会丢，得等这个实例恢复了，然后才可以继续从这个 queue 拉取数据

### 镜像集群模式

这种模式为所谓的 RabbitMQ 的高可用模式，跟普通集群模式不一样的是，创建的 queue，无论元数据还是 queue 里的消息都会存在于多个实例上，然后每次写消息到 queue 的时候，都会自动把消息到多个实例的 queue 里进行消息同步

优点在于任何一个实例宕机了，别的实例都可以用。缺点在于性能开销太大和扩展性很低，同步所有实例，这会导致网络带宽和压力很重，而且扩展性很低，每增加一个实例都会去包含已有的 queue 的所有数据，并没有办法线性扩展 queue

开启镜像集群模式可以去 RabbitMQ 的管理控制台去增加一个策略，指定要求数据同步到所有节点，也可以要求就同步到指定数量的节点，然后再次创建 queue 的时候，应用这个策略，就会自动将数据同步到其他的节点上去了

## 如何确保集群的高可用性？

确保 RabbitMQ 集群的高可用性，可以采取以下几个关键措施：

1. 节点冗余和自动切换：在 RabbitMQ 集群中，每个节点都拥有自己的数据副本。如果某个节点发生故障，其他节点可以继续处理消息。同时，RabbitMQ 提供了自动切换功能，当某个节点不可用时，其他节点可以自动接管该节点的职责，以保证集群的高可用性。
2. 持久化机制：RabbitMQ 支持消息持久化，可以将消息保存在磁盘上，即使节点发生故障，消息也不会丢失。同时，持久化机制还可以保证在节点恢复后，消息可以重新被加载到内存中，继续进行处理。
3. 镜像队列：RabbitMQ 的镜像队列可以确保队列中的消息和元数据在所有节点上都有备份。即使某个节点发生故障，其他节点仍然可以访问队列中的消息。同时，镜像队列还可以提高集群的负载均衡能力，因为所有节点都可以处理相同的消息。
4. 备份和恢复：定期对 RabbitMQ 的数据进行备份，以防止数据丢失或损坏。在节点故障或数据损坏的情况下，可以使用备份数据进行恢复。
5. 使用合适的集群模式：RabbitMQ 提供了多种集群模式，包括普通集群模式和镜像集群模式。普通集群模式使用 Erlang 语言的天生具备的集群方式搭建，但消息可靠性不是很高，适用于对消息安全性要求不高的场景。而镜像集群模式，即 RabbitMQ 的官方 HA 高可用方案，是在普通集群模式基础上的一种增强方案，它需要在搭建了普通集群之后再补充搭建，能确保消息的高可用性。

## RAM node 和 Disk node 的区别

RAM node 和 Disk node 是 RabbitMQ 中的两种不同类型的节点，它们的主要区别在于存储方式和性能特点。

RAM node 将 RabbitMQ 中的元数据，如 queue、exchange 和 binding 等 RabbitMQ 基础构件（即 fabric）相关数据，仅保存到内存中。这意味着 RAM node 在处理数据时具有较高的性能，因为内存访问速度通常远快于磁盘访问。然而，由于数据仅存储在内存中，一旦节点崩溃或重启，数据将会丢失，因此 RAM node 不适合用于持久化存储重要数据。

相比之下，Disk node 会在内存和磁盘中均进行存储。这意味着 Disk node 不仅将元数据保存在内存中以提高访问速度，同时也将数据写入磁盘以确保数据的持久性。因此，即使在节点崩溃或重启的情况下，Disk node 也能保留数据，从而保证了数据的可靠性和安全性。然而，由于涉及到磁盘操作，Disk node 在处理数据时可能不如 RAM node 速度快。

另外，为了确保 RabbitMQ 集群的稳定性和数据的可靠性，在 RabbitMQ cluster 中至少需要存在一个 Disk node。这是因为在某些情况下，如集群元数据更新或节点故障转移时，需要 Disk node 来确保数据的持久性和一致性。

综上所述，RAM node 和 Disk node 的主要区别在于存储方式和性能特点。RAM node 速度快但数据易失，适用于对数据持久性要求不高但性能要求较高的场景；而 Disk node 虽然速度稍慢但数据可靠，适用于需要持久化存储重要数据的场景。

## 如何自动删除长时间没有消费的 RabbitMQ 消息？
在 RabbitMQ 中，可以通过设置消息的过期时间（TTL，Time To Live）来实现自动删除长时间没有消费的消息。消息的 TTL 决定了消息在队列中的存活时间，一旦消息过期，RabbitMQ 会自动将其从队列中删除。

1. 队列级别的 TTL

在创建队列时，可以使用 x-message-ttl 参数来设置整个队列的 TTL。队列中的所有消息都将继承这个 TTL。当某个消息的过期时间小于队列的 TTL 时，该消息会被立即删除。当某个消息的过期时间大于队列的 TTL 时，RabbitMQ 会根据消息的过期时间来删除它。

2. 单个消息级别的 TTL

在发布消息时，可以为每个消息单独设置 TTL。这个 TTL 会覆盖队列级别的 TTL（如果存在的话）。通过设置不同消息的 TTL，可以实现消息的延时处理或不同优先级的消息有不同的存活时间。

此外，RabbitMQ 还提供了死信队列（Dead Letter Exchanges，DLX）的机制。如果一个消息在队列中过期，它会被发送到一个配置好的死信队列中，而不是直接删除。这样，你可以对过期的消息进行进一步的处理或分析。
