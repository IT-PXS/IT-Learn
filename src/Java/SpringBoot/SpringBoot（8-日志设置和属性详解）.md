---
title: SpringBoot（8-日志设置和属性详解）
tag: 
  - SpringBoot
category: Java
date: 2025-04-13 22:38:34
description: SpringBoot日志配置灵活，支持Logback、Log4j2等框架，通过application.properties或yml文件设置。常用属性包括logging.level（日志级别）、logging.file.path（路径）、logging.pattern（格式）。还支持分组日志、自定义配置文件和异步日志，便于调试与监控。
---

## 日志类型

日志类型有很多，比如 JUL、JCL、Jboss-logging、logback、log4j、log4j2、slf4j…，主要分为抽象层和实现层：

1. 抽象层：

* JCL：不使用，从 2014 年开始就没更新过了。
* jboss-logging：不使用，使用场景有限。
* SLF4j：Springboot 中使用的日志抽象层。

2. 实现层：

* Log4j
* Log4j2：apache 借 Log4j 之名写的一个日志框架，并不是 Log4j 的升级版，太高端了，很多框架适配不了。
* Logback：Log4j 的升级版本，和 SLF4j 出自同一个人之手（Spring Boot 约定的默认配置）。

SpringBoot 选用 SLF4j 和 Logback，大部分场景推荐 Spring Boot 自带的日志 logback，在 Spring Boot 中，logback 是基于 slf4j 实现的。

## 日志级别

日志级别从低到高分为：TRACE < DEBUG < INFO < WARN < ERROR < FATAL

如果设置为 WARN ，则低于 WARN 的信息都不会输出。同理，当我们指定日志级别为 INFO 级别，那么 TRACE、DEBUG 级别的日志就不会被输出打印。

Spring Boot 中默认配置 ERROR、WARN 和 INFO 级别的日志输出到控制台。

## SpringBoot 整合 logback 日志

### 基本使用

**使用方法 1**


```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
</dependency>
```

但是实际开发中不需要直接添加该依赖，`spring-boot-starter` 包含了 `spring-boot-starter-logging`，该依赖内容就是 Spring Boot 默认的日志框架 logback。

```java
@SpringBootApplication
public class LogApplication {

    public static void main(String[] args) {
        Logger logger = LoggerFactory.getLogger(LogApplication.class);
        SpringApplication.run(LogApplication.class, args);
        // 注意：spring 默认日志输出级别为 info，所以默认情况下这句不会打印到控制台
        logger.debug("This is a debug message");
        logger.info("This is an info message");
        logger.warn("This is a warn message");
        logger.error("This is an error message");
    }
}
```

**使用方法 2**

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

```java
@Slf4j
public class LogApplication {

    public static void main(String[] args) {
        log.info("====");
    }
}
```

### 文件配置

**日志级别设置**

```properties
# 格式为：logging.level.* = LEVEL
# logging.level：日志级别控制前缀，*为包名或Logger名
# LEVEL：选项 TRACE, DEBUG, INFO, WARN, ERROR, FATAL, OFF

# com.dudu包下所有class以DEBUG级别输出
logging.level.com.dudu = DEBUG 
# root日志以WARN级别输出
logging.level.root = WARN
```

**日志输出格式设置**

```properties
# 在控制台输出的日志的格式
logging.pattern.console = %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n

# 指定文件中日志输出的格式
logging.pattern.file = %d{yyyy-MM-dd} === [%thread] === %-5level === %logger{50} ==== %msg%n

# 日志输出格式：
# %d：日期时间
# %thread：线程名
# %-5level：级别从左显示5个字符宽度
# %logger{50}：logger名字最长50个字符，否则按照句点分割。
# %msg：日志消息
# %n：换行符
```

**指定日志配置文件**

```properties
logging.config = classpath:logging-config.xml
```

根据不同的日志系统，你可以按如下规则组织配置文件名，就能被正确加载：

1. Logback：`logback-spring.xml、logback-spring.groovy、logback.xml、logback.groovy`
2. Log4j：`log4j-spring.properties、log4j-spring.xml、log4j.properties、log4j.xml`
3. Log4j2：`log4j2-spring.xml、log4j2.xml`
4. JDK (Java Util Logging)：`logging.properties`

