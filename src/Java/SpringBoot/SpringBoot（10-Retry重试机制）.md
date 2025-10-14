---
title: SpringBoot（10-Retry重试机制）
tag:
  - SpringBoot
category: Java
description: Spring Retry 提供了一种灵活的重试机制，可在方法调用失败时自动重试，适用于远程调用、数据库操作等场景。其支持注解与编程式方式，结合回避策略（如指数退避）、最大重试次数及回调机制，提高系统的稳定性与容错能力。
date: 2025-05-08 12:42:19
---

## 使用背景

在调用第三方接口或者使用 MQ 时，会出现网络抖动、连接超时等网络异常，所以需要重试。为了使处理更加健壮并且不太容易出现故障，后续的尝试操作，有时候会帮助失败的操作最后执行成功。一般情况下，需要我们自行实现重试机制

## 使用案例

### 基本使用

```xml
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
```

```java
@SpringBootApplication
// 开启重试机制
@EnableRetry
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

```java
@Service
@Slf4j
public class DoRetryService {

    @Retryable(value = Exception.class, maxAttempts = 4, backoff = @Backoff(delay = 2000L, multiplier = 1.5))
    public boolean doRetry(boolean isRetry) throws Exception {
        log.info("开始通知下游系统");
        if (isRetry) {
            throw new RuntimeException("通知下游系统异常");
        }
        return true;
    }
}
```

### 配置文件获取参数

1. 在 `application.properties` 文件中定义属性

```properties
retry.maxAttempts=2 # 最大尝试次数
retry.maxDelay=100 # 延迟
```

2. 在 `@Retryable` 注入 Properties 文件中定义的 `retry.maxAttempts` 和 `retry.maxDelay`

```java
@Service 
public class MyService {

    @Retryable(retryFor = SQLException.class, maxAttemptsExpression = "${retry.maxAttempts}", backoff = @Backoff(delayExpression = "${retry.maxDelay}")) 
    public void retryServiceWithExternalConfiguration(String sql) throws SQLException {
        // ...
    }
}
```

## 相关注解

### @Retryable

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Retryable {
    String interceptor() default "";

    Class<? extends Throwable>[] value() default {};

    Class<? extends Throwable>[] include() default {};

    Class<? extends Throwable>[] exclude() default {};

    String label() default "";

    boolean stateful() default false;

    int maxAttempts() default 3;

    String maxAttemptsExpression() default "";

    Backoff backoff() default @Backoff;

    String exceptionExpression() default "";

    String[] listeners() default {};
}
```

用于标记当前方法会使用重试机制

参数信息：

1. interceptor：将 interceptor 的 bean 名称应用到 retryable()，和其他的属性互斥
2. value：可重试的异常类型，抛出指定异常才会重试
3. include：哪些异常可以触发重试，和 value 一样，默认为空
4. exclude：哪些异常将不会触发重试，默认为空，如果和 include 属性同时为空，则所有的异常都将会触发重试
5. label：统计报告的唯—标签。如果没有提供，调用者可以选择忽略它，或者提供默认值
6. maxAttempts：最大重试次数，默认 3 次（包括第一次调用）
7. backoff：重试等待策略，默认使用@Backoff

**Retry 配置的优先级规则**

1. 方法级别配置：如果某个配置在方法上定义了，则该方法上的配置会覆盖类级别的配置和全局配置。
2. 类级别配置：如果某个配置在类上定义了，并且该类的方法没有单独定义配置，则使用类级别的配置。

```java
@Service
@Retryable(
    value = {RuntimeException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000) // 类级别的配置
)
public class MyService {

    @Retryable(
        value = {RuntimeException.class},
        maxAttempts = 5,
        backoff = @Backoff(delay = 500) // 方法级别的配置
    )
    public void retryableMethodWithSpecificConfig() {
        System.out.println("Retrying with specific config...");
        throw new RuntimeException("Simulated exception");
    }

    @Retryable(
        value = {RuntimeException.class}
    )
    public void retryableMethodWithoutSpecificDelay() {
        System.out.println("Retrying without specific delay...");
        throw new RuntimeException("Simulated exception");
    }

    public void nonRetryableMethod() {
        System.out.println("This method does not retry.");
        throw new RuntimeException("Simulated exception");
    }
}
```

3. 全局配置：如果没有在方法或类上定义配置，则使用全局配置。（例如：定义 RetryTemplate 配置类）

