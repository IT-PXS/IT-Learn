---
title: Nacos（2-注册中心使用）
series: SpringCloud
tags:
  - SpringCloud
categories: Java
cover: /img/index/nacos.png
top_img: /img/index/nacos.png
published: true
abbrlink: 50492
date: 2025-03-16 22:38:34
description: Nacos 作为注册中心，支持服务的动态注册、发现与健康检查，适用于微服务架构。服务实例可通过 HTTP 或 Dubbo、gRPC 等方式注册至 Nacos，客户端可实时感知服务变更。支持负载均衡、权重调整及自定义元数据，实现高可用与弹性伸缩，提升服务治理能力。
---

## 基本使用

![](Nacos（2-注册中心使用）/1.png)

1. 父模块 maven

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>springcloud</artifactId>
    <packaging>pom</packaging>
    <version>0.0.1-SNAPSHOT</version>
    <modules>
        <module>order-nacos</module>
        <module>stock-nacos</module>
    </modules>
    
    <name>springcloud</name>
    <description>springcloud</description>

    <properties>
        <java.version>1.8</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <spring-boot.version>2.3.7.RELEASE</spring-boot.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
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
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>2.2.5.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>Hoxton.SR8</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                    <encoding>UTF-8</encoding>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>2.3.7.RELEASE</version>
                <configuration>
                    <mainClass>com.example.springcloud.SpringcloudApplication</mainClass>
                </configuration>
                <executions>
                    <execution>
                        <id>repackage</id>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

2. order-nacos 模块 maven

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

    <artifactId>order-nacos</artifactId>

    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!--nacos服务注册发现-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
    </dependencies>
</project>
```

application.yaml（或 bootstrap.yaml）

```yaml
server:
  port: 8020

# 应用名称（nacos会将该名称当作服务名称）
spring:
  application:
    name: order-service
  cloud:
    nacos: 
      server-addr: localhost:8848 #nacos服务地址
      discovery: 
        username: nacos #用户名
        password: nacos #密码
        namespace: public #命名空间
```

```java
@SpringBootApplication
public class OrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }

    /**
     * 远程调用
     * @param builder
     * @return
     */
	@LoadBalanced
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder){
        RestTemplate restTemplate = builder.build();
        return restTemplate;
    }
}
```

```java
@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    RestTemplate restTemplate;

    @RequestMapping("/add")
    public String add() {
        System.out.println("下单成功");
        String msg = restTemplate.getForObject("http://stock-service/stock/reduct", String.class);
        return "hello world" + msg;
    }
}
```

3. stock-nacos 模块 maven

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

  <artifactId>stock-nacos</artifactId>

  <properties>
    <maven.compiler.source>8</maven.compiler.source>
    <maven.compiler.target>8</maven.compiler.target>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
    </dependency>
  </dependencies>
</project>
```

application.yaml（或 bootstrap.yaml）

```yaml
server:
  port: 8021
  
spring:
  application:
    name: stock-service
  cloud:
    nacos:
      server-addr: localhost:8848
      discovery:
        username: nacos
        password: nacos
        namespace: public
        #ephemeral: false # 默认为true，false为永久实例，哪怕宕机了也不会删除实例
        
        #service: 默认取${spring.application.name}，也可以通过该选项配置
        #group: 默认DEFAULT_GROUP 更细的相同特征的服务进行归类分组管理
        #weight: 通常要结合安装权重的负载均衡策略，权重越高分配的流量就越大
        #metadata: version=1 可以结合元数据做扩展
```

```java
@RestController
@RequestMapping("/stock")
public class StockController {
    
    @Value("${server.port}")
    String port;
    
    @RequestMapping("/reduct")
    public String reduct(){
        System.out.println("扣减库存");
        return "扣减库存:"+port;
    }
}
```

4. 查看服务情况

![](Nacos（2-注册中心使用）/2.png)

## 命名空间 ID

注意：如果命名空间名称后面有对应的 ID，则 namespace 则要写 ID，否则会报错

![](Nacos（2-注册中心使用）/3.png)

nacos 新建命名空间默认不能填写 ID，数据库中导入 nacos/conf 下的 nacos-mysql 文件，然后修改 nacos/conf 下的 application.properties 文件，重启后即可填写 dataID

![](Nacos（2-注册中心使用）/4.png)

![](Nacos（2-注册中心使用）/5.png)

## 权重配置

1. Nacos 控制台可以设置实例的权重值，0~1 之间
2. 同集群内的多个实例，权重越高被访问的频率越高
3. 权重设置为 0 则完全不会被访问

![](Nacos（2-注册中心使用）/6.png)

![](Nacos（2-注册中心使用）/7.png)