Spring Boot 官方推荐优先使用带有-spring 的文件名作为日志配置（如使用 `logback-spring.xml`，而不是 `logback.xml`）。

因为命名为 `logback-spring.xml` 的日志配置文件，Spring Boot 可以为它添加一些 Spring Boot 特有的配置项。

`logback.xml` 直接就被日志框架识别了。如果使用 `logback-spring.xml`，日志框架就不直接加载日志的配置项，需要加上 springProfile 标签由 SpringBoot 解析日志配置，即可以使用 SpringBoot 的高级 Profile 功能

### 配置文件加载顺序

`logback.xml-> application.properties-> logback-spring.xml`

## logback-spring.xml

### 完整文件样例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 日志级别从低到高分为TRACE < DEBUG < INFO < WARN < ERROR < FATAL，如果设置为WARN，则低于WARN的信息都不会输出 -->
<!-- scan:当此属性设置为true时，配置文件如果发生改变，将会被重新加载，默认值为true -->
<!-- scanPeriod:设置监测配置文件是否有修改的时间间隔，如果没有给出时间单位，默认单位是毫秒。当scan为true时，此属性生效。默认的时间间隔为1分钟。 -->
<!-- debug:当此属性设置为true时，将打印出logback内部日志信息，实时查看logback运行状态。默认值为false。 -->
<configuration  scan="true" scanPeriod="10 seconds">

    <contextName>logback</contextName>
    <!-- name的值是变量的名称，value的值时变量定义的值。通过定义的值会被插入到logger上下文中。定义变量后，可以使“${}”来使用变量-->
    <property name="log.path" value="F:/java基础学习/复习testcode/logs" />

    <property name="CONSOLE_LOG_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg %n"/>


    <!--输出到控制台-->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <!--此日志appender是为开发使用，只配置最底级别，控制台输出的日志级别是大于或等于此级别的日志信息-->
        <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
            <level>debug</level>
        </filter>
        <encoder>
            <Pattern>${CONSOLE_LOG_PATTERN}</Pattern>
            <!-- 设置字符集 -->
            <charset>UTF-8</charset>
        </encoder>
    </appender>


    <!--输出到文件-->
    <!-- 时间滚动输出 level为 DEBUG 日志 -->
    <appender name="DEBUG_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <!-- 正在记录的日志文件的路径及文件名 -->
        <!--先将今天的日志保存在这个文件中-->
        <file>${log.path}/log_debug.log</file>
        <!--日志文件输出格式   %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
            %d{HH: mm:ss.SSS}——日志输出时间
            %thread——输出日志的进程名字，这在Web应用以及异步任务处理中很有用
            %-5level——日志级别，并且使用5个字符靠左对齐
            %logger{36}——日志输出者的名字
            %msg——日志消息
            %n——平台的换行符
           -->
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
            <charset>UTF-8</charset> <!-- 设置字符集 -->
        </encoder>
        <!-- 日志记录器的滚动策略，按日期，按大小记录 -->

        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <!-- rollover daily -->
            <!--如果第二天输出日志,会将当天的日志记录在<file>${log.path}/log_debug.log</file>,然后将昨天的日志归档到下面的文件中-->
            <!--以分钟切分  %d{yyyy-MM-dd_HH-mm}-->
            <fileNamePattern>${log.path}/debug/log-debug-%d{yyyy-MM-dd_HH-mm}.%i.log</fileNamePattern>
            <!-- each file should be at most 100MB, keep 60 days worth of history, but at most 20GB -->
            <!--单个日志文件最大100M，到了这个值，就会再创建一个日志文件，日志文件的名字最后+1-->
            <maxFileSize>100MB</maxFileSize>
            <!--日志文件保留天数-->
            <maxHistory>30</maxHistory>
            <!--所有的日志文件最大20G，超过就会删除旧的日志-->
            <totalSizeCap>20GB</totalSizeCap>
        </rollingPolicy>
        <!--
            此日志文件只记录debug级别的
            onMatch和onMismatch都有三个属性值，分别为Accept、DENY和NEUTRAL
            onMatch="ACCEPT" 表示匹配该级别及以上
            onMatch="DENY" 表示不匹配该级别及以上
            onMatch="NEUTRAL" 表示该级别及以上的，由下一个filter处理，如果当前是最后一个，则表示匹配该级别及以上
            onMismatch="ACCEPT" 表示匹配该级别以下
            onMismatch="NEUTRAL" 表示该级别及以下的，由下一个filter处理，如果当前是最后一个，则不匹配该级别以下的
            onMismatch="DENY" 表示不匹配该级别以下的
        -->
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>debug</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <!-- 时间滚动输出 level为 INFO 日志 -->
    <appender name="INFO_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <!-- 正在记录的日志文件的路径及文件名 -->
        <file>${log.path}/log_info.log</file>
        <!--日志文件输出格式-->
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
            <charset>UTF-8</charset>
        </encoder>
        <!-- 日志记录器的滚动策略，按日期，按大小记录 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <!-- rollover daily -->
            <!--如果第二天输出日志,会将当天的日志记录在<file>${log.path}/log_debug.log</file>,然后将昨天的日志归档到下面的文件中-->
            <!--以分钟切分  %d{yyyy-MM-dd_HH-mm}-->
            <fileNamePattern>${log.path}/info/log-info-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <!-- each file should be at most 100MB, keep 60 days worth of history, but at most 20GB -->
            <!--单个日志文件最大100M，到了这个值，就会再创建一个日志文件，日志文件的名字最后+1-->
            <maxFileSize>100MB</maxFileSize>
            <!--日志文件保留天数-->
            <maxHistory>30</maxHistory>
            <!--所有的日志文件最大20G，超过就会删除旧的日志-->
            <totalSizeCap>20GB</totalSizeCap>
        </rollingPolicy>
        <!--SizeAndTimeBasedRollingPolicy配置更灵活,所以改用SizeAndTimeBasedRollingPolicy-->
        <!--<rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            &lt;!&ndash; 每天日志归档路径以及格式 &ndash;&gt;
            <fileNamePattern>${log.path}/info/log-info-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <timeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <maxFileSize>100MB</maxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
            &lt;!&ndash;日志文件保留天数&ndash;&gt;
            <maxHistory>15</maxHistory>
        </rollingPolicy>-->
        <!-- 此日志文件只记录info级别的 -->
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>info</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <!-- 时间滚动输出 level为 WARN 日志 -->
    <appender name="WARN_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <!-- 正在记录的日志文件的路径及文件名 -->
        <file>${log.path}/log_warn.log</file>
        <!--日志文件输出格式-->
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
            <charset>UTF-8</charset> <!-- 此处设置字符集 -->
        </encoder>
        <!-- 日志记录器的滚动策略，按日期，按大小记录 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <!-- rollover daily -->
            <!--如果第二天输出日志,会将当天的日志记录在<file>${log.path}/log_debug.log</file>,然后将昨天的日志归档到下面的文件中-->
            <!--以分钟切分  %d{yyyy-MM-dd_HH-mm}-->
            <fileNamePattern>${log.path}/warn/log-warn-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <!-- each file should be at most 100MB, keep 60 days worth of history, but at most 20GB -->
            <!--单个日志文件最大100M，到了这个值，就会再创建一个日志文件，日志文件的名字最后+1-->
            <maxFileSize>100MB</maxFileSize>
            <!--日志文件保留天数-->
            <maxHistory>30</maxHistory>
            <!--所有的日志文件最大20G，超过就会删除旧的日志-->
            <totalSizeCap>20GB</totalSizeCap>
        </rollingPolicy>
        <!-- 此日志文件只记录warn级别的 -->
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>warn</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>


    <!-- 时间滚动输出 level为 ERROR 日志 -->
    <appender name="ERROR_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <!-- 正在记录的日志文件的路径及文件名 -->
        <file>${log.path}/log_error.log</file>
        <!--日志文件输出格式-->
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
            <charset>UTF-8</charset> <!-- 此处设置字符集 -->
        </encoder>
        <!-- 日志记录器的滚动策略，按日期，按大小记录 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <!-- rollover daily -->
            <!--如果第二天输出日志,会将当天的日志记录在<file>${log.path}/log_debug.log</file>,然后将昨天的日志归档到下面的文件中-->
            <!--以分钟切分  %d{yyyy-MM-dd_HH-mm}-->
            <fileNamePattern>${log.path}/error/log-error-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <!-- each file should be at most 100MB, keep 60 days worth of history, but at most 20GB -->
            <!--单个日志文件最大100M，到了这个值，就会再创建一个日志文件，日志文件的名字最后+1-->
            <maxFileSize>100MB</maxFileSize>
            <!--日志文件保留天数-->
            <maxHistory>30</maxHistory>
            <!--所有的日志文件最大20G，超过就会删除旧的日志-->
            <totalSizeCap>20GB</totalSizeCap>
        </rollingPolicy>
        <!-- 此日志文件只记录ERROR级别的 -->
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
    </appender>

    <!--root配置必须在appender下边-->
    <!--root节点是对所有appender的管理,添加哪个appender就会打印哪个appender的日志-->
    <!--root节点的level是总的日志级别控制,如果appender的日志级别设定比root的高,会按照appender的日志级别打印日志,-->
    <!--如果appender的日志级别比root的低,会按照root设定的日志级别进行打印日志-->
    <!--也就是说root设定的日志级别是最低限制,如果root设定级别为最高ERROR,那么所有appender只能打印最高级别的日志-->
    <root level="INFO">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="DEBUG_FILE" />
        <appender-ref ref="INFO_FILE" />
        <appender-ref ref="WARN_FILE" />
        <appender-ref ref="ERROR_FILE" />
    </root>


    <!--name:用来指定受此loger约束的某一个包或者具体的某一个类。-->
    <!--addtivity:是否向上级loger传递打印信息。默认是true。-->
    <logger name="com.pikaiqu.logbackdemo.LogbackdemoApplicationTests" level="debug" additivity="false">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="INFO_FILE" />
    </logger>

    <!--配置多环境日志输出  可以在application.properties中配置选择哪个profiles : spring.profiles.active=dev-->
    <!--生产环境:输出到文件-->
    <!--<springProfile name="pro">
        <root level="info">
            <appender-ref ref="DEBUG_FILE" />
            <appender-ref ref="INFO_FILE" />
            <appender-ref ref="ERROR_FILE" />
            <appender-ref ref="WARN_FILE" />
        </root>
    </springProfile>-->
    <!--开发环境:打印控制台-->
    <!--<springProfile name="dev">
        <root level="debug">
            <appender-ref ref="STDOUT" />
        </root>
    </springProfile>-->