### @Backoff

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Backoff {
    long value() default 1000L;

    long delay() default 0L;

    long maxDelay() default 0L;

    double multiplier() default 0.0;

    String delayExpression() default "";

    String maxDelayExpression() default "";

    String multiplierExpression() default "";

    boolean random() default false;
}
```

重试回退策略（立即重试还是等待一会再重试）

参数信息：

1. value：隔多少毫秒后重试，默认为 1000L
2. delay：和 value 一样，但是默认为 0
3. maxDelay：重试之间的最大等待时间（以毫秒为单位）
4. multiplier（指定延迟倍数）：默认为 0，表示固定暂停 1 秒后进行重试，如果把 multiplier 设置为 1.5，则第一次重试为 2 秒，第二次为 3 秒，第三次为 4.5 秒
5. delayExpression：重试之间的等待时间表达式
6. maxDelayExpression：重试之间的最大等待时间表达式
7. multiplierExpression：指定延迟的倍数表达式
8. random：随机指定延迟时间

### @Recover

当重试次数耗尽时，RetryOperations 可以将控制传递给另一个回调，即 RecoveryCallback。`@Recover` 用于 `@Retryable` 重试失败后处理方法，此方法里的异常一定要是 `@Retryable` 方法里抛出的异常，否则不会调用这个方法

```java
@Service
@Slf4j
public class DoRetryService {

    @Retryable(value = Exception.class, maxAttempts = 4, backoff = @Backoff(delay = 2000L, multiplier = 1.5))
    public boolean doRetry(boolean isRetry) throws Exception {
        log.info("开始通知下游系统");
        if (isRetry) {
            throw new RuntimeException("通知下游系统异常");
        }
        return true;
    }
    
    /**
     * Spring-Retry还提供了@Recover注解，用于@Retryable重试失败后处理方法。
     * 如果不需要回调方法，可以直接不写回调方法，那么实现的效果是，重试次数完了后，如果还是没成功没符合业务判断，就抛出异常。
     * @Recover标记方法必须要与@Retryable注解的方法“形参”保持一致，第一入参为要重试的异常(一定要是@Retryable方法里抛出的异常或者异常父类)，其他参数与@Retryable保持一致，返回值也要一样，否则无法执行！
     * @Retryable注解的原方法参数，可以保留，也可以不要。
     */
    @Recover
    public boolean doRecover(Throwable e, boolean isRetry) throws ArithmeticException {
        log.info("全部重试失败，执行doRecover");
        return false;
    }
}
```

**注意**

1. 方法的返回值必须与 `@Retryable` 方法一致
2. 方法的第一个参数，必须是 Throwable 类型的，建议是与 `@Retryable` 配置的异常一致，其余的参数需要与 `@Retryable` 方法的参数一致
3. 回调方法和重试方法写在同一个实现类里面，且被 `@Retryable` 标记的方法不能有返回值，这样 Recover 方法才会生效

**@Recover 不生效问题**

1. 对于 `@EnableRetry` 中的 proxyTargetClass 参数，是控制是否对使用接口实现的 bean 开启代理类，默认下是不开启的
2. 当使用接口实现的 bean 时，需要将 EnableRetry 的参数改为 true，非接口的实现类可以使用
3. 由于 retry 用到了 aspect 增强，所有会有 aspect 的坑，就是方法内部调用，会使 aspect 增强失效，那么 retry 当然也会失效

```java
public class demo {
    public void A() {
        B();
    }

    // 方法内部条用，这里B不会执行
    @Retryable(Exception.class)
    public void B() {
        throw new RuntimeException("retry...");
    }
}
```

## RetryTemplate

### RetryOperations

```java
public interface RetryOperations {

    <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback) throws E;

    <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback, RecoveryCallback<T> recoveryCallback) throws E;

    <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback, RetryState retryState) throws E, ExhaustedRetryException;

    <T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback, RecoveryCallback<T> recoveryCallback, RetryState retryState) throws E;
}
```

### RetryCallback

允许插入需要在失败时重试的业务逻辑

```java
public interface RetryCallback<T, E extends Throwable> {

