---
title: SpringBoot组合注解
tag:
  - SpringBoot
category: Java
description: SpringBoot 组合注解是基于元注解（如 @Component、@RequestMapping）自定义的注解，用于简化配置。例如，@RestController 结合 @Controller 和 @ResponseBody，@SpringBootApplication 组合 @Configuration、@EnableAutoConfiguration、@ComponentScan，提升代码可读性和开发效率，适用于模块化开发。
date: 2025-03-23 12:42:19
---

## Java 注解

### 基本注解

1. 内置标准注解

```java
@Override       // 表示方法重写父类方法
@Deprecated    // 表示元素已过时
@SuppressWarnings // 抑制编译器警告
@SafeVarargs   // 表示可变参数使用是安全的
@FunctionalInterface // 表示接口是函数式接口
```

2. 元注解（用于注解其他注解）

```java
@Target        // 指定注解可以应用的元素类型
@Retention     // 指定注解的保留策略
@Documented    // 表示注解应包含在Javadoc中
@Inherited     // 表示注解可以被子类继承
@Repeatable    // 表示注解可以重复使用
```

### 注解分类

1. 按保留策略（即声明注解的生命周期，`@Retention`）

- SOURCE：仅保留在源码中，编译时丢弃
- CLASS：保留到 class 文件，但 JVM 不加载（默认）
- RUNTIME：保留到运行时，可通过反射读取

2. 按作用目标（即声明可以注解在哪些元素之上，`@Target`）

| 元素                        | 说明                   |
| --------------------------- | ---------------------- |
| ElementType.TYPE            | 注解在类、接口、枚举上 |
| ElementType.FIELD           | 注解在类中的字段上     |
| ElementType.METHOD          | 注解在类中的方法上     |
| ElementType.PARAMETER       | 注解在方法的参数前     |
| ElementType.CONSTRUCTOR     | 注解在类中构造方法上   |
| ElementType.LOCAL_VARIABLE  | 注解在局部变量前       |
| ElementType.ANNOTATION_TYPE | 注解在注解上           |
| ElementType.PACKAGE         | 注解在包名前           |

### 组合注解

`@Controller` 注解用来配置访问路径等，`@ResponseBody` 注解用来表明不做视图渲染，直接展示方法的运行结果（一般是转成 `json` 返回），而 `@RestController` 组合了两者的功能，可以配置访问路径，同时也可以直接展示方法的运行结果

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Controller  //组合 Controller 使其实现 Bean 注册
@ResponseBody  //组合 ResponseBody 使其支持将结果转化为 json
public @interface RestController {
 
    @AliasFor(annotation = Controller.class)
    String value() default "";
}
```

**使用案例**

简化 Web 层配置，需求：统一 Controller 层的公共配置（如日志、权限校验）。

```java
@RestController
@RequestMapping("/api/v1")
@CrossOrigin
@Tag(name = "API接口") // 例如 OpenAPI 的注解
public @interface RestApiController {
}
```

```java
@RestApiController
public class UserController {
    
    @GetMapping("/users")
    public List<User> getUsers() { 
        //... 
    }
}
```

## @AliasFor

### 显式别名

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Mapping
public @interface RequestMapping {
 
    @AliasFor("path")
    String[] value() default {};
 
    @AliasFor("value")
    String[] path() default {};
 
    //...
}
```

`value` 和 `path` 互为别名，互为别名的限制条件如下：

1. 互为别名的属性其属性值类型、默认值，都是相同的。
2. 互为别名的属性必须定义默认值。
3. 互为别名的注解必须成对出现。

### 隐式别名

```java
@ContextConfiguration
public @interface MyTestConfig {

   @AliasFor(annotation = ContextConfiguration.class, attribute = "locations")
   String[] value() default {};

   @AliasFor(annotation = ContextConfiguration.class, attribute = "locations")
   String[] groovyScripts() default {};

   @AliasFor(annotation = ContextConfiguration.class, attribute = "locations")
   String[] xmlFiles() default {};
}
```

因为 `value`、`groovyScripts`、`xmlFiles` 都定义了别名 `@AliasFor(annotation = ContextConfiguration.class, attribute = "locations")`，所以 `value`、`groovyScripts` 和 `xmlFiles` 也互为别名。

### 传递式隐式别名