</configuration>
```

### 文件配置项

1. 一个父标签：configuration
2. 两种属性：contextName 和 property
3. 三个节点：appender、root、logger

### 父标签

Configuration：

1. scan：当此属性设置为 true 时，配置文件如果发生改变，将会被重新加载，默认为 true
2. scanPeriod：设置监测配置文件是否有修改的时间间隔，如果没有给出时间单位，默认单位是毫秒。当 scan 为 true 时，此属性生效，默认的时间间隔为 1 分钟
3. debug：当此属性设置为 true 时，将打印出 logback 内部日志信息，实时查看 logback 运行状态，默认为 false

```xml
<configuration scan="true" scanPeriod="10 seconds">
</configuration>
```

### 属性

#### contextName

1. 每个 logger 都关联到 logger 上下文，默认上下文名称为 `“default”`，但可以设置成其他名字，用于区分不同应用程序的记录，可以通过 `%contextName` 来打印日志上下文名称
2. 如果同时存在 `logback.xml` 和 `logback-spring.xml`，或者同时存在 `logback.xml` 和自定义的配置文件，则先加载 `logback.xml`，再根据 application 配置加载指定配置文件，或加载 `logback-spring.xml`。

注意：如果这两个文件的 contextName 不同就会报错

**使用案例**

1. logback.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration scan="true" scanPeriod="60 seconds" debug="false">
    <contextName>logback</contextName>
</configuration>
```