    T doWithRetry(RetryContext context) throws E;
}
```

### RetryPolicy 重试策略

1. NeverRetryPolicy：只允许调用 RetryCallback 一次，不允许重试
2. AlwaysRetryPolicy：允许无限重试，直到成功
3. SimpleRetryPolicy（默认策略）：固定次数重试策略，默认重试最大次数为 3 次
4. TimeoutRetryPolicy：超时时间重试策略，默认超时时间为 1 秒，在指定的时间内允许重试
5. CircuitBreakerRetryPolicy：有熔断功能的重试策略，需设置 3 个参数 openTimeout、resetTimeout 和 delegate
6. CompositeRetryPolicy：组合重试策略，但不管哪种组合方式，组合中的每一个策略都会执行

- 乐观组合重试策略：只要有一个策略允许重试即可以
- 悲观组合重试策略：只要有一个策略不允许重试即不可以

### BackOffPolicy 退避策略

| 策略类                         | 描述                                               |
| ------------------------------ | -------------------------------------------------- |
| FixedBackOffPolicy             | 间隔固定时间重试，直接 Thread.sleep 固定时间       |
| NoBackOffPolicy                | 无等待，立马重试                                   |
| UniformRandomBackOffPolicy     | 在一个设置的时间区间内。随机等待后重试             |
| ExponentialBackOffPolicy       | 在一个设置的时间区间内，等待时长为上一次时长的递增 |
| ExponentialRandomBackOffPolicy | 乘数随机的 ExponentialBackOffPolicy                |

### 基本使用

```java
@Configuration
public class RetryConfig {
    
    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        // 设置延迟策略
        FixedBackOffPolicy fixedBackOffPolicy = new FixedBackOffPolicy();
        fixedBackOffPolicy.setBackOffPeriod(2000l);
        retryTemplate.setBackOffPolicy(fixedBackOffPolicy);

        // 设置重试策略
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(2);
        retryTemplate.setRetryPolicy(retryPolicy);

        return retryTemplate;
    }
}
```

调用 retryTemplate.execute() 方法来运行带有重试处理功能的代码

```java
retryTemplate.execute(new RetryCallback<Void, RuntimeException>() {
    @Override
    public Void doWithRetry(RetryContext arg0) {
        myService.templateRetryService();
        //...
    }
});
```

可以通过 setRetryPolicy()方法来为 RetryTemplate 设置重试策略

## 监听器

Listener（监听器）会在重试时提供额外的回调，可以利用这些回调处理不同重试中的各种横切关注点（cross-cutting concerns）。

### 添加回调

```java
public class DefaultListenerSupport extends RetryListenerSupport {
    
    @Override
    public <T, E extends Throwable> void close(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
        logger.info("onClose");
        //...
        super.close(context, callback, throwable);
    }

    @Override
    public <T, E extends Throwable> void onError(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
        logger.info("onError"); 
        //...
        super.onError(context, callback, throwable);
    }

    @Override
    public <T, E extends Throwable> boolean open(RetryContext context, RetryCallback<T, E> callback) {
        logger.info("onOpen");
        //...
        return super.open(context, callback);
    }
}
```

open 和 close 回调在整个重试前后进行，而 onError 则适用于单个 RetryCallback 调用。

### 注册监听器

向 RetryTemplate 实例化的 Bean 注册监听器（DefaultListenerSupport）

```java
@Configuration
public class RetryConfig {

    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();
        //...
        retryTemplate.registerListener(new DefaultListenerSupport());
        return retryTemplate;
    }
}
```

### 基本使用

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = AppConfig.class, loader = AnnotationConfigContextLoader.class)
public class SpringRetryIntegrationTest {

    @Autowired
    private MyService myService;

    @Autowired
    private RetryTemplate retryTemplate;

    @Test(expected = RuntimeException.class)
    public void test() {
        retryTemplate.execute(arg0 -> {
            myService.templateRetryService();
            return null;
        });
    }
}
```

## 实现原理

1. 使用@EnableRetry 注解后会导入 RetryConfiguration 配置类

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@EnableAspectJAutoProxy(proxyTargetClass = false)
@Import(RetryConfiguration.class)
@Documented
public @interface EnableRetry {

    boolean proxyTargetClass() default false;
}
```

2. RetryConfiguration 通过 init()方法构建切点和通知

* buildPointcut 构建切点：切点类型为使用 Retryable 注解的类或方法（`org.springframework.retry.annotation.RetryConfiguration.AnnotationClassOrMethodPointcut`）
* buildAdvice 构建通知：创建通知 （`org.springframework.retry.annotation.AnnotationAwareRetryOperationsInterceptor`）

```java
@Configuration
public class RetryConfiguration extends AbstractPointcutAdvisor implements IntroductionAdvisor, BeanFactoryAware {
    
    private Advice advice;

    private Pointcut pointcut;

