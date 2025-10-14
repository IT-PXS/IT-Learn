---
title: 
tags:
  - Java
  - Spring
categories: Java
cover: /img/index/
top_img: /img/index/
description: 
published: false
abbrlink: 51290
date: 2024-12-29 12:42:19
---

## Java Agent 是什么？

在 JDK 1.5 之后，JVM 提供了探针接口（Instrumentation 接口），便于开发人员基于 Instrumentation 接口编写 Java Agent。但是，Instrumentation 接口底层依然依赖 JVMTI 语义的 Native API，相当于给用户封装了一下，降低了使用成本。

在 JDK 1.6 及之后的版本，JVM 又提供了 Attach 接口，便于开发人员使用 Attach 接口实现 Java Agent。和 Instrumentation 接口一样，Attach 接口底层也依赖 JVMTI 语义的 Native API。

简而言之，Java Agent 可以理解为是一种特殊的 Java 程序，是 Instrumentation 接口的客户端。

## 执行方式

与普通 Java 程序通过 main 方法启动不同，Java Agent 并不是一个可以单独启动的程序，它必须依附在一个 Java 应用程序（JVM）上，与主程序运行在同一个 JVM 进程中，通过 Instrumentation 接口与 JVM 进行交互。

Java Agent 提供了一种在加载字节码时对字节码进行修改的能力，有两种执行方式：

1. 在应用运行之前，通过 premain()方法来实现「在应用启动时侵入并代理应用」，这种方式是利用 Instrumentation 接口实现的；

应用在启动时，会优先加载 Java Agent，并执行 premain()方法，这时部分的类都还没有被加载。此时，可以实现对新加载的类进行字节码修改，但如果 premain()方法执行失败或者抛出异常，则 JVM 会被终止

2. 在应用运行之后，通过 Attach API 和 agentmain()方法来实现「在应用启动后的某一个运行阶段中侵入并代理应用」，这种方式是利用 Attach 接口实现的。

Attach 接口其实是 JVM 进程之间的沟通桥梁，底层通过 Socket 进行通信，JVM A 可以发送指令给 JVM B，JVM B 在收到指令之后执行相应的逻辑。比如，在命令行中经常使用的 Jstack、Jcmd、Jps 等，都是基于这种机制实现的。

## 使用场景

1. 调试代码：通过 IDEA 调试代码就是基于 Java Agent 技术实现的
2. 热部署：在应用运行时在线升级软件，而不需要重启应用
3. 在线诊断：借助热部署工具，可以在不修改应用代码的情况下，对业务问题进行诊断
4. 性能分析

## 基本使用

### premain

**常用方法**

premain 方法只允许以下两种定义方式：

```java
public static void premain(String agentArgs)

public static void premain(String agentArgs, Instrumentation inst)
```

当以上两种方式都存在时，带有 Instrumentation 参数的方法的优先级更高，会被 JVM 优先加载。

**使用案例**

1. 代码编写

```java
public class TestAgent {
    /**
     * 注意方法名必须是premain
     */
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("----------哈哈，我是PreMainAgent");
        System.out.println("----------agentArgs = " + agentArgs);
    }
}
```

2. 使用 maven 插件配置 javaagent 工程

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.1.0</version>
    <configuration>
        <archive>
            <!--自动添加META-INF/MANIFEST.MF -->
            <manifest>
                <addClasspath>true</addClasspath>
            </manifest>
            <manifestEntries>
                <!--指定包含premain方法的类，需要配置为类的全路径名，必须配置-->
                <Premain-Class>com.example.javaagent.TestAgent</Premain-Class>
                <!--是否可以重新定义class，默认为false，可选配置-->
                <Can-Redefine-Classes>true</Can-Redefine-Classes>
                <!--是否可以重新转换class，实现字节码替换，默认为false，可选配置。-->
                <Can-Retransform-Classes>true</Can-Retransform-Classes>
                <!--是否可以设置Native方法的前缀，默认为false，可选配置。-->
                <Can-Set-Native-Method-Prefix>true</Can-Set-Native-Method-Prefix>
            </manifestEntries>
        </archive>
    </configuration>