2. logback-spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration scan="false" scanPeriod="60 seconds" debug="false">
    <contextName>logback</contextName>
</configuration>
```

3. application.properties

```properties
logging.config=classpath:logback-spring.xml
```

#### property

用来定义变量值的标签，name 是变量的名称，value 是变量定义的指。通过定义的值会被插入到 logger 上下文中，定义变量后，可以使用 "${}" 来使用变量

```xml
<configuration scan="true" scanPeriod="60 seconds" debug="false">  
    <property name="APP_Name" value="myAppName" />   
    <contextName>${APP_Name}</contextName>  
</configuration>
```

### 节点

#### appender

追加器，可以理解为一个日志的渲染器，有 name 和 class 两个属性，name 表示该渲染器的名字，class 表示使用的输出策略

1. encoder：输出格式

```xml
%d：时间
%thread：线程名
%-5level：日志级别，允许以五个字符长度输出
%logger{50}：具体的日志输出者，比如类名，括号内表示长度
%msg：具体的日志消息，就是logger.info("xxx")中的xxx
%n：换行
```

2. filter：过滤

onMatch 和 onMismatch 都有三个属性值，分别为 Accept、DENY 和 NEUTRAL

```xml
onMatch="ACCEPT"：表示匹配该级别及以上
onMatch="DENY"：表示不匹配该级别及以上
onMatch="NEUTRAL"：表示该级别及以上的，由下一个filter处理，如果当前是最后一个，则表示匹配该级别及以上
onMismatch="ACCEPT"：表示匹配该级别以下
onMismatch="NEUTRAL"：表示该级别及以下的，由下一个filter处理，如果当前是最后一个，则不匹配该级别以下的
onMismatch="DENY"：表示不匹配该级别以下的
```

**控制台输出 appender**

```xml
<property name="CONSOLE_LOG_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg %n"/>

