---
title: Nacos（4-参数配置）
tags:
  - SpringCloud
categories: Java
cover: /img/index/mdc.jpg
top_img: /img/index/mdc.jpg
published: false
abbrlink: 50492
date: 2025-03-10 22:38:34
description: MDC（Mapped Diagnostic Context）链路跟踪用于在分布式系统中维护请求的上下文信息。通过在日志中注入唯一请求ID，MDC可实现日志关联分析，便于问题排查。结合日志框架（如Logback、Log4j）和链路追踪系统（如Sleuth、Zipkin），可提升系统可观测性，优化故障排除效率。
---

## 依赖版本

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    <version>2.2.4.RELEASE</version>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    <version>2.2.4.RELEASE</version>
</dependency>
```

## 配置中心配置

前缀：spring.cloud.nacos.config

| 参数                      | 描述                                                         |
| ------------------------- | ------------------------------------------------------------ |
| server-addr               | nacos 服务地址，优先级比 endpoint 高。                       |
| username                  | 用户名                                                       |
| password                  | 密码                                                         |
| encode                    | 配置内容编码方式                                             |
| group                     | nacos 配置组，组是配置数据元信息。 默认值：DEFAULT_GROUP     |
| prefix                    | nacos 配置 dataId 前缀。                                     |
| file-extension            | nacos config dataId 的后缀，也是配置内容的文件扩展名。       |
| timeout                   | 配置超时时间。 默认值：3000                                  |
| max-retry                 | 长轮询的最大重试次数。                                       |
| config-long-poll-timeout  | 长轮询的超时时间，单位为毫秒                                 |
| config-retry-time         | 长轮询任务重试时间，单位为毫秒                               |
| enable-remote-sync-config | 启用远程同步配置，监听器首次添加时拉取远端配置，默认值：false |
| endpoint                  | nacos 服务的域名                                             |
| namespace                 | 命名空间 ID。 Nacos 通过不同的命名空间来区分不同的环境，进行数据隔离 |
| access-key                | access key                                                   |
| secret-key                | secret key                                                   |
| context-path              | 服务器的上下文路径。                                         |
| cluster-name              | 集群名称                                                     |
| name                      | dataId 名称                                                  |
| shared-configs            | 一组共享配置，例如： spring.cloud.nacos.config.shared-configs [0] = xxx . |
| extension-configs         | 一组扩展配置，例如： spring.cloud.nacos.config.extension-configs [0] = xxx . |
| refresh-enabled           | 刷新配置的主开关，默认：true（打开）                         |

## 注册中心配置

前缀：spring.cloud.nacos.discovery

| 参数                       | 描述                                                         |
| -------------------------- | ------------------------------------------------------------ |
| server-addr                | nacos 服务地址，优先级比 endpoint 高。<br />注：多个 IP 可以通过“，”号隔离，例如 192.168.80.1:8848,192.168.80.1:8848 填写域名时前缀不要加上 http:// |
| username                   | 用户名                                                       |
| password                   | 密码                                                         |
| endpoint                   | nacos 服务的域名                                             |
| namespace                  | 命名空间 ID。 Nacos 通过不同的命名空间来区分不同的环境，进行数据隔离，服务消费时只能消费到对应命名空间下的服务。 |
| watch-delay                | 默认为 30s。<br/>默认为 true，客户端在启动时会创建一个线程池，该线程定期去查询服务端的信息列表，该请求不会立刻返回，默认等待 30s，若在 30s 内，服务端信息列表发生变化，则该请求立刻返回，通知客户端拉取服务端的服务信息列表，若 30s 内，没有变化，则 30s 时该请求返回响应，客户端服务列表不变，再次发生该请求。<br/>注：推荐该值为 30s 即可，无需修改 |
| log-name                   | nacos 客户端会在启动时打印一部分发送注册请求信息和异常日志，可以通过日志查看注册的 nacos 集群地址、服务名、nameSpace、IP、元数据等内容，文件名默认为 naming.log。<br />注：推荐将该日志的位置设置为和其他日志在一个文件夹下 |
| service                    | 项目向注册中心注册服务时的服务名。 默认为 spring.application.name 变量。 <br />注：该服务名必须使用小写，因为 nacos 服务名区分大小写，如果服务名不完全匹配，那么无法调用服务 |
| weight                     | nacos 支持服务端基于权重的负载均衡，该值默认为 1。 <br />注：建议该值保持默认即可，因为代码可能会部署到不同的服务器上，无法确保某台服务器的配置一定较好，如果有需要修改该值的需求，可以上控制台修改，这样可以保证对应 IP 服务器的权重值较高 |
| cluster-name               | 集群名称，默认值：DEFAULT                                    |
| group                      | 分组名称，默认值：DEFAULT_GROUP                              |
| naming-load-cache-at-start | 客户端在启动时是否读取本地配置项(一个文件)来获取服务列表。 默认为 false。 <br />注：推荐该值为 false，若改成 true。则客户端会在本地的一个文件中保存服务信息，当下次宕机启动时，会优先读取本地的配置对外提供服务。 |
| metadata                   | 给服务添加一些标签，例如属于什么业务线，该元数据会持久化存储在服务端，但是客户端消费时不会获取到此值，默认为空。<br />注：推荐为空，我们可以通过已经注册的服务名来找到具体的业务线，无需添加 metadata |
| register-enabled           | 该项目是否向注册中心注册服务，默认为 true。 <br />注：如果服务从注册中心只消费服务，没有对外提供服务，那么该值可设置为 false，可减少客户端线程池的创建，无需向服务端发送心跳请求，提高性能。 |
| ip                         | 服务实例要注册的 ip 地址，不用设置                           |
| network-interface          | 想要注册哪个网络接口的 ip                                    |
| port                       | 向 nacos 注册服务时，服务对应的端口号。 <br />注：无需修改，默认为应用对外提供服务的端口号，server.port |
| secure                     | 是否是 https 服务，默认：false                               |
| access-key                 | access key                                                   |
| secret-key                 | secret key                                                   |
| heart-beat-interval        | nacos 客户端向服务端发送心跳的时间间隔，默认 5s。<br/>注：客户端向服务端每隔 5s 向服务端发送心跳请求，进行服务续租，告诉服务端该实例 IP 健康。若在 3 次心跳的间隔时间(默认 15s)内服务端没有接受到该实例的心跳请求，则认为该实例不健康，该实例将无法被消费。如果再次经历 3 次心跳的间隔时间，服务端接受到该实例的请求，那么会立刻将其设置外健康，并可以被消费，若未接受到，则删除该实例的注册信息。推荐配置为 5s，如果有的业务线希望服务下线或者出故障时希望尽快被发现，可以适当减少该值。 |
| heart-beat-timeout         | 服务端没有接受到客户端心跳请求就将其设为不健康的时间间隔，默认为 15s。 注：推荐值该值为 15s 即可，如果有的业务线希望服务下线或者出故障时希望尽快被发现，可以适当减少该值。 |
| ip-delete-timeout          | ip 删除超时。 时间单位：毫秒。                               |
| instance-enabled           | 是否启用实例以接受请求。 默认值是 true。                     |

## 其他参数配置

| 参数                                       | 描述                                                         |
| ------------------------------------------ | ------------------------------------------------------------ |
| com.alibaba.nacos.naming.log.level         | Naming 客户端的日志级别，改属性通过客户端启动时通过命令行加参数指定。 <br />注：默认为 info |
| com.alibaba.nacos.naming.cache.dir         | 客户端缓存目录, 默认值：{user.home}/nacos/naming              |
| com.alibaba.nacos.client.naming.tls.enable | 是否打开 HTTPS，默认值：false                                 |
| namingLoadCacheAtStart                     | 启动时是否优先读取本地缓存，默认值：false                    |
| namingCacheRegistryDir                     | 指定缓存子目录，位置为 …/nacos/{SUB_DIR}/naming              |
| namingClientBeatThreadCount                | 客户端心跳的线程池大小                                       |
| namingPollingThreadCount                   | 客户端定时轮询数据更新的线程池大小                           |

