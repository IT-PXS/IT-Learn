---
title: SpringBoot（8-事务监听器）
tags:
  - SpringBoot
categories: Java
cover: /img/index/springboot.jpg
top_img: /img/index/springboot.jpg
description: SpringBoot 事务监听器利用 TransactionSynchronization 或 @TransactionalEventListener 监听事务状态，实现事务提交后执行异步任务、日志记录等操作。支持 AFTER_COMMIT、BEFORE_COMMIT、AFTER_ROLLBACK 等阶段，提高数据一致性和扩展性，适用于订单处理、积分结算等业务场景。
published: true
abbrlink: 51290
date: 2025-03-24 12:42:19
---

## 使用背景

当在完成某些数据的入库后，发布了一个事件，此时使用的是@EventListener，然后在这个事件中又去对刚才入库的数据进行查询，从而完成后续的操作。例如：（数据入库 => 对入库数据进行查询审核），这时候会发现，查询不到刚才入库的数据，这是因为事务还没提交完成，在同一个事务当中，查询不到才存入的数据，那么就引出了下面的解决方式

1. @TransactionalEventListener
2. 事务同步管理器 TransactionSynchronizationManager

## 注解属性

```java
@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@EventListener //有类似于注解继承的效果
public @interface TransactionalEventListener {
	// 这个注解取值有：BEFORE_COMMIT、AFTER_COMMIT、AFTER_ROLLBACK、AFTER_COMPLETION
	// 各个值都代表什么意思表达什么功能，非常清晰，下面解释了对应的枚举类~
	// 需要注意的是：AFTER_COMMIT + AFTER_COMPLETION 是可以同时生效的
	// AFTER_ROLLBACK + AFTER_COMPLETION 是可以同时生效的
	TransactionPhase phase() default TransactionPhase.AFTER_COMMIT;

	// 表明若没有事务的时候，对应的 event 是否需要执行，默认值为 false 表示，没事务就不执行了。
	boolean fallbackExecution() default false;

	// 这里巧妙的用到了@AliasFor 的能力，放到了@EventListener 身上
	// 注意：一般建议都需要指定此值，否则默认可以处理所有类型的事件，范围太广了。
	@AliasFor(annotation = EventListener.class, attribute = "classes")
	Class<?>[] value() default {};
	@AliasFor(annotation = EventListener.class, attribute = "classes")
	Class<?>[] classes() default {};
	
	String condition() default "";
}
```

```java
public enum TransactionPhase {
    // 指定目标方法在事务 commit 之前执行
    BEFORE_COMMIT,
    
    // 指定目标方法在事务 commit 之后执行
    AFTER_COMMIT,
    
    // 指定目标方法在事务 rollback 之后执行
    AFTER_ROLLBACK,
    
    // 指定目标方法在事务完成时执行，这里的完成是指无论事务是成功提交还是事务回滚了
    AFTER_COMPLETION
}
```

## 基本使用

```java
@Slf4j
@Service
public class HelloServiceImpl implements HelloService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private ApplicationEventPublisher applicationEventPublisher;

    @Transactional
    @Override
    public Object hello(Integer id) {
        // 向数据库插入一条记录
        String sql = "insert into user (id,name,age) values (" + id + ",'fsx',21)";
        jdbcTemplate.update(sql);

        // 发布一个自定义的事件~~~
        applicationEventPublisher.publishEvent(new MyAfterTransactionEvent("我是和事务相关的事件，请事务提交后执行我~~~", id));
        return "service hello";
    }

    @Slf4j
    @Component
    private static class MyTransactionListener {
        @Autowired
        private JdbcTemplate jdbcTemplate;

        @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
        private void onHelloEvent(HelloServiceImpl.MyAfterTransactionEvent event) {
            Object source = event.getSource();
            Integer id = event.getId();

            String query = "select count(1) from user where id = " + id;
            Integer count = jdbcTemplate.queryForObject(query, Integer.class);
            
            // 可以看到 这里的 count 是 1  它肯定是在上面事务提交之后才会执行的
            log.info(source + ":" + count.toString()); //我是和事务相关的事件，请事务提交后执行我~~~: 1
        }
    }


    // 定一个事件，继承自 ApplicationEvent 
    private static class MyAfterTransactionEvent extends ApplicationEvent {
        private Integer id;

        public MyAfterTransactionEvent(Object source, Integer id) {
            super(source);
            this.id = id;
        }

        public Integer getId() {
            return id;
        }
    }
}
```

## 实现原理

Spring 对事务监控的处理逻辑是在 TransactionSynchronization

