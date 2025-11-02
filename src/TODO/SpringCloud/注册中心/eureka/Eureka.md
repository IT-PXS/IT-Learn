---
title: Nacos（1-环境搭建）
series: SpringCloud
tags:
  - SpringCloud
categories: Java
cover: /img/index/nacos.png
top_img: /img/index/nacos.png
published: true
abbrlink: 50492
date: 2025-03-15 22:38:34
description: Nacos 是阿里巴巴开源的动态服务发现、配置管理与服务管理平台。环境配置包括 Nacos 的安装部署、数据库存储模式选择（嵌入式或 MySQL）、集群与多环境配置、权限控制及参数优化，确保服务高可用与配置中心高效稳定运行，适用于微服务架构。
---

## 常用配置

```yaml
eureka:
  client: #eureka客户端配置
    register-with-eureka: true #是否将自己注册到eureka服务端上去
    fetch-registry: true #是否获取eureka服务端上注册的服务列表
    service-url:
      defaultZone: http://localhost:8001/eureka/ # 指定注册中心地址
    enabled: true # 启用eureka客户端
    registry-fetch-interval-seconds: 30 #定义去eureka服务端获取服务列表的时间间隔
  instance: #eureka客户端实例配置
    lease-renewal-interval-in-seconds: 30 #定义服务多久去注册中心续约
    lease-expiration-duration-in-seconds: 90 #定义服务多久不去续约认为服务失效
    metadata-map:
      zone: jiangsu #所在区域
    hostname: localhost #服务主机名称
    prefer-ip-address: false #是否优先使用ip来作为主机名
  server: #eureka服务端配置
    enable-self-preservation: false #关闭eureka服务端的保护机制
```

## 基本使用
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>org.example</groupId>
    <artifactId>springcloud</artifactId>
    <packaging>pom</packaging>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <java.version>1.8</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>2.3.7.RELEASE</spring-boot.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>Hoxton.SR9</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

### 服务端
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

```java
@SpringBootApplication
@EnableEurekaServer
public class ServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class,args);
    }
}
```

```yaml
server:
  port: 8001
spring:
  application:
    name: eureka-server #指定服务名称
eureka:
  instance:
    hostname: localhost #指定主机地址
  client:
    fetch-registry: false #指定是否从注册中心获取服务（注册中心不需要开启）
    register-with-eureka: false #指定是否要注册到注册中心（注册中心不需要开启）
    service-url:
    	# 指定注册中心地址，如果是集群，需要加上其它Server的地址
      defaultZone: http://localhost:8001/eureka/
  server:
    enable-self-preservation: false #关闭保护模式
```

访问localhost:8081

![](Eureka/1.png)

### 客户端
```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

```java
@SpringBootApplication
@EnableEurekaClient
public class ClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(ClientApplication.class, args);
    }
}
```

```yaml
server:
  port: 8101
spring:
  application:
    name: eureka-client #服务名称
eureka:
  client:
    register-with-eureka: true  #注册到eureka的注册中心
    fetch-registry: true  #获取注册实例列表
    service-url: 
      defaultZone: http://localhost:8101/eureka #配置注册中心地址
```

![](Eureka/2.png)

## 注册中心集群
```yaml
server:
  port: 8002
spring:
  application:
    name: eureka-server
eureka:
  instance:
    hostname: localhost
  client:
    service-url: 
      defaultZone: http://localhost:8003/eureka/ #注册到另一个Eureka注册中心
    fetch-registry: true
    register-with-eureka: true
```

```yaml
server:
  port: 8003
spring:
  application:
    name: eureka-server
eureka:
  instance:
    hostname: localhost
  client:
    service-url: 
      defaultZone: http://localhost:8002/eureka/ #注册到另一个Eureka注册中心
    register-with-eureka: true
    fetch-registry: true
```

<font style="background-color:#FBDE28;">客户端yaml</font>

```yaml
server:
  port: 8101
spring:
  application:
    name: eureka-client #服务名称
eureka:
  client:
    register-with-eureka: true  #注册到eureka的注册中心
    fetch-registry: true  #获取注册实例列表
    service-url: 
#      defaultZone: http://localhost:8001/eureka #配置注册中心地址
			#同时注册到两个注册中心
      defaultZone: http://localhost:8002/eureka,http://localhost:8003/eureka
```

## 注册中心添加认证SpringSecurity
```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

```yaml
server:
  port: 8004
spring:
  application:
    name: eureka-security-server
  security:
    user:
      name: user
      password: 123456
eureka:
  instance:
    hostname: localhost
  client:
    register-with-eureka: true
    fetch-registry: true
```

