## 基本介绍

### 对话出现问题

```java
@Resource
private ChatModel chatModel;

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

## ChatMemory

大型语言模型（LLM）是无状态的，这意味着它们不保留关于以前互动的信息。为了解决这个问题，Spring AI 提供了 Chat Memory（聊天记忆）功能。通过 Chat Memory，用户可以实现在与 LLM 的多次交互中存储和检索信息。

```java
/**
 * 聊天记忆接口，用于管理多轮对话中的上下文消息，支持多会话隔离。
 * 主要功能包括添加消息、获取消息、清空消息，确保AI模型能基于历史对话生成连贯回复。
 */
public interface ChatMemory {
 
    /**
     * 默认会话ID，当未指定会话标识时使用，适用于单会话场景
     */
    String DEFAULT_CONVERSATION_ID = "default";
 
    /**
     * 会话ID在相关上下文中的属性键名，用于从环境中获取或设置会话标识
     */
    String CONVERSATION_ID = "chat_memory_conversation_id";
 
    /**
     * 向指定会话的记忆中添加单条消息（默认实现）
     * 该方法通过断言确保会话ID和消息的有效性，最终调用批量添加方法
     *
     * @param conversationId 会话唯一标识，用于区分不同对话上下文
     * @param message 要添加的消息对象（可是用户消息、AI回复或系统消息等）
     */
    default void add(String conversationId, Message message) {
        // 断言会话ID不为空或空白，否则抛出异常
        Assert.hasText(conversationId, "conversationId cannot be null or empty");
        // 断言消息不为空，否则抛出异常
        Assert.notNull(message, "message cannot be null");
        // 调用批量添加方法，将单条消息包装为列表
        this.add(conversationId, List.of(message));
    }
 
    /**
     * 向指定会话的记忆中批量添加消息（核心方法，需实现类提供具体逻辑）
     * 用于一次性添加多条消息，适用于初始化会话或批量导入历史记录
     *
     * @param conversationId 会话唯一标识
     * @param messages 要添加的消息列表
     */
    void add(String conversationId, List<Message> messages);
 
    /**
     * 获取指定会话的所有记忆消息（核心方法，需实现类提供具体逻辑）
     * 返回的消息列表将作为上下文传递给AI模型，影响回复的连贯性
     *
     * @param conversationId 会话唯一标识
     * @return 按时间顺序排列的消息列表，包含该会话的所有历史消息
     */
    List<Message> get(String conversationId);
 
    /**
     * 清空指定会话的所有记忆消息（核心方法，需实现类提供具体逻辑）
     * 适用于重置对话上下文（如用户切换话题、结束当前会话）
     *
     * @param conversationId 会话唯一标识
     */
    void clear(String conversationId);
}
```

可以看到，所有的会话记忆都是与 conversationid 有关联的，也就是会话 Id，将来不同会话 id 的记忆自然是分开管理的。

### 存储方式

聊天记忆的底层存储由 ChatMemoryRepository 处理，其唯一责任是存储和检索消息。决定保留哪些消息及何时删除这些消息的权利在于 ChatMemory 的实现。策略可能包括保留最近的 N 条消息，保留一定时间段的消息，或者保留指定最大令牌数的消息。

会话记忆功能同样是基于 AOP 实现，Spring 提供了一个 MessageChatMemoryAdvisor 的通知，我们可以像之前添加日志通知一样添加到 ChatClient 即可，不过 MessageChatMemoryAdvisor 需要指定一个 ChatMemory 实例，也就是会话历史保存的方式。

```java
/**
 * 对话记忆仓库接口，负责对话消息的持久化存储与查询，是连接业务逻辑与底层存储的桥梁。
 * 提供基于会话ID的消息管理能力，支持多会话的消息持久化、查询和删除操作。
 */
public interface ChatMemoryRepository {
 
    /**
     * 查询所有存在的会话ID列表。
     * 用于获取系统中已保存的所有对话会话标识，便于管理或展示历史会话列表。
     *
     * @return 所有会话ID的字符串列表，每个ID对应一个独立的对话上下文
     */
    List<String> findConversationIds();
 
    /**
     * 根据会话ID查询该会话下的所有消息。
     * 是多轮对话中恢复上下文的核心方法，为AI模型提供历史对话依据。
     *
     * @param conversationId 会话唯一标识，用于定位具体的对话上下文
     * @return 该会话下按时间顺序排列的消息列表（包含用户输入、AI回复等）
     */
    List<Message> findByConversationId(String conversationId);
 