    @Autowired(required = false)
    private RetryContextCache retryContextCache;

    @Autowired(required = false)
    private List<RetryListener> retryListeners;

    @Autowired(required = false)
    private MethodArgumentsKeyGenerator methodArgumentsKeyGenerator;

    @Autowired(required = false)
    private NewMethodArgumentsIdentifier newMethodArgumentsIdentifier;

    @Autowired(required = false)
    private Sleeper sleeper;

    private BeanFactory beanFactory;

    @PostConstruct
    public void init() {
        Set<Class<? extends Annotation>> retryableAnnotationTypes = new LinkedHashSet<Class<? extends Annotation>>(1);
        retryableAnnotationTypes.add(Retryable.class);
        this.pointcut = buildPointcut(retryableAnnotationTypes);
        this.advice = buildAdvice();
        if (this.advice instanceof BeanFactoryAware) {
            ((BeanFactoryAware) this.advice).setBeanFactory(beanFactory);
        }
    }

    protected Advice buildAdvice() {
        AnnotationAwareRetryOperationsInterceptor interceptor = new AnnotationAwareRetryOperationsInterceptor();
        if (retryContextCache != null) {
            interceptor.setRetryContextCache(retryContextCache);
        }
        if (retryListeners != null) {
            interceptor.setListeners(retryListeners);
        }
        if (methodArgumentsKeyGenerator != null) {
            interceptor.setKeyGenerator(methodArgumentsKeyGenerator);
        }
        if (newMethodArgumentsIdentifier != null) {
            interceptor.setNewItemIdentifier(newMethodArgumentsIdentifier);
        }
        if (sleeper != null) {
            interceptor.setSleeper(sleeper);
        }
        return interceptor;
    }

