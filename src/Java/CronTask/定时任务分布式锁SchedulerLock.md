---
title: 定时任务分布式锁SchedulerLock
tag: 定时任务
category: Java
description: ShedLock 通过 @SchedulerLock 注解结合数据库或 Redis 实现分布式定时任务锁，防止多个节点同时执行任务。其核心原理是任务执行前获取锁，执行后释放，确保任务全局唯一性，适用于分布式环境中的定时任务调度，如数据清理、报表统计等，提高任务执行的可靠性。
date: 2025-04-05 22:38:34
---

## 作用

SchedulerLock 作用：确保任务在同一时刻最多执行一次。如果一个任务正在一个节点上执行，则它将获得一个锁，该锁将阻止从另一个节点（或线程）执行同一任务。如果一个任务已经在一个节点上执行，则在其他节点上的执行不会等待，只需跳过它即可 。

SchedulerLock 主要通过分布式锁实现，可以使用：

1. 数据库锁（基于数据库行锁或唯一约束）
2. Redis 分布式锁（利用 SET NX EX）
3. Zookeeper 分布式锁（基于临时节点）
4. 基于 Quartz/ShedLock 的框架实现

## 相关注解

### @EnableSchedulerLock

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulerLockConfigurationSelector.class)
public @interface EnableSchedulerLock {
    enum InterceptMode {
        PROXY_SCHEDULER,

        PROXY_METHOD
    }

    InterceptMode interceptMode() default InterceptMode.PROXY_METHOD;

    String defaultLockAtMostFor();

    String defaultLockAtLeastFor() default "PT0S";

    AdviceMode mode() default AdviceMode.PROXY;

    boolean proxyTargetClass() default false;

    int order() default Ordered.LOWEST_PRECEDENCE;
}
```

指定在执行节点结束时应保留锁的默认时间使用 ISO8601 Duration 格式，作用就是在被加锁的节点挂了时，无法释放锁，造成其他节点无法进行下一任务，我们使用注解时候需要给定一个值。可以在每个 ScheduledLock 注解中被重写，也就是说每个定时任务都可以重新定义时间，来控制每个定时任务。

1. defaultLockAtMostFor：设定默认最大锁持有时间
2. defaultLockAtLeastFor：设定默认最小锁持有时间

### @SchedulerLock

```java
@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Deprecated
public @interface SchedulerLock {
    String name() default "";

    long lockAtMostFor() default -1L;

    String lockAtMostForString() default "";

    long lockAtLeastFor() default -1L;

    String lockAtLeastForString() default "";
}
```

1. name：锁的名称，必须保证唯一，每个任务的锁名称应该唯一，因为它决定了这个锁在分布式环境中的唯一性
2. lockAtMostFor：成功执行任务的节点所能拥有的独占锁的最长时间，设置的值要保证比定时任务正常执行完成的时间大一些，此属性保证了如果 task 节点突然宕机，也能在超过设定值时释放任务锁
3. lockAtLeastFor：成功执行任务的节点所能拥有的独占锁的最短时间，在指定的时间内，即使任务执行完成，锁也不会释放，这有助于防止任务被频繁触发
4. lockAtMostForString：最大时间的字符串形式，允许通过 Spring 的属性占位符（例如：${lock.duration}）来动态配置值，例如“PT14M”表示为 14 分钟
5. lockAtLeastForString：最小时间的字符串形式

## 基本使用

### redis 整合

```xml
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
    <version>4.38.0</version>
</dependency>
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-provider-redis-spring</artifactId>
    <version>4.38.0</version>
</dependency>
```

```yaml
spring:
  redis:
    #数据库索引
    database: 0
    host: 127.0.0.1
    port: 6379
    password:
    jedis:
      pool:
        #最大连接数
        max-active: 8
        #最大阻塞等待时间(负数表示没限制)
        max-wait: -1
        #最大空闲
        max-idle: 8
        #最小空闲
        min-idle: 0
        #连接超时时间
    timeout: 10000
