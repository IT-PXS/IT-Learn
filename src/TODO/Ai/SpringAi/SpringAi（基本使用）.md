# 工具

## 工具介绍

工具调用也成为函数工具调用，是人工智能应用中的一个常见模式，通过函数调用允许模型与一组 API 或工具进行交互，从而增强其能力。

主要作用：

1. 信息检索。此类别中的工具可用于从外部源检索信息，例如数据库、Web 服务、文件系统或 Web 搜索引擎。其目的是增强模型的知识，使其能够回答其他方式无法回答的问题。例如，可以使用某个工具检索给定地点的当前天气、获取最新的新闻文章或查询数据库中的特定记录。

2. 执行操作。本类工具可用于在软件系统中执行操作，例如发送电子邮件、在数据库中创建新记录、提交表单或触发工作流程。目标是自动化否则需要人工干预或明确编程的任务。例如，可以使用某个工具为与聊天机器人互动的客户预订航班，填写网页上的表单等。

执行流程：

1. 当我们想让工具对大模型可用时，我们会将它的定义包含在聊天请求中。每个工具定义包括名称、描述和输入参数的模式。

2. 当大模型决定调用工具时（注意：是否调用函数工具，由大模型做决定），它会发送一个响应，其中包含工具名称以及根据定义模式建模的输入参数。

3. 我们的应用负责使用工具名称来识别并执行带有提供输入参数的工具。

4. 工具调用的结果由应用处理。

5. 应用将工具调用结果发送回大模型。

6. 大模型根据工具调用的结果，结合上下文信息生成最终响应。

## 定义工具类

```java
public class MyTools {
 
    @Tool(name="getTodayDate", description = "获取今天日期信息")
    String getTodayDate() {
        System.out.println("获取当前日期时间");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(new Date());
    }
}
```

大模型调用的工具通过@Tool 修饰，其包含如下 4 个属性：

1. name：工具的名称。如果未提供，将使用方法名称。AI 模型在调用工具时使用此名称进行识别。因此，同一类中不允许存在名称相同的两个工具。对于特定聊天请求，该名称在模型可用的所有工具中必须是唯一的。

2. description：工具的描述，模型可以使用此描述来理解何时以及如何调用该工具。如果未提供，将使用方法名称作为工具描述。但是，强烈建议提供详细描述，这对于模型理解工具目的及使用方法至关重要。未提供良好的描述可能导致模型在应该使用时未使用工具，或者使用错误。

3. returnDirect：工具结果是直接返回给客户端，还是传回给模型。默认值 false，表示执行工具的结果需要再发送给大模型，大模型根据上下文返回组织后的信息。

4. resultConverter：用于将工具调用结果转换为自定义的 String 类型的数据，需要开发人员重写 ToolCallResultConverter 接口的方法实现，默认返回 JSON 格式的字符串。

```java
public class MyTools {
 
    @Tool(name="getTodayDate", 
            description = "获取今天日期信息", 
            returnDirect = true)
    String getTodayDate() {
        System.out.println("获取当前日期时间");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(new Date());
    }
}
```

## 通过 ChatModel 对象调用

```java
@GetMapping("/chat")
public String chat(String message) {
    // 将指定类中@Tool修饰的方法转为ToolCallback对象
    ToolCallback[] dateTimeTools = ToolCallbacks.from(new MyTools());
    // 设置ChatOptions, 指定工具
    ChatOptions chatOptions = ToolCallingChatOptions.builder()
            .toolCallbacks(dateTimeTools)
            .build();
    // 提示词对象中指定工具
    Prompt prompt = new Prompt(message, chatOptions);
    // Prompt prompt = new Prompt(message);
    ChatResponse response = chatModel.call(prompt);
    System.out.println(response.getResult().getOutput().getText());
    return "success";
}
```

## 通过 ChatClient 对象调用

```java
@GetMapping("/chat2")
public String chat2(String message) {
    String answer = this.client
            .prompt(message)
            // 指定工具
            .tools(new MyTools())
            .call()
            .content();

    System.out.println(answer);
    return "success";
}
```

上面的例子，我们是每次发送消息时都指定工具，这样子做更灵活。如果不想每次指定，我们可以通过 defaultTools()方法为 ChatClient 指定默认工具：

```java
@Bean
public ChatClient chatClient(ZhiPuAiChatModel chatModel) {
    return ChatClient
            .builder(chatModel)
            // 设置系统消息
            .defaultSystem("你是一个java架构师")
            // 指定默认工具
            .defaultTools(new MyTools())
            //配置日志相关的Advisor，需要开启日志级别以及配置 默认debug级别
            .defaultAdvisors(simpleLoggerAdvisor(),
                    MessageChatMemoryAdvisor.builder(chatMemory()).build())
            .build();
}
```

## 大模型自动调用多次函数工具

```java
public class MyTools {
 
    @Tool(description = "获取今天日期信息")
    String getTodayDate() {
        System.out.println("获取当前日期时间");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(new Date());
    }
 
    @Tool(description = "根据指定日期获取天气情况")
    String getWeather(@ToolParam(description = "日期信息，格式为yyyy-MM-dd") String date) {
        System.out.println("获取指定日期的天气：" + date);
        return "晴天 35度";
    }
}
```

