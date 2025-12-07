## 基本介绍

### 对话出现问题

```java
@GetMapping("/chat")
public String chat() {
    String answer = chatModel.call("你好，我是Java工程师");
    System.out.println(answer);

    String answer2 = chatModel.call("我是谁");
    System.out.println(answer2);
    return "success";
}
```

根据输出结果可以看到，第一次提问时，虽然已经告知大模型自己的名字，但是第二次提问时，大模型并不能回答出正确答案。这就说明本例中，两次提问是相互独立的，大模型是无状态的。

### 解决方法

让 AI 有会话记忆的方式就是把每一次历史对话内容拼接到 Prompt 中，一起发送过去。

```java
@RestController
public class ChatMemoryController {

    // 历史消息列表
    private static List<Message> historyMessage = new ArrayList<>();
    // 历史消息列表的最大长度
    private static final int MAX_LEN = 10;

    @Resource
    private ChatClient chatClient;

    /**
     * 上下文对话
     */
    @RequestMapping(value = "/demo", produces = "text/html;charset=UTF-8")
    public String demoV3(@RequestParam("msg") String msg) {
        // 用户输入的文本是UserMessage
        historyMessage.add(new UserMessage(msg));
        // 发给AI前对历史消息对列的长度进行检查
        if (historyMessage.size() > MAX_LEN) {
            historyMessage = historyMessage.subList(historyMessage.size() - MAX_LEN - 1, historyMessage.size());
        }
        // 获取AssistantMessage
        ChatResponse chatResponse = chatClient.prompt(new Prompt(historyMessage)).call().chatResponse();
        AssistantMessage assistantMessage = chatResponse.getResult().getOutput();
        // 将AI回复的消息放到历史消息列表中
        historyMessage.add(assistantMessage);
        return assistantMessage.getText();
    }
}
```

> 注意：SpringAI 自带了会话记忆功能，可以帮我们把历史会话保存下来，下一次请求 AI 时会自动拼接，非常方便。

## Chat Memory 介绍

大型语言模型（LLM）是无状态的，这意味着它们不保留关于以前互动的信息。为了解决这个问题，Spring AI 提供了 Chat Memory（聊天记忆）功能。通过 Chat Memory，用户可以实现在与 LLM 的多次交互中存储和检索信息。

聊天记忆的底层存储由 ChatMemoryRepository 处理，其唯一责任是存储和检索消息。决定保留哪些消息及何时删除这些消息的权利在于 ChatMemory 的实现。策略可能包括保留最近的 N 条消息，保留一定时间段的消息，或者保留指定最大令牌数的消息。

会话记忆功能同样是基于 AOP 实现，Spring 提供了一个 MessageChatMemoryAdvisor 的通知，我们可以像之前添加日志通知一样添加到 ChatClient 即可。

不过，要注意的是，MessageChatMemoryAdvisor 需要指定一个 ChatMemory 实例，也就是会话历史保存的方式。

```java
public interface ChatMemory {

	String DEFAULT_CONVERSATION_ID = "default";

	String CONVERSATION_ID = "chat_memory_conversation_id";

	default void add(String conversationId, Message message) {
		Assert.hasText(conversationId, "conversationId cannot be null or empty");
		Assert.notNull(message, "message cannot be null");
		this.add(conversationId, List.of(message));
	}

	// 添加会话信息到指定conversationId的会话历史中
	void add(String conversationId, List<Message> messages);

    // 根据conversationId查询历史会话
	List<Message> get(String conversationId);

	// 清除指定conversationId的会话历史
	void clear(String conversationId);
}
```

可以看到，所有的会话记忆都是与 conversationid 有关联的，也就是会话 Id，将来不同会话 id 的记忆自然是分开管理的。

## 存储方式

1. InMemoryChatMemoryRepository：表示上下文消息存储在内存中

2. JdbcChatMemoryRepository：表示使用 JDBC 在关系数据库中存储消息，支持 PostgreSQL、MySQL / 

   MariaDB、SQL Server、HSQLDB 等数据库

3. CassandraChatMemoryRepository：表示使用 Apache Cassandra 分布式数据库存储消息
   Neo4jChatMemoryRepository 表示将聊天消息作为节点和关系存储在 Neo4j 图数据库

## 内置 Advisor

1. MessageChatMemoryAdvisor：此 Advisor 使用提供的 `ChatMemory` 实现管理对话记忆。在每次交互时，它从记忆中检索对话历史并将其作为消息集合包含在提示中。

2. PromptChatMemoryAdvisor：此 Advisor 使用提供的 `ChatMemory` 实现管理对话记忆。在每次交互时，它从记忆中检索对话历史并将其作为纯文本附加到系统提示中。

3. VectorStoreChatMemoryAdvisor：此 Advisor 使用提供的 `VectorStore` 实现管理对话记忆。在每次交互时，它从向量存储中检索对话历史并将其作为纯文本附加到系统消息中。

## 内存存储

### 使用默认 ChatMemory

不需要任何配置，即可直接注入 ChatMemory 对象

