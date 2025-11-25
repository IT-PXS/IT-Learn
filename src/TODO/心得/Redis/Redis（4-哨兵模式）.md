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

## 基本概念

Redis 的 Sentinel 系统用于管理多个 Redis 服务器（instance）， 该系统执行以下三个任务：

1. 监控（Monitoring）： Sentinel 会不断地检查你的主服务器和从服务器是否运作正常。
2. 提醒（Notification）： 当被监控的某个 Redis 服务器出现问题时， Sentinel 可以通过 API 向管理员或者其他应用程序发送通知。
3. 自动故障迁移（Automatic failover）： 当一个主服务器不能正常工作时， Sentinel 会开始一次自动故障迁移操作， 它会将失效主服务器的其中一个从服务器升级为新的主服务器， 并让失效主服务器的其他从服务器改为复制新的主服务器； 当客户端试图连接失效的主服务器时， 集群也会向客户端返回新主服务器的地址， 使得集群可以使用新主服务器代替失效服务器。

Redis Sentinel 是一个分布式系统， 你可以在一个架构中运行多个 Sentinel 进程（progress）， 这些进程使用流言协议（gossip protocols）来接收关于主服务器是否下线的信息， 并使用投票协议（agreement protocols）来决定是否执行自动故障迁移， 以及选择哪个从服务器作为新的主服务器。

## 作用

Redis 哨兵模式（Sentinel）的作用：监控 Redis 的运行状态

1. 监控主数据库和从数据库是否正常运行
2. 主数据库出现故障时自动将从数据库转换为主数据库

![](Redis（4-哨兵模式）/1.png)

![](Redis（4-哨兵模式）/2.png)

## 特点

1. 哨兵节点会定期监控数据节点，其他哨兵节点是否可达
2. 哨兵节点会将故障转移的结果通知给应用方
3. 哨兵节点可以将从节点晋升为主节点，并维护后续正确的主从关系
4. 哨兵模式下，客户端连接的是哨兵节点集合，从中获取主节点信息
5. 节点的故障判断是由多个哨兵节点共同完成的，可有效地防止误判
6. 哨兵节点集合是由多个哨兵节点组成的，即使个别哨兵节点不可用，整个集合依然是健壮的
7. 哨兵节点也是独立的 Redis 节点，是特殊的 Redis 节点，它们不存储数据，只支持部分命令

## 实现原理

![](Redis（4-哨兵模式）/3.png)

哨兵启动后会与要监控的主数据库建立两条连接，和主数据库连接建立完成后，哨兵会使用连接 2 发送如下命令：

1. 每 10 秒钟哨兵会向主数据库和从数据库发送 INFO 命令
2. 每 2 秒钟哨兵会向主数据库和从数据库的\_sentinel_: hello 频道发送自己的消息
3. 每 1 秒钟哨兵会向主数据、从数据库和其他哨兵节点发送 PING 命令

发送 INFO 命令会返回当前数据库的相关信息（运行 id，从数据库信息等）从而实现新节点的自动发现，配置哨兵时只需要监控 Redis 主数据库即可，因为哨兵可以借助 INFO 命令来获取所有的从数据库信息（slave），进而和从数据库分别建立两个连接，在此之后哨兵会每隔 10 秒钟向已知的主从数据库发送 INFO 命令来获取信息更新并进行相应的操作

接下来哨兵向主从数据库的\_sentinel_: hello 频道发送信息与同样监控该数据库的哨兵分享自己的信息，发送信息内容为：

```java
<哨兵的地址>，<哨兵的端口>，<哨兵的运行ID>，<哨兵的配置版本>，
<主数据库的名字>，<主数据库的地址>，<主数据库的端口>，<主数据库的配置版本>
```

![](Redis（4-哨兵模式）/4.png)

哨兵通过监听的\_sentinel_: hello 频道接收到其他哨兵发送的消息后会判断哨兵是不是新发现的哨兵，如果是则将其加入已发现的哨兵列表中并创建一个到其的连接（哨兵与哨兵只会创建用来发送 PING 命令的连接，不会创建订阅频道的连接）

实现了自动发送从数据库和其他哨兵节点后，哨兵要做的就是定时监控这些数据和节点运行情况，每隔一定时间向这些节点发送 PING 命令来监控，间隔时间和 down-after-milliseconds 选项有关

```java
// 每隔 1 秒发送一次 PING 命令
sentinel down-after-milliseconds mymaster 60000
// 每隔 600 毫秒发送一次 PING 命令
sentinel down-after-milliseconds othermaster 600
```

## 主节点下线

**主观下线**

当超过 down-after-milliseconds 指定时间（默认 30s）后，如果被 PING 的数据库或节点仍然未回复，则哨兵认为其主观下线，主线下线表示从当前的哨兵进程看来，该节点已经下线，修改其 flags 状态为 SRI_S_DOWN

服务器对 PING 命令的有效回复可以是以下三种回复的其中一种：