<!--输出到控制台-->
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <!--此日志appender是为开发使用，只配置最底级别，控制台输出的日志级别是大于或等于此级别的日志信息-->
    <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
    	<level>debug</level>
    </filter>
    <encoder>
        <Pattern>${CONSOLE_LOG_PATTERN}</Pattern>
        <!-- 设置字符集 -->
        <charset>UTF-8</charset>
    </encoder>
</appender>
```

**文件输出 appender**

```xml
<!--输出到文件-->
<!-- 时间滚动输出 level为 DEBUG 日志 -->
<appender name="DEBUG_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <!-- 正在记录的日志文件的路径及文件名 -->
    <!--先将今天的日志保存在这个文件中-->
    <file>${log.path}/log_debug.log</file>
    <!--日志文件输出格式   %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
        %d{HH: mm:ss.SSS}——日志输出时间
        %thread——输出日志的进程名字，这在Web应用以及异步任务处理中很有用
        %-5level——日志级别，并且使用5个字符靠左对齐
        %logger{36}——日志输出者的名字
        %msg——日志消息
        %n——平台的换行符
       -->
    <encoder>
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        <!-- 设置字符集 -->
        <charset>UTF-8</charset> 
    </encoder>
  
    <!-- 日志记录器的滚动策略，按日期，按大小记录 -->
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <!-- rollover daily -->
        <!--如果第二天输出日志,会将当天的日志记录在<file>${log.path}/log_debug.log</file>,然后将昨天的日志归档到下面的文件中-->
        <!--以分钟切分  %d{yyyy-MM-dd_HH-mm}-->
        <fileNamePattern>${log.path}/debug/log-debug-%d{yyyy-MM-dd_HH-mm}.%i.log</fileNamePattern>
        <!-- each file should be at most 100MB, keep 60 days worth of history, but at most 20GB -->
        <!--单个日志文件最大100M，到了这个值，就会再创建一个日志文件，日志文件的名字最后+1-->
        <maxFileSize>100MB</maxFileSize>
        <!--日志文件保留天数-->
        <maxHistory>30</maxHistory>
        <!--所有的日志文件最大20G，超过就会删除旧的日志-->
        <totalSizeCap>20GB</totalSizeCap>
    </rollingPolicy>
  
    <!-- 此日志文件只记录debug级别的 -->
    <filter class="ch.qos.logback.classic.filter.LevelFilter">
        <level>debug</level>
        <onMatch>ACCEPT</onMatch>
        <onMismatch>DENY</onMismatch>
    </filter>
</appender>
```

#### root

1. root 配置必须在 appender 下边
2. root 节点是对所有 appender 的管理，添加哪个 appender 就会打印哪个 appender 的日志
3. root 节点的 level 是总的日志级别控制

* 如果 appender 的日志级别设定比 root 的高，会按照 appender 的日志级别打印日志
* 如果 appender 的日志级别比 root 的低， 会按照 root 设定的日志级别进行打印日志
* 总结：root 设定的日志级别是最低限制，如果 root 设定级别为最高 ERROR，那么所有 appender 只能打印最高级别的日志

```xml
<root level="DEBUG">
    <appender-ref ref="CONSOLE" />
    <appender-ref ref="DEBUG_FILE" />
    <appender-ref ref="INFO_FILE" />
    <appender-ref ref="WARN_FILE" />
    <appender-ref ref="ERROR_FILE" />
</root>
```

#### logger

1. name：用来指定受此 loger 约束的某一个包或者具体的某一个类。
2. addtivity：是否向上级 loger 传递打印信息。默认是 true。

```xml
<!-- logback为 com.pikaqiu.logbackdemo 中的包 -->
<logger name="com.pikaqiu.logbackdemo" level="debug" additivity="false">
    <appender-ref ref="CONSOLE" />
</logger>

<!-- logback为 com.pikaqiu.logbackdemo.LogbackdemoApplicationTests 这个类 -->
<logger name="com.pikaiqu.logbackdemo.LogbackdemoApplicationTests" level="INFO" additivity="true">
    <appender-ref ref="STDOUT"/>
</logger>
```

**root 和 logger 的关系**

1. root 和 logger 是父子的关系

logger 的 appender 根据参数 additivity 决定是否要叠加 root 的 appender，logger 的级别是其自身定义的级别，和 root 的级别没关系

2. root 是全局配置，logger 对单个类或包配置，是局部配置

如果 logger 里面配置了 additivity = "false"，就会覆盖 root 的，只打印一遍；如果 additivity = "true"，就会向上层再次传递，不会覆盖，而是打印两遍

### 多环境配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration  scan="true" scanPeriod="10 seconds">
    <!--配置多环境日志输出  可以在application.properties中配置选择哪个profiles : spring.profiles.active=dev-->
    <!--生产环境:输出到文件-->
    <springProfile name="pro">
        <root level="info">
            <appender-ref ref="DEBUG_FILE" />
            <appender-ref ref="INFO_FILE" />
            <appender-ref ref="ERROR_FILE" />
            <appender-ref ref="WARN_FILE" />
        </root>
    </springProfile>
    <!--开发环境:打印控制台-->
    <springProfile name="dev">
        <root level="debug">
            <appender-ref ref="CONSOLE" />
        </root>
    </springProfile>

    <!-- spring.application.name需要配置到bootstrap中 -->
    <springProperty scope="context" name="logLevel" source="log.level" defaultValue="info"/>
    <springProperty scope="context" name="immediateFlush" source="log.immediateFlush" defaultValue="false"/>
    <springProperty scope="context" name="appName" source="spring.application.name" defaultValue="appName"/>
    <springProperty scope="context" name="APP_NAME" source="spring.application.name"/>
    <!-- <contextName>${appName}</contextName> -->
    <springProperty scope="context" name="logPattern" source="log.pattern"
                    defaultValue="%d{yyyy-MM-dd HH:mm:ss.SSS}| %tid | %-5level | ${appName} | %thread｜%logger{20}:%line:%method{20} - %msg%n"/>
</configuration>
```

1. name：自定义别名
2. source：对应 SpringBoot 配置文件中属性名
3. defaultValue：默认值