# 向量

嵌入是文本、图像或视频的数值表示，用于捕获输入之间的关系。

嵌入的工作原理是将文本、图像和视频转换为浮点数数组，称为向量。这些向量旨在捕获文本、图像和视频的含义。嵌入数组的长度称为向量的维度。

通过计算两个文本向量表示之间的数值距离，应用程序可以确定用于生成嵌入向量的对象之间的相似性。

EmbeddingModel 接口旨在轻松集成 AI 和机器学习中的嵌入模型。其主要功能是将文本转换为数值向量，通常称为嵌入。这些嵌入对于各种任务至关重要，例如语义分析和文本分类。

```xml
<dependency>
   <groupId>org.springframework.ai</groupId>
   <artifactId>spring-ai-starter-model-ollama</artifactId>
</dependency>
```

```yaml
spring:
  ai:
    ollama:
      # ollama的api路径
      base-url: http://localhost:11434
      embedding:
        options:
          # 嵌入模型名称
          model: shaw/dmeta-embedding-zh:latest
    model:
      embedding: ollama
```

##  对字符串数据进行嵌入处理

```java
@RestController
@RequestMapping("/embeding")
public class EmbedingController {
 
    @Resource
    private EmbeddingModel embeddingModel;
 
    @GetMapping("/embed")
    public String embed() {
        // 返回响应对象
        EmbeddingResponse embeddingResponse = embeddingModel.embedForResponse(List.of("今天天气不错"));
        // Map<String, EmbeddingResponse> embedding = Map.of("embedding", embeddingResponse);
        System.out.println(Arrays.toString(embeddingResponse.getResult().getOutput()));
 
        // 直接返回向量化后的数据
        float[] embed = embeddingModel.embed("挺风和日丽的");
        System.out.println(Arrays.toString(embed));
        return "success";
    }
}
```

## Document 对象进行嵌入处理

### DocumentReader

通过 DocumentReader 实现类对象，可以读取不同来源的文档数据。支持的实现类：

1. JsonReader 处理 JSON 文档，将它们转换为 Document 对象列表
2. TextReader 处理纯文本文档，将它们转换为 Document 对象列表
3. JsoupDocumentReader 使用 JSoup 库处理 HTML 文档，将它们转换为 Document 对象列表。
4. MarkdownDocumentReader 处理 Markdown 文档，将它们转换为 Document 对象列表。
5. PagePdfDocumentReader 使用 Apache PdfBox 库解析 PDF 文档
6. ParagraphPdfDocumentReader 使用 PDF 目录（例如 TOC）信息将输入 PDF 拆分为文本段落，并为每个段落输出一个单独的 Document。注意：并非所有 PDF 文档都包含 PDF 目录
7. TikaDocumentReader 使用 Apache Tika 从各种文档格式（例如 PDF、DOC/DOCX、PPT/PPTX 和 HTML）中提取文本

```java
// 加载指定的资源文件
@Value("classpath:document/医院.txt")
private org.springframework.core.io.Resource resource;

@GetMapping("/embed2")
public String embed2() {
    // 读取文本文件
    TextReader textReader = new TextReader(this.resource);
    // 元数据中增加文件名
    textReader.getCustomMetadata().put("filename", "医院.txt");
    // 获取Document对象
    List<Document> docList = textReader.read();
    // 向量化处理
    float[] embed = embeddingModel.embed(docList.get(0));
    // 打印向量化后的数据
    System.out.println(Arrays.toString(embed));
    // 打印Document中的原始文本数据
    System.out.println(docList.get(0).getText());
    return "success";
}
```

### DocumentTransformer

对文档进行批量转换处理

上个例子，我们对文档进行了转换，但是默认一个文档转为一个 Document 对象，如果文档太长，以后进行检索时，那么聊天上下文占用的 token 就会很大，为了解决该问题，我们可以对文档进行拆分处理。

TokenTextSplitter 是 TextSplitter 的一个实现，而 TextSpliter 继承了 DocumentTransformer 接口，它使用 CL100K_BASE 编码，根据 token 计数将文本分割成块。

```java
public TokenTextSplitter() {
    this(800, 350, 5, 10000, true);
}

public TokenTextSplitter(boolean keepSeparator) {
    this(800, 350, 5, 10000, keepSeparator);
}

public TokenTextSplitter(int chunkSize, int minChunkSizeChars, int minChunkLengthToEmbed, int maxNumChunks, boolean keepSeparator) {
	......
}
```

1. defaultChunkSize: 每个文本块以 token 为单位的目标大小（默认值：800）。
2. minChunkSizeChars: 每个文本块以字符为单位的最小大小（默认值：350）。
3. minChunkLengthToEmbed: 文本块去除空白字符或者处理分隔符后，用于嵌入处理的文本的最小长度（默认值：5）。
4. maxNumChunks: 从文本生成的最大块数（默认值：10000）。
5. keepSeparator: 是否在块中保留分隔符（例如换行符）（默认值：true）。