```

```java
// 开启定时任务注解
@EnableScheduling
// 开启定时任务锁，默认设置锁最大占用时间为 30s
@EnableSchedulerLock(defaultLockAtMostFor = "PT30S")
@SpringBootApplication
public class HelloSpringbootApplication {

   public static void main(String[] args) {
      SpringApplication.run(HelloSpringbootApplication.class, args);
   }
}
```

```java
@Configuration
@EnableCaching
public class RedisConfig extends CachingConfigurerSupport {
    
    @Bean(name = "redisTemplate")
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory){
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        //参照 StringRedisTemplate 内部实现指定序列化器
        redisTemplate.setConnectionFactory(redisConnectionFactory);
        redisTemplate.setKeySerializer(keySerializer());
        redisTemplate.setHashKeySerializer(keySerializer());
        redisTemplate.setValueSerializer(valueSerializer());
        redisTemplate.setHashValueSerializer(valueSerializer());
        return redisTemplate;
    }

    private RedisSerializer<String> keySerializer(){
        return new StringRedisSerializer();
    }

    //使用 Jackson 序列化器
    private RedisSerializer<Object> valueSerializer(){
        return new GenericJackson2JsonRedisSerializer();
    }
    
    @Bean
    public LockProvider lockProvider(RedisTemplate redisTemplate) {
        return new RedisLockProvider(redisTemplate.getConnectionFactory());
    }
}
```

```java
@Slf4j
@Component
public class TestScheduled {

    @Resource
    RedisTemplate redisTemplate;

    // @SchedulerLock 的作用是保证当前定时任务的方法执行时获得锁，忽略其他相同任务的执行
    // name 必须要指定，ShedLock 就是根据这个 name 进行相同任务判定的
    // name：定时任务的名字，就是数据库中的主键(name)
    // lockAtMostFor：锁的最大时间单位为毫秒
    // lockAtLeastFor：锁的最小时间单位为毫秒
    @Scheduled(fixedDelay = 30 * 1000)
    @SchedulerLock(name = "evaluateUnsubmit",lockAtLeastFor = 5*60*1000,lockAtMostFor = 20*60*1000 )
    public void testMethod(){
        log.info("开始执行 {}", DateFormatUtils.format(new Date(), "yyyy-MM-dd HH:mm:ss"));
        try {
            Thread.sleep(100);
            redisTemplate.opsForValue().set("test" + System.currentTimeMillis(),"goodJob",100, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        log.info("执行完成 {}", DateFormatUtils.format(new Date(), "yyyy-MM-dd HH:mm:ss"));
    }

    @Scheduled(cron = "*/15 * * * * *")
    @SchedulerLock(name = "TaskScheduler_scheduledTask", lockAtLeastForString = "PT5M", lockAtMostForString = "PT14M")
    public void scheduledTask() {
        // ...
    }
}
```

### mysql 整合

```xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
    <version>4.23.0</version>
</dependency>
 <!--每个外部存储实例所需依赖包不一样，这里是jdbc-->
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-provider-jdbc-template</artifactId>
    <version>4.23.0</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>
```

```sql
# MySQL, MariaDB
CREATE TABLE shedlock(name VARCHAR(64) NOT NULL, lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), locked_by VARCHAR(255) NOT NULL, PRIMARY KEY (name));

# Postgres
CREATE TABLE shedlock(name VARCHAR(64) NOT NULL, lock_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP NOT NULL, locked_by VARCHAR(255) NOT NULL, PRIMARY KEY (name));

# Oracle
CREATE TABLE shedlock(name VARCHAR(64) NOT NULL, lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL, locked_by VARCHAR(255) NOT NULL, PRIMARY KEY (name));

# MS SQL
CREATE TABLE shedlock(name VARCHAR(64) NOT NULL, lock_until datetime2 NOT NULL,
    locked_at datetime2 NOT NULL, locked_by VARCHAR(255) NOT NULL, PRIMARY KEY (name));

# DB2
CREATE TABLE shedlock(name VARCHAR(64) NOT NULL PRIMARY KEY, lock_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP NOT NULL, locked_by VARCHAR(255) NOT NULL);
```

```java
@Configuration
// 开启定时器
@EnableScheduling
// 开启定时任务锁，指定一个默认的锁的时间 30 秒
@EnableSchedulerLock(defaultLockAtMostFor = "PT30S")
public class ShedlockJdbcConfig {

    /**
     * 配置锁的提供者
     */
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime()
                        .build()
        );
    }
}
```

```java
@Component
@Slf4j
public class TimeTaskJob {

    private static Integer count = 1;

    /**
     * 任务 1 每 5 秒执行一次
     * lockAtLeastFor：虽然定时任务是每隔5秒执行一次, 但是分布式锁定义的是: 每次任务要锁住20秒，20秒是持有锁的最小时间，必须等20秒后才释放锁，并且确保在20秒钟内，该任务不会运行超过 1 次；
     * lockAtMostFor：锁最大持有时间30秒，表示最多锁定30秒钟，主要用于防止执行任务的节点挂掉（即使这个节点挂掉，在30秒钟后锁也被释放），一般将其设置为明显大于任务的最大执行时长；如果任务运行时间超过该值（即任务30秒钟没有执行完），则该任务可能被重复执行。
     */
    @Scheduled(cron = "0/5 * * * * ? ")
    @SchedulerLock(name = "testJob1",lockAtLeastFor = "20000", lockAtMostFor = "30000")
    public void scheduledTask1() {
        log.info(Thread.currentThread().getName() + "->>>任务1执行第：" + (count++) + "次");
    }


    @Scheduled(cron = "0/5 * * * * ? ")
    @SchedulerLock(name = "testJob2")
    public void scheduledTask2() {
        log.info(Thread.currentThread().getName() + "->>>任务2执行第：" + (count++) + "次");
    }
}
```

## 实现原理

1. 使用@EnableSchedulerLock 注解后，会引入 SchedulerLockConfigurationSelector 类，根据其对应的模式（默认 InterceptMode.PROXY_METHOD）生成 LockConfigurationExtractorConfiguration 和 MethodProxyLockConfiguration 类

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulerLockConfigurationSelector.class)
public @interface EnableSchedulerLock {
    enum InterceptMode {
        PROXY_SCHEDULER,

        PROXY_METHOD
    }

    InterceptMode interceptMode() default InterceptMode.PROXY_METHOD;

    String defaultLockAtMostFor();

    String defaultLockAtLeastFor() default "PT0S";

    AdviceMode mode() default AdviceMode.PROXY;

    boolean proxyTargetClass() default false;

    int order() default Ordered.LOWEST_PRECEDENCE;
}
```

```java
public class SchedulerLockConfigurationSelector implements ImportSelector {

    @Override
    @NonNull
    public String[] selectImports(@NonNull AnnotationMetadata metadata) {
        AnnotationAttributes attributes = AnnotationAttributes.fromMap(metadata.getAnnotationAttributes(EnableSchedulerLock.class.getName(), false));
        InterceptMode mode = attributes.getEnum("interceptMode");
        if (mode == PROXY_METHOD) {
            return new String[]{AutoProxyRegistrar.class.getName(), LockConfigurationExtractorConfiguration.class.getName(), MethodProxyLockConfiguration.class.getName()};
        } else if (mode == PROXY_SCHEDULER) {
            return new String[]{AutoProxyRegistrar.class.getName(), LockConfigurationExtractorConfiguration.class.getName(), SchedulerProxyLockConfiguration.class.getName(), RegisterDefaultTaskSchedulerPostProcessor.class.getName()};
        } else {
            throw new UnsupportedOperationException("Unknown mode " + mode);
        }
    }
}
```

2. LockConfigurationExtractorConfiguration 会获取@EnableSchedulerLock 注解上的属性进行配置，生成 SpringLockConfigurationExtractor

```java
@Configuration
class LockConfigurationExtractorConfiguration extends AbstractLockConfiguration implements EmbeddedValueResolverAware {
    private final StringToDurationConverter durationConverter = StringToDurationConverter.INSTANCE;

    private StringValueResolver resolver;

    @Bean
    ExtendedLockConfigurationExtractor lockConfigurationExtractor() {
        return new SpringLockConfigurationExtractor(defaultLockAtMostForDuration(), defaultLockAtLeastForDuration(), resolver, durationConverter);
    }

    private Duration defaultLockAtLeastForDuration() {
        return toDuration(getDefaultLockAtLeastFor());
    }

    private Duration defaultLockAtMostForDuration() {
        return toDuration(getDefaultLockAtMostFor());
    }

    private String getDefaultLockAtLeastFor() {
        return getStringFromAnnotation("defaultLockAtLeastFor");
    }

    private String getDefaultLockAtMostFor() {
        return getStringFromAnnotation("defaultLockAtMostFor");
    }

    private Duration toDuration(String string) {
        return durationConverter.convert(resolver.resolveStringValue(string));
    }

    protected String getStringFromAnnotation(String name) {
        return annotationAttributes.getString(name);
    }

    @Override
    public void setEmbeddedValueResolver(@NonNull StringValueResolver resolver) {
        this.resolver = resolver;
    }
}
```

3. MethodProxyLockConfiguration 类会根据 LockProvider 和 ExtendedLockConfigurationExtractor 进行自动装配，生成 MethodProxyScheduledLockAdvisor

```java
@Configuration
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
class MethodProxyLockConfiguration extends AbstractLockConfiguration {
    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    MethodProxyScheduledLockAdvisor proxyScheduledLockAopBeanPostProcessor(
        @Lazy LockProvider lockProvider,
        @Lazy ExtendedLockConfigurationExtractor lockConfigurationExtractor
    ) {
        MethodProxyScheduledLockAdvisor advisor = new MethodProxyScheduledLockAdvisor(
            lockConfigurationExtractor,
            new DefaultLockingTaskExecutor(lockProvider)
        );
        advisor.setOrder(getOrder());
        return advisor;
    }
}
```

4. 生成一个切面 MethodProxyScheduledLockAdvisor 类，对方法进行拦截

```java
class MethodProxyScheduledLockAdvisor extends AbstractPointcutAdvisor {
    // ...

    private static class LockingInterceptor implements MethodInterceptor {
        private final ExtendedLockConfigurationExtractor lockConfigurationExtractor;
        private final LockingTaskExecutor lockingTaskExecutor;

        LockingInterceptor(ExtendedLockConfigurationExtractor lockConfigurationExtractor, LockingTaskExecutor lockingTaskExecutor) {
            this.lockConfigurationExtractor = lockConfigurationExtractor;
            this.lockingTaskExecutor = lockingTaskExecutor;
        }

        @Override
        public Object invoke(MethodInvocation invocation) throws Throwable {
            Class<?> returnType = invocation.getMethod().getReturnType();
            if (returnType.isPrimitive() && !void.class.equals(returnType)) {
                throw new LockingNotSupportedException("Can not lock method returning primitive value");
            }

            // 查找@SchedulerLock 注解
            LockConfiguration lockConfiguration = lockConfigurationExtractor.getLockConfiguration(invocation.getThis(), invocation.getMethod()).get();
            // 执行加锁方法
            TaskResult<Object> result = lockingTaskExecutor.executeWithLock(invocation::proceed, lockConfiguration);

            if (Optional.class.equals(returnType)) {
                return toOptional(result);
            } else {
                return result.getResult();
            }
        }

        private static Object toOptional(TaskResult<Object> result) {
            if (result.wasExecuted()) {
                return result.getResult();
            } else {
                return Optional.empty();
            }
        }
    }
}
```

5. SpringLockConfigurationExtractor 会查找方法上是否存在@SchedulerLock 注解

```java
class SpringLockConfigurationExtractor implements ExtendedLockConfigurationExtractor {
    // ...

    @Override
    public Optional<LockConfiguration> getLockConfiguration(Object target, Method method) {
        AnnotationData annotation = findAnnotation(target, method);
        if (shouldLock(annotation)) {
            return Optional.of(getLockConfiguration(annotation));
        } else {
            return Optional.empty();
        }
    }

    AnnotationData findAnnotation(Object target, Method method) {
        AnnotationData annotation = findAnnotation(method);
        if (annotation != null) {
            return annotation;
        } else {
            Class<?> targetClass = AopUtils.getTargetClass(target);
            try {
                Method methodOnTarget = targetClass
                    .getMethod(method.getName(), method.getParameterTypes());
                return findAnnotation(methodOnTarget);
            } catch (NoSuchMethodException e) {
                return null;
            }
        }
    }

    private AnnotationData findAnnotation(Method method) {
        net.javacrumbs.shedlock.core.SchedulerLock annotation = AnnotatedElementUtils.getMergedAnnotation(method, net.javacrumbs.shedlock.core.SchedulerLock.class);
        if (annotation != null) {
            return new AnnotationData(annotation.name(), annotation.lockAtMostFor(), annotation.lockAtMostForString(), annotation.lockAtLeastFor(), annotation.lockAtLeastForString());
        }
        SchedulerLock annotation2 = AnnotatedElementUtils.getMergedAnnotation(method, SchedulerLock.class);
        if (annotation2 != null) {
            return new AnnotationData(annotation2.name(), -1, annotation2.lockAtMostFor(), -1, annotation2.lockAtLeastFor());
        }
        return null;
    }

    // ...
}
```

6. DefaultLockingTaskExecutor 类对方法进行加解锁，执行 LockProvider 提供的加锁方法

```java
public class DefaultLockingTaskExecutor implements LockingTaskExecutor {
    // ...

    @Override
    @NonNull
    public <T> TaskResult<T> executeWithLock(@NonNull TaskWithResult<T> task, @NonNull LockConfiguration lockConfig) throws Throwable {
        Optional<SimpleLock> lock = lockProvider.lock(lockConfig);
        String lockName = lockConfig.getName();

        if (alreadyLockedBy(lockName)) {
            logger.debug("Already locked '{}'", lockName);
            return TaskResult.result(task.call());
        } else if (lock.isPresent()) {
            try {
                LockAssert.startLock(lockName);
                LockExtender.startLock(lock.get());
                logger.debug("Locked '{}', lock will be held at most until {}", lockName, lockConfig.getLockAtMostUntil());
                return TaskResult.result(task.call());
            } finally {
                LockAssert.endLock();
                SimpleLock activeLock = LockExtender.endLock();
                if (activeLock != null) {
                    activeLock.unlock();
                } else {
                    // This should never happen, but I do not know any better way to handle the null case.
                    logger.warn("No active lock, please report this as a bug.");
                    lock.get().unlock();
                }
                if (logger.isDebugEnabled()) {
                    Instant lockAtLeastUntil = lockConfig.getLockAtLeastUntil();
                    Instant now = ClockProvider.now();
                    if (lockAtLeastUntil.isAfter(now)) {
                        logger.debug("Task finished, lock '{}' will be released at {}", lockName, lockAtLeastUntil);
                    } else {
                        logger.debug("Task finished, lock '{}' released", lockName);
                    }
                }
            }
        } else {
            logger.debug("Not executing '{}'. It's locked.", lockName);
            return TaskResult.notExecuted();
        }
    }
}
```