</plugin>
```

3. 通过 maven 打包成一个 jar 包，在其他项目运行时设置 JVM 参数信息（-javaagent: jar 包路径）

**使用注意**

1. agent 的方法名必须是 premain

2. 如果在 premain 方法中抛出异常，会导致后面的项目启动失败（为了解决 premain 模式的缺陷，在 JDK 1.6 引入了 agentmain 模式）

```java
public class TestAgent {

    /**
     * 注意方法名必须是premain
     */
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("----------哈哈，我是PreMainAgent");
        System.out.println("----------agentArgs = " + agentArgs);
        throw new RuntimeException("抛出异常");
    }
}
```

### agentmain

**常用方法**

上面介绍的 Instrumentation 是在 JDK 1.5 中提供的，开发者只能在 main 加载之前添加手脚，在 Java SE 6 的 Instrumentation 当中，提供了一个新的代理操作方法：agentmain，可以在 main 函数开始运行之后再运行。

attach 模式的 attachmain 方法只允许以下两种定义方式：

```java
public static void agentmain(String agentArgs)

// 采用attach机制，被代理的目标程序VM有可能很早之前已经启动，当然其所有类已经被加载完成，这个时候需要借助Instrumentation#retransformClasses(Class<?>... classes)让对应的类可以重新转换，从而激活重新转换的类执行ClassFileTransformer列表中的回调
public static void agentmain(String agentArgs, Instrumentation inst)
```

当以上两种方式都存在时，带有 Instrumentation 参数的方法的优先级更高，会被 JVM 优先加载。

**使用案例**

1. 代码编写

```java
public class TestAgent {

    public static void agentmain(String agentArgs, Instrumentation inst) {
        System.out.println("----------哈哈，我是PreMainAgent");
        System.out.println("----------agentArgs = " + agentArgs);
    }
}
```

2. 使用 maven 插件配置 javaagent 工程

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.1.0</version>
    <configuration>
        <archive>
            <!--自动添加META-INF/MANIFEST.MF -->
            <manifest>
                <addClasspath>true</addClasspath>
            </manifest>
            <manifestEntries>
                <!--指定包含agentmain方法的类，需要配置为类的全路径名，必须配置-->
                <Agent-Class>com.example.javaagent.TestAgent</Agent-Class>
                <!--是否可以重新定义class，默认为false，可选配置-->
                <Can-Redefine-Classes>true</Can-Redefine-Classes>
                <!--是否可以重新转换class，实现字节码替换，默认为false，可选配置。-->
                <Can-Retransform-Classes>true</Can-Retransform-Classes>
                <!--是否可以设置Native方法的前缀，默认为false，可选配置。-->
                <Can-Set-Native-Method-Prefix>true</Can-Set-Native-Method-Prefix>
            </manifestEntries>
        </archive>
    </configuration>
</plugin>
```

3. 通过 maven 打包成一个 jar 包

4. 编写 Test1 方法

```java
public class Test1 {

    public static void main(String[] args) throws IOException {
        System.in.read();
    }
}
```

5. 编写 Test2 方法进行传输

```java
public class Test2 {

    public static void main(String[] args) {
        try {
            VirtualMachine vm = VirtualMachine.attach("Test1类JVM进程的PID");
            vm.loadAgent("jar包路径", "哈哈");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

通过 loadAgent 方法向 JVM 注册一个代理程序 agent，在该 agent 的代理程序中会得到一个 Instrumentation 实例，该实例可以在 class 加载前改变 class 的字节码，也可以在 class 加载后重新加载。

**实现原理**

attach 实现动态注入的原理如下：

通过 VirtualMachine 类的 attach(pid)方法，便可以 attach 到一个运行中的 java 进程上，之后便可以通过 loadAgent(agentJarPath)来将 agent 的 jar 包注入到对应的进程，然后对应的进程会调用 agentmain 方法

![img](https://img2018.cnblogs.com/blog/1607781/201908/1607781-20190817155003876-767522290.png)

## 拦截类

### premain

使用 javassist 来动态将某个方法替换掉

```xml
<dependency>
    <groupId>org.javassist</groupId>
    <artifactId>javassist</artifactId>
    <version>3.25.0-GA</version>