```java
@RestController
public class ChatMemoryControllerV2 {

    @Resource
    private ChatMemory chatMemory;
    @Resource
    private ChatClient chatClient;

    @RequestMapping(value = "/chatMemory", produces = "text/html;charset=UTF-8")
    public Flux<String> chat(@RequestParam("msg") String msg, @RequestParam("conversationId") String conversationId) {
        UserMessage userMessage1 = new UserMessage(msg);
        // conversationId表示和大模型的会话id，一般可以使用用户id表示，用于区分不同的用户的聊天上下文信息
        chatMemory.add(conversationId, userMessage1);
        ChatClient.StreamResponseSpec stream = chatClient.prompt(new Prompt(chatMemory.get(conversationId))).stream();
        // 使用chatResponse()而不是content()来获取完整的响应
        Flux<ChatResponse> chatResponseFlux = stream.chatResponse();
        
        // 从ChatResponse中提取内容并添加到ChatMemory中
        Flux<String> content = chatResponseFlux.map(response -> {
            String responseText = response.getResult().getOutput().getText();
            // 将AI的回复添加到对话历史中
            chatMemory.add(conversationId, new AssistantMessage(responseText));
            return responseText;
        });
        
        /*
        Flux<ChatClientResponse> chatResponseFlux = stream.chatClientResponse();
        Flux<String> content = chatResponseFlux.mapNotNull(response -> {
            List<Message> list = response.chatResponse()
                    .getResults()
                    .stream()
                    .map(g -> (Message) g.getOutput())
                    .toList();
            chatMemory.add(conversationId, list);
            return response.chatResponse().getResult().getOutput().getText();
        });
        */
        return content;
    }
}
```

### 自定义 ChatMemory

```java
@Configuration
public class ChatClientConfig {

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("你是一个Java高级开发工程师")
                .defaultAdvisors(new SimpleLoggerAdvisor())
            	// 需要指定对应的 Advisor
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory()).build())
                .build();
    }

    @Bean
    public ChatMemory chatMemory() {
        MessageWindowChatMemory build = MessageWindowChatMemory.builder()
            	// 表示聊天的上下文消息存储在内存中
                .chatMemoryRepository(new InMemoryChatMemoryRepository())
            	// 指定存储的最大的消息条数
                .maxMessages(10)
                .build();
        return build;
    }
}
```

MessageWindowChatMemory 维护一个最多可达到指定最大大小（默认：20 条消息）的消息窗口。当消息数量超过此限制时，旧消息会被驱逐，但系统消息会被保留。如果添加了一条新的系统消息，则会从聊天记忆中删除所有以前的系统消息。这确保了最新的上下文始终可用于对话，同时保持聊天记忆使用在可控范围内。

```java
@RestController
public class ChatMemoryControllerV2 {

    @Resource
    private ChatClient chatClient;

    @RequestMapping(value = "/chatMemoryV2", produces = "text/html;charset=UTF-8")
    public Flux<String> chatV2(@RequestParam("msg") String msg, @RequestParam("conversationId") String conversationId) {
        return chatClient.prompt()
                .user(msg)
            	// 必须指定，根据conversationId区分不同会话的上下文
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .stream()
                .content();
    }
}
```

## 数据库存储

### MySQL

```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.6</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-chat-memory-repository-jdbc</artifactId>
    <version>1.1.0</version>
</dependency>
```

```yaml
spring:
  # Spring AI 相关配置
  ai:
    # OpenAI 相关配置
    openai:
      # API基础URL，这里配置的是阿里云百炼平台的兼容模式地址
      base-url: https://dashscope.aliyuncs.com/compatible-mode
      # API密钥，用于身份验证
      api-key: 
      # 聊天模型相关配置
      chat:
        options:
          # 指定使用的模型为qwen3-max（通义千问大模型）
          model: qwen3-max
          # 设置温度参数为0.75，控制输出的随机性，值越高结果越随机
          temperature: 0.75
    # 聊天记忆相关配置
    chat:
      # 配置聊天记忆存储库
      memory:
        repository:
          # JDBC存储库配置
          jdbc:
            # 初始化数据库表结构，always表示总是初始化（如果不存在则创建）
            initialize-schema: never

  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/springai?serverTimezone=Asia/Shanghai
    username: root
    password: 123456

# 日志配置
logging:
  level:
    org.springframework.ai: debug # AI对话的日志级别
```

```java
@Configuration
public class ChatClientConfig {

    @Resource
    private JdbcChatMemoryRepository chatMemoryRepository;

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("你是一个Java高级开发工程师，对于用户提出的问题给予简洁的回复即可")
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory()).build())
                .build();
    }

    @Bean
    public ChatMemory chatMemory() {
        MessageWindowChatMemory build = MessageWindowChatMemory.builder()
                .chatMemoryRepository(chatMemoryRepository)
                .maxMessages(10)
                .build();
        return build;
    }
}
```

```java
@RestController
public class ChatMemoryControllerV2 {

    @Resource
    private ChatClient chatClient;

    @RequestMapping(value = "/chatMemoryV2", produces = "text/html;charset=UTF-8")
    public Flux<String> chatV2(@RequestParam("msg") String msg, @RequestParam("conversationId") String conversationId) {
        return chatClient.prompt()
                .user(msg)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .stream()
                .content();
    }
}
```