TokenTextSplitter 拆分文档的逻辑：

1.使用 CL100K_BASE 编码将输入文本编码为 token

2.根据 defaultChunkSize 对编码后的 token 进行分块

3.对于分块：

        （1）将块再解码为文本字符串
    
        （2）尝试从后向前找到一个合适的截断点（句号、问号、感叹号或换行符）。
    
        （3）如果找到合适的截断点，并且截断点所在的 index 大于 minChunkSizeChars，则将在该点截断该块
    
        （4）对分块去除两边的空白字符，并根据 keepSeparator 设置，可选地移除换行符
    
        （5）如果处理后的分块长度大于 minChunkLengthToEmbed，则将其添加到分块列表中

4.持续执行第 2 步和第 3 步，直到所有 token 都被处理完或达到 maxNumChunks

5.如果还有剩余的 token 没有处理，并且剩余的 token 进行编码和转换处理后，长度大于 minChunkLengthToEmbed，则将其作为最终块添加

```java
@GetMapping("/embed3")
public String embed3() {
    // 读取文本文件
    TextReader textReader = new TextReader(this.resource);
    // 元数据中增加文件名
    textReader.getCustomMetadata().put("filename", "医院.txt");
    // 获取Document对象
    List<Document> docList = textReader.read();
    // 文档分割
    TokenTextSplitter splitter = new TokenTextSplitter();
    List<Document> splitDocuments = splitter.apply(docList);
    // 向量化处理
    float[] embed = embeddingModel.embed(splitDocuments.get(0));
    // 打印向量化后的数据
    System.out.println(Arrays.toString(embed));
    // 打印Document中的原始文本数据
    System.out.println(splitDocuments.get(0).getText());
    return "success";
}
```

## 向量存储

### SimpleVectorStore 使用

SimpleVectorStore 将向量数据存储在内存中。

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vector-store</artifactId>
</dependency>
```

```java
@Bean
public SimpleVectorStore vectorStore() {
    return SimpleVectorStore.builder(embeddingModel).build();
}
```

向 SimpleVectorStore 对象中写入测试数据，本例中，创建 Document 对象时，三个参数分别为：文档 id，文档内容，文档的元数据。

```java
@PostConstruct
public void init() {
    List<Document> documents = List.of(
            new Document("1", "今天天气不错", Map.of("country", "郑州", "date", "2025-05-13")),
            new Document("2", "天气不错，适合旅游", Map.of("country", "开封", "date", "2025-05-15")),
            new Document("3", "去哪里旅游好呢", Map.of("country", "洛阳", "date", "2025-05-15")));
    // 存储数据
    simpleVectorStore.add(documents);
}
```

### 进行相似度搜索

#### 根据字符串内容进行搜索

```java
@GetMapping("/store")
public String store(String message) {
    // 相似度检索
    List<Document> list= simpleVectorStore.similaritySearch("旅游");
    System.out.println(list.size());
    System.out.println(list.get(0).getText());

    return "success";
}
```

#### 根据元数据过滤器进行搜索

**使用字符串设置搜索条件**

例如：

- `"country == 'BG'"`
- `"genre == 'drama' && year >= 2020"`
- `"genre in ['comedy', 'documentary', 'drama']"`

```java
SearchRequest request = SearchRequest.builder()
    .query("World")
    .filterExpression("country == 'Bulgaria'")
    .build();
```

**使用 Filter.Expression 设置搜索条件**

可以使用 `FilterExpressionBuilder` 创建 `Filter.Expression` 的实例。一个简单的示例如下：

```java
FilterExpressionBuilder b = new FilterExpressionBuilder();
Expression expression = this.b.eq("country", "BG").build();
```

```java
@GetMapping("/store")
public String store(String message) {
    // 相似度检索
    // List<Document> list = simpleVectorStore.similaritySearch("旅游");

    // 创建过滤器对象
    FilterExpressionBuilder b = new FilterExpressionBuilder();
    Filter.Expression filter = b.eq("country", "郑州").build();
    // Filter.Expression filter = b.and(b.eq("country", "郑州"), b.gte("date", "2025-05-15")).build();;
    // 创建搜索对象
    SearchRequest request = SearchRequest.builder()
            .query("旅游") // 搜索内容
            .filterExpression(filter) // 指定过滤器对象
            .build();
    List<Document> list = simpleVectorStore.similaritySearch(request);
    System.out.println(list.size());
    System.out.println(list.get(0).getText());

    return "success";
}
```

### 删除数据

```java
@GetMapping("/store2")
public String store2(String message) {
    // 删除数据
    simpleVectorStore.delete(List.of("3"));
    return "success";
}
```

## Milvus 进行向量存储（TODO）

```xml
<dependency>
	<groupId>org.springframework.ai</groupId>
	<artifactId>spring-ai-starter-vector-store-milvus</artifactId>
