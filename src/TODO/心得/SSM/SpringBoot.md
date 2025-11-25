---
title: MySQL（3-事务和日志）
tags: MySQL
categories: 数据库
cover: /img/index/mysql.png
top_img: /img/index/mysql.png
published: false
abbrlink: 63240
date: 2024-11-22 22:38:34
description:
---

## SpringBoot、SpringMVC 和 Spring 的区别

1. Spring：最重要的特征是 DI 依赖注入。所有 Spring Modules 不是 DI 依赖注入就是 IOC 控制反转
2. SpringMVC：SpringMVC 提供了一种分离式的方法来开发 Web 应用。通过运用像 DispatcherServlet、ModelAndView 和 ViewResolver 等一些简单的概念，开发 Web 应用将会变得非常简单
3. SpringBoot：Spring 和 SpringMVC 的问题在于需要配置大量的参数，SpringBoot 为了简化 Spring 应用的创建、运行、调试、部署等而出现的，SpringBoot 通过一个自动配置和启动的项来解决这个问题

**SpringBoot 优点**

1. 独立运行：SpringBoot 内嵌了各种 servlet 容器，Tomcat、Jetty 等，现在不再需要打成 war 包部署到容器中，SpringBoot 只要打成一个可执行的 jar 包就能独立运行，所有的依赖包都在一个 jar 包内
2. 简化配置：spring-boot-starter-web 启动器自动依赖其他组件，减少了 maven 的配置
3. 自动配置：SpringBoot 能根据当前类路径下的类、jar 包来自动配置 bean，如添加一个 spring-boot-starter-web 启动器就能拥有 web 的功能，无需其他配置，避免大量的 maven 导入和各种版本冲突
4. 应用监控：SpringBoot 提供一系列端点可以监控服务及应用，做健康检测

## SpringBoot 的核心注解

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = {
    @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
    @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {}
```

1. @SpringBootApplication：在 Spring Boot 入口类中，唯一的一个注解就是@SpringBootApplication。他是 Spring Boot 项目的核心注解，用于开启自动配置，准确说是通过该注解内组合的@EnableAutoConfiguration 开启了自动配置
2. @EnableAutoConfiguration：打开自动配置的功能，也可以关闭某个自动配置的选项，如：关闭数据源自动配置功能：@SpringBootApplication(exclude ={DataSourceAutoConfiguration.class})。主要功能是启动 Spring 应用程序上下文进行自动配置，它会尝试猜测并配置项目可能需要的 Bean。自动配置通常是基于项目 classpath 中引入的类和已定义的 bean 来实现的
3. @Import 注解：@EnableAutoConfiguration 的关键功能是通过@Import 注解导入的 ImportSelector 来完成的，从源代码得知@Import(AutoConfigurationImportSelector.class)是@EnableAutoConfiguration 注解的组成部分，也是自动配置功能的核心实现者
4. @ComponentScan：Spring 组件扫描
5. @SpringBootConfiguration：组合了@Configuration 注解，实现配置文件的功能
6. @Conditional：可根据是否满足指定的条件来决定是否进行 Bean 的实例化及装配，比如，设定当类路径下包含某个 jar 包的时候才会对注解的类进行实例化操作
+ @ConditionalOnBean：在容器中有指定 bean 的条件下
+ @ConditionalOnClass：在 classpath 类路径下有指定类的条件下
+ @ConditionalOnCloudPlatform：当指定的云平台处于 active 状态时
+ @ConditionalOnExpression：基于 SpEL 表达式的条件判断
+ @ConditionalOnJava：基于 JVM 版本作为判断条件
+ @ConditionalOnJndi：在 JNDI 存在的条件下查找指定的位置
+ @ConditionalOnMissingBean：当容器里没有指定的 bean 时
+ @ConditionalOnMissingClass：当类路径下没有指定类的条件时
+ @ConditionalOnNotWebApplication：在项目不是一个 Web 项目的条件下
+ @ConditionalOnProperty：在指定的属性有指定值的条件下
+ @ConditionalOnResource：类路径是否有指定的值
+ @ConditionalOnSingleCandidate：当指定的 bean 在容器中只有一个或者有多个但是指定了首选的 bean 时
+ @ConditionalOnWebApplication：在项目是一个 Web 项目的条件下

## 什么是 JavaConfig？

指基于 Java 配置的 Spring，它提供了配置 Spring IOC 容器的纯 Java 方法，因此它有助于避免使用 XML 配置

1. @Configuration：放在一个类的上面，表示这个类是作为配置文件使用的
2. @Bean：声明对象，把对象放到容器中

```java
@Configuration
public class conf {
    
    @Bean
    public UserDao userDao(){
        return new UserDao();
    }

    @Bean
    public UserService userService(){
        return new UserService();
    }
}
```

优点：

1. 面向对象的配置：由于配置被定义为 JavaConfig 中的类，因此用户可以充分利用 Java 中的面向对象功能，一个配置类可以继承另一个，重写它的@Bean 方法等
2. 减少或消除 XML 配置：许多开发人员不希望在 XML 和 Java 之间来回切换，JavaConfig 为开发人员提供了一种纯 Java 方法来配置与 XML 配置概念相似的 Spring 容器
3. 类型安全和重构友好：由于 Java5.0 对泛型的支持，现在可以按类型而不是按名称检索 bean，不需要任何强制转换或基于字符串的查找

## 什么是 Spring Profiles？

针对应用程序，不同环境需要不同配置加载的一种解决方案。允许用户根据配置文件（dev，test，prod 等）来注册 bean。当应用程序在开发运行时，只有某些 bean 可以加载，而在 production 中，某些其他 bean 可以加载。假设我们的文档仅适用于 QA 环境，并且禁用所有其他文档，这可以使用配置文件来完成。

### 分支环境

1. pro 环境：生产环境，面向外部用户的环境，连接上互联网即可访问的正式环境
2. pre 环境：灰度环境，外部用户可以访问，但是服务器配置相对低，其他和生产一样
3. test 环境：测试环境，外部用户无法访问，专门给测试人员使用的，版本相对稳定
4. dev 环境：开发环境，外部用户无法访问，开发人员使用，版本变动很大

### 区分 Bean

1. 通过@Profile 注解可以为一个 Bean 赋予对应的 profile 名称

```java
@Component
@Profile("dev")
public class DevDatasourceConfig

/*
上面的DevDatasourceConfig被定义为profile=dev，该Bean只会在dev（开发模式）被启用
如果需要定义为非dev环境，采用下面的方式：
*/
@Component
@Profile("!dev")
public class DevDatasourceConfig
```

2. XML 风格配置

```xml
<beans profile="dev">
    <bean id="devDatasourceConfig" class="org.baeldung.profiles.DevDatasourceConfig" />
</beans>
```

3. 读取 Profile

```java
public class ProfileManager {
    @Autowired
    Environment environment;

    public void getActiveProfiles() {
        for (final String profileName : environment.getActiveProfiles()) {
            System.out.println("Currently active profile - " + profileName);
        }   
    }
}
```

### 设置 Profile

1. WebApplicationInitializer 接口

在 Web 应用程序中，通过 ApplicationInitializer 可以对当前的 ServletContext 进行配置

```java
@Configuration
public class MyWebApplicationInitializer implements WebApplicationInitializer {

    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        servletContext.setInitParameter("spring.profiles.active", "dev");
    }
}
```

2. 通过 web.xml 定义

在 web.xml 中通过 context-param 元素也可以设置 profile，但前提是当前应用程序使用了 xml 的配置文件风格

```xml
<context-param>
  <param-name>contextConfigLocation</param-name>
  <param-value>/WEB-INF/app-config.xml</param-value>
</context-param>
<context-param>
  <param-name>spring.profiles.active</param-name>
  <param-value>dev</param-value>
</context-param>
```

3. JVM 启动参数

`java -jar application.jar -Dspring.profiles.active = dev`

4. 环境变量

在 Unix/Linux 环境中，可以通过环境变量注入 profile 的值

```java
export spring_profiles_active=dev
java -jar application.jar 
```

5. application.properties

`spring.profiles.active = dev`

6. Maven Profile

```xml
<profiles>
  <profile>
    <id>dev</id>
    <activation>
      <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
      <spring.profiles.active>dev</spring.profiles.active>
    </properties>
  </profile>
  <profile>
    <id>prod</id>
    <properties>
      <spring.profiles.active>prod</spring.profiles.active>
    </properties>
  </profile>
</profiles>

<build>
  <resources>
    <resource>
      <directory>src/main/resources</directory>
      <filtering>true</filtering>
    </resource>
  </resources>
</build>
```

在 SpringBoot 的配置文件 application.properties 中，需要替换这个为 maven 传入的 property

```properties
## 使用Maven的属性进行替换
spring.profiles.active=@spring.profiles.active@
```

7. 使用@ActiveProfiles

```java
@ActiveProfiles("test")
public void ApiTest{
  ...
}
```

8. 使用 ConfigurationEnvironment

```java
SpringApplication application = new SpringApplication(MyApplication.class);

//设置 environment 中的 profiler
ConfigurableEnvironment environment = new StandardEnvironment();
environment.setActiveProfiles("dev","join_dev");

application.setEnvironment(environment);
application.run(args)
```

9. SpringApplication.setAdditionalProfiles

```java
SpringApplication application = new SpringApplication(MyApplication.class);
application.setAdditionalProfiles("new_dev");
```

### 优先级

1. SpringApplication.setAdditionalProfiles
2. ConfigurableEnvironment、@ActiveProfiles
3. web.xml 的 context-param
4. WebApplicationInitializer
5. JVM 启动参数
6. 环境变量
7. Maven profile、application.properties

## SpringBoot 解决跨域问题

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowCredentials(true)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .maxAge(3600);
    }
}
```

我们知道一个 http 请求，先走 filter，到达 servlet 后才进行拦截器的处理，如果我们把 cors 放在 filter 里，就可以优先于拦截器执行

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.addAllowedOrigin("*");
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource urlBasedCorsConfigurationSource = new UrlBasedCorsConfigurationSource();
        urlBasedCorsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);
        return new CorsFilter(urlBasedCorsConfigurationSource);
    }
}
```

## SpringBoot 打成的 jar 和普通 jar 包的区别

SpringBoot 项目最终打包成的 jar 是可执行 jar，这种 jar 可以直接通过 java -jar xxx.jar 命令来运行，这种 jar 不可以作为普通的 jar 被其他项目依赖，即使依赖了也无法使用其中的类。主要是它和普通 jar 的结构不同，普通的 jar 包解压后直接就是包名，包里就是我们的代码，而 SpringBoot 打包成的可执行 jar 解压后，在\BOOT-INF\classes 目录下才是我们的代码，因此无法被直接引用。如果非要引用，可以在 pom.xml 文件中增加配置，将 SpringBoot 项目打包成两个 jar，一个可执行，一个可引用

## SpringBoot 启动流程

1. 启动 main 方法开启
2. 初始化配置：通过类加载器（loadFactories）读取 classpath 下所有的 spring.factories 配置文件，创建一些初始配置对象，通知监听者应用程序启动开始，创建环境对象 environment，用于读取环境配置，如：application.yaml
3. 创建应用程序上下文（createApplicationContext），创建 bean 工厂对象
4. 刷新上下文（启动核心）
5. 配置工厂对象，包括上下文类加载器、bean 工厂发布处理器（beanFactoryPostProcessor）
6. 注册并实例化 bean 工厂发布处理器，并且调用这些处理器，对包扫描解析（主要是 class 文件）
7. 注册并实例化 bean 发布处理器（beanPostProcessor）
8. 初始化一些与上下文有特别关系的 bean 对象（创建 tomcat 服务器）
9. 实例化所有 bean 工厂缓存的 bean 对象（剩下的）
10. 发布通知——通知上下文刷新完成（启动 tomcat 服务器）
11. 通知监听者——启动程序完成，启动中，大部分对象都是 BeanFactory 对象通过反射创建

**run 方法启动**

```java
@SpringBootApplication //启动必要注解
public class YourApplication {
	//运行 main 方法启动 springboot
	public static void main(String[] args) {
		SpringApplication.run(YourApplication.class, args);//启动类静态 run 方法
	}
}
```

启动类在运行静态 run 方法的时候，先创建一个 SpringApplication 对象，再运行对象的 run 方法，工厂初始配置在构造函数中完成，run 方法定义运行

**初始化配置**

SpringBoot 启动应用程序之前，loadSpringFactories(classLoader)读取运行环境中所有 META-INF/spring.factories 配置，会创建一些初始化对象和监听器。通过反射获取这些类的 Class，再创建这些对象，完成后再启动监听器，创建应用程序环境，读取 application.properties 或者 application.yaml 文件

```java
// 静态方法 org.springframework.boot.SpringApplication.run(Class <?> [], String [])
public static ConfigurableApplicationContext run(Class<?>[] primarySources, String[] args) {
    return new SpringApplication(primarySources).run(args);
}

// 构造方法
public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
    //.......... 
    //// 1.(loadFactories)读取 classpath 下所有的 spring.factories 配置文件 ////
    // 配置应用程序启动前的初始化对象
    setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class)); 
    // 配置应用程序启动前的监听器
    setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
    this.mainApplicationClass = deduceMainApplicationClass();
}

//看一下 getSpringFactoriesInstances 方法
private <T> Collection<T> getSpringFactoriesInstances(Class<T> type) {
    return getSpringFactoriesInstances(type, new Class<?>[] {});
}

private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
    ClassLoader classLoader = getClassLoader();
    // 获取初始化类的类名
    Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
    // 通过这些类名实例化对象
    List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
    AnnotationAwareOrderComparator.sort(instances);
    return instances;
}

// 读取配置方法
// 更详深层的代码在 org.springframework.core.io.support.SpringFactoriesLoader.loadSpringFactories(ClassLoader)
public static List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader) {
    String factoryTypeName = factoryType.getName();
    return loadSpringFactories(classLoader).getOrDefault(factoryTypeName, Collections.emptyList());   
}
// loadSpringFactories(classLoader)读取运行环境中所有 META-INF/spring.factories 配置


// 对象 run 方法 开始启动程序
public ConfigurableApplicationContext run(String... args) {
    //......
    // 通知监听者启动开始
    listeners.starting(); 
    try {
        // 创建应用程序环境 配置文件在此处读取(application.properties application.yml)
        ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
        //// 2.创建应用程序上下文...此处创建了 beanfactory ////
        context = createApplicationContext();
        //// 3.刷新上下文（spring 启动核心） ////
        refreshContext(context);

        //// 4.启动完成通知...... ////
        listeners.started(context);
    }
    catch (Throwable ex) {
        handleRunFailure(context, ex, exceptionReporters, listeners);
        throw new IllegalStateException(ex);
    }
    try {
        listeners.running(context);
    }
    catch (Throwable ex) {
        handleRunFailure(context, ex, exceptionReporters, null);
        throw new IllegalStateException(ex);
    }
    return context;
}
```

**创建应用上下文**

初始化和配置好后，开始创建应用程序上下文（createApplicationContext），关键的工厂 BeanFactory 就是在这里创建

```java
// 创建应用程序上下文
context = createApplicationContext();

protected ConfigurableApplicationContext createApplicationContext() {
    // 上下文创建的判断逻辑
    Class<?> contextClass = this.applicationContextClass;
    if (contextClass == null) {
        try {
            switch (this.webApplicationType) {
                case SERVLET:
                    contextClass = Class.forName(DEFAULT_SERVLET_WEB_CONTEXT_CLASS);
                    break;
                case REACTIVE:
                    contextClass = Class.forName(DEFAULT_REACTIVE_WEB_CONTEXT_CLASS);
                    break;
                default:
                    contextClass = Class.forName(DEFAULT_CONTEXT_CLASS);
            }
        }
        catch (ClassNotFoundException ex) {
            throw new IllegalStateException(
                "Unable create a default ApplicationContext, please specify an ApplicationContextClass", ex);
        }
    }
    return (ConfigurableApplicationContext) BeanUtils.instantiateClass(contextClass);
}

public static final String DEFAULT_SERVLET_WEB_CONTEXT_CLASS = "org.springframework.boot."
			+ "web.servlet.context.AnnotationConfigServletWebServerApplicationContext";
// 默认是创建这个类
```

**刷新应用上下文**

创建好上下文之后，开始刷新上下文，如：工厂配置，bean 处理器配置，类的扫描，解析，bean 定义，bean 类信息缓存，服务器创建，bean 实例化，动态代理对象的创建等

注意：注册 bean 信息和实例化 bean 是两回事

1. 注册 bean 对象不是创建 bean 对象，是解析 bean 类获取详细信息，会创建 BeanDefinition 对象，携带 bean 类的字节码和方法等信息，把 BeanDefinition 对象注册保存到工厂 BeanDefinitionMap 中
2. 工厂实例化 bean 时直接 BeanDefinitionMap.get(beanName)获取 bean 的字节码信息，通过反射创建对象，然后将 bean 对象保存到 singletionObjects 中

```java
refreshContext(context); //刷新上下文

@Override
public void refresh() throws BeansException, IllegalStateException {
    synchronized (this.startupShutdownMonitor) {
        //......
        // 3.1 配置工厂对象
        prepareBeanFactory(beanFactory);
        try {       
            postProcessBeanFactory(beanFactory);
            
            // 3.2 注册并实例化 bean 工厂处理器, 并调用他们
            invokeBeanFactoryPostProcessors(beanFactory);
            
            // 3.3 注册并实例化 bean 处理器
            registerBeanPostProcessors(beanFactory);
            
            // 3.4 初始化一些与上下文有特别关系的 bean 对象（创建 tomcat）
            onRefresh();
            
            // 3.5 实例化所有 bean 工厂缓存的 bean 对象（剩下的）.
            finishBeanFactoryInitialization(beanFactory);
            
            // 3.6 发布通知-通知上下文刷新完成（包括启动 tomcat）
            finishRefresh();
        }
        catch (BeansException ex) {// ......Propagate exception to caller.
            throw ex;
        }
        finally {// ......
            resetCommonCaches();
        }
    }
}
```

**配置工厂对象，包括上下文类加载器，bean 工厂发布处理器**

工厂创建好后，首先配置的是类加载器，然后是一些对象发布处理器（拦截器）

```java
// 3.1 配置工厂对象 
prepareBeanFactory(beanFactory);

protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
    // 设置类加载器
    beanFactory.setBeanClassLoader(getClassLoader());
    beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
    beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));

    // 添加 BeanPostProcessor
    beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
    beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
    beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
	// ......
}
```

**注册并实例化 bean 工厂发布处理器，并调用它们**

过程主要是工厂发布处理器的创建和调用

```java
//// 3.2 注册并实例化 bean 工厂处理器, 并调用他们
invokeBeanFactoryPostProcessors(beanFactory);

protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
    PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());
    // ......
}

// PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors
public static void invokeBeanFactoryPostProcessors(
			ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {
    postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
    for (String ppName : postProcessorNames) {
        if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
            // 创建 BeanDefinitionRegistryPostProcessor 处理器
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
            processedBeans.add(ppName);
        }
    }
    // 调用这些处理器
    invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
    // ...
}

// 循环调用
private static void invokeBeanDefinitionRegistryPostProcessors(
			Collection<? extends BeanDefinitionRegistryPostProcessor> postProcessors, BeanDefinitionRegistry registry) {
    for (BeanDefinitionRegistryPostProcessor postProcessor : postProcessors) {
        postProcessor.postProcessBeanDefinitionRegistry(registry);
    }
}

//// 3.3 注册并实例化 bean 处理器
registerBeanPostProcessors(beanFactory);
```

BeanFactoryPostProcessors 和 BeanPostProcessors 的区别：

1. BeanFactoryPostProcessors 是工厂发布处理器，定义什么是 bean，知道哪些是 bean 类，解析 class 文件，包括注解解析，成员对象依赖解析等，BeanPostProcessors 主要在 BeanFactoryPostProcessors 调用完之后工作
2. 一般在 bean 对象的创建之前或之后，BeanFactory 调用这些 bean 处理器拦截处理，Spring 代理对象也是通过 beanPostProcessor 处理器来实现

**bean 发布处理器生产 AOP 代理对象**

```java
// org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(String, Object, RootBeanDefinition)
// bean 初始化
protected Object initializeBean(String beanName, Object bean, @Nullable RootBeanDefinition mbd) {
    invokeAwareMethods(beanName, bean);
    Object wrappedBean = bean;
    if (mbd == null || !mbd.isSynthetic()) {
        // 初始化之前，拦截
        wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
    }
    invokeInitMethods(beanName, wrappedBean, mbd);
    if (mbd == null || !mbd.isSynthetic()) {
        // 初始化之后拦截
        wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
    }
    return wrappedBean;
}

@Override
public Object applyBeanPostProcessorsAfterInitialization(Object existingBean, String beanName)
    throws BeansException {
    Object result = existingBean;
    for (BeanPostProcessor processor : getBeanPostProcessors()) {
        // 循环 bean 发布处理器调用 postProcessAfterInitialization 方法  
        Object current = processor.postProcessAfterInitialization(result, beanName);
        if (current == null) {
            return result;
        }
        result = current;
    }
    return result;
}
```

**初始化一些与上下文有特别关系的 bean 对象**

默认 tomcat 服务器的创建就是此方法完成，此处定义特别的 bean 创建，一般是服务器有关或个性化对象

```java
//// 3.4 初始化一些与上下文有特别关系的 bean 对象
onRefresh();

// org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext
// 子类 context 重写
@Override
protected void onRefresh() {
    super.onRefresh();
    try {
        createWebServer(); //创建服务器
    }
    catch (Throwable ex) {
        throw new ApplicationContextException("Unable to start web server", ex);
    }
}

private void createWebServer() {
    WebServer webServer = this.webServer;
    ServletContext servletContext = getServletContext();
    if (webServer == null && servletContext == null) {
        ServletWebServerFactory factory = getWebServerFactory();
        this.webServer = factory.getWebServer(getSelfInitializer()); 
        // 默认创建 tomcat 服务器
        // org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory.getWebServer()
    }
    // ......
    initPropertySources();
}
```

**实例化所有 bean 工厂缓存的 bean 对象**

服务器启动后，创建 spring 工厂里面缓存的 bean 信息（没有被创建的单例）

```java
//// 3.5 实例化所有 bean 工厂缓存的 bean 对象（剩下的）.
finishBeanFactoryInitialization(beanFactory);

protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
    // ......
    // Instantiate all remaining (non-lazy-init) singletons.
    beanFactory.preInstantiateSingletons();
}

// 子类 org.springframework.beans.factory.support.DefaultListableBeanFactory 实现方法，完成剩下的单例 bean 对象创建
@Override
public void preInstantiateSingletons() throws BeansException {
    List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);
    for (String beanName : beanNames) {
        RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
        if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
                getBean(beanName); //创建还没有实例化的 bean 对象
        }
    }
}
```

**发布通知——通知上下文刷新完成**

上下文初始化完成之后，启动 tomcat 服务器

```java
finishRefresh();

// super.finishRefresh
protected void finishRefresh() {
    // ...... 发布刷行完成事件
    // Publish the final event.
    publishEvent(new ContextRefreshedEvent(this));
}

// org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.finishRefresh()
@Override
protected void finishRefresh() {
    super.finishRefresh();
    WebServer webServer = startWebServer();// 启动服务器
    if (webServer != null) {
        publishEvent(new ServletWebServerInitializedEvent(webServer, this));
    }
}
```

**通知监听者——启动程序完成**

发布通知监听器启动完成，监听器会根据事件类型做个性化操作

```java
listeners.started(context);
listeners.running(context);

void started(ConfigurableApplicationContext context) {
    for (SpringApplicationRunListener listener : this.listeners) {
        listener.started(context);
    }
}

void running(ConfigurableApplicationContext context) {
    for (SpringApplicationRunListener listener : this.listeners) {
        listener.running(context);
    }
}

@Override
public void started(ConfigurableApplicationContext context) {
    context.publishEvent(new ApplicationStartedEvent(this.application, this.args, context));
}

@Override
public void running(ConfigurableApplicationContext context) {
    context.publishEvent(new ApplicationReadyEvent(this.application, this.args, context));
}
```

## SpringBoot 自动装配机制

自动装配原理（主要思想：约定大于配置）

1. @SpringBootApplication：启动类注解
2. @EnableAutoConfiguration：自动配置注解
3. AutoConfigurationImportSelector：自动配置导入类
4. SpringFactoriesLoader：加载所有 META-INF/spring.factories
5. ImportSelector：生成配置类的 bean 放入容器当中

SpringBoot 在启动的时候从类路径下的 META-INF/spring.factories 中获取 EnableAutoConfiguration 指定的值，将这些值作为自动配置类导入容器，自动配置类就生效，帮我们进行自动配置工作。整个 J2EE 的整体解决方案和自动配置都在 springboot-autoconfigure 的 jar 中，它会给容器中导入非常多的自动配置类（xxxAutoConfiguration），就是给容器中导入这个场景需要的所有组件，并配置好这些组件。有了自动配置类，免去了我们手动编写配置注入功能组件等的工作

**注解**

1. @SpringBootApplication

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented//表明这个注解应该被 javadoc 记录
@Inherited//表明子类可以继承这个注解
@SpringBootConfiguration//继承了@Configuration 注解，表示当前类是注解类
@EnableAutoConfiguration//开启 SpringBoot 的自动注解功能，其主要借助@import注解实现的
@ComponentScan(//扫描路径配置（具体使用待配置）
    excludeFilters = {@Filter(
        type = FilterType.CUSTOM,
        classes = {TypeExcludeFilter.class}
    ), @Filter(
        type = FilterType.CUSTOM,
        classes = {AutoConfigurationExcludeFilter.class}
    )}
)
public @interface SpringBootApplication {
}
```

2. @SpringBootConfiguration：该注解中有一个@Configuraion 注解，表示这个 SpringBoot 启动类是一个配置类，最终要被注入到 Spring 容器中
3. @ComponentScan：该注解是包扫描注解，等同于 XML <context:component-scan> 标签，目的是用来扫描包路径，如果不指定路径，默认加载的是启动类所在目录下面所有的对象

注意：@ComponentScan 并不会把类所在的包注入到容器中，@ComponentScan 只注入指定的包，类所在的包通过@AutoConfigurationPackage 注入

4. @EnableAutoConfiguration：表示开启自动配置

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage //作用：将 main 包下的所有组件注册到容器中
@Import({AutoConfigurationImportSelector.class}) //加载自动装配类 xxxAutoconfiguration
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}
```

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Import({Registrar.class})
public @interface AutoConfigurationPackage {
    String[] basePackages() default {};

    Class<?>[] basePackageClasses() default {};
}
```

@AutoConfigurationPackage 注解导入了 Register.class，其本质是一个 ImportBeanDefinitionRegister，Register 类的作用是将启动类所在包下的所有子包的组件扫描注入到 Spring 容器中

```java
static class Registrar implements ImportBeanDefinitionRegistrar, DeterminableImports {
    Registrar() {
    }

    public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
        AutoConfigurationPackages.register(registry, (String[])(new AutoConfigurationPackages.PackageImports(metadata)).getPackageNames().toArray(new String[0]));
    }

    public Set<Object> determineImports(AnnotationMetadata metadata) {
        return Collections.singleton(new AutoConfigurationPackages.PackageImports(metadata));
    }
}
```

@Import({AutoConfigurationImportSelector.class})中的 AutoConfigurationImportSelector 实现了 ImportSelector 接口，会按照注解内容去装载需要的 Bean

```java
public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware, ResourceLoaderAware, BeanFactoryAware, EnvironmentAware, Ordered {
}

public interface DeferredImportSelector extends ImportSelector {
}

public interface ImportSelector {
    String[] selectImports(AnnotationMetadata var1);
}
```

```java
public String[] selectImports(AnnotationMetadata annotationMetadata) {
    //判断自动装配开关是否打开
    if (!this.isEnabled(annotationMetadata)) {
        return NO_IMPORTS;
    } else {
        // 获取需要自动装配的 AutoConfiguration 列表
        AutoConfigurationImportSelector.AutoConfigurationEntry autoConfigurationEntry = this.getAutoConfigurationEntry(annotationMetadata);
        // 获取自动装配类的类名称列表
        return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
    }
}

// 获取需要自动装配的 AutoConfiguration 列表
protected AutoConfigurationImportSelector.AutoConfigurationEntry getAutoConfigurationEntry(AnnotationMetadata annotationMetadata) {
    if (!this.isEnabled(annotationMetadata)) {
        return EMPTY_ENTRY;
    } else {
        // 获取注解中的属性
        AnnotationAttributes attributes = this.getAttributes(annotationMetadata);
        // 获取所有 META-INF/spring.factories 中的 AutoConfiguration 类
        List<String> configurations = this.getCandidateConfigurations(annotationMetadata, attributes);
        // 删除重复的类
        configurations = this.removeDuplicates(configurations);
        // 获取注解中 Exclude 的类
        Set<String> exclusions = this.getExclusions(annotationMetadata, attributes);
        this.checkExcludedClasses(configurations, exclusions);
        // 移除所有被 Exclude 的类
        configurations.removeAll(exclusions);
        // 使用 META-INF/spring.factories 中配置的过滤器
        configurations = this.getConfigurationClassFilter().filter(configurations);
        // 广播相关的事件
        this.fireAutoConfigurationImportEvents(configurations, exclusions);
        // 返回符合条件的配置类。
        return new AutoConfigurationImportSelector.AutoConfigurationEntry(configurations, exclusions);
    }
}
```

SpringBoot 自动装配其实就是通过扫描配置，将所需要的 Bean 对象以 JavaConfig 的方式注入到 Spring 容器中，是通过 SpringFactoriesLoader 来加载 META-INF/spring.factories 文件里所有配置的 EnableAutoConfiguration，根据@Conditional 注解的条件，最终通过过滤和移除确定哪些是需要被装配的类，进行自动配置并将 Bean 注入 Spring Context

## 如何不停机更新项目？

### 使用 Nacos 的权重功能

不停服更新应用的流程：

1. 将 user1 的权重设置为 0
2. 更新 user1
3. user1 启动完毕后，恢复 user1 的权重为 1，将 user2 的权重设置为 0
4. 更新 user2
5. 恢复 user2 的权重为 1

注意：修改完之后，所有网关的请求都会转发到权重不为 0 的实例上边，但 feign 请求还是会到达权重为 0 的实例上边

解决方法：需要修改 feign 的负载均衡器（ribbon 或者 loadbalancer），将其改为从 Nacos 获得实例，根据权重选择实例

### 使用强制路由中间件

不停服更新应用的流程：

1. 将 user2 设置为强制路由
2. 更新 user1
3. user1 启动完毕后，取消 user2 的强制路由，将 user1 设置为强制路由
4. 更新 user2
5. 取消 user1 的强制路由

## Spring.factories 作用

在 SpringBoot 中，如果想把容器注册在 Spring 中，那么路径必须在 SpringApplication 启动类包的根路径下，没有的话，也有 2 种方式进行注册：

1. 使用@Import 注解引入
2. 使用 spring.factories 文件

### @Import

```java
@SpringBootApplication
@Import(ServiceB.class) // 通过@Import 注解把 ServiceB 添加到 IOC 容器里面去
public class MyBatisApplication {   
    public static void main(String[] args) {
        SpringApplication.run(MyBatisApplication.class, args);
    }
}
```

### SPI 扩展机制

SPI 的全名为 Service Provider Interface，是针对厂商或者插件的，在 SpringBoot 中也有一种类似 SPI 的加载机制，路径位于 jar 包中的 META-INF/spring.factories，数据为 key = value 格式存储，作用就是为了将指定类注入到 Bean 中

```properties
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.apache.cxf.spring.boot.autoconfigure.CxfAutoConfiguration,\
org.apache.cxf.spring.boot.autoconfigure.openapi.OpenApiAutoConfiguration,\
org.apache.cxf.spring.boot.autoconfigure.micrometer.MicrometerMetricsAutoConfiguration
```

### 总结

1. 如果在项目中，想把某个类加载到 Spring 中，那么可以使用@Component 注解进行加载
2. 但如果要加载一个独立 jar 包中的类，就需要使用 spring.factories，spring.factories 文件就是为了解决 jar 包中的类加载到容器中的，SpringBoot 在 SpringFactoriesLoader 类中，以硬编码的方式指定了 spring.factories 这个路径，所以这个文件就是一个扩展点

## <font style="color:rgb(77, 77, 77);"> CommandLineRunner </font>

在使用 SpringBoot 构建项目时，通常有一些预先数据的加载，SpringBoot 提供了一个简单的方式来实现（CommandLineRunner）

CommandLineRunner 是一个接口，我们需要时只需实现该接口就行，如果存在多个加载的数据，可以使用@Order 注解来排序

```java
@Component
@Order(value = 2)
public class MyStartupRunner1 implements CommandLineRunner{
    @Override
    public void run(String... strings) throws Exception {
        System.out.println(">>>>>>>>>>>>>>>服务启动执行，执行加载数据等操作 MyStartupRunner1 order 2 <<<<<<<<<<<<<");
    }
}

@Component
@Order(value = 1)
public class MyStartupRunner2 implements CommandLineRunner {
    @Override
    public void run(String... strings) throws Exception {
        System.out.println(">>>>>>>>>>>>>>>服务启动执行，执行加载数据等操作 MyStartupRunner2 order 1 <<<<<<<<<<<<<");
    }
}
```

