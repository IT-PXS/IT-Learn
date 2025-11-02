---
title: MDC链路跟踪
tags:
  - SpringCloud
categories: Java
cover: /img/index/mdc.jpg
top_img: /img/index/mdc.jpg
published: true
abbrlink: 50492
date: 2025-03-10 22:38:34
description: MDC（Mapped Diagnostic Context）链路跟踪用于在分布式系统中维护请求的上下文信息。通过在日志中注入唯一请求ID，MDC可实现日志关联分析，便于问题排查。结合日志框架（如Logback、Log4j）和链路追踪系统（如Sleuth、Zipkin），可提升系统可观测性，优化故障排除效率。
---

## 基本概念
### 什么是链路跟踪？
分布式链路追踪就是将一次分布式请求还原成调用链路，将一次分布式请求的调用情况集中展示，比如各个服务节点上的耗时、请求具体到达哪台机器上、每个服务节点的请求状态等等。

链路跟踪主要功能：

1. 故障快速定位：可以通过调用链结合业务日志快速定位错误信息。
2. 链路性能可视化：各个阶段链路耗时、服务依赖关系可以通过可视化界面展现出来。
3. 链路分析：通过分析链路耗时、服务依赖关系可以得到用户的行为路径，汇总分析应用在很多业务场景。

### 什么是 MDC？

MDC（Mapped Diagnostic Context，映射调试上下文）是 log4j 、logback 及 log4j2 提供的一种方便在多线程条件下记录日志的功能。某些应用程序采用多线程的方式来处理多个用户的请求。在一个用户的使用过程中，可能有多个不同的线程来进行处理。典型的例子是 Web 应用服务器。当用户访问某个页面时，应用服务器可能会创建一个新的线程来处理该请求，也可能从线程池中复用已有的线程。在一个用户的会话存续期间，可能有多个线程处理过该用户的请求。这使得比较难以区分不同用户所对应的日志。当需要追踪某个用户在系统中的相关日志记录时，就会变得很麻烦。

一种解决的办法是采用自定义的日志格式，把用户的信息采用某种方式编码在日志记录中。这种方式的问题在于要求在每个使用日志记录器的类中，都可以访问到用户相关的信息。这样才可能在记录日志时使用。这样的条件通常是比较难以满足的。MDC 的作用是解决这个问题。

MDC 可以看成是一个与当前线程绑定的哈希表，可以往其中添加键值对。MDC 中包含的内容可以被同一线程中执行的代码所访问，当前线程的子线程会继承其父线程中的 MDC 的内容。当需要记录日志时，只需要从 MDC 中获取所需的信息即可。MDC 的内容则由程序在适当的时候保存进去。对于一个 Web 应用来说，通常是在请求被处理的最开始保存这些数据。

### 相关指标
1. traceId：在整个分布式系统中，每个请求都有一个唯一的 traceId。这个 traceId 由链路跟踪系统自动生成，通常以时间戳和其他标识组合而成，以保证其唯一性。

例如：请求经过了服务 A，同时服务 A 又调用了服务 B 和服务 C，但是先调的服务 B 还是服务 C 呢？从图中很难看出来，只有通过查看源码才知道顺序。为了表达这种父子关系引入了 spanId 的概念。

2. spanId：在每个服务中，请求被进一步划分为多个 span，每个 span 都有一个唯一的 spanId。spanId 通常由链路跟踪系统生成，用于标识该 span 在请求中的位置和作用。

同一层级 parent id 相同，span id 不同，span id 从小到大表示请求的顺序

![](MDC链路跟踪/1.png)

3. parentSpanId：这个标识符用于表示当前 span 的父级 span。在一个请求的完整路径中，每个 span 都有一个父级 span，通过 parentSpanId 可以建立 span 之间的层次关系。

![](MDC链路跟踪/2.png)

在自定义业务处理中，如设置 userId，通常在入口处记录 traceId 和 spanId，然后在每个服务调用中传递这些信息。例如，在某个服务中设置 userId 时，可以将其与 traceId 和 spanId 一起记录下来。这样，当出现问题时，可以方便地找到是哪个用户的请求导致了问题。

4. timestamp（调用时间）：把请求发出、接收、处理的时间都记录下来，计算业务处理耗时和网络耗时，然后用可视化界面展示出来每个调用链路，性能，故障

![](MDC链路跟踪/3.png)

+ cs（Client Send）客户端发出请求，开始一个请求的生命周期
+ sr（Server Received）服务端接受到请求开始进行处理， sr－ cs = 网络延迟（服务调用的时间）
+ ss（Server Send）服务端处理完毕准备发送到客户端， ss - sr = 服务器上的请求处理时间
+ cr（Client Reveived）客户端接受到服务端的响应，请求结束。 cr - sr = 请求的总时间

![](MDC链路跟踪/4.png)

## 基本使用

### MDC 使用

#### 日志文件配置

```xml
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-log4j12</artifactId>
    <version>1.7.21</version>
</dependency>
```