    // ....
}
```

3. 切面方法拦截器 `AnnotationAwareRetryOperationsInterceptor` 会拦截目标方法，查找方法上是否有 `@Retryable` 注解

* 如果存在方法拦截器委派者，调用委派者 invoke 方法
* 否则直接调用目标方法，即：不具备可重试功能

```java
public class AnnotationAwareRetryOperationsInterceptor implements IntroductionInterceptor, BeanFactoryAware {
    // ....

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        MethodInterceptor delegate = getDelegate(invocation.getThis(), invocation.getMethod());
        if (delegate != null) {
            // 调用委派者invoke方法
            return delegate.invoke(invocation);
        }
        else {
            // 直接调用目标方法
            return invocation.proceed();
        }
    }

    private MethodInterceptor getDelegate(Object target, Method method) {
        if (!this.delegates.containsKey(target) || !this.delegates.get(target).containsKey(method)) {
            synchronized (this.delegates) {
                if (!this.delegates.containsKey(target)) {
                    this.delegates.put(target, new HashMap<Method, MethodInterceptor>());
                }
                Map<Method, MethodInterceptor> delegatesForTarget = this.delegates.get(target);
                if (!delegatesForTarget.containsKey(method)) {
                    // 1. 获取目标方法上的Retryable注解
                    Retryable retryable = AnnotationUtils.findAnnotation(method, Retryable.class);
                    if (retryable == null) {
                        // 2. 目标方法不存在Retryable注解，降级查找目标方法声明类上的Retryable注解
                        retryable = AnnotationUtils.findAnnotation(method.getDeclaringClass(), Retryable.class);
                    }
                    if (retryable == null) {
                        // 3. 方法、声明类均没有Retryable注解，降级从target目标实例中获取同方法名、同方法入参类型的方法上的Retryable注解
                        retryable = findAnnotationOnTarget(target, method);
                    }
                    // 4.依然不存在则为方法缓存委派者为null，即降级直接调用目标方法，不具备可重试功能。
                    if (retryable == null) {
                        return delegatesForTarget.put(method, null);
                    }
                    MethodInterceptor delegate;
                    if (StringUtils.hasText(retryable.interceptor())) {
                        // 5. 如果Retryable注解指定了方法拦截器，使用自定义方法拦截器拦截目标方法
                        delegate = this.beanFactory.getBean(retryable.interceptor(), MethodInterceptor.class);
                    }
                    else if (retryable.stateful()) {
                        delegate = getStatefulInterceptor(target, method, retryable);
                    }
                    else {
                        delegate = getStatelessInterceptor(target, method, retryable);
                    }
                    delegatesForTarget.put(method, delegate);
                }
            }
        }
        return this.delegates.get(target).get(method);
    }

    private Retryable findAnnotationOnTarget(Object target, Method method) {
        try {
            Method targetMethod = target.getClass().getMethod(method.getName(), method.getParameterTypes());
            Retryable retryable = AnnotationUtils.findAnnotation(targetMethod, Retryable.class);
            if (retryable == null) {
                retryable = AnnotationUtils.findAnnotation(targetMethod.getDeclaringClass(), Retryable.class);
            }

            return retryable;
        }
        catch (Exception e) {
            return null;
        }
    }

    private MethodInterceptor getStatelessInterceptor(Object target, Method method, Retryable retryable) {
        RetryTemplate template = createTemplate(retryable.listeners());
        template.setRetryPolicy(getRetryPolicy(retryable));
        template.setBackOffPolicy(getBackoffPolicy(retryable.backoff()));
        return RetryInterceptorBuilder.stateless()
                .retryOperations(template)
                .label(retryable.label())
                .recoverer(getRecoverer(target, method))
                .build();
    }

    private MethodInterceptor getStatefulInterceptor(Object target, Method method, Retryable retryable) {
        // 1. 创建重试模板类
        RetryTemplate template = createTemplate(retryable.listeners());
        template.setRetryContextCache(this.retryContextCache);
        // 2. 获取方法的环路打断器注解
        CircuitBreaker circuit = AnnotationUtils.findAnnotation(method, CircuitBreaker.class);
        if (circuit!=null) {
            // 3. 根据环路打断器注解获取重试策略：a. ExpressionRetryPolicy。b. SimpleRetryPolicy
            RetryPolicy policy = getRetryPolicy(circuit);
            // 4. 环路打断器重试策略包装原注解配置的重试策略
            CircuitBreakerRetryPolicy breaker = new CircuitBreakerRetryPolicy(policy);
            breaker.setOpenTimeout(getOpenTimeout(circuit));
            breaker.setResetTimeout(getResetTimeout(circuit));
            template.setRetryPolicy(breaker);
            // 无backoff策略，即立马重试
            template.setBackOffPolicy(new NoBackOffPolicy());
            String label = circuit.label();
            if (!StringUtils.hasText(label))  {
                label = method.toGenericString();
            }
            // 5. 根据配置构建并返回重试拦截器，底层实际使用的是StatefulRetryOperationsInterceptor
            // 拦截器，区别主要是重试策略在原基础上增加了CircuitBreakerRetryPolicy包装，及无backoff策略
            return RetryInterceptorBuilder.circuitBreaker()
                    .keyGenerator(new FixedKeyGenerator("circuit"))
                    .retryOperations(template)
                    .recoverer(getRecoverer(target, method))
                    .label(label)
                    .build();
        }
        // 6. 如果不存在环路打断器则走原注解配置的重试策略：表达式重试策略，简单重试策略
        RetryPolicy policy = getRetryPolicy(retryable);
        template.setRetryPolicy(policy);
        // 7. 根据注解配置设置backoff策略
        template.setBackOffPolicy(getBackoffPolicy(retryable.backoff()));
        String label = retryable.label();
        return RetryInterceptorBuilder.stateful()
                .keyGenerator(this.methodArgumentsKeyGenerator)
                .newMethodArgumentsIdentifier(this.newMethodArgumentsIdentifier)
                .retryOperations(template)
                .label(label)
                .recoverer(getRecoverer(target, method))
                .build();
    }

    // .....
}
```

4. `RetryOperationsInterceptor` 或 `StatefulRetryOperationsInterceptor` 拦截器进行拦截

```java
public class RetryOperationsInterceptor implements MethodInterceptor {
    // ....

    public Object invoke(final MethodInvocation invocation) throws Throwable {
        String name;
        if (StringUtils.hasText(label)) {
            name = label;
        } else {
            name = invocation.getMethod().toGenericString();
        }
        final String label = name;
        RetryCallback<Object, Throwable> retryCallback = new RetryCallback<Object, Throwable>() {
            public Object doWithRetry(RetryContext context) throws Exception {
                context.setAttribute(RetryContext.NAME, label);
                if (invocation instanceof ProxyMethodInvocation) {
                    try {
                        return ((ProxyMethodInvocation) invocation).invocableClone().proceed();
                    }
                    catch (Exception e) {
                        throw e;
                    }
                    catch (Error e) {
                        throw e;
                    }
                    catch (Throwable e) {
                        throw new IllegalStateException(e);
                    }
                }
                else {
                    throw new IllegalStateException(
                            "MethodInvocation of the wrong type detected - this should not happen with Spring AOP, " +
                                    "so please raise an issue if you see this exception");
                }
            }
        };
        if (recoverer != null) {
            ItemRecovererCallback recoveryCallback = new ItemRecovererCallback(
                    invocation.getArguments(), recoverer);
            return this.retryOperations.execute(retryCallback, recoveryCallback);
        }
        return this.retryOperations.execute(retryCallback);
    }