```java
public interface TransactionSynchronization extends Ordered, Flushable {
    int STATUS_COMMITTED = 0;
    int STATUS_ROLLED_BACK = 1;
    int STATUS_UNKNOWN = 2;

    default int getOrder() {
        return Integer.MAX_VALUE;
    }

    // 在当前事务挂起时执行
    default void suspend() {
    }
    
    // 在当前事务重新加载时执行
    default void resume() {
    }
    
    // 在当前数据刷新到数据库时执行
    default void flush() {
    }
    
    // 在当前事务 commit 之前执行
    default void beforeCommit(boolean readOnly) {
    }
    
    // 在当前事务 completion 之前执行
    default void beforeCompletion() {
    }

    // 在当前事务 commit 之后实质性
    default void afterCommit() {
    }
    
    // 在当前事务 completion 之后执行
    default void afterCompletion(int status) {
    }
}
```

Spring 会注册一个 TransactionalEventListenerFactory 类型的 bean 到 Spring 容器中，TransactionalEventListenerFactory 实现了 EventListenerFactory 接口，主要作用是先判断目标方法是否是某个监听器的类型，然后为目标方法生成一个监听器，会在某个 bean 初始化之后由 Spring 调用其方法用于生成监听器

```java
public class TransactionalEventListenerFactory implements EventListenerFactory, Ordered {

    // 指定当前监听器的顺序
    private int order = 50;
    
    public void setOrder(int order) {
        this.order = order;
    }
    
    @Override
    public int getOrder() {
        return this.order;
    }

    // 指定目标方法是否是所支持的监听器的类型，这里的判断逻辑就是如果目标方法上包含有
    // TransactionalEventListener 注解，则说明其是一个事务事件监听器
    @Override
    public boolean supportsMethod(Method method) {
        return (AnnotationUtils.findAnnotation(method, TransactionalEventListener.class) != null);
    }
    
    // 为目标方法生成一个事务事件监听器，这里 ApplicationListenerMethodTransactionalAdapter 实现了
    // ApplicationEvent 接口
    @Override
    public ApplicationListener<?> createApplicationListener(String beanName, Class<?> type, Method method) {
        return new ApplicationListenerMethodTransactionalAdapter(beanName, type, method);
    }
}
```

TransactionalApplicationListenerMethodAdapter 在监听到发布的事件之后会生成一个 TransactionSynchronization 对象，并且将该对象注册到当前事务逻辑中

```java
public class TransactionalApplicationListenerMethodAdapter extends ApplicationListenerMethodAdapter implements TransactionalApplicationListener<ApplicationEvent> {
    private final TransactionalEventListener annotation;
    private final TransactionPhase transactionPhase;
    private final List<TransactionalApplicationListener.SynchronizationCallback> callbacks = new CopyOnWriteArrayList();

    public TransactionalApplicationListenerMethodAdapter(String beanName, Class<?> targetClass, Method method) {
        super(beanName, targetClass, method);
        TransactionalEventListener ann = (TransactionalEventListener)AnnotatedElementUtils.findMergedAnnotation(method, TransactionalEventListener.class);
        if (ann == null) {
            throw new IllegalStateException("No TransactionalEventListener annotation found on method: " + method);
        } else {
            this.annotation = ann;
            this.transactionPhase = ann.phase();
        }
    }

    public TransactionPhase getTransactionPhase() {
        return this.transactionPhase;
    }

    public void addCallback(TransactionalApplicationListener.SynchronizationCallback callback) {
        Assert.notNull(callback, "SynchronizationCallback must not be null");
        this.callbacks.add(callback);
    }

    public void onApplicationEvent(ApplicationEvent event) {
        // 如果当前 TransactionManager 已经配置开启事务事件监听，此时才会注册 TransactionSynchronization 对象
        if (TransactionSynchronizationManager.isSynchronizationActive() && TransactionSynchronizationManager.isActualTransactionActive()) {
            // 注册 TransactionSynchronization 对象到 TransactionManager 中
            TransactionSynchronizationManager.registerSynchronization(new TransactionalApplicationListenerSynchronization(event, this, this.callbacks));
        } else if (this.annotation.fallbackExecution()) {
            // 如果当前 TransactionManager 没有开启事务事件处理，但是当前事务监听方法中配置了
        	// fallbackExecution 属性为 true，说明其需要对当前事务事件进行监听，无论其是否有事务
            if (this.annotation.phase() == TransactionPhase.AFTER_ROLLBACK && this.logger.isWarnEnabled()) {
                this.logger.warn("Processing " + event + " as a fallback execution on AFTER_ROLLBACK phase");
            }
            this.processEvent(event);
        } else if (this.logger.isDebugEnabled()) {
            // 走到这里说明当前是不需要事务事件处理的，因而直接略过
            this.logger.debug("No transaction is active - skipping " + event);
        }
    }
}
```