log4j.xml 配置样例，追踪日志自定义格式主要在 `name="traceId"` 的 `layout` 里面进行设置，我们使用 `%X{traceId}` 来定义此处会打印 MDC 里面 key 为 traceId 的 value，如果所定义的字段在 MDC 不存在对应的 key，那么将不会打印，会留一个占位符

#### 相关方法

1. clear() ：移除所有 MDC
2. get(String key) ：获取当前线程 MDC 中指定 key 的值
3. getContext() ：获取当前线程的 MDC
4. getCopyOfContextMap()：将 MDC 从内存获取出来，再传给线程
5. put(String key, Object o) ：往当前线程的 MDC 中存入指定的键值对
6. remove(String key) ：删除当前线程 MDC 中指定的键值对
7. setContextMap()：将父线程的 MDC 内容传给子线程

#### 线程间传递

用 MDC 的 put 时，子线程在创建的时候会把父线程中的 inheritableThreadLocals 变量设置到子线程的 inheritableThreadLocals 中，而 MDC 内部是用 InheritableThreadLocal 实现的，所以会把父线程中的上下文带到子线程中，但在线程池中，由于线程会被重用，但是线程本身只会初始化一次，所以之后重用线程的时候，就不会进行初始化操作了，也就不会有父线程 inheritableThreadLocals 拷贝到子线程中的过程了，这个时候如果还想传递父线程的上下文的话，就要使用 getCopyOfContextMap 方法

### SpringBoot 整合

```xml
<!-- Spring Boot Actuator -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<!-- Spring Boot Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- SLF4J MDC -->
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.30</version>
</dependency>
```

#### 配置拦截器

```java
public class LogInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        //如果有上层调用就用上层的 ID
        String traceId = request.getHeader(Constants.TRACE_ID);
        if (traceId == null) {
            traceId = TraceIdUtil.getTraceId();
        }

        MDC.put(Constants.TRACE_ID, traceId);
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView)             throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)             throws Exception {
        //调用结束后删除
        MDC.remove(Constants.TRACE_ID);
    }
}
```

```java
@Configuration
public class WebConfigurerAdapter implements WebMvcConfigurer {

    @Bean
    public LogInterceptor logInterceptor() {
        return new LogInterceptor();
    }

    /**
     * 注册拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(logInterceptor());
    }
}
```

#### 配置日志文件

修改 logback-spring.xml 的日志格式，logback 中也可以使用占位符%X{}来占位，替换到对应的 MDC 中 key 的值，重点是 %X{traceId}，traceId 和 MDC 中的键名称一致

注意：%X{traceId}和 [%trace-id]

```xml
<!-- 控制台输出 -->
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder charset="UTF-8">
        <!-- 输出日志记录格式,并打印 trace-id -->
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%trace-id] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
</appender>
```

### 多线程 traceId 传递

#### 存在问题

子线程在打印日志的过程中 traceId 将丢失，解决方式为重写线程池，对于直接 new 创建线程的情况不考虑【实际应用中应该避免这种用法】，重写线程池无非是对任务进行一次封装。

处理逻辑：

1. 判断当前线程对应 MDC 的 Map 是否存在，存在则设置；
2. 设置 MDC 中的 traceId 值，不存在则新生成，针对不是子线程的情况，如果是子线程，MDC 中 traceId 不为 null；
3. 执行 run 方法。

#### 解决方法

```java
/**
 * 封装 MDC 用于向线程池传递
 */
public class ThreadMdcUtil {
    
    // 设置 MDC 中的 traceId 值，不存在则新生成，针对不是子线程的情况，如果是子线程，MDC 中 traceId 不为 null
    public static void setTraceIdIfAbsent() {
        if (MDC.get(Constants.TRACE_ID) == null) {
            MDC.put(Constants.TRACE_ID, TraceIdUtil.getTraceId());
        }
    }
 
    public static <T> Callable<T> wrap(final Callable<T> callable, final Map<String, String> context) {
        return () -> {
            if (context == null) {
                MDC.clear();
            } else {
                MDC.setContextMap(context);
            }
            setTraceIdIfAbsent();
            try {
                return callable.call();
            } finally {
                // 清除子线程的，避免内存溢出，就和 ThreadLocal.remove()一个原因
                MDC.clear();
            }
        };
    }
 
    public static Runnable wrap(final Runnable runnable, final Map<String, String> context) {
        return () -> {
            if (context == null) {
                MDC.clear();
            } else {
                MDC.setContextMap(context);
            }
            setTraceIdIfAbsent();
            try {
                runnable.run();
            } finally {
                MDC.clear();
            }
        };
    }
}
```

1. 重写线程池方法