    // ...
}
```

5. 调用 RetryTemplate 重试模板类进行重试

```java
public class RetryTemplate implements RetryOperations {
    // ....

    protected <T, E extends Throwable> T doExecute(RetryCallback<T, E> retryCallback,
            RecoveryCallback<T> recoveryCallback, RetryState state)
            throws E, ExhaustedRetryException {
        RetryPolicy retryPolicy = this.retryPolicy;
        BackOffPolicy backOffPolicy = this.backOffPolicy;

        RetryContext context = open(retryPolicy, state);
        if (this.logger.isTraceEnabled()) {
            this.logger.trace("RetryContext retrieved: " + context);
        }
        RetrySynchronizationManager.register(context);
        Throwable lastException = null;
        boolean exhausted = false;
        try {
            boolean running = doOpenInterceptors(retryCallback, context);
            if (!running) {
                throw new TerminatedRetryException(
                        "Retry terminated abnormally by interceptor before first attempt");
            }
            BackOffContext backOffContext = null;
            Object resource = context.getAttribute("backOffContext");
            if (resource instanceof BackOffContext) {
                backOffContext = (BackOffContext) resource;
            }
            if (backOffContext == null) {
                backOffContext = backOffPolicy.start(context);
                if (backOffContext != null) {
                    context.setAttribute("backOffContext", backOffContext);
                }
            }
            while (canRetry(retryPolicy, context) && !context.isExhaustedOnly()) {
                try {
                    if (this.logger.isDebugEnabled()) {
                        this.logger.debug("Retry: count=" + context.getRetryCount());
                    }
                    lastException = null;
                    return retryCallback.doWithRetry(context);
                }
                catch (Throwable e) {
                    lastException = e;
                    try {
                        registerThrowable(retryPolicy, state, context, e);
                    }
                    catch (Exception ex) {
                        throw new TerminatedRetryException("Could not register throwable",
                                ex);
                    }
                    finally {
                        doOnErrorInterceptors(retryCallback, context, e);
                    }

                    if (canRetry(retryPolicy, context) && !context.isExhaustedOnly()) {
                        try {
                            backOffPolicy.backOff(backOffContext);
                        }
                        catch (BackOffInterruptedException ex) {
                            lastException = e;
                            if (this.logger.isDebugEnabled()) {
                                this.logger
                                        .debug("Abort retry because interrupted: count="
                                                + context.getRetryCount());
                            }
                            throw ex;
                        }
                    }
                    if (this.logger.isDebugEnabled()) {
                        this.logger.debug(
                                "Checking for rethrow: count=" + context.getRetryCount());
                    }
                    if (shouldRethrow(retryPolicy, context, state)) {
                        if (this.logger.isDebugEnabled()) {
                            this.logger.debug("Rethrow in retry for policy: count="
                                    + context.getRetryCount());
                        }
                        throw RetryTemplate.<E>wrapIfNecessary(e);
                    }
                }
                if (state != null && context.hasAttribute(GLOBAL_STATE)) {
                    break;
                }
            }
            if (state == null && this.logger.isDebugEnabled()) {
                this.logger.debug(
                        "Retry failed last attempt: count=" + context.getRetryCount());
            }
            exhausted = true;
            return handleRetryExhausted(recoveryCallback, context, state);
        }
        catch (Throwable e) {
            throw RetryTemplate.<E>wrapIfNecessary(e);
        }
        finally {
            close(retryPolicy, context, state, lastException == null || exhausted);
            doCloseInterceptors(retryCallback, context, lastException);
            RetrySynchronizationManager.clear();
        }
    }
}
```

6. 通过 RetryPolicy 的实现类判断是否进行重试

* SimpleRetryPolicy 重试策略

```java
public class SimpleRetryPolicy implements RetryPolicy {
    // .....

    @Override
    public boolean canRetry(RetryContext context) {
        Throwable t = context.getLastThrowable();
        return (t == null || retryForException(t)) && context.getRetryCount() < maxAttempts;
    }

    // .....
}
```