```java
private static class TransactionSynchronizationEventAdapter 
    extends TransactionSynchronizationAdapter {

    private final ApplicationListenerMethodAdapter listener;
    private final ApplicationEvent event;
    private final TransactionPhase phase;

    public TransactionSynchronizationEventAdapter(ApplicationListenerMethodAdapter 
        listener, ApplicationEvent event, TransactionPhase phase) {
        this.listener = listener;
        this.event = event;
        this.phase = phase;
    }
    
    @Override
    public int getOrder() {
        return this.listener.getOrder();
    }

    // 在目标方法配置的 phase 属性为 BEFORE_COMMIT 时，处理 before commit 事件
    public void beforeCommit(boolean readOnly) {
        if (this.phase == TransactionPhase.BEFORE_COMMIT) {
            processEvent();
        }
    }
    
    // 这里对于 after completion 事件的处理，虽然分为了三个 if 分支，但是实际上都是执行的 processEvent()
    // 方法，因为 after completion 事件是事务事件中一定会执行的，因而这里对于 commit，
    // rollback 和 completion 事件都在当前方法中处理也是没问题的
    public void afterCompletion(int status) {
        if (this.phase == TransactionPhase.AFTER_COMMIT && status == STATUS_COMMITTED) {
            processEvent();
        } else if (this.phase == TransactionPhase.AFTER_ROLLBACK 
                   && status == STATUS_ROLLED_BACK) {
            processEvent();
        } else if (this.phase == TransactionPhase.AFTER_COMPLETION) {
            processEvent();
        }
    }
    
    // 执行事务事件
    protected void processEvent() {
        this.listener.processEvent(this.event);
    }
}
```

```java
public void processEvent(ApplicationEvent event) {
    // 处理事务事件的相关参数，这里主要是判断 TransactionalEventListener 注解中是否配置了 value
    // 或 classes 属性，如果配置了，则将方法参数转换为该指定类型传给监听的方法；如果没有配置，则判断
    // 目标方法是 ApplicationEvent 类型还是 PayloadApplicationEvent 类型，是则转换为该类型传入
    Object[] args = resolveArguments(event);
    // 这里主要是获取 TransactionalEventListener 注解中的 condition 属性，然后通过
    // Spring expression language 将其与目标类和方法进行匹配
    if (shouldHandle(event, args)) {
        // 通过处理得到的参数借助于反射调用事务监听方法
        Object result = doInvoke(args);
        if (result != null) {
            // 对方法的返回值进行处理
            handleResult(result);
        } else {
            logger.trace("No result object given - no result to handle");
        }
    }
}

// 处理事务监听方法的参数
protected Object[] resolveArguments(ApplicationEvent event) {
    // 获取发布事务事件时传入的参数类型
    ResolvableType declaredEventType = getResolvableType(event);
    if (declaredEventType == null) {
    	return null;
    }
    
    // 如果事务监听方法的参数个数为 0，则直接返回
    if (this.method.getParameterCount() == 0) {
    	return new Object[0];
    }
    
    // 如果事务监听方法的参数不为 ApplicationEvent 或 PayloadApplicationEvent，则直接将发布事务
    // 事件时传入的参数当做事务监听方法的参数传入。从这里可以看出，如果事务监听方法的参数不是
    // ApplicationEvent 或 PayloadApplicationEvent 类型，那么其参数必须只能有一个，并且这个
    // 参数必须与发布事务事件时传入的参数一致
    Class<?> eventClass = declaredEventType.getRawClass();
    if ((eventClass == null || !ApplicationEvent.class.isAssignableFrom(eventClass)) &&
    	event instanceof PayloadApplicationEvent) {
    	return new Object[] {((PayloadApplicationEvent) event).getPayload()};
    } else {
    // 如果参数类型为 ApplicationEvent 或 PayloadApplicationEvent，则直接将其传入事务事件方法
    	return new Object[] {event};
    }
}

// 判断事务事件方法方法是否需要进行事务事件处理
private boolean shouldHandle(ApplicationEvent event, @Nullable Object[] args) {
    if (args == null) {
    	return false;
    }
    String condition = getCondition();
    if (StringUtils.hasText(condition)) {
        Assert.notNull(this.evaluator, "EventExpressionEvaluator must no be null");
        EvaluationContext evaluationContext = this.evaluator.createEvaluationContext(
            event, this.targetClass, this.method, args, this.applicationContext);
        return this.evaluator.condition(condition, this.methodKey, evaluationContext);
    }
    return true;
}

// 对事务事件方法的返回值进行处理，这里的处理方式主要是将其作为一个事件继续发布出去，这样就可以在
// 一个统一的位置对事务事件的返回值进行处理
protected void handleResult(Object result) {
    // 如果返回值是数组类型，则对数组元素一个一个进行发布
    if (result.getClass().isArray()) {
        Object[] events = ObjectUtils.toObjectArray(result);
        for (Object event : events) {
            publishEvent(event);
        }
    } else if (result instanceof Collection<?>) {
    	// 如果返回值是集合类型，则对集合进行遍历，并且发布集合中的每个元素
    	Collection<?> events = (Collection<?>) result;
        for (Object event : events) {
            publishEvent(event);
        }
    } else {
        // 如果返回值是一个对象，则直接将其进行发布
        publishEvent(result);
    }
}
```