```java
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().ignoringAntMatchers("/eureka/**");
        super.configure(http);
    }
}
```

<font style="background-color:#FBDE28;">客户端yaml</font>

```yaml
server:
  port: 8101
spring:
  application:
    name: eureka-client #服务名称
eureka:
  client:
    register-with-eureka: true  #注册到eureka的注册中心
    fetch-registry: true  #获取注册实例列表
    service-url: 
#      defaultZone: http://localhost:8001/eureka #配置注册中心地址
    	#同时注册到两个注册中心
#      defaultZone: http://localhost:8002/eureka,http://localhost:8003/eureka
      # 注册到有登录认证的注册中心：http://${username}:${password}@${hostname}:${port}/eureka/
      defaultZone: http://user:123456@localhost:8004/eureka/
```

## 版本号和IP显示
1. Application下的名字对应spring.application.name
2. status下的是状态+instanceID , instanceID默认值为主机名+服务名+端口（即：${spring.cloud.client.ipAddress}:${spring.application.name}:${spring.application.instance_id:${server.port}}）
3. 鼠标移到status下的instanceID那里，左下角显示的是主机名:端口/actuaor/info

```yaml
eureka:
	instance:
  	# 添加项目版本号
  	instance-id: ${spring.cloud.client.ipAddress}:${spring.application.name}:${server.port}:@project.version@
  	# 主机名用ip表示
  	prefer-ip-address: true
```

![](Eureka/3.png)

## 工作流程
1. Eureka Server 启动成功，等待服务端注册。在启动过程中如果配置了集群，集群之间定时通过 Replicate 同步注册表，每个 Eureka Server 都存在独立完整的服务注册表信息。
2. Eureka Client 启动时根据配置的 Eureka Server 地址去注册中心注册服务。
3. Eureka Client 会每 30s 向 Eureka Server 发送一次心跳请求，证明客户端服务正常。
4. 当 Eureka Server 90s 内没有收到 Eureka Client 的心跳，注册中心则认为该节点失效，会注销该实例。
5. 单位时间内 Eureka Server 统计到有大量的 Eureka Client 没有上送心跳，则认为可能为网络异常，进入自我保护机制，不再剔除没有上送心跳的客户端。
6. 当 Eureka Client 心跳请求恢复正常之后，Eureka Server 自动退出自我保护模式。
7. Eureka Client 定时全量或者增量从注册中心获取服务注册表，并且将获取到的信息缓存到本地。
8. 服务调用时，Eureka Client 会先从本地缓存找寻调取的服务。如果获取不到，先从注册中心刷新注册表，再同步到本地缓存。
9. Eureka Client 获取到目标服务器信息，发起服务调用。
10. Eureka Client 程序关闭时向 Eureka Server 发送取消请求，Eureka Server 将实例从注册表中删除。

## 自我保护机制
默认情况下，如果 Eureka Server 在一定的 90s 内没有接收到某个微服务实例的心跳，会注销该实例。但是在微服务架构下服务之间通常都是跨进程调用，网络通信往往会面临着各种问题，比如微服务状态正常，网络分区故障，导致此实例被注销。

固定时间内大量实例被注销，可能会严重威胁整个微服务架构的可用性。为了解决这个问题，Eureka 开发了自我保护机制，那么什么是自我保护机制呢？

1. Eureka Server 在运行期间会去统计心跳失败比例在 15 分钟之内是否低于 85%，如果低于 85%，Eureka Server 即会进入自我保护机制。
2. Eureka Server 进入自我保护机制，会出现以下几种情况：
+ Eureka 不再从注册列表中移除因为长时间没收到心跳而应该过期的服务。
+ Eureka 仍然能够接受新服务的注册和查询请求，但是不会被同步到其它节点上(即保证当前节点依然可用)。
+ 当网络稳定时，当前实例新的注册信息会被同步到其它节点中。
3. Eureka 自我保护机制是为了防止误杀服务而提供的一个机制。当个别客户端出现心跳失联时，则认为是客户端的问题，剔除掉客户端；当 Eureka 捕获到大量的心跳失败时，则认为可能是网络问题，进入自我保护机制；当客户端心跳恢复时，Eureka 会自动退出自我保护机制。
4. 如果在保护期内刚好这个服务提供者非正常下线了，此时服务消费者就会拿到一个无效的服务实例，即会调用失败。对于这个问题需要服务消费者端要有一些容错机制，如重试，断路器等。

```properties
eureka.server.enable-self-preservation=true
```

## 缓存机制