</dependency>
```

```yaml
spring:
  ai:
    vectorstore:
      milvus:
        client:
          host: "localhost"
          port: 19530
        databaseName: "myai"
        collectionName: "vector_store"
        embeddingDimension: 768
        indexType: IVF_FLAT
        metricType: COSINE
```

### 通过 attu 创建 collection

![img](https://i-blog.csdnimg.cn/direct/5c6e5d07292e4171a2fe02aed7cee8dd.png)

注意：collection 中的字段名称使用的是上面属性中的默认名称：

spring.ai.vectorstore.milvus.id-field-name = doc_id

spring.ai.vectorstore.milvus.content-field-name = content

spring.ai.vectorstore.milvus.metadata-field-name = metadata

spring.ai.vectorstore.milvus.embedding-field-name = embedding

```java
@Resource
private MilvusVectorStore milvusVectorStore;

@PostConstruct
public void init() {
    List<Document> documents = List.of(
            new Document("今天天气不错", Map.of("country", "郑州", "date", "2025-05-13")),
            new Document("天气不错，适合旅游", Map.of("country", "开封", "date", "2025-05-15")),
            new Document("去哪里旅游好呢", Map.of("country", "洛阳", "date", "2025-05-15")));

    // 存储数据
    milvusVectorStore.add(documents);
}
```

### 相似度搜索

```java
@GetMapping("/search")
public String search(String message) {
    // 相似度检索
    List<Document> list = milvusVectorStore.similaritySearch("旅游");

    System.out.println(list.size());
    System.out.println(list.get(0).getText());
    return "success";
}

@GetMapping("/search5")
public String search5(String message) {
    MilvusSearchRequest request = MilvusSearchRequest.milvusBuilder()
            .query("旅游")
            .topK(5)
            .similarityThreshold(0.7)
            .filterExpression("date == '2025-05-15'") // Ignored if nativeExpression is set
            //.searchParamsJson("{\"nprobe\":128}")
            .build();
    // 相似度检索
    List<Document> list = milvusVectorStore.similaritySearch(request);

    System.out.println(list.size());
    System.out.println(list.get(0).getText());
    return "success";
}
```

top_k： 表示根据 token 排名，只考虑前 k 个 token

similarity threshold：相似度的阈值

# RAG

检索增强生成（RAG），用于解决将相关数据纳入提示词中以获得准确 AI 模型响应的挑战。

该方法采用批处理式编程模型，从指定的文档中读取非结构化数据，进行转换，然后写入向量数据库。从高层次来看，这是一个 ETL（提取、转换和加载）管道。向量数据库用于 RAG 技术的检索部分。

在将非结构化数据加载到向量数据库时，最重要的转换之一是将原始文档分割成更小的片段。将原始文档分割成更小片段的过程有两个重要步骤：

在保持内容语义边界的同时将文档分割成部分。例如，对于包含段落和表格的文档，应避免在段落或表格中间分割文档。对于代码，避免在方法的实现中间分割代码。

将文档的部分进一步分割成大小占 AI 模型词元限制很小百分比的部分。

RAG 的下一阶段是处理用户输入。当需要 AI 模型回答用户的提问时，该问题以及所有“相似”的文档片段都会被放入发送给 AI 模型的提示词中。这就是使用向量数据库的原因。它非常善于查找相似的内容。

```xml
<dependency>
   <groupId>org.springframework.ai</groupId>
   <artifactId>spring-ai-advisors-vector-store</artifactId>