    /**
     * 为指定会话批量保存消息。
     * 用于将对话过程中产生的消息持久化存储，支持新增消息或覆盖已有消息。
     *
     * @param conversationId 会话唯一标识，指定消息所属的对话上下文
     * @param messages 要保存的消息列表，通常包含本轮对话的新消息或完整的上下文消息
     */
    void saveAll(String conversationId, List<Message> messages);
 
    /**
     * 根据会话ID删除该会话下的所有消息。
     * 用于清理指定会话的历史记录，适用于会话结束、用户删除记录等场景。
     *
     * @param conversationId 会话唯一标识，指定要删除的对话上下文
     */
    void deleteByConversationId(String conversationId);
}
```

1. InMemoryChatMemoryRepository：表示上下文消息存储在内存中

2. JdbcChatMemoryRepository：表示使用 JDBC 在关系数据库中存储消息，支持 PostgreSQL、MySQL / 

   MariaDB、SQL Server、HSQLDB 等数据库

3. CassandraChatMemoryRepository：表示使用 Apache Cassandra 分布式数据库存储消息
   Neo4jChatMemoryRepository 表示将聊天消息作为节点和关系存储在 Neo4j 图数据库

### 内置 Advisor

1. MessageChatMemoryAdvisor：此 Advisor 使用提供的 `ChatMemory` 实现管理对话记忆。在每次交互时，它从记忆中检索对话历史并将其作为消息集合包含在提示中。

2. PromptChatMemoryAdvisor：此 Advisor 使用提供的 `ChatMemory` 实现管理对话记忆。在每次交互时，它从记忆中检索对话历史并将其作为纯文本附加到系统提示中。

3. VectorStoreChatMemoryAdvisor：此 Advisor 使用提供的 `VectorStore` 实现管理对话记忆。在每次交互时，它从向量存储中检索对话历史并将其作为纯文本附加到系统消息中。

## 内存存储

### 基本使用

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

### MessageChatMemoryAdvisor 对话历史管理

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

    /**
     * 自定义 ChatMemory
     */
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

### PromptChatMemoryAdvisor 动态优化提示词

在发送请求给 AI 模型前，自动将历史对话注入到当前提示词中（系统提示词），形成完整的上下文感知 Prompt。内部维护了一个默认的系统提示词模板

```java
@Configuration
public class ChatClientConfig {

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("你是一个Java高级开发工程师")
                .defaultAdvisors(new SimpleLoggerAdvisor())
            	// 需要指定对应的 Advisor
                .defaultAdvisors(promptChatMemoryAdvisor())
                .build();
    }

    /**
     * 自定义 ChatMemory
     */
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
    
    @Bean
    public PromptChatMemoryAdvisor promptChatMemoryAdvisor() {
        // 自定义系统提示模板
        PromptTemplate promptTemplate = new PromptTemplate("""
                {instructions}
                
                请使用 “MEMORY” 部分中的对话记忆来提供准确答案。
                
                ---------------------
                MEMORY:
                {memory}
                ---------------------
                
                """);
        return PromptChatMemoryAdvisor.builder(chatMemory())
                .systemPromptTemplate(promptTemplate)
                .build();
    }
}
```

注意，上述配置的系统提示词模板中的 **{instructions}** 和 **{memory}** 占位符，Spring AI 会自动帮我们替换。我们还可以添加自定义的占位符，但需要使用 PromptTemplate 的 add(String name, Object value) 添加占位符具体的值

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
    <version>1.1.2</version>
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

1. `spring.ai.chat.memory.repository.jdbc.initialize-schema`：控制初始化 Schema 的时机。可选值：embedded（默认）、always（总是创建）、never（从不创建）。默认为 embedded

2. `spring.ai.chat.memory.repository.jdbc.schema`：用于初始化的 Schema 脚本位置。支持 classpath: URL 及平台占位符。默认为 classpath: org/springframework/ai/chat/memory/repository/jdbc/schema-@@platform@@.sql

3. `spring.ai.chat.memory.repository.jdbc.platform`：若初始化脚本中使用 @@platform@@ 占位符，则指定其对应的平台标识。默认为 auto-detected

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

### Redis

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
```

