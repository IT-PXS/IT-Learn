---
title: Nacos（3-配置中心使用）
series: SpringCloud
tags:
  - SpringCloud
categories: Java
cover: /img/index/nacos.png
top_img: /img/index/nacos.png
published: true
abbrlink: 50492
date: 2025-03-17 22:38:34
description: Nacos 配置中心提供动态配置管理，支持配置的集中存储、实时推送与灰度发布。通过 Data ID、Group、Namespace 分类管理配置，支持多环境隔离。客户端可监听配置变更，自动刷新应用参数，提升系统灵活性与可维护性，广泛用于微服务架构的配置动态化与统一治理。
---

## 读取配置文件顺序

SpringBoot 读取配置文件顺序：bootstrap.yml >  bootstrap.properties > nacos 配置 > application.yml > application.properties

1. 加载顺序：若 application.yaml 和 bootstrap.yaml 在同一目录下，bootstrap.yaml 先加载，application.yaml 后加载。bootstrap.yaml 用于应用程序上下文的引导阶段，application.yaml 由父 Spring ApplicationContext 加载
2. 配置区别：bootstrap.yaml 和 application.yaml 都可以用来配置参数。bootstrap.yaml 用来程序引导时执行，应用于更加早期配置信息读取，可以理解为系统级别的一些参数配置，这些参数配置是不会变动的，一旦 bootstrap.yaml 被加载，则内容不会被覆盖
3. 属性覆盖问题：启动上下文时，Spring Cloud 会创建一个 Bootstrap Context 作为 Spring 应用的 Application Context 的父上下文，初始化的时候，Bootstrap Context 负责从外部源加载配置属性并解析配置，这两个上下文共享一个从外部获取的 Environment。Bootstrap 属性有高优先级，默认情况下，它们不会被本地配置覆盖，即如果加载的 application.yaml 的内容标签与 bootstrap 的标签一致，application 也不会覆盖 bootstrap，而 application.yaml 里面的内容可以动态替换

## 环境隔离

1. 命名空间（namespace）

![](Nacos（3-配置中心使用）/1.png)

![](Nacos（3-配置中心使用）/2.png)

![](Nacos（3-配置中心使用）/3.png)

2. 组（group）

![](Nacos（3-配置中心使用）/4.png)

![](Nacos（3-配置中心使用）/5.png)

3. 唯一标识（dataId）

![](Nacos（3-配置中心使用）/6.png)

## 动态感知

在进行修改 yaml 或 properties 文件，每次都要重新启动项目，可以在 nacos 配置中心进行文件配置，使得项目可以动态感知，在 resources 创建的文件名必须是 bootstrap。在 nacos 中创建配置文件，配置文件名称要和项目中 bootstrap.properties 中配置的名称一致，注意：配置文件的名称建议为项目服务名且要带上具体环境，例如：configclient-prod.properties

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <parent>
    <artifactId>springcloud</artifactId>
    <groupId>com.example</groupId>
    <version>0.0.1-SNAPSHOT</version>
  </parent>
  <modelVersion>4.0.0</modelVersion>

  <artifactId>config-nacos</artifactId>

  <properties>
    <maven.compiler.source>8</maven.compiler.source>
    <maven.compiler.target>8</maven.compiler.target>
  </properties>

  <dependencies>
    <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>

    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
  </dependencies>
</project>
```

1. application.yaml

```yaml
server:
  port: 8050
spring:
  profiles:
    active: dev
# 在配置中心，可以通过profile进行设置，只有默认的配置文件才能结合profile进行使用
# 对应的Dataid:${spring.application.name}-${profile}.${file-extensive:properties}
# profile的后缀必须跟随配置文件的格式来
```

2. bootstrap.yaml

```yaml
spring:
  application:
    # 会自动根据服务名拉取dataid对应的配置，如果dataid跟服务名不一致，就需要手动指定dataid
    # 跟服务名相同的dataid的配置文件，称为默认配置文件
    # 除了默认的配置文件，其他配置文件必须写上后缀，例如：config-nacos-dev
    name: config-nacos
  cloud:
    nacos:
      server-addr: localhost:8848
      username: nacos
      password: nacos
      # 解决控制台循环打印ClientWorker日志，命名空间的问题
      #config:
      #  namespace: public
      
      config:
		# nacos客户端默认是properties的文件扩展名
      	# 一旦修改成了非properties格式，则必须通过file-extension进行配置
        file-extension: yaml

        #refresh-enabled: false      nacos客户端无法感知配置的变化
        namespace: dev  	#去哪个命名空间拉取
        group: test  		#去哪个组拉取

      	# 用于共享的配置文件
        shared-configs: 
          - data-id: com.common.test1     #[0]
            refresh: true
            #group: 默认是DEFAULT-GROUP
          - data-id: com.common.test2     #[1]
            refresh: true
      	# 扩展配置的文件
        extension-configs[0]:
          data-id: com.common.test3
          refresh: true
          
# 配置文件的优先级（优先级大的会覆盖优先级小的，并且会形成互补）
# 服务名-profile.yaml > 默认配置文件.yaml > extension-configs(下标越大，优先级越大) > share-configs(下标越大，优先级越大)
```

```java
@SpringBootApplication
public class ConfigApplication {

    public static void main(String[] args) throws InterruptedException {
        ConfigurableApplicationContext applicationContext = SpringApplication.run(ConfigApplication.class, args);
        while (true){
            String userName = applicationContext.getEnvironment().getProperty("user.name");
            String userAge = applicationContext.getEnvironment().getProperty("user.age");
            System.err.println(userName+","+userAge);
            TimeUnit.SECONDS.sleep(1);
        }
    }
}
```

```java
@RestController
@RequestMapping("/config")
@RefreshScope//动态感知配置变化
public class ConfigController {
    
    @Value("${user.name}")
    public String username;
    
    @RequestMapping("/show")
    public String show(){
        return username;
    }
}
```