- 返回 `+PONG` 。
- 返回 `-LOADING` 错误。
- 返回 `-MASTERDOWN` 错误。

如果服务器返回除以上三种回复之外的其他回复， 又或者在指定时间内没有回复 PING 命令， 那么 Sentinel 认为服务器返回的回复无效（non-valid）。

注意：一个服务器必须在 down-after-milliseconds 毫秒内，一直返回无效回复才会被 Sentinel 标记为主观下线。

**客观下线**

在主观下线后，如果该节点是主数据库，则哨兵会进一步判断是否需要对其进行故障恢复，哨兵发送 SENTINEL is-master-down-by-addr 命令询问其他哨兵节点以了解他们是否也认为该主数据库主观下线

发送命令：sentinel is-master-down-by-addr \< ip > \< port > <current_epoch> \< runid >

1. ip：主观下线的服务 ip
2. port：主观下线的服务端口
3. current_epoch：sentinel 的纪元
4. runid：*表示检测服务下线状态，如果是 sentinel 的运行 id，表示用来选举领头 sentinel

例如：sentinel monitor mymaster 127.0.0.1 6380 2

每个 sentinel 收到命令之后，会根据发送过来的 ip 和 port 检查自己判断的结果，回复自己是否认为该 master 节点已经下线了。回复内容主要包含三个参数（由于上面发送的 runid 参数是*，这里先忽略后两个参数）

1. down_state（1 表示已下线，0 表示未下线）
2. leader_runid（领头 sentinal id）
3. leader_epoch（领头 sentinel 纪元）。

如果达到指定数量时，哨兵会认为其客观下线，并选举领头的哨兵节点对主从系统发起故障恢复，这个指定数量就是 quorum 参数 （默认为 n/2+1），该配置表示只有当至少两个 sentinel 节点（包括当前节点）认为主数据库主观下线时，当前哨兵节点才会认为该主数据库客观下线，接下来选举领头哨兵

在一般情况下，每个 Sentinel 每隔 10s 向所有的 Master，Slave 发送 INFO 命令。当 Master 被 Sentinel 标记为客观下线时，Sentinel 向下线的 Master 的所有 Slave 发送 INFO 命令的频率会从 10 秒一次改为每秒一次。作用：发现最新的集群拓扑结构

## 选举领头哨兵

当前哨兵虽然发现了主数据库客观下线，需要故障恢复，但故障恢复需要由领头哨兵来完成，这样来保证同一时间只有一个哨兵来执行故障恢复，选举领头哨兵的过程使用了 Raft 算法，具体过程如下：

1. 发现主数据库客观下线的哨兵节点（A）向每个哨兵节点发送命令 SENTINEL is-master-down-by-addr ip port current_epoch runid，要求对象选择自己成为领头哨兵

注意：这时的 runid 是自己的 run id，每个 sentinel 节点都有一个自己运行时 id

2. 如果目标哨兵节点没有选过其他人，则会同样将 A 设置为领头哨兵。目标 sentinel 回复是否同意 master 下线并选举领头 sentinel，选择领头 sentinel 的过程符合先到先得的原则。举例：sentinel1 判断了客观下线，向 sentinel2 发送了第一步中的命令，sentinel2 回复了 sentinel1，说选你为领头，这时候 sentinel3 也向 sentinel2 发送第一步的命令，sentinel2 会直接拒绝回复

3. 如果 A 发现有大于等于 quorum 参数值的哨兵节点同样选择自己成为领头哨兵，则 A 成功成为领头哨兵

4. 当有多个哨兵节点同时参选领头哨兵，则会出现没有任何节点当选的可能，此时每个参选节点将等待一个随机事件重新发起参选请求进行下一轮选举，直到选举成功

## 故障恢复

选出领头哨兵后，领头哨兵将会开始对主数据库进行故障恢复

1. 在进行选择之前需要先剔除掉一些不满足条件的 slave，这些 slave 不会作为变成 master 的备选

* 剔除列表中已经下线的从服务
* 剔除有 5s 没有回复 sentinel 的 info 命令的 slave
* 剔除与已经下线的主服务连接断开时间超过 down-after-milliseconds * 10 + master 宕机时长 的 slave

2. 选主过程：

![](Redis（4-哨兵模式）/5.png)

新的 master 节点选择出来之后，还需要做一些事情配置的修改，如下：

1. 领头 sentinel 会对选出来的从节点执行 slaveof no one 命令让其成为主节点
2. 领头 sentinel 向别的 slave 发送 slaveof 命令，告诉他们新的 master 是谁谁谁，你们向这个 master 复制数据
3. 如果之前的 master 重新上线时，领头 sentinel 同样会给其发送 slaveof 命令，将其变成从节点

## 为什么哨兵节点至少 3 节点？

一个哨兵集群选举成为 Leader 的最低票数为 quorum 和哨兵节点数/2+1 的最大值，如果哨兵集群只有 2 个节点，则 Leader 最低票数至少为 2，当该哨兵集群中有一个节点故障后，仅剩的一个节点是永远无法成为 Leader