```java
public class ThreadPoolExecutorMdcWrapper extends ThreadPoolExecutor {
    public ThreadPoolExecutorMdcWrapper(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit,
                                        BlockingQueue<Runnable> workQueue) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue);
    }
 
    public ThreadPoolExecutorMdcWrapper(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory);
    }
 
    public ThreadPoolExecutorMdcWrapper(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, handler);
    }
 
    public ThreadPoolExecutorMdcWrapper(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler);
    }
 
    @Override
    public void execute(Runnable task) {
        super.execute(ThreadMdcUtil.wrap(task, MDC.getCopyOfContextMap()));
    }
 
    @Override
    public <T> Future<T> submit(Runnable task, T result) {
        return super.submit(ThreadMdcUtil.wrap(task, MDC.getCopyOfContextMap()), result);
    }
 
    @Override
    public <T> Future<T> submit(Callable<T> task) {
        return super.submit(ThreadMdcUtil.wrap(task, MDC.getCopyOfContextMap()));
    }
 
    @Override
    public Future<?> submit(Runnable task) {
        return super.submit(ThreadMdcUtil.wrap(task, MDC.getCopyOfContextMap()));
    }
}
```

2. 使用自定义线程池

```java
@Bean
public ThreadPoolTaskExecutor taskExecutor() {
    ThreadPoolTaskExecutor taskExecutor = new ThreadPoolExecutorMdcWrapper();
    // 核心线程数，默认为 1
    taskExecutor.setCorePoolSize(1);
    // 最大线程数，默认为 Integer.MAX_VALUE
    taskExecutor.setMaxPoolSize(200);
    // 队列最大长度，一般需要设置值 >= notifyScheduledMainExecutor.maxNum；默认为 Integer.MAX_VALUE
    taskExecutor.setQueueCapacity(2000);
    // 线程池维护线程所允许的空闲时间，默认为 60s
    taskExecutor.setKeepAliveSeconds(60);
    // 线程池对拒绝任务（无线程可用）的处理策略
    taskExecutor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
    // 初始化线程池
    taskExecutor.initialize();
    return taskExecutor;
}
```

### HTTP 调用丢失 traceId

在使用 HTTP 调用第三方服务接口时 traceId 将丢失，需要对 HTTP 调用工具进行改造。发送时，在 request header 中添加 traceId，在下层被调用方添加拦截器获取 header 中的 traceId 添加到 MDC 中。

HTTP 调用有多种方式，比较常见的有 HttpClient、OKHttp、RestTemplate，所以只给出这几种 HTTP 调用的解决方式。

#### HttpClient

1. 实现 HttpRequestInterceptor 接口并重写 process 方法。
2. 如果调用线程中含有 traceId，则需要将获取到的 traceId 通过 request 中的 header 向下透传下去。
3. 为 HttpClient 添加拦截器

```java
public class HttpClientTraceIdInterceptor implements HttpRequestInterceptor {
    @Override
    public void process(HttpRequest httpRequest, HttpContext httpContext) throws HttpException, IOException {
        String traceId = MDC.get(Constants.TRACE_ID);
        //当前线程调用中有 traceId，则将该 traceId 进行透传
        if (traceId != null) {
            //添加请求体
            httpRequest.addHeader(Constants.TRACE_ID, traceId);
        }
    }
}
```

```java
private static CloseableHttpClient httpClient = HttpClientBuilder.create()
            .addInterceptorFirst(new HttpClientTraceIdInterceptor())
            .build();
```

#### OkHttp
```java
public class OkHttpTraceIdInterceptor implements Interceptor {
    @Override
    public Response intercept(Chain chain) throws IOException {
        String traceId = MDC.get(Constants.TRACE_ID);
        Request request = null;
        if (traceId != null) {
            //添加请求体
            request = chain.request().newBuilder().addHeader(Constants.TRACE_ID, traceId).build();
        }
        Response originResponse = chain.proceed(request);
        return originResponse;
    }
}
```

```java
private static OkHttpClient client = new OkHttpClient.Builder()
        .addNetworkInterceptor(new OkHttpTraceIdInterceptor())
        .build();
```

#### RestTemplate
```java
public class RestTemplateTraceIdInterceptor implements ClientHttpRequestInterceptor {
    @Override
    public ClientHttpResponse intercept(HttpRequest httpRequest, byte[] bytes, ClientHttpRequestExecution clientHttpRequestExecution) throws IOException {
        String traceId = MDC.get(Constants.TRACE_ID);
        if (traceId != null) {
            httpRequest.getHeaders().add(Constants.TRACE_ID, traceId);
        }
        return clientHttpRequestExecution.execute(httpRequest, bytes);
    }
}
```

```java
restTemplate.setInterceptors(Arrays.asList(new RestTemplateTraceIdInterceptor()));
```

#### 第三方服务拦截器
HTTP 调用第三方服务接口全流程 traceId 需要第三方服务配合，第三方服务需要添加拦截器拿到 request header 中的 traceId 并添加到 MDC 中

```java
public class LogInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        //如果有上层调用就用上层的 ID
        String traceId = request.getHeader(Constants.TRACE_ID);
        if (traceId == null) {
            traceId = TraceIdUtils.getTraceId();
        }
        
        MDC.put("traceId", traceId);
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView)             throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)             throws Exception {
        MDC.remove(Constants.TRACE_ID);
    }
}
```