</dependency>
```

```java
public class TestAgent {

    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("agentArgs : " + agentArgs);
        inst.addTransformer(new DefineTransformer(), true);
    }

    static class DefineTransformer implements ClassFileTransformer {

        @Override
        public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined, ProtectionDomain protectionDomain, byte[] classfileBuffer) {
//            System.out.println("premain load Class:" + className);
//            return classfileBuffer;

            // 操作Date类
            if ("java/util/Date".equals(className)) {
                try {
                    // 从ClassPool获得CtClass对象
                    ClassPool classPool = ClassPool.getDefault();
                    CtClass clazz = classPool.get("java.util.Date");
                    CtMethod convertToAbbr = clazz.getDeclaredMethod("convertToAbbr");
                    //这里对 java.util.Date.convertToAbbr() 方法进行了改写，在 return之前增加了一个打印操作
                    String methodBody = "{sb.append(Character.toUpperCase(name.charAt(0)));" +
                            "sb.append(name.charAt(1)).append(name.charAt(2));" +
                            "System.out.println(\"sb.toString()\");" +
                            "return sb;}";
                    convertToAbbr.setBody(methodBody);

                    // 返回字节码，并且detachCtClass对象
                    byte[] byteCode = clazz.toBytecode();
                    // detach的意思是将内存中曾经被javassist加载过的Date对象移除，如果下次有需要在内存中找不到会重新走javassist加载
                    clazz.detach();
                    return byteCode;
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
            // 如果返回null则字节码不会被修改
            return null;
        }
    }
}
```

### agentmain

```java
public class TestAgent {

    public static void agentmain(String agentArgs, Instrumentation instrumentation) {
        instrumentation.addTransformer(new DefineTransformer(), true);
    }

    static class DefineTransformer implements ClassFileTransformer {

        @Override
        public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined, ProtectionDomain protectionDomain, byte[] classfileBuffer) {
            System.out.println("agentmain load Class:" + className);
            return classfileBuffer;
        }
    }
}
```

```java
public class Test2 {

    public static void main(String[] args) throws IOException, AttachNotSupportedException, AgentLoadException, AgentInitializationException {
        // 获取当前系统中所有 运行中的 虚拟机
        System.out.println("running JVM start ");
        List<VirtualMachineDescriptor> list = VirtualMachine.list();
        for (VirtualMachineDescriptor vmd : list) {
            // 如果虚拟机的名称为 xxx 则 该虚拟机为目标虚拟机，获取该虚拟机的 pid
            // 然后加载 agent.jar 发送给该虚拟机
            System.out.println(vmd.displayName());
            if (vmd.displayName().endsWith("com.example.javaagent2.Test1")) {
                VirtualMachine virtualMachine = VirtualMachine.attach(vmd.id());
                virtualMachine.loadAgent("jar包路径");
                virtualMachine.detach();
            }
        }
    }
}
```

## Instrumentation 局限性

大多数情况下，我们使用 Instrumentation 都是使用其字节码插桩的功能，或者笼统说就是类重定义(Class Redefine)的功能，但是有以下的局限性：

1. premain 和 agentmain 两种方式修改字节码的时机都是类文件加载之后，也就是说必须要带有 Class 类型的参数，不能通过字节码文件和自定义的类名重新定义一个本来不存在的类。

2. 类的字节码修改称为类转换(Class Transform)，类转换其实最终都回归到类重定义 Instrumentation#redefineClasses()方法，此方法有以下限制：

* 新类和老类的父类必须相同；
* 新类和老类实现的接口数也要相同，并且是相同的接口；
* 新类和老类访问符必须一致。 新类和老类字段数和字段名要一致；
* 新类和老类新增或删除的方法必须是 private static/final 修饰的；
* 可以修改方法体。