</dependency>
```

## 初始化数据

本例仅用于测试，读取指定的文本文件，按照指定的大小对文件进行分割，将分割后的块，进行向量化处理，并将向量化后的数据写入 milvus 中。

```java
@PostConstruct
public void init() {
    // 读取文本文件
    TextReader textReader = new TextReader(this.resource);
    // 元数据中增加文件名
    textReader.getCustomMetadata().put("filename", "医院.txt");
    // 获取Document对象,只有一个记录
    List<Document> docList = textReader.read();
    TokenTextSplitter splitter = new TokenTextSplitter(300, 350, 5, 10000, true);
    List<Document> splitDocuments = splitter.apply(docList);

    // 分割后的文档存入向量数据库
    milvusVectorStore.add(splitDocuments);
}
```

```java
@GetMapping("/chat")
public String chat(String message) {
    // 定义提示词模版
    PromptTemplate customPromptTemplate = PromptTemplate.builder()
            .renderer(StTemplateRenderer.builder().startDelimiterToken('<').endDelimiterToken('>').build())
            .template("""
                    <query>
                    上下文信息如下：
                    ---------------------
                    <question_answer_context>
                    ---------------------
                    根据上下文信息回答查询。
                    遵循以下规则：
                    1. 如果答案不在上下文中，只需说你不知道。
                    2. 避免使用“根据上下文...”或“提供的信息...”这样的表述。
                    3. 回答问题尽量精简
                             """)
            .build();

    QuestionAnswerAdvisor qaAdvisor = QuestionAnswerAdvisor.builder(milvusVectorStore)
            // 设置提示词模版对象，如果不设置，使用默认的模版
            .promptTemplate(customPromptTemplate)
            // 指定进行向量搜索时的基本条件
            .searchRequest(SearchRequest.builder().topK(3).similarityThreshold(0.5).build())
            .build();

    ChatResponse chatResponse = this.client.prompt()
            .advisors(qaAdvisor)
            .user(message)
            .call()
            .chatResponse();
    System.out.println(chatResponse.getResult().getOutput().getText());
    return "success";
}
```

```
本例使用<>表示占位符
<query>表示用户提出的问题，<question_answer_context>表示检索的内容
```

当用户问题发送到 AI 模型时，QuestionAnswerAdvisor 查询向量数据库以获取与用户问题相关的文档。

向量数据库的响应被附加到用户文本中，为 AI 模型生成响应提供上下文。

发送的提示词如下：

```java
request: ChatClientRequest[prompt=Prompt{messages=[SystemMessage{textContent='你是一个java架构师', messageType=SYSTEM, metadata={messageType=SYSTEM}}, UserMessage{content='医院职工数
上下文信息如下：
---------------------
70%，获批省级特色专科、省级专病治疗中心。
心脏大血管外科入选河南省“十四五”首批省级临床重点专科，开展冠脉搭桥手术、经导管主动脉瓣置换术（TAVI手术）、HYBRID心脏杂交手术。血管外科是河南省医学会、医师协会副主委单位，完成主动脉夹层（瘤）介入技术、颈动脉体瘤切除、颈动脉内膜剥脱、一站式治疗VTE。
整形修复科是中国创面修复建设培育单位，入选河南省“十四五”首批省级临床重点专科，开展耳、鼻、口唇、颌面、手足、乳房、腹壁、生殖器、瘢痕、体表肿瘤
河南省直第三人民医院简介
（修订日期 2025年3月）
河南省直第三人民医院是河南省卫健委直属的一家“医教研转工作统筹推进、防治康养手段综合应用、吃动睡想行为全面科学”的省三级公立综合医院。是河南省干部保健定点医院。
医院位于河南省省会郑州，有三个院区，郑东院区（郑东新区人民医院）比邻河南省政府。西院区位于中原区伏牛路陇海路交叉口；857院区位于中原区陇海路328号。医院有2个急救站，5个急救联盟单位、4个社区卫生服务中心；下设司法鉴定中心。
医院核定床位1800张，职工2113人，专业技术人员1903人，二级主任医�
化，汲取“智慧管理、人文管理、高科技创新、低成本高效运营”的现代化综合性医院之精髓，为患者提供安全、优质、便捷的医疗服务。
---------------------
根据上下文信息回答查询。
遵循以下规则：
1. 如果答案不在上下文中，只需说你不知道。
2. 避免使用“根据上下文...”或“提供的信息...”这样的表述。
3. 回答问题尽量精简
'
```

从提示词中看出，在向大模型发送消息前，先通过向量数据库，搜索对应的信息。然后按照提示词模版，生成最新的提示词信息，然后将用户的提问和提示词模版生成的提示词信息一并发送给大模型。

## RetrievalAugmentationAdvisor

QuestionAnswerAdvisor 主要作用是对向量 [数据库](https://so.csdn.net/so/search?q=数据库&spm=1001.2101.3001.7020) 中的所有文档执行相似性搜索。

RetrievalAugmentationAdvisor 可以更好的体现检索增强。

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-rag</artifactId>
</dependency>
```

```yaml
spring:
  ai:
    zhipuai:
      api-key: 自己申请的key
      chat:
        options:
          # model: glm-4v-flash
          model: glm-4-flash
          temperature: 0.7
    ollama:
      base-url: http://localhost:11434
      embedding:
        options:
          model: shaw/dmeta-embedding-zh:latest
    model:
      embedding: ollama
    vectorstore:
      milvus:
        client:
          host: "localhost"
          port: 19530
        databaseName: "myai"
        collectionName: "vector_2501"
        embeddingDimension: 768
        indexType: IVF_FLAT
        metricType: COSINE
```

```java
@RestController
@RequestMapping("/rag")
public class RagController {
    @Resource
    private ChatClient client;
    @Resource
    private EmbeddingModel embeddingModel;
    @Value("classpath:document/医院.txt")
    private org.springframework.core.io.Resource resource;
    @Resource
    // private VectorStore vectorStore;
    private MilvusVectorStore milvusVectorStore;
 
    // 执行一次即可
    // @PostConstruct
    public void init() {
        // 读取文本文件
        TextReader textReader = new TextReader(this.resource);
        // 元数据中增加文件名
        textReader.getCustomMetadata().put("filename", "医院.txt");
        // 获取Document对象,只有一个记录
        List<Document> docList = textReader.read();
        TokenTextSplitter splitter = new TokenTextSplitter(300, 350, 5, 10000, true);
        List<Document> splitDocuments = splitter.apply(docList);
 
        milvusVectorStore.add(splitDocuments);
    }
    
    @GetMapping("/chat2")
    public String chat2(String message) {
        // 创建RetrievalAugmentationAdvisor对象
        // 通过documentRetriever指定使用的向量数据库
        Advisor retrievalAugmentationAdvisor = RetrievalAugmentationAdvisor.builder()
                .documentRetriever(VectorStoreDocumentRetriever.builder()
                        .similarityThreshold(0.50)
                        .topK(3)
                        .vectorStore(milvusVectorStore)
                        .build())
                .build();
 
        String answer = client.prompt()
                // 设置检索增强对象
                .advisors(retrievalAugmentationAdvisor)
                .user(message)
                .call()
                .content();
 
        System.out.println(answer);
        return "success";
    }
}
```

VectorStoreDocumentRetriever 从向量数据库检索与输入查询语义相似的文档，支持基于元 [数据过滤](https://so.csdn.net/so/search?q=数据过滤&spm=1001.2101.3001.7020)、相似度阈值和 top-k 结果数量控制。 

默认情况下，RetrievalAugmentationAdvisor 不允许检索到的上下文为空。此时它会指示模型不回答用户查询。

## ContextualQueryAugmenter

RetrievalAugmentationAdvisor 不允许检索到的上下文为空。如果解决该问题可以使用 ContextualQueryAugmenter，利用所提供文档的内容上下文数据增强用户查询。

```java
Advisor retrievalAugmentationAdvisor = RetrievalAugmentationAdvisor.builder()
    .documentRetriever(VectorStoreDocumentRetriever.builder()
            .similarityThreshold(0.50)
            .topK(3)
            .vectorStore(milvusVectorStore)
            .build())
    .queryAugmenter(ContextualQueryAugmenter.builder()
            .allowEmptyContext(true)
            .build())
    .build();
```

查询时，默认的提示词模版信息是英文的，那么如何指定我们的自定义提示词模版呢？

只需要设置 ContextualQueryAugmenter 的 queryTemplate 属性即可。

```java
@GetMapping("/chat2")
public String chat2(String message) {
    // 定义提示词模版
    PromptTemplate customPromptTemplate = PromptTemplate.builder()
            .renderer(StTemplateRenderer.builder().startDelimiterToken('<').endDelimiterToken('>').build())
            .template("""
                    <query>
                    上下文信息如下：
                    ---------------------
                    <context>
                    ---------------------
                    根据上下文信息回答查询。
                    遵循以下规则：
                    1. 如果答案不在上下文中，只需说你不知道。
                    2. 避免使用“根据上下文...”或“提供的信息...”这样的表述。
                    3. 回答问题尽量精简
                             """)
            .build();


    Advisor retrievalAugmentationAdvisor = RetrievalAugmentationAdvisor.builder()
            .documentRetriever(VectorStoreDocumentRetriever.builder()
                    .similarityThreshold(0.50)
                    .topK(3)
                    .vectorStore(milvusVectorStore)
                    .build())
            .queryAugmenter(ContextualQueryAugmenter.builder()
                    .allowEmptyContext(true)
                    .promptTemplate(customPromptTemplate)
                    .build())
            .build();

    String answer = client.prompt()
            .advisors(retrievalAugmentationAdvisor)
            .user(message)
            .call()
            .content();

    System.out.println(answer);
    return "success";
}
```

## RewriteQueryTransformer

RewriteQueryTransformer 利用大语言模型重写用户查询，从而在查询向量数据库或搜索引擎等目标系统时获得更好结果。

当用户查询冗长、含歧义或包含可能影响搜索结果质量的无关信息时，该转换器（Transformer）特别有效

```java
Advisor retrievalAugmentationAdvisor = RetrievalAugmentationAdvisor.builder()
    .documentRetriever(VectorStoreDocumentRetriever.builder()
            .similarityThreshold(0.50)
            .topK(3)
            .vectorStore(milvusVectorStore)
            .build())
    .queryAugmenter(ContextualQueryAugmenter.builder()
            .allowEmptyContext(true)
            .promptTemplate(customPromptTemplate)
            .build())
    .queryTransformers(RewriteQueryTransformer.builder()
            .chatClientBuilder(this.client.mutate())
            .build())
    .build();
```

通过调试 RewriteQueryTransformer 源码，可以看到源码的 transform()方法，将我们的提问先发给大模型，大模型根据提问内容返回重写的查询信息。本例，我们提问的内容是“肚子疼看哪个科室”，大模型给出的重写后的查询为“查找肚子疼对应的科室”。程序内部，根据重写后的内容再次向大模型发送提问。

## 文本分块优化

RAG 时，检索效果的优劣，和文本的分块的情况有很大关系。SpringAI 中通过 TokenTextSplitter 对文本分块。

查看了 TokenTextSplitter 的源码，其进行文本分块的核心代码如下：

```java
protected List<String> doSplit(String text, int chunkSize) {
    if (text != null && !text.trim().isEmpty()) {
        // 将分割的内容转为对应token的列表
        List<Integer> tokens = this.getEncodedTokens(text);
        List<String> chunks = new ArrayList();
        int num_chunks = 0;

        while(!tokens.isEmpty() && num_chunks < this.maxNumChunks) {
            // 根据token列表，按照chunkSize或者token列表长度的最小值进行截取
            List<Integer> chunk = tokens.subList(0, Math.min(chunkSize, tokens.size()));
            // 将token转为字符串
            String chunkText = this.decodeTokens(chunk);
            if (chunkText.trim().isEmpty()) {
                tokens = tokens.subList(chunk.size(), tokens.size());
            } else {
                // 从文本最后开始，获取英文的.!?和换行符的索引
                int lastPunctuation = Math.max(chunkText.lastIndexOf(46), Math.max(chunkText.lastIndexOf(63), Math.max(chunkText.lastIndexOf(33), chunkText.lastIndexOf(10))));
                // 如果索引值不是-1，并且索引大于分块的最小的字符数，对分块内容进行截取
                if (lastPunctuation != -1 && lastPunctuation > this.minChunkSizeChars) {
                    chunkText = chunkText.substring(0, lastPunctuation + 1);
                }
                // 如果keepSeparator是false，将本文中的换行符替换为空格
                String chunkTextToAppend = this.keepSeparator ? chunkText.trim() : chunkText.replace(System.lineSeparator(), " ").trim();
                if (chunkTextToAppend.length() > this.minChunkLengthToEmbed) {
                    // 将分块内容添加到分块列表中
                    chunks.add(chunkTextToAppend);
                }
                // 对原来的token列表进行截取，用于排除已经分块的内容
                tokens = tokens.subList(this.getEncodedTokens(chunkText).size(), tokens.size());
                ++num_chunks;
            }
        }

        if (!tokens.isEmpty()) {
            String remaining_text = this.decodeTokens(tokens).replace(System.lineSeparator(), " ").trim();
            if (remaining_text.length() > this.minChunkLengthToEmbed) {
                chunks.add(remaining_text);
            }
        }

        return chunks;
    } else {
        return new ArrayList();
    }
}
```

1. chunkSize: 每个文本块以 token 为单位的目标大小（默认值：800）。

2. minChunkSizeChars: 每个文本块以字符为单位的最小大小（默认值：350）。

3. minChunkLengthToEmbed: 文本块去除空白字符或者处理分隔符后，用于嵌入处理的文本的最小长度（默认值：5）。

4. maxNumChunks: 从文本生成的最大块数（默认值：10000）。

5. keepSeparator: 是否在块中保留分隔符（例如换行符）（默认值：true）。

TokenTextSplitter 拆分文档的逻辑：

1.使用 CL100K_BASE 编码将输入文本编码为 token 列表

2.根据 chunkSize 对编码后的 token 列表进行截取分块

3.对于分块：

        （1）将 token 分块再解码为文本字符串
    
        （2）尝试从后向前找到一个合适的截断点（默认是英文的句号、问号、感叹号或换行符）。
    
        （3）如果找到合适的截断点，并且截断点所在的 index 大于 minChunkSizeChars，则将在该点截断该块
    
        （4）对分块去除两边的空白字符，并根据 keepSeparator 设置，如果为 false，则移除换行符
    
        （5）如果处理后的分块长度大于 minChunkLengthToEmbed，则将其添加到分块列表中

4.持续执行第 2 步和第 3 步，直到所有 token 都被处理完或达到 maxNumChunks

5.如果还有剩余的 token 没有处理，并且剩余的 token 进行编码和转换处理后，长度大于 minChunkLengthToEmbed，则将其作为最终块添加

源码中，是根据英文的逗号，叹号，问号和换行符进行文本的截取。这显然不太符合中文文档的语法习惯。为此，我们对源码进行修改，增加分割符的列表，用户可以根据文档的中英文情况，自行设置分割符。自定义的分割类代码如下：

```java
public class MyTextSplit extends TextSplitter {
 
    private static final int DEFAULT_CHUNK_SIZE = 800;
    private static final int MIN_CHUNK_SIZE_CHARS = 350;
    private static final int MIN_CHUNK_LENGTH_TO_EMBED = 5;
    private static final int MAX_NUM_CHUNKS = 10000;
    private static final boolean KEEP_SEPARATOR = true;
    private final EncodingRegistry registry;
    private final Encoding encoding;
    private final int chunkSize;
    private final int minChunkSizeChars;
    private final int minChunkLengthToEmbed;
    private final int maxNumChunks;
    private final boolean keepSeparator;
    private final List<String> splitList;
 
    public MyTextSplit() {
        this(800, 350, 5, 10000, true, Arrays.asList(".", "!", "?", "\n"));
    }
 
    public MyTextSplit(boolean keepSeparator) {
        this(800, 350, 5, 10000, keepSeparator, Arrays.asList(".", "!", "?", "\n"));
    }
 
    public MyTextSplit(int chunkSize, int minChunkSizeChars, int minChunkLengthToEmbed, int maxNumChunks, boolean keepSeparator, List<String> splitList) {
        this.registry = Encodings.newLazyEncodingRegistry();
        this.encoding = this.registry.getEncoding(EncodingType.CL100K_BASE);
        this.chunkSize = chunkSize;
        this.minChunkSizeChars = minChunkSizeChars;
        this.minChunkLengthToEmbed = minChunkLengthToEmbed;
        this.maxNumChunks = maxNumChunks;
        this.keepSeparator = keepSeparator;
        if (splitList == null || splitList.isEmpty()) {
            this.splitList = Arrays.asList(".", "!", "?", "\n");
        } else {
            this.splitList = splitList;
        }
    }
 
    protected List<String> splitText(String text) {
        return this.doSplit(text, this.chunkSize);
    }
 
    protected List<String> doSplit(String text, int chunkSize) {
        if (text != null && !text.trim().isEmpty()) {
            List<Integer> tokens = this.getEncodedTokens(text);
            List<String> chunks = new ArrayList();
            int num_chunks = 0;
 
            while (!tokens.isEmpty() && num_chunks < this.maxNumChunks) {
                List<Integer> chunk = tokens.subList(0, Math.min(chunkSize, tokens.size()));
                String chunkText = this.decodeTokens(chunk);
                if (chunkText.trim().isEmpty()) {
                    tokens = tokens.subList(chunk.size(), tokens.size());
                } else {
                    int lastPunctuation = splitList.stream()
                            .mapToInt(chunkText::lastIndexOf)
                            .max().orElse(-1);
                    // 46 .  63 ?  33 !   10换行
                    // int lastPunctuation = Math.max(chunkText.lastIndexOf(46), Math.max(chunkText.lastIndexOf(63), Math.max(chunkText.lastIndexOf(33), chunkText.lastIndexOf(10))));
                    if (lastPunctuation != -1 && lastPunctuation > this.minChunkSizeChars) {
                        chunkText = chunkText.substring(0, lastPunctuation + 1);
                    }
 
                    String chunkTextToAppend = this.keepSeparator ? chunkText.trim() : chunkText.replace(System.lineSeparator(), " ").trim();
                    if (chunkTextToAppend.length() > this.minChunkLengthToEmbed) {
                        chunks.add(chunkTextToAppend);
                    }
 
                    tokens = tokens.subList(this.getEncodedTokens(chunkText).size(), tokens.size());
                    ++num_chunks;
                }
            }
 
            if (!tokens.isEmpty()) {
                String remaining_text = this.decodeTokens(tokens).replace(System.lineSeparator(), " ").trim();
                if (remaining_text.length() > this.minChunkLengthToEmbed) {
                    chunks.add(remaining_text);
                }
            }
            return chunks;
        } else {
            return new ArrayList();
        }
    }
 
    private List<Integer> getEncodedTokens(String text) {
        Assert.notNull(text, "Text must not be null");
        return this.encoding.encode(text).boxed();
    }
 
    private String decodeTokens(List<Integer> tokens) {
        Assert.notNull(tokens, "Tokens must not be null");
        IntArrayList tokensIntArray = new IntArrayList(tokens.size());
        Objects.requireNonNull(tokensIntArray);
        tokens.forEach(tokensIntArray::add);
        return this.encoding.decode(tokensIntArray);
    }
}
```

```java
public void init2() {
    // 读取文本文件
    TextReader textReader = new TextReader(this.resource);
    // 元数据中增加文件名
    textReader.getCustomMetadata().put("filename", "医院.txt");
    // 获取Document对象,只有一个记录
    List<Document> docList = textReader.read();
    // 指定分割符
    List<String> splitList = Arrays.asList("。", "！", "？", System.lineSeparator());
    MyTextSplit splitter = new MyTextSplit(300, 100, 5, 10000, true, splitList);
    List<Document> splitDocuments = splitter.apply(docList);
    System.out.println(splitDocuments);
}
```

另外，根据源码，minChunkSizeChars的值要小于chunkSize的值才有意义。

根据CL100K_BASE编码，300长度的token转为本文内容后，文本内容的长度在220-250之间（根据本例的中文文档测试，实际存在误差），转换比例在70%到80%多，为了根据特定的字符进行分割，所以minChunkSize的值最好小于210。

根据源码的逻辑，分割文本时，可能出现如果分隔符的索引小于minChunkSizeChars，就不会对文本进行分割，于是，就会出现句子被断开的情况。

针对该现象，可以增加分割的字符种类；或者干脆将minChunkSizeChars设置为0（解决方案有点简单粗暴哈O(∩_∩)O哈哈~）；还可以根据分割后的内容，进行手动修改，然后再进行向量化处理。

该代码存在的问题：

使用由于是先转为token列表；再转为字符串后，根据分割符进行截取；截取后转为token，再根据token长度截取token列表，索引多次转换后，使用CL100K_BASE编码会存在一些中文数据的丢失或者乱码情况。

经过测试，可以将编码方式修改为O200K_BASE编码。使用该编码后，中文转换的token列表长度小于文本本身的长度，所以分块时，需要重置chunkSize和minChunkSizeChars的值。

```java
this.encoding = this.registry.getEncoding(EncodingType.O200K_BASE);
```