```java
@MyTestConfig
public @interface GroovyOrXmlTestConfig {

   @AliasFor(annotation = MyTestConfig.class, attribute = "groovyScripts")
   String[] groovy() default {};

   @AliasFor(annotation = ContextConfiguration.class, attribute = "locations")
   String[] xml() default {};
}

@ContextConfiguration
public @interface MyTestConfig {

   @AliasFor(annotation = ContextConfiguration.class, attribute = "locations")
   String[] groovyScripts() default {};
}
```

`@AliasFor` 注解是允许别名之间的传递的，简单理解，如果 `A` 是 `B` 的别名，并且 `B` 是 `C` 的别名，那么 `A` 是 `C` 的别名

因为 `MyTestConfig` 中的 `groovyScripts` 属性是 `ContextConfiguration` 中的 `locations` 属性的别名；所以 `xml` 属性和 `groovy` 属性也互为别名

## 自定义注解

### 继承

```java
public class SynthesizedAnnotationTest {
 
    @Target({ ANNOTATION_TYPE, FIELD, TYPE })
    @Retention(RUNTIME)
    @interface Test1 {
        String test1() default "test1";
    }
 
    @Target({ ANNOTATION_TYPE, FIELD, TYPE })
    @Retention(RUNTIME)
    @interface Test2 {
        String test2() default "test2";
    }
 
    @Target({ ANNOTATION_TYPE, FIELD, TYPE })
    @Retention(RUNTIME)
    @Test2
    @interface Test3 {
        String test3() default "test3";
    }
 
    /**
     * 只有@Test3 注解，但是 Test3 注解上组合了@Test2 注解，故就可以通过 Spring 的工具类获取到 Test2 注解的内容，详见 main 方法
     * 当然也可以将组合注解作用于更高层次，如 Test3 组合 Test2, Test2 组合 Test1，然后将 Test3 作用于元素，通过工具类获取 Test1 注解功能
     */
    @Test3
    static class Element {}
   
    public static void main(String[] args) {
        Test2 test2 = AnnotatedElementUtils.getMergedAnnotation(Element.class, Test2.class);
        System.out.println(test2);
        // 输出'@mayfly.sys.common.utils.SynthesizedAnnotationTest$Test2(test2 = test2)'
    }
}
```

### 覆盖

```java
public class SynthesizedAnnotationTest {
 
    @Target({ ANNOTATION_TYPE, FIELD, TYPE })
    @Retention(RUNTIME)
    @interface Test1 {
        String test1() default "test1";
    }
 
    @Target({ ANNOTATION_TYPE, FIELD, TYPE })
    @Retention(RUNTIME)
    @interface Test2 {
        String test2() default "test2";
    }
 
    @Target({ ANNOTATION_TYPE, FIELD, TYPE })
    @Retention(RUNTIME)
    @Test2
    @interface Test3 {
        /**
         * AliasFor 注解用来表示要覆盖 Test2 注解中的 test2()属性方法，
         * annotation 属性声明的注解类必须存在于该注解的元注解上
         * attribute 属性声明的值必须存在于 Test2 注解属性方法中(即 Test2 注解的 test2 方法)
         */
        @AliasFor(annotation = Test2.class, attribute = "test2")
        String test3() default "test3";
    }
 
    /**
     * 只有@Test3 注解，但是 Test3 注解上组合了@Test2 注解，并将该注解的 test3 方法值用来覆盖 Test2 注解中的 test2 方法
     * 即更低层次声明的覆盖规则，会覆盖更高层次的属性方法值，即调用高层次的注解方法值实际显示的是低层所赋的值
     * 当然也可以将组合注解作用于更高层次，如 Test3 组合 Test2, Test2 组合 Test1，然后将 Test3 作用于元素，通过工具类获取 Test1 注解覆盖的属性值
     */
    @Test3(test3 = "覆盖Test2属性中的test2方法")
    static class Element {}

    public static void main(String[] args) {
        Test2 test2 = AnnotatedElementUtils.getMergedAnnotation(Element.class, Test2.class);
        // 虽然调用了 Test2 注解的 test2 方法，但是实际显示的是 Test3 注解中的 test3 属性声明的值
        // 则说明 Test2 的 test2 属性被覆盖了 
        System.out.println(test2.test2());
    }
}
```

### 合并

```java
@Documented
@Target({ElementType.TYPE,ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@A
@B
public @Interface C{   // 合并了 A, B 注解
    @AliasFor(annotation = A.class, attribute = "value")
    String aValue();
    
    @AliasFor(annotation = B.class, attribute = "value")
    String bValue();
}
```
