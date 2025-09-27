---
title: SpringBoot @Conditional条件注解
tag:
  - SpringBoot
category: Java
description: Spring Boot 条件注解（如 `@ConditionalOnProperty`、`@ConditionalOnClass`）用于按条件加载 Bean 或配置，提高应用的灵活性。例如，`@ConditionalOnMissingBean` 仅在指定 Bean 不存在时生效，适用于自动配置场景，可结合 `@Configuration` 实现模块化配置，提高启动效率。
date: 2025-03-21 12:42:19
---

## 属性注入

### @ConfigurationProperties+@Component

如果一个类只配置了 `@ConfigurationProperties` 注解，而没有使用 `@Component` 注解将该类加入到 IOC 容器中，那么它就不能完成 xxx.properties 文件和 Java Bean 的数据绑定

```properties
xiaomao.name=xiaomaomao
xiaomao.age=27
```

```java
@Component
@ConfigurationProperties(prefix = "xiaomao")
@Data
public class MyConfigurationProperties {
    private String name;
    
    private Integer age;
    
    private String gender;
}
```

### @EnableConfigurationProperties

`@EnableConfigurationProperties(A.class)` 的作用就是如果 A 这个类上使用了 `@ConfigurationProperties` 注解，那么 A 这个类就会与 xxx.properties 进行动态绑定，并且会将 A 这个类加入 IOC 容器中，并交由 IOC 容器进行管理

```java
@ConfigurationProperties(prefix = "xiaomao")
@Data
public class MyConfigurationProperties {
    private String name;
    
    private Integer age;
    
    private String gender;
}
```

```java
@Service
// 该注解的作用是使 MyConfigurationProperties 这个类上标注的 @ConfigurationProperties 注解生效,并且会自动将这个类注入到 IOC 容器中
@EnableConfigurationProperties(MyConfigurationProperties.class)
public class HelloServiceImpl implements HelloService {
}
```

## @Conditional 扩展注解

| Condition 处理类   | 条件注解        | 实例                                                         | 解释                                                         |
| ---------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------ |
| OnBeanCondition                 | @ConditionalOnBean            | @ConditionalOnBean(DataSource.class)                         | Spring 容器中不存在对应的实例生效                             |
| OnBeanCondition                 | @ConditionalOnMissingBean     | @ConditionalOnMissingBean(name = "redisTemplate")            | Spring 容器中不存在对应的实例生效                             |
| OnBeanCondition                 | @ConditionalOnSingleCandidate | @ConditionalOnSingleCandidate(FilteringNotifier.class)       | Spring 容器中是否存在且只存在一个对应的实例，或者虽然有多个但 是指定首选的 Bean 生效 |
| OnClassCondition                | @ConditionalOnClass           | @ConditionalOnClass(RedisOperations.class)                   | 类加载器中存在对应的类生效                                   |
| OnClassCondition                | @ConditionalOnMissingClass    | @ConditionalOnMissingClass(RedisOperations.class)            | 类加载器中不存在对应的类生效                                 |
| OnExpressionCondition           | @ConditionalOnExpression      | @ConditionalOnExpression("''${server.host}'=='localhost'") | 判断 SpEL 表达式成立生效                                      |
| @ConditionalOnJava              | OnJavaCondition               | @ConditionalOnJava(JavaVersion.EIGHT)                        | 指定 Java 版本符合要求生效                                     |
| @ConditionalOnProperty          | OnPropertyCondition           | @ConditionalOnProperty(prefix = "spring.aop", name = "auto", havingValue = "true", matchIfMissing = true) | 应用环境中的属性满足条件生效                                 |
| @ConditionalOnResource          | OnResourceCondition           | @ConditionalOnResource(resources ="mybatis.xml")             | 存在指定的资源文件生效                                       |
| @ConditionalOnWebApplication    | OnWebApplicationCondition     |                                                              | 当前应用是 Web 应用生效                                        |
| @ConditionalOnNotWebApplication | OnWebApplicationCondition     |                                                              | 当前应用不是 Web 应用生效                                      |

上面的扩展注解我们可以简单的分为以下几类：

- Bean 作为条件：`@ConditionalOnBean`、`@ConditionalOnMissingBean`、`@ConditionalOnSingleCandidate`。
- 类作为条件：`@ConditionalOnClass`、`@ConditionalOnMissingClass`。
- SpEL 表达式作为条件：`@ConditionalOnExpression`。
- JAVA 版本作为条件：`@ConditionalOnJava`
- 配置属性作为条件：`@ConditionalOnProperty`。
- 资源文件作为条件：`@ConditionalOnResource`。
- 是否 Web 应用作为判断条件：`@ConditionalOnWebApplication`、`@ConditionalOnNotWebApplication`。

### @ConditionalOnBean

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnBeanCondition.class)
public @interface ConditionalOnBean {

    /**
     * 需要作为条件的类的Class对象数组
     */
    Class<?>[] value() default {};

    /**
     * 需要作为条件的类的Name, Class.getName()
     */
    String[] type() default {};

    /**
     * (用于指定注解修饰的Bean)条件所需的注解类
     */
    Class<? extends Annotation>[] annotation() default {};

    /**
     * Spring容器中Bean的名字
     */
    String[] name() default {};

    /**
     * 搜索容器层级，当前容器，父容器
     */
    SearchStrategy search() default SearchStrategy.ALL;

    /**
     * 可能在其泛型参数中包含指定Bean类型的其他类
     */
    Class<?>[] parameterizedContainer() default {};
}
```

`@ConditionalOnBean` 对应的 Condition 处理类是 `OnBeanCondition`，如果 Spring 容器里面存在指定的 Bean 则生效。

```java
// 当容器中存在指定的 Bean 时，创建该 Bean
@Bean
@ConditionalOnBean(DataSource.class)
public String onBeanCondition() {
    return "DataSource 存在时该 Bean 被创建";
}
```

### @ConditionalOnMissingBean

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnBeanCondition.class)
public @interface ConditionalOnMissingBean {

    /**
     * 需要作为条件的类的Class对象数组
     */
    Class<?>[] value() default {};

    /**
     * 需要作为条件的类的Name, Class.getName()
     */
    String[] type() default {};

    /**
     * 匹配Bean的时候需要忽视的Class对象数组，一般是父类
     * @ConditionalOnMissingBean(value = JdbcFactory.class, ignored = MySqlDefaultFactory.class)
     */
    Class<?>[] ignored() default {};

    /**
     * 匹配Bean的时候需要忽视的类的Name, Class.getName()
     */
    String[] ignoredType() default {};

    /**
     * (用于指定注解修饰的Bean)条件所需的注解类
     */
    Class<? extends Annotation>[] annotation() default {};

    /**
     * Spring容器中Bean的名字
     */
    String[] name() default {};

    /**
     * 搜索容器层级，当前容器，父容器
     */
    SearchStrategy search() default SearchStrategy.ALL;

    /**
     * 可能在其泛型参数中包含指定Bean类型的其他类
     */
    Class<?>[] parameterizedContainer() default {};
}
```

`@ConditionalOnMissingBean` 对应的 Condition 实现类是 `OnBeanCondition`，如果 Spring 容器里面不存在指定的 Bean 则生效。

```java
// 当容器里面不存在redisTemplate对应的Bean的时候，就会创建一个RedisTemplate添加到容器里面去。
@Bean
@ConditionalOnMissingBean(name = "redisTemplate")
public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory)
        throws UnknownHostException {
    RedisTemplate<Object, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(redisConnectionFactory);
    return template;
}
```

### @ConditionalOnSingleCandidate

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnBeanCondition.class)
public @interface ConditionalOnSingleCandidate {

    /**
     * 需要作为条件的类的Class对象
     */
    Class<?> value() default Object.class;

    /**
     * 需要作为条件的类的Name, Class.getName()
     */
    String type() default "";

    /**
     * 搜索容器层级，当前容器，父容器
     */
    SearchStrategy search() default SearchStrategy.ALL;
}
```

`@ConditionalOnSingleCandidate` 对应的 Condition 处理类是 `OnBeanCondition`，如果当指定 Bean 在容器中只有一个，或者虽然有多个但是指定首选 Bean 的时候则生效。

```java
// 当存在唯一符合条件的 Bean 时创建
@Bean
@ConditionalOnSingleCandidate(DataSource.class)
public String onSingleCandidate() {
    return "存在唯一的 DataSource 实例时，该 Bean 被创建";
}
```

### @ConditionalOnClass

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnClassCondition.class)
public @interface ConditionalOnClass {

    /**
     * 需要作为条件的类的Class对象数组
     */
    Class<?>[] value() default {};

    /**
     * 需要作为条件的类的Name, Class.getName()
     */
    String[] name() default {};
}
```

`@ConditionalOnClass` 对应的 Condition 处理类是 `OnClassCondition`，如果当前类路径下面有指定的类的时候则生效。

```java
// 当类存在于 classpath 时，创建该 Bean
@Bean
@ConditionalOnClass(name = "com.mysql.cj.jdbc.Driver")
public String onClassCondition() {
    return "MySQL Driver 存在于 classpath 时，该 Bean 被创建";
}
```

### @ConditionalOnMissingClass

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnClassCondition.class)
public @interface ConditionalOnMissingClass {

    /**
     * 需要作为条件的类的Name, Class.getName()
     */
    String[] value() default {};
}
```

`@ConditionalOnMissingClass` 对应的 Condition 处理类是 `OnClassCondition`，如果当前类路径下面没有指定的类的时候则生效。

```java
// 当类不存在于 classpath 时，创建该 Bean
@Bean
@ConditionalOnMissingClass("com.mysql.cj.jdbc.Driver")
public String onMissingClassCondition() {
    return "MySQL Driver 不存在于 classpath 时，该 Bean 被创建";
}
```

### @ConditionalOnExpression

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.METHOD })
@Documented
@Conditional(OnExpressionCondition.class)
public @interface ConditionalOnExpression {

    /**
     * 要作为条件的SpEL表达式
     */
    String value() default "true";
}
```

`@ConditionalOnExpression` 对应的 Condition 处理类是 `OnExpressionCondition`，只有当 SpEL 表达式满足条件的时候则生效。

```java
// 基于 SpEL 表达式的条件判断
@Bean
@ConditionalOnExpression("'${custom.feature.enabled:false}' == 'true'")
public String onExpressionCondition() {
    return "SpEL 表达式结果为 true 时，该 Bean 被创建";
}
```

### @ConditionalOnJava

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnJavaCondition.class)
public @interface ConditionalOnJava {

    /**
     * 比较方式，Range.EQUAL_OR_NEWER:当前版本等于或高于、Range.OLDER_THAN:当前版本老于，越早的版本越老
     */
    Range range() default Range.EQUAL_OR_NEWER;

    /**
     * 指定JAVA版本
     */
    JavaVersion value();

    /**
     * Range options.
     */
    enum Range {

        /**
         * Equal to, or newer than the specified {@link JavaVersion}.
         */
        EQUAL_OR_NEWER,

        /**
         * Older than the specified {@link JavaVersion}.
         */
        OLDER_THAN
    }
}
```

`@ConditionalOnJava` 对应的 Condition 处理类是 `OnJavaCondition`，只有当指定的 JAVA 版本条件满足的时候，才会创建对应的 Bean。

```java
// 基于 Java 版本的条件判断
@Bean
@ConditionalOnJava(range = ConditionalOnJava.Range.EQUAL_OR_NEWER, value = ConditionalOnJava.JavaVersion.ELEVEN)
public String onJavaVersionCondition() {
    return "Java 版本 >= 11 时，该 Bean 被创建";
}
```

### @ConditionalProperty

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.METHOD })
@Documented
@Conditional(OnPropertyCondition.class)
public @interface ConditionalOnProperty {

    //name的别名，和value不可同时使用
    String[] value() default {};

    /**
    * 配置项的前缀，例如完整的配置是config.person.enable=true，那 prefix=“config.person”
    */
    String prefix() default "";

    /**
    配置项的属性，例如完整的配置是config.person.enable=true
    在前面已经设置 prefix=“config.person”，那么 name=“enable”；

    如果prefix没有设置，那么name可以是整个配置项，例如下面：
    name=“config.person.enable”，效果和上面的一样
     */
    String[] name() default {};

    /**
     * 会将配置文件中的值和havingValue的值对比，如果一样则加载Bean，例如：
     * 
     * config.person.enable=true，havingValue=“true”，加载Bean
     * 
     * config.person.enable=false，havingValue=“false”，加载Bean
     * 
     * config.person.enable=ok，havingValue=“ok”，加载Bean
     * 
     * config.person.enable=false，havingValue=“true”，不加载Bean
     * 
     * config.person.enable=ok，havingValue=“no”，不加载Bean
     * 
     * 当然havingValue也可以不设置，只要配置项的值不是false或“false”，都加载Bean，例如：
     * 
     * config.person.enable=ok，不设置havingValue，加载Bean
     * 
     * config.person.enable=false，不设置havingValue，不加载Bean
     */
    String havingValue() default "";

    /**
     * 如果在配置文件中没有该配置项，是否加载Bean
     */
    boolean matchIfMissing() default false;
}
```

1. 指定 prefix 和 name

```yaml
config:
  person:
    enable: true
```

```java
@Configuration
public class MyBeanConfig {

    @Bean
    @ConditionalOnProperty(prefix = "config.person", name = "enable")
    public Person person1(){
        return new Person("Bill Gates", 66);
    }
}
```

2. 只指定 name 或 value

```java
@Configuration
public class MyBeanConfig {

    @Bean
    @ConditionalOnProperty(value = "config.person.enable")
    public Person person1(){
        return new Person("Bill Gates", 66);
    }
}
```

3. 指定 havingValue

指定了 havingValue，要把配置项的值与 havingValue 对比，一致则加载 Bean

注意：havingValue 可以不设置，只要配置项的值不是 false 或 "false"，都加载 Bean

```java
@Configuration
public class MyBeanConfig {
    
    @Bean
    @ConditionalOnProperty(prefix = "config.person", name = "enable", havingValue = "true")
    public Person person1(){
       return new Person("Bill Gates", 66);
    }
}
```

4. 指定 matchIfMissing

配置文件缺少配置，但配置了 matchIfMissing = true，加载 Bean，否则不加载

```java
@Configuration
public class MyBeanConfig {

    @Bean
    @ConditionalOnProperty(prefix = "config.person", name = "enable", havingValue = "true", matchIfMissing = true)
    public Person person1(){
        return new Person("Bill Gates", 66);
    }
}
```

### @ConditionalOnResource

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnResourceCondition.class)
public @interface ConditionalOnResource {

    /**
     * 要作为判断条件的资源文件名称  @ConditionalOnResource(resources=”mybatis.xml”)
     */
    String[] resources() default {};
}
```

`@ConditionalOnResource` 对应的 Condition 处理类 `OnResourceCondition`，只有当指定的资源文件出现在 classpath 中则生效。

```java
// 基于资源文件的条件判断
@Bean
@ConditionalOnResource(resources = "classpath:config/application.yaml")
public String onResourceCondition() {
    return "classpath 下存在 application.yaml 文件时，该 Bean 被创建";
}
```

### @ConditionalOnWebApplication

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnWebApplicationCondition.class)
public @interface ConditionalOnWebApplication {

    /**
     * 需要作为条件的Web应用程序的必需类型
     */
    Type type() default Type.ANY;

    /**
     * Available application types.
     */
    enum Type {

        /**
         * 任何web应用都将匹配
         */
        ANY,

        /**
         * 仅基于servlet的Web应用程序将匹配
         */
        SERVLET,

        /**
         * 仅基于反应式的Web应用程序将匹配
         */
        REACTIVE
    }
}
```

`@ConditionalOnWebApplication` 对应的 Condition 处理类是 `OnWebApplicationCondition`，只有当当前项目是 Web 项目的时候则生效。

```java
// 当应用是 Web 应用时，创建该 Bean
@Bean
@ConditionalOnWebApplication
public String onWebApplicationCondition() {
    return "Web 应用环境下，该 Bean 被创建";
}
```

### @ConditionalOnNotWebApplication

```java
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(OnWebApplicationCondition.class)
public @interface ConditionalOnNotWebApplication {

}
```

`@ConditionalOnNotWebApplication` 对应的 Condition 处理类是 `OnWebApplicationCondition`，只有当当前项目不是 Web 项目的时候则生效。

```java
// 当应用不是 Web 应用时，创建该 Bean
@Bean
@ConditionalOnNotWebApplication
public String onNotWebApplicationCondition() {
    return "非 Web 应用环境下，该 Bean 被创建";
}
```

## @Conditional 自定义

仿照 `OnPropertyCondition` 源码进行修改，扩展注解 `ConditionalOnPropertyExist`，指定我们的 Condition 实现类 `OnPropertyExistCondition`，并且指定两个参数，一个是参数 `name` 用于指定属性，另一个参数 `exist` 用于指定是判断存在还是不存在。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@Documented
@Conditional(OnPropertyExistCondition.class)
public @interface ConditionalOnPropertyExist {

    /**
     * 配置文件里面对应的key
     */
    String name() default "";

    /**
     * 是否有配置的时候判断通过
     */
    boolean exist() default true;
}
```

```java
public class OnPropertyExistCondition implements Condition {
    
    @Override
    public boolean matches(ConditionContext conditionContext, AnnotatedTypeMetadata annotatedTypeMetadata) {
        Map<String, Object> annotationAttributes = annotatedTypeMetadata.getAnnotationAttributes(ConditionalOnPropertyExist.class.getName());
        if (annotationAttributes == null) {
            return false;
        }
        // 简单的判断下属性存在与否
        String propertyName = (String) annotationAttributes.get("name");
        boolean values = (boolean) annotationAttributes.get("exist");
        String propertyValue = conditionContext.getEnvironment().getProperty(propertyName);
        if(values) {
            return !StringUtils.isEmpty(propertyValue);
        } else {
            return StringUtils.isEmpty(propertyValue);
        }
    }
}
```

## 源码详解

### 条件判断的触发时机

Spring 在以下阶段触发条件判断：

| **阶段**          | **触发场景**                     | **相关源码位置**                         |
| :---------------- | :------------------------------- | :--------------------------------------- |
| 配置类解析阶段    | 解析 `@Configuration` 类时       | `ConfigurationClassParser`               |
| Bean 方法注册阶段 | 处理 `@Bean` 方法时              | `ConfigurationClassBeanDefinitionReader` |
| 组件扫描阶段      | 扫描 `@Component` 及其派生注解时 | `ClassPathBeanDefinitionScanner`         |

### ConditionEvaluator

```java
class ConditionEvaluator {

    private final ConditionContextImpl context;

    public ConditionEvaluator(@Nullable BeanDefinitionRegistry registry,
            @Nullable Environment environment, @Nullable ResourceLoader resourceLoader) {
        this.context = new ConditionContextImpl(registry, environment, resourceLoader);
    }

    public boolean shouldSkip(AnnotatedTypeMetadata metadata) {
        return shouldSkip(metadata, null);
    }

    /**
    * 判断是否应跳过当前元素的处理（如类或方法）
    */
    public boolean shouldSkip(@Nullable AnnotatedTypeMetadata metadata, @Nullable ConfigurationPhase phase) {
        // 检查是否存在 @Conditional 注解
        if (metadata == null || !metadata.isAnnotated(Conditional.class.getName())) {
            return false;
        }

        if (phase == null) {
            if (metadata instanceof AnnotationMetadata &&
                    ConfigurationClassUtils.isConfigurationCandidate((AnnotationMetadata) metadata)) {
                return shouldSkip(metadata, ConfigurationPhase.PARSE_CONFIGURATION);
            }
            return shouldSkip(metadata, ConfigurationPhase.REGISTER_BEAN);
        }

        // 获取所有 Condition 实现类
        List<Condition> conditions = new ArrayList<>();
        for (String[] conditionClasses : getConditionClasses(metadata)) {
            for (String conditionClass : conditionClasses) {
                // 通过反射实例化 Condition 对象
                Condition condition = getCondition(conditionClass, this.context.getClassLoader());
                conditions.add(condition);
            }
        }

        AnnotationAwareOrderComparator.sort(conditions);
        // 按顺序执行所有条件判断
        for (Condition condition : conditions) {
            ConfigurationPhase requiredPhase = null;
            if (condition instanceof ConfigurationCondition) {
                requiredPhase = ((ConfigurationCondition) condition).getConfigurationPhase();
            }
            // 检查条件是否匹配
            if ((requiredPhase == null || requiredPhase == phase) && !condition.matches(this.context, metadata)) {
                return true;
            }
        }
        return false;
    }

    // ......
}
```

### SpringBootCondition

```java
public abstract class SpringBootCondition implements Condition {

    private final Log logger = LogFactory.getLog(getClass());

    @Override
    public final boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        // 获取类名或方法名称
        String classOrMethodName = getClassOrMethodName(metadata);
        try {
            // 获取匹配结果
            ConditionOutcome outcome = getMatchOutcome(context, metadata);
            // 日志记录
            logOutcome(classOrMethodName, outcome);
            // 评估结果记录
            recordEvaluation(context, classOrMethodName, outcome);
            return outcome.isMatch();
        }
        catch (NoClassDefFoundError ex) {
            throw new IllegalStateException("Could not evaluate condition on " + classOrMethodName + " due to "
                    + ex.getMessage() + " not found. Make sure your own configuration does not rely on "
                    + "that class. This can also happen if you are "
                    + "@ComponentScanning a springframework package (e.g. if you "
                    + "put a @ComponentScan in the default package by mistake)", ex);
        }
        catch (RuntimeException ex) {
            throw new IllegalStateException("Error processing condition on " + getName(metadata), ex);
        }
    }

    private String getName(AnnotatedTypeMetadata metadata) {
        // 如果注解在类上，返回类名
        if (metadata instanceof AnnotationMetadata) {
            return ((AnnotationMetadata) metadata).getClassName();
        }
        // 如果注解在方法上，返回方法名
        if (metadata instanceof MethodMetadata) {
            MethodMetadata methodMetadata = (MethodMetadata) metadata;
            return methodMetadata.getDeclaringClassName() + "." + methodMetadata.getMethodName();
        }
        return metadata.toString();
    }

    private static String getClassOrMethodName(AnnotatedTypeMetadata metadata) {
        if (metadata instanceof ClassMetadata) {
            ClassMetadata classMetadata = (ClassMetadata) metadata;
            return classMetadata.getClassName();
        }
        MethodMetadata methodMetadata = (MethodMetadata) metadata;
        return methodMetadata.getDeclaringClassName() + "#" + methodMetadata.getMethodName();
    }

    /**
     * 日志记录
     */
    protected final void logOutcome(String classOrMethodName, ConditionOutcome outcome) {
        if (this.logger.isTraceEnabled()) {
            this.logger.trace(getLogMessage(classOrMethodName, outcome));
        }
    }

    private StringBuilder getLogMessage(String classOrMethodName, ConditionOutcome outcome) {
        StringBuilder message = new StringBuilder();
        message.append("Condition ");
        message.append(ClassUtils.getShortName(getClass()));
        message.append(" on ");
        message.append(classOrMethodName);
        message.append(outcome.isMatch() ? " matched" : " did not match");
        if (StringUtils.hasLength(outcome.getMessage())) {
            message.append(" due to ");
            message.append(outcome.getMessage());
        }
        return message;
    }

    /**
     * 记录评估结果
     */
    private void recordEvaluation(ConditionContext context, String classOrMethodName, ConditionOutcome outcome) {
        // 如果启用了条件评估报告（通过配置 spring.boot.enableautoconfigreport）
        if (context.getBeanFactory() != null) {
            ConditionEvaluationReport.get(context.getBeanFactory()).recordConditionEvaluation(classOrMethodName, this,
                    outcome);
        }
    }


    public abstract ConditionOutcome getMatchOutcome(ConditionContext context, AnnotatedTypeMetadata metadata);

    /**
     * 全部匹配
     */
    protected final boolean anyMatches(ConditionContext context, AnnotatedTypeMetadata metadata,
            Condition... conditions) {
        for (Condition condition : conditions) {
            if (matches(context, metadata, condition)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 任一匹配
     */
    protected final boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata, Condition condition) {
        if (condition instanceof SpringBootCondition) {
            return ((SpringBootCondition) condition).getMatchOutcome(context, metadata).isMatch();
        }
        return condition.matches(context, metadata);
    }
}
```

### OnPropertyCondition

```java
@Order(Ordered.HIGHEST_PRECEDENCE + 40)
class OnPropertyCondition extends SpringBootCondition {

    /**
     * 获取比对结果
     */
    @Override
    public ConditionOutcome getMatchOutcome(ConditionContext context, AnnotatedTypeMetadata metadata) {
        // 获取@ConditionalOnProperty注解的所有属性值，属性值是MultiValueMap类型
        List<AnnotationAttributes> allAnnotationAttributes = annotationAttributesFromMultiValueMap(
                metadata.getAllAnnotationAttributes(ConditionalOnProperty.class.getName()));
        // 初始化【比对不成功】列表
        List<ConditionMessage> noMatch = new ArrayList<>();
        // 初始化【比对成功】列表
        List<ConditionMessage> match = new ArrayList<>();
        // 循环计算每一个属性的比对结果
        for (AnnotationAttributes annotationAttributes : allAnnotationAttributes) {
            // 计算比对结果
            ConditionOutcome outcome = determineOutcome(annotationAttributes, context.getEnvironment());
            // 判断匹配结果是否成功，如果成功将结果的ConditionMessage加入【比对成功】列表，否则加入【比对不成功】列表
            (outcome.isMatch() ? match : noMatch).add(outcome.getConditionMessage());
        }
        // 如果【比对不成功】列表不为空，返回“匹配失败”的ConditionOutcome，条件不成立
        if (!noMatch.isEmpty()) {
            return ConditionOutcome.noMatch(ConditionMessage.of(noMatch));
        }
        // 返回“匹配成功”的ConditionOutcome，条件成立
        return ConditionOutcome.match(ConditionMessage.of(match));
    }

    /**
     * 将MultiValueMap中的属性数据转成AnnotationAttributes类型。
     */
    private List<AnnotationAttributes> annotationAttributesFromMultiValueMap(
            MultiValueMap<String, Object> multiValueMap) {
        List<Map<String, Object>> maps = new ArrayList<>();
        multiValueMap.forEach((key, value) -> {
            for (int i = 0; i < value.size(); i++) {
                Map<String, Object> map;
                if (i < maps.size()) {
                    map = maps.get(i);
                }
                else {
                    map = new HashMap<>();
                    maps.add(map);
                }
                map.put(key, value.get(i));
            }
        });
        List<AnnotationAttributes> annotationAttributes = new ArrayList<>(maps.size());
        for (Map<String, Object> map : maps) {
            annotationAttributes.add(AnnotationAttributes.fromMap(map));
        }
        return annotationAttributes;
    }

     /**
     * 计算比对结果
     */
    private ConditionOutcome determineOutcome(AnnotationAttributes annotationAttributes, PropertyResolver resolver) {
        // 用属性值实例化一个内部类Spec
        Spec spec = new Spec(annotationAttributes);
        // 初始化【未配置属性】列表
        List<String> missingProperties = new ArrayList<>();
        // 初始化【匹配失败属性】列表
        List<String> nonMatchingProperties = new ArrayList<>();
        // 匹配属性(传入missingProperties和nonMatchingProperties)
        spec.collectProperties(resolver, missingProperties, nonMatchingProperties);
        // 如果【未配置属性】列表不为空，返回实例化匹配失败的ConditionOutcome
        if (!missingProperties.isEmpty()) {
            return ConditionOutcome.noMatch(ConditionMessage.forCondition(ConditionalOnProperty.class, spec)
                    .didNotFind("property", "properties").items(Style.QUOTE, missingProperties));
        }
        // 如果【匹配失败属性】列表不为空，返回实例化匹配失败的ConditionOutcome
        if (!nonMatchingProperties.isEmpty()) {
            return ConditionOutcome.noMatch(ConditionMessage.forCondition(ConditionalOnProperty.class, spec)
                    .found("different value in property", "different value in properties")
                    .items(Style.QUOTE, nonMatchingProperties));
        }
        // 返回实例化匹配成功的ConditionOutcome
        return ConditionOutcome
                .match(ConditionMessage.forCondition(ConditionalOnProperty.class, spec).because("matched"));
    }

    private static class Spec {
        // 每个要匹配的属性前缀。如果没有指定前缀，前缀将自动以"."结尾。
        private final String prefix;

        // 属性的预期值。如果没有指定预期值，属性不能等于false字符串。
        private final String havingValue;

        // 要匹配的属性的名称。如果定义了前缀prefix，那么将使用prefix+name的形式进行匹配。
        private final String[] names;

        // names是否松散的，默认为true。
        private final boolean matchIfMissing;

        Spec(AnnotationAttributes annotationAttributes) {
            String prefix = annotationAttributes.getString("prefix").trim();
            // 如果前缀有值，且不是以"."结尾，在结尾加"."
            if (StringUtils.hasText(prefix) && !prefix.endsWith(".")) {
                prefix = prefix + ".";
            }
            this.prefix = prefix;
            this.havingValue = annotationAttributes.getString("havingValue");
            this.names = getNames(annotationAttributes);
            this.matchIfMissing = annotationAttributes.getBoolean("matchIfMissing");
        }

        private String[] getNames(Map<String, Object> annotationAttributes) {
            String[] value = (String[]) annotationAttributes.get("value");
            String[] name = (String[]) annotationAttributes.get("name");
            // name和value必须指定，不能同时为空
            Assert.state(value.length > 0 || name.length > 0,
                    "The name or value attribute of @ConditionalOnProperty must be specified");
            // name和value是互斥的，不能同时有值
            Assert.state(value.length == 0 || name.length == 0,
                    "The name and value attributes of @ConditionalOnProperty are exclusive");
            return (value.length > 0) ? value : name;
        }

        /**
         * 判断属性是否匹配
         */
        private void collectProperties(PropertyResolver resolver, List<String> missing, List<String> nonMatching) {
            // 循环配置属性是否匹配
            for (String name : this.names) {
                String key = this.prefix + name;
                // 如果处理器(理解为配置文件application.yml)中包含这个属性名，判断属性名对应的值是否和预期值匹配
                if (resolver.containsProperty(key)) {
                    if (!isMatch(resolver.getProperty(key), this.havingValue)) {
                        nonMatching.add(name);
                    }
                }
                else {
                    // 如果处理器中(理解为配置文件application.yml)中未包含这个属性，且matchIfMissing为false，将属性名加入【未配置属性】列表
                    if (!this.matchIfMissing) {
                        missing.add(name);
                    }
                }
            }
        }

        private boolean isMatch(String value, String requiredValue) {
            if (StringUtils.hasLength(requiredValue)) {
                return requiredValue.equalsIgnoreCase(value);
            }
            return !"false".equalsIgnoreCase(value);
        }

        @Override
        public String toString() {
            StringBuilder result = new StringBuilder();
            result.append("(");
            result.append(this.prefix);
            if (this.names.length == 1) {
                result.append(this.names[0]);
            }
            else {
                result.append("[");
                result.append(StringUtils.arrayToCommaDelimitedString(this.names));
                result.append("]");
            }
            if (StringUtils.hasLength(this.havingValue)) {
                result.append("=").append(this.havingValue);
            }
            result.append(")");
            return result.toString();
        }
    }
}
```

