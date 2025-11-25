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

### 启动

1. mqnamesrv
2. mqbroker -c ..\conf\broker.conf -n localhost: 9876 autoCreateTopicEnable = true

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\1.png)

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\2.png)

### 启用 SQL 过滤

在 conf 目录下修改 broker.conf 文件，添加 enablePropertyFilter = true

### 控制台使用

1. 老版本：rocketmq-console
2. 新版本：rocketmq-dashboard

下载对应的 console 或 dashboard，修改 resource 文件的 server.port 和 rocketmq.config.namesrvAddr

```properties
server.contextPath=
server.port=17030
#spring.application.index=true
spring.application.name=rocketmq-console
spring.http.encoding.charset=UTF-8
spring.http.encoding.enabled=true
spring.http.encoding.force=true
logging.config=classpath:logback.xml
#if this value is empty,use env value rocketmq.config.namesrvAddr  NAMESRV_ADDR | now, you can set it in ops page.default localhost:9876
rocketmq.config.namesrvAddr=127.0.0.1:9876
#if you use rocketmq version < 3.5.8, rocketmq.config.isVIPChannel should be false.default true
rocketmq.config.isVIPChannel=
#rocketmq-console's data path:dashboard/monitor
rocketmq.config.dataPath=/tmp/rocketmq-console/data
#set it false if you don't want use dashboard.default true
rocketmq.config.enableDashBoardCollect=true
```

1. 执行 maven 打包命令：mvn clean package -Dmaven.test.skip = true
2. 执行启动命令： java -jar .\rocketmq-xxxxx-xxxx-1.0.0.jar
3. 访问地址：http://127.0.0.1:17030

##### 运维

1. NameServerAddressList：配置服务使用的 nameserver 的地址。如果 rockermq 集群里有加入新的 nameserver 节点，可以在这里动态配置后更新生效。
2. IsUseVIPChannel：配置服务是否使用 VIPChannel(如果你的 rockermq 版本小于 3.5.8，请设置不使用)
3. useTLS：是否启用 TLS 配置

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\3.png)

##### 驾驶舱

1. 查看 broker 的消息量（总量/5 分钟趋势图）
2. 查看单一主题的消息量（总量/5 分钟趋势图）

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\4.png)

##### 集群

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\5.png)

集群主要展示了集群当前 broker 的状态，如下是各个字段含义：

1. 分片：指的是数据分片（或者 broker），当前 rocketmq 集群的只有一个数据分片，id 为 RaftNode00，即所有数据都在这个分片上；rocketmq 的消息数据可以分布在多个数据分片上（一般都是多 broker 集群）
2. 编号：标识了哪些是 master，哪些是 slave，master 负责直接读写；slave 相当于 master 的副本，定期从 master 同步数据，如果 master 挂掉，slave 会自动内部选举一个 master 节点。
3. 地址：即 broker 的实际 ip 端口。
4. 版本：rocketmq 的版本
5. 生产消息 TPS：即 broker 中处理消息的 TPS（每秒落盘的消息数）。
6. 消费消息 TPS：即 consumer 从 broker 中收取消息的 TPS（每秒接收的消息数） 。
7. 昨日生产总数：昨天落盘的总消息数。
8. 昨日消费总数：昨天消费的总消息数。
9. 今天生产总数：今天落盘的总消息数。
10. 今天消费总数：今天消费的总消息数。
11. 状态：当前 broker 中的消息处理和消费的一些属性值
12. 配置：即启动 broker 时候 broker.conf 相关的配置项

##### 主题

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\6.png)

1. 普通主题：这里是 rocketmq 自动创建的一些系统 topic，然后用户创建的 topic 也展示在这里。
2. 重试主题：这里是发送失败时候系统为之创建的 topic。
3. 死信主题：这里的 topic 类似垃圾箱，无法从中生产或者消费消息

<font style="background-color:#FBDE28;"> 状态 </font>

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\7.png)

记录了 topic 中每个队列的起始位置（minOffset）和结束位置（maxOffset），通过累加所有队列的（maxOffset-minOffset）的差值，可以算出消息的总落盘数

<font style="background-color:#FBDE28;"> 路由 </font>

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\8.png)

RaftNode00 指的是分片，brokerAddrs 指的是分片里的几个 broker 的地址信息，即该 topic 存在于这几个 broker 中。

<font style="background-color:#FBDE28;"> Consumer 管理 </font>

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\9.png)

这里指的是 Topic 当前的 Consumer 的连接信息，没有消费者（consumer）则不显示订阅组。

<font style="background-color:#FBDE28;"> Topic 管理 </font>

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\10.png)

<font style="background-color:#FBDE28;"> 发送消息 </font>

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\11.png)

这里指的是给 topic 发送生产消息，消息包含 msgid（系统自带），tag，key，body，其中 tag 和 key 可以用于后面筛选和查找消息。

<font style="background-color:#FBDE28;"> 重置消费点位 </font>

这里指的是从头开始消费消息，比如 broker 某 topic 有 3w 条消息，现在消费了 2w 条，还剩余 1w 条没有消费，下一条应该是从 20001 条开始消费；如果点击这个重置消费点位，下一条就会重新从第一条开始消费。

<font style="background-color:#FBDE28;"> 删除 </font>

<font style="background-color:#FBDE28;"> 新增/更新 topic </font>

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\12.png)

##### 消费者

1. 添加/更新消费组

+ clusterName：创建在哪几个集群上
+ brokerName：创建在哪几个 broker 上
+ groupName：消费组名字
+ consumeEnable：是否可以消费，FALSE 的话将无法进行消费
+ consumeBroadcastEnable：是否可以广播消费
+ retryQueueNums：重试队列的大小
+ brokerId：正常情况从哪儿消费
+ whichBrokerWhenConsumeSlowly：出问题了从哪儿消费

2. 终端

##### 生产者

![](D:\blog\hexo\source\_posts\消息队列\RocketMQ\RocketMQ（3-环境配置）\13.png)

##### 消息

1. 按 topic 查询，指定开始时间和结束时间即可查询。
2. 选定 topic，输入对应的 messageID 进行查询
3. 选定 topic，输入对应的 message key 进行查询。