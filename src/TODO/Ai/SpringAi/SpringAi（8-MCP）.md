## 基本介绍

MCP (Model Context Protocol) 是一个开放协议，用于标准化应用程序如何向 LLM 提供上下文。可以将 MCP 想象成 AI 应用程序的 USB 接口。就像 USB 为设备连接各种外设和配件提供标准化方式一样，MCP 为 AI 模型连接不同的数据源和工具提供了标准化的方式。

![](SpringAi（8-MCP）/1.png)

Spring AI 提供了两种客户端的开发：

1. 标准客户端

通过 STDIO（in-process） 和/或 SSE（远程）访问 MCP 服务端。 SSE 连接使用基于 HttpClient 的传输实现。 与 MCP 服务器的每次连接都会创建一个新的 MCP 客户端实例。 可以选择 SYNC 或 ASYNCMCP 客户端（注意：不能混合使用同步客户端和异步客户端）。 

2. WebFlux 客户端

提供与标准客户端类似的功能，但使用基于 WebFlux 的 SSE 传输实现。

## SDTIO 方式通信

### MCP 服务器

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server</artifactId>
    <version>1.1.2</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.3.0</version>
</dependency>
```

MCP 服务器支持四种主要功能类型，可以单独启用或禁用：

1. 工具 - 启用/禁用工具功能 spring.ai.mcp.server.capabilities.tool = true|false
2. 资源 - 启用/禁用资源功能 spring.ai.mcp.server.capabilities.resource = true|false
3. 提示 - 启用/禁用提示功能 spring.ai.mcp.server.capabilities.prompt = true|false
4. 完成 - 启用/禁用完成功能 spring.ai.mcp.server.capabilities.completion = true|false

默认情况下，所有功能均处于启用状态。禁用功能将阻止服务器注册和向客户端公开相应的功能。

```yaml
# 日志配置
logging:
  # 日志输出格式配置
  pattern:
    # 控制台日志输出格式（空表示使用默认格式）
    console:

# Spring框架配置
spring:
  # 主要应用程序配置
  main:
    # 设置Web应用程序类型为none，表示这是一个非Web应用程序
    web-application-type: none
    # 关闭Spring Boot启动时的banner显示
    banner-mode: off
  
  # Spring AI相关配置
  ai:
    # Model Context Protocol (MCP) 服务器配置
    mcp:
      server:
        # MCP服务器名称
        name: name-mcp-server
        # MCP服务器版本号
        version: 1.0.0
        # 服务器类型：SYNC表示同步模式
        type: SYNC
        # 启用STDIO模式通信（标准输入输出模式）
        stdio: true

server:
  port: 8088
```

使用 STDIO 传输时，如下选项必须配置：

1. 禁用 Web 应用程序类型 (spring.main.web-application-type = none)

当使用 STDIO 模式时，MCP 服务器不需要通过 HTTP 协议与客户端通信，而是通过标准输入和输出流进行通信。因此，没有必要启动 Web 服务器（如 Tomcat、Jetty 等），这样可以：

- 减少资源消耗（CPU、内存）

- 避免端口冲突

- 明确应用程序的运行模式为纯后台服务

2. 禁用 Spring Banner (spring.main.banner-mode = off)

Spring Boot 在启动时默认会打印一个 Banner（通常是 Spring 的 ASCII 艺术字），但在 STDIO 模式下：

- 这些额外的输出会被误认为是 MCP 协议的一部分

- 可能干扰客户端对 MCP 消息的正确解析

- 影响通信协议的纯净性

3. 清空控制台日志模式 (logging.pattern.console =)

默认情况下，日志输出包含时间戳、日志级别、线程名等前缀信息，而在 STDIO 模式下：

- 这些日志格式化的文本会污染标准输出流

- MCP 客户端无法正确区分哪些是协议消息，哪些是日志消息

- 清空日志模式可以确保只有纯净的 MCP 协议消息通过 STDIO 传输

该类中定义需要对外提供的调用的函数方法

```java
@Slf4j
@Service
public class NameMcpServer {
 
    @Tool(description = "根据孩子的出生日期和性别起名")
    public String childName(@ToolParam(description = "出生日期") String birth,
                            @ToolParam(description = "性别") String gender) {
        log.info(birth, gender);
        return "老任与码";
    }
}
```

用于向 MCP 客户端公开函数工具

```java
@Configuration
public class MyServerConfig {
    
    @Bean
    public ToolCallbackProvider nameTool(NameMcpServer nameMcpServer) {
        return MethodToolCallbackProvider.builder().toolObjects(nameMcpServer).build();
    }
}
```

对 MCP 服务进行打包，将打包后的 jar 将被 MCP 客户端调用

### MCP 客户端

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client</artifactId>
    <version>1.1.2</version>
</dependency>
```

```yaml
spring:
  # Spring AI 相关配置
  ai:
    # OpenAI 相关配置
    openai:
      base-url: https://api.chatanywhere.tech
      api-key: 
      # 聊天模型相关配置
      chat:
        options:
          model: gpt-3.5-turbo
          # 设置温度参数为0.75，控制输出的随机性，值越高结果越随机
          temperature: 0.75
      embedding:
        options:
          model: text-embedding-3-small
          dimensions: 1024
    # 聊天记忆相关配置
    chat:
      # 配置聊天记忆存储库
      memory:
        repository:
          # JDBC存储库配置
          jdbc:
            # 初始化数据库表结构，always表示总是初始化（如果不存在则创建）
            initialize-schema: never
    # MCP (Model Context Protocol) 客户端配置
    # 用于与支持MCP协议的AI模型服务进行交互
    mcp:
     client:
       # 客户端名称
       name: name-mcp-client
       # 客户端版本
       version: 1.0.0
       # 请求超时时间
       request-timeout: 10s
       # 客户端类型，sync表示同步模式
       type: SYNC
       stdio:
         # MCP服务器配置文件路径，使用classpath方式引用
         servers-configuration: classpath:mcp-servers-config.json

  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/springai?serverTimezone=Asia/Shanghai
    username: root
    password: 123456
  data:
    redis:
      host: localhost
      port: 6379
      database: 0

# 日志配置
logging:
  level:
    # 设置Spring AI相关组件的日志级别为debug，便于调试
    org.springframework.ai: debug # AI对话的日志级别
```

mcp-servers-config.json 文件中增加 MCP 服务的配置：

```json
{
  "mcpServers": {
    "name-mcp-server": {
      "command": "java",
      "args": [
        "-jar",
        "D:/name-mcp-server.jar"
      ]
    }
  }
}
```

注意：application.yml 和 mcp-servers-config.json 都放在项目的 resources 目录下

```java
@Configuration
public class ChatClientConfig {
    
    @Resource
    private List<McpSyncClient> mcpSyncClients;

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                // 设置系统消息
                .defaultSystem("你是一个java架构师")
                // 指定同步的MCP回调工具对象
                .defaultToolCallbacks(new SyncMcpToolCallbackProvider(mcpSyncClients))
                .build();
    }
}
```

```java
@RestController
@RequestMapping("/mcp")
public class MspClientController {
 
    @Resource
    private ChatClient client;
 
    @GetMapping("/chat")
    public String chat(String message) {
        return client.prompt(message).call().content();
    }
}
```

查看日志和输出结果，如果有，说明调用了我们自定义 MCP 服务器的 childName 方法

**其他配置**

```json
{
  "mcpServers": {
    "name-mcp-server": {
      "command": "java",
      "args": [
        "-jar",
        "-Dspring.ai.mcp.server.stdio=true",
        "-Dspring.main.web-application-type=none",
        "-Dspring.main.banner-mode=false",
        "-Dlogging.pattern.console=",
        "D:/name-mcp-server.jar"
      ]
    }
  }
}
```

如果客户端采用上述配置，MCP 服务端的配置可以修改为：

```yaml
spring:
  ai:
    mcp:
      server:
        name: name-mcp-server
        version: 1.0.0
        type: SYNC
        stdio: true
server:
  port: 8088
```

## Http SSE 方式通信

### MCP 服务端

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
    <version>1.1.2</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.3.0</version>
</dependency>
```

```java
@Slf4j
@Service
public class NameMcpServer {
 
    @Tool(description = "根据孩子的出生日期和性别起名")
    public String childName(@ToolParam(description = "出生日期") String birth,
                            @ToolParam(description = "性别") String gender) {
        log.info(birth, gender);
        return "老任与码";
    }
}
```

```java
@Configuration
public class MyServerConfig {
    
    @Bean
    public ToolCallbackProvider nameTool(NameMcpServer nameMcpServer) {
        return MethodToolCallbackProvider.builder().toolObjects(nameMcpServer).build();
    }
}
```

```yaml
spring:
  ai:
    mcp:
      server:
        name: name-mcp-server
        version: 1.0.0
        type: SYNC
 
server:
  port: 8088
```

### MCP 客户端

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client</artifactId>
    <version>1.1.2</version>
</dependency>
```

```yaml
spring:
  # Spring AI 相关配置
  ai:
    # OpenAI 相关配置
    openai:
      base-url: https://api.chatanywhere.tech
      api-key: 
      # 聊天模型相关配置
      chat:
        options:
          model: gpt-3.5-turbo
          # 设置温度参数为0.75，控制输出的随机性，值越高结果越随机
          temperature: 0.75
      embedding:
        options:
          model: text-embedding-3-small
          dimensions: 1024
    # 聊天记忆相关配置
    chat:
      # 配置聊天记忆存储库
      memory:
        repository:
          # JDBC存储库配置
          jdbc:
            # 初始化数据库表结构，always表示总是初始化（如果不存在则创建）
            initialize-schema: never
    # MCP (Model Context Protocol) 客户端配置
    # 用于与支持MCP协议的AI模型服务进行交互
    mcp:
     client:
       # 客户端名称，用于标识当前MCP客户端实例
       name: name-mcp-client
       # 客户端版本号，用于版本管理
       version: 1.0.0
       # 请求超时时间设置，超过此时间未响应将抛出超时异常
       request-timeout: 10s
       # 客户端通信类型，SYNC表示同步模式，还有ASYNC异步模式可选
       type: SYNC
       # SSE (Server-Sent Events) 连接配置，用于建立与MCP服务器的实时通信连接
       sse:
          connections:
            # MCP服务器连接配置块，name-mcp-server是自定义的连接名称
            name-mcp-server:
              # MCP服务器的基础URL地址
              url: http://localhost:8088
              # SSE端点路径，客户端将通过此路径与服务器建立SSE连接
              sse-endpoint: /sse

  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/springai?serverTimezone=Asia/Shanghai
    username: root
    password: 123456
  data:
    redis:
      host: localhost
      port: 6379
      database: 0

# 日志配置
logging:
  level:
    # 设置Spring AI相关组件的日志级别为debug，便于调试
    org.springframework.ai: debug # AI对话的日志级别
```

```java
@Configuration
public class ChatClientConfig {
    
    @Resource
    private List<McpSyncClient> mcpSyncClients;

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                // 设置系统消息
                .defaultSystem("你是一个java架构师")
                // 指定同步的MCP回调工具对象
                .defaultToolCallbacks(new SyncMcpToolCallbackProvider(mcpSyncClients))
                .build();
    }
}
```

```java
@RestController
@RequestMapping("/mcp")
public class MspClientController {
 
    @Resource
    private ChatClient client;
 
    @GetMapping("/chat")
    public String chat(String message) {
        return client.prompt(message).call().content();
    }
}
```

## WebFlux SSE 方式通信 

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client-webflux</artifactId>
</dependency>
```

### MCP 服务端

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webflux</artifactId>
    <version>1.1.2</version>
</dependency>
```

```yaml
spring:
  ai:
    mcp:
      server:
        name: name-mcp-server
        version: 1.0.0
        type: SYNC
 
server:
  port: 8088
```

注意：由于使用 WebFlux，springboot 项目必须删除 spring-boot-starter-web 的依赖

```java
@Slf4j
@Service
public class NameMcpServer {
 
    @Tool(description = "根据孩子的出生日期和性别起名")
    public String childName(@ToolParam(description = "出生日期") String birth,
                            @ToolParam(description = "性别") String gender) {
        log.info(birth, gender);
        return "老任与码";
    }
}
```

```java
@Configuration
public class MyServerConfig {
    
    @Bean
    public ToolCallbackProvider nameTool(NameMcpServer nameMcpServer) {
        return MethodToolCallbackProvider.builder().toolObjects(nameMcpServer).build();
    }
}
```

### MCP 客户端

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client-webflux</artifactId>
    <version>1.1.2</version>
</dependency>
```

```yaml
spring:
  # Spring AI 相关配置
  ai:
    # OpenAI 相关配置
    openai:
      base-url: https://api.chatanywhere.tech
      api-key: 
      # 聊天模型相关配置
      chat:
        options:
          model: gpt-3.5-turbo
          # 设置温度参数为0.75，控制输出的随机性，值越高结果越随机
          temperature: 0.75
      embedding:
        options:
          model: text-embedding-3-small
          dimensions: 1024
    # 聊天记忆相关配置
    chat:
      # 配置聊天记忆存储库
      memory:
        repository:
          # JDBC存储库配置
          jdbc:
            # 初始化数据库表结构，always表示总是初始化（如果不存在则创建）
            initialize-schema: never
    # MCP (Model Context Protocol) 客户端配置
    # 用于与支持MCP协议的AI模型服务进行交互
    mcp:
     client:
       # 客户端名称，用于标识当前MCP客户端实例
       name: name-mcp-client
       # 客户端版本号，用于版本管理
       version: 1.0.0
       # 请求超时时间设置，超过此时间未响应将抛出超时异常
       request-timeout: 10s
       # 客户端通信类型，SYNC表示同步模式，还有ASYNC异步模式可选
       type: SYNC
       # SSE (Server-Sent Events) 连接配置，用于建立与MCP服务器的实时通信连接
       sse:
          connections:
            # MCP服务器连接配置块，name-mcp-server是自定义的连接名称
            name-mcp-server:
              # MCP服务器的基础URL地址
              url: http://localhost:8088
              # SSE端点路径，客户端将通过此路径与服务器建立SSE连接
              sse-endpoint: /sse

  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/springai?serverTimezone=Asia/Shanghai
    username: root
    password: 123456
  data:
    redis:
      host: localhost
      port: 6379
      database: 0

# 日志配置
logging:
  level:
    # 设置Spring AI相关组件的日志级别为debug，便于调试
    org.springframework.ai: debug # AI对话的日志级别
```

```java
@Configuration
public class ChatClientConfig {
    
    @Resource
    private List<McpSyncClient> mcpSyncClients;

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                // 设置系统消息
                .defaultSystem("你是一个java架构师")
                // 指定同步的MCP回调工具对象
                .defaultToolCallbacks(new SyncMcpToolCallbackProvider(mcpSyncClients))
                .build();
    }
}
```

```java
@RestController
@RequestMapping("/mcp")
public class MspClientController {
 
    @Resource
    private ChatClient client;
 
    @GetMapping("/chat")
    public String chat(String message) {
        return client.prompt(message).call().content();
    }
}
```