```java
/**
 * 自定义 ChatMemoryRepository，将数据存储到 Redis
 */
@Slf4j
public class RedisChatMemoryRepository implements ChatMemoryRepository {
    // 存储到Redis键的前缀
    private static final String DATA_REDIS_PREFIX = "ai:history:data:";
    private final RedisTemplate<String, String> redisTemplate;

    public RedisChatMemoryRepository(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public List<String> findConversationIds() {
        List<String> retKeys = new ArrayList<>();
        Optional.of(redisTemplate.opsForHash().keys(DATA_REDIS_PREFIX + "*")).ifPresent(keys -> {
            keys.forEach(k -> {
                if (Objects.nonNull(k)) {
                    retKeys.add(k.toString());
                }
            });
        });
        return retKeys;
    }

    @Override
    public List<Message> findByConversationId(String conversationId) {
        List<String> list = redisTemplate.opsForList().range(DATA_REDIS_PREFIX + conversationId, 0, -1);
        if (Objects.isNull(list) || list.isEmpty()) {
            return Collections.emptyList();
        }

        List<Message> retList = new ArrayList<>();
        for (String json : list) {
            if (!StringUtils.hasText(json)) {
                continue;
            }

            JSONObject jsonObject = JSONObject.parseObject(json);
            String type = jsonObject.getString("messageType");
            String text = jsonObject.getString("text");
            if (!StringUtils.hasText(type) || !StringUtils.hasText(text)) {
                continue;
            }

            if ("USER".equalsIgnoreCase(type)) {
                UserMessage userMessage = new UserMessage(text);
                retList.add(userMessage);
            } else if ("SYSTEM".equalsIgnoreCase(type)) {
                SystemMessage systemMessage = new SystemMessage(text);
                retList.add(systemMessage);
            } else if ("ASSISTANT".equalsIgnoreCase(type)) {
                AssistantMessage assistantMessage = new AssistantMessage(text);
                retList.add(assistantMessage);
            } else if ("TOOL".equalsIgnoreCase(type)) {
                ToolResponseMessage toolResponseMessage = ToolResponseMessage.builder()
                        .responses(jsonObject.getList("responses", ToolResponseMessage.ToolResponse.class))
                        .build();
                retList.add(toolResponseMessage);
            } else {
                log.warn("未知消息类型 type= {}, data={}", type, json);
            }
        }
        return retList;
    }

    @Override
    public void saveAll(String conversationId, List<Message> messages) {
        if (messages.isEmpty()) {
            return;
        }
        // 删除旧数据
        redisTemplate.delete(DATA_REDIS_PREFIX + conversationId);
        // 插入最新数据
        List<String> list = new ArrayList<>();
        messages.forEach(m -> {
            list.add(JSONObject.toJSONString(m));
        });
        redisTemplate.opsForList().rightPushAll(DATA_REDIS_PREFIX + conversationId, list);
    }

    @Override
    public void deleteByConversationId(String conversationId) {
        redisTemplate.opsForHash().delete(DATA_REDIS_PREFIX + conversationId, conversationId);
    }
}
```

```java
@Configuration
public class ChatClientConfig {

    @Resource
    private ChatModel chatModel;

    @Bean
    public ChatClient chatClient(ChatMemory chatMemory) {
        return ChatClient.builder(chatModel)
                .defaultAdvisors(new SimpleLoggerAdvisor())
                .defaultAdvisors(safeGuardAdvisor())
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }

    @Bean
    public SafeGuardAdvisor safeGuardAdvisor() {
        return SafeGuardAdvisor.builder()
                // 设置敏感词列表，用于过滤用户输入和AI输出中的不当内容
                .sensitiveWords(Arrays.asList("黄色"))
                // 当检测到敏感内容时返回的提示信息
                .failureResponse("请注意措辞")
                .build();
    }

    /**
     * 定义聊天记忆（ChatMemory）Bean
     * 采用窗口模式（MessageWindowChatMemory），限制最多保存的消息数量
     *
     * @param chatMemoryRepository 聊天记忆存储仓库（Redis实现）
     * @return 配置好的聊天记忆对象
     */
    @Bean
    public ChatMemory chatMemory(RedisChatMemoryRepository chatMemoryRepository) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(chatMemoryRepository) // 注入自定义存储仓库，指定消息持久化方式
                .maxMessages(20) // 设置窗口大小，最多保存20条消息（超过则自动丢弃最早的消息）
                .build();
    }

    // 创建自定义的 RedisChatMemoryRepository
    @Bean
    public RedisChatMemoryRepository redisChatMemoryRepository(RedisTemplate<String, String> redisTemplate) {
        return new RedisChatMemoryRepository(redisTemplate);
    }
}
```

## 向量存储

VectorStoreChatMemoryAdvisor 类是一个基于向量存储（VectorStore）的聊天记忆管理组件，通过将历史对话消息转换为向量并存储，实现在对话系统中上下文感知的对话记忆功能。

当用户发起请求时，VectorStoreChatMemoryAdvisor 会基于会话 ID（Conversation ID）直接关联并返回历史消息，而没有进行向量语义检索（即没有通过嵌入向量相似性搜索来获取相关上下文）。
