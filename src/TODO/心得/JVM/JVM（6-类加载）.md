---
title: JVM（6-类加载）
series: JVM
tags:
  - JVM
categories: Java
cover: /img/index/
top_img: /img/index/
published: false
abbrlink: 48844
date: 2024-12-09 22:38:34
description: 
---

## 类加载过程

程序主动使用某个类时，如果该类还未被加载到内存中，则 JVM 会通过加载、连接、初始化 3 个步骤对该类进行初始化。如果没有意外，JVM 将会连续完成 3 个步骤，所以有时也把这 3 个步骤统称为类加载或类初始化，类的加载、连接和初始化都是在程序运行期间完成的

![](JVM（6-类加载）/1.png)

### 加载

加载是 JVM 加载的起点，具体什么时候开始加载，《Java 虚拟机规范》中并没有进行强制约束，可以交给虚拟机的具体实现来自由把握。

在加载过程，JVM 要做三件事情：

1. 通过一个类的全限定名来获取定义该类的二进制流（ZIP 包、网络、运算生成、JSP 生成、数据库读取）
2. 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构
3. 在内存中生成一个代表这个类的 java.lang.Class 对象，作为方法区这个类的各种数据的访问入口

加载阶段结束后，Java 虚拟机外部的二进制字节流就按照虚拟机所设定的格式存储在方法区之中了，方法区中的数据存储格式完全由虚拟机实现自行定义，《Java 虚拟机规范》未规定此区域的具体数据结构。

类型数据妥善安置在方法区之后，会在 Java 堆内存中实例化一个 java.lang.Class 类的对象， 这个对象将作为程序访问方法区中的类型数据的外部接口。

### 验证

![](JVM（6-类加载）/2.png)

验证是连接阶段的第一步，这一阶段的目的是确保 Class 文件的字节流中包含的信息符合《Java 虚拟机规范》的全部约束要求。

1. 文件格式验证

验证字节流是否符合 Class 文件格式的规范，并且能被当前版本的虚拟机处理。需要验证魔数、版本号、常量池常量类型是否支持、指向常量的索引值等等。

2. 元数据验证

对字节码描述的信息进行语义分析，以保证其描述的信息符合《Java 语言规范》的要求，包括类是否有父类、父类是否继承了 final 修饰的类、非抽象类是否实现了父类定义的方法、类是否与父类有矛盾等等。

3. 字节码验证

整个验证过程中最复杂的一个阶段，主要目的是通过数据流分析和控制流分析，确定程序语义是合法的、符合逻辑的。

4. 符号引用验证

最后一个阶段的校验行为发生在虚拟机将符号引用转化为直接引用的时候，这个转化动作将在连接的第三阶段——解析阶段中发生。

符号引用验证主要验证类是否缺少或者被禁止访问它依赖的某些外部类、方法、字段等资源。

### 准备

准备阶段是正式为类变量分配内存并设置类变量初始值的阶段。这时候进行内存分配的仅包括类变量（Class Variables，即静态变量，被 static 关键字修饰的变量，只与类相关，因此被称为类变量），而不包括实例变量。实例变量会在对象实例化时随着对象一块分配在 Java 堆中

这里所设置的初始值是数据类型默认的零值（如 0、0L、null、false 等），比如定义了 public static int value = 111，那么 value 变量在准备阶段的初始值就是 0 而不是 111（初始化阶段才会赋值）。

特殊情况：比如给 value 变量加上了 final 关键字 public static final int value = 111，那么准备阶段 value 的值就被赋值为 111

### 解析

解析阶段是虚拟机将常量池内的符号引用替换为直接引用（直接指向目标的指针、相对偏移量或一个间接定位到目标的句柄）的过程。解析动作主要针对类或接口、字段、类方法、接口方法、方法类型、方法句柄和调用限定符 7 类符号引用进行

1. 符号引用（Symbolic References）：符号引用以一组符号来描述所引用的目标，符号可以是任何形式的字面量，只要使用时能无歧义地定位到目标即可。
2. 直接引用（Direct References）：直接引用是可以直接指向目标的指针、相对偏移量或者是一个能间接定位到目标的句柄。

在程序实际运行时，只有符号引用是不够的，例如：在程序执行方法时，系统需要明确知道这个方法所在的位置，Java 虚拟机为每个类都准备了一张方法表来存放类中所有的方法。当需要调用一个类的方法的时候，只要知道这个方法在方法表中的偏移量就可以直接调用该方法了，通过解析操作符号引用就可以直接转变为目标方法在类中方法表的位置，从而使得方法可以被调用

### 初始化

初始化阶段是执行初始化方法 \< clinit >()方法的过程，是类加载的最后一步，这一步 JVM 才开始真正执行类中定义的 Java 程序代码（字节码）

对于初始化阶段，虚拟机严格规范了有且只有 5 种情况下，必须对类进行初始化（只有主动去使用类才会初始化类）：

1. 当遇到 new、getstatic、putstatic 或 invokestatic 这 4 条字节码指定时，比如 new 一个类，读取一个静态字段（未被 final 修饰）、或调用一个类的静态方法时

+ 当 JVM 执行 new 指令时会初始化类，即当程序创建一个类的实例对象
+ 当 JVM 执行 getstatic 指令时会初始化类，即程序访问类的静态变量（不是静态常量，常量会被加载到运行时常量池）
+ 当 JVM 执行 putstatic 指令时会初始化类，即程序给类的静态变量赋值
+ 当 JVM 执行 invokestatic 指令时会初始化类，即程序调用类的静态方法

2. 使用 java.lang.reflect 包的方法对类进行反射调用时如 Class.forName("....")，newInstance()等，如果类没初始化，需要触发其初始化
3. 初始化一个类，如果其父类还未初始化，则先触发该父类的初始化
4. 当虚拟机启动时，用户需要定义一个要执行的主类（包含 main 方法的那个类），虚拟机会先初始化这个类
5. MethodHandle 和 VarHandle 可以看作是轻量级的反射调用机制，而要想使用这 2 个调用，就必须先使用 findStaticVarHandle 来初始化要调用的类
6. 当一个接口中定义了 JDK8 新加入的默认方法（被 default 关键字修饰的接口方法）时，如果有这个接口的实现类发生了初始化，那该接口要在其之前被初始化

### 卸载

卸载类需要满足 3 个要求：

1. 该类的所有的实例对象都已被 GC，也就是说堆不存在该类的实例对象
2. 该类没有在其他任何地方被引用
3. 该类的类加载器的实例已被 GC

在 JVM 生命周期内，由 JVM 自带的类加载器加载的类是不会被卸载的，但是由我们自定义的类加载器加载的类是可能被卸载的

## 双亲委派机制

### 类加载器

类加载器只用于实现类的加载动作。但对于任意一个类，都必须由加载它的类加载器和这个类本身一起共同确立其在 Java 虚拟机中的唯一性，每 一个类加载器，都拥有一个独立的类名称空间。

这句话可以表达得更通俗一些：比较两个类是否“相等”，只有在这两个类是由同一个类加载器加载的前提下才有意义，否则，即使这两个类来源于同一个 Class 文件，被同一个 Java 虚拟机加载，只要加载它们的类加载器不同，那这两个类就必定不相等

**分类**

1. 启动类加载器（BootstrapClassLoader）

负责加载 JVM 的核心类库，加载%JAVA_HOME%/lib 下或被-Xbootclasspath 参数指定路径下的类

2. 扩展类加载器（ExtensionClassLoader）

加载%JRE_HOME%/lib/ext 目录下的 jar 包和类或者被 java.ext.dirs 系统变量所指定的路径下的 jar 包

3. 引用程序类加载器（ApplicationClassLoader）

ClassLoader 负责，加载用户路径下所指定的 jar 包和类库

### 工作原理

如果一个类加载器收到了类加载请求，它并不会自己先去加载，而是把这个请求委托给父类的加载器去执行，如果父类加载器还存在其父类加载器，则进一步向上委托，依次递归，请求最终将到达顶层的启动类加载器，如果父类加载器可以完成类加载任务，就成功返回，倘若父类加载器无法完成此加载任务，子加载器才会尝试自己去加载

![](JVM（6-类加载）/3.png)

```java
private final ClassLoader parent;
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException{
    synchronized (getClassLoadingLock(name)) {
        // 首先，检查请求的类是否已经被加载过
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                if (parent != null) {
                    //父加载器不为空，调用父加载器loadClass()方法处理
                    c = parent.loadClass(name, false);
                } else {
                    //父加载器为空，使用启动类加载器 BootstrapClassLoader 加载
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                //抛出异常说明父类加载器无法完成加载请求
            }

            if (c == null) {
                long t1 = System.nanoTime();
                //自己尝试加载
                c = findClass(name);

                // this is the defining class loader; record the stats
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

**为什么要用双亲委派机制呢？**

1. 采用双亲委派机制的好处是 Java 类随着它的类加载器一起具备了一种带有优先级的层次关系，通过这种层级关系可以避免类的重复加载，当父亲已经加载了该类，就没有必要让 ClassLoader 再加载一次。
2. Java 核心 API 中定义类型不会被随意替换，假设通过网络传递一个名为 java.lang.Integer 的类，通过双亲委派机制传递到启动类加载器，而启动类加载器在核心 Java API 发现这个名字的类，发现该类已被加载，并不会重新加载网络传递过来的 java.lang.Integer，而直接返回已加载过的 Integer.class，这样便可以防止核心 API 库被随意篡改

### 自定义类加载器

若要实现自定义类加载器，只需要继承 java.lang.ClassLoader 类，并且重写其 findClass()方法即可

```java
public class MyClassLoaderTest {
    static class MyClassLoader extends ClassLoader {
        private String classPath;
 
        public MyClassLoader(String classPath) {
            this.classPath = classPath;
        }
 
        private byte[] loadByte(String name) throws Exception {
            name = name.replaceAll("\\.", "/");
            FileInputStream fis = new FileInputStream(classPath + "/" + name + ".class");
            int len = fis.available();
            byte[] data = new byte[len];
            fis.read(data);
            fis.close();
            return data;
        }
 
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            try {
                byte[] data = loadByte(name);
                //defineClass将一个字节数组转为Class对象，这个字节数组是class文件读取后最终的字节数组。
                return defineClass(name, data, 0, data.length);
            } catch (Exception e) {
                e.printStackTrace();
                throw new ClassNotFoundException();
            }
        }
    }
 
    public static void main(String args[]) throws Exception {
        //初始化自定义类加载器，会先初始化父类ClassLoader，其中会把自定义类加载器的父加载器设置为应用程序类加载器AppClassLoader
        MyClassLoader classLoader = new MyClassLoader("D:/test");
        //D盘创建 test/com/tuling/jvm 几级目录，将User类的复制类User1.class丢入该目录
        Class clazz = classLoader.loadClass("com.tuling.jvm.User1");
        Object obj = clazz.newInstance();
        Method method = clazz.getDeclaredMethod("sout", null);
        method.invoke(obj, null);
        System.out.println(clazz.getClassLoader().getClass().getName());
    }
}
 
运行结果：
=======自己的加载器加载类调用方法=======
com.tuling.jvm.MyClassLoaderTest$MyClassLoader
```

### 怎么打破双亲委派模型？

1. 自己写一个类加载器
2. 重写 loadClass()方法：这个方法可以指定类通过什么加载器来进行加载，所以如果我们改写他的加载规则，就相当于打破了双亲委派机制。
3. 重写 findClass()方法

**tomcat 为什么要打破双亲委派机制？**

Tomact 是 web 容器，可能需要部署多个应用程序。不同的应用程序可能会依赖同一个第三方类库的不同版本，但是不同版本的类库中某一个类的全路径名可能是一样的。如：多个应用都要依赖 hollis.jar，但是 A 应用需要依赖 1.0.0 版本，但是 B 应用需要依赖 1.0.1 版本。这两个版本中都有一个类是 com.hollis.Test.class。如果采用默认的双亲委派类加载机制，那么无法加载多个相同的类。

所以，Tomcat 破坏了双亲委派原则，提供隔离的机制，为每个 web 容器单独提供一个 WebAppClassLoader 加载器。每一个 WebAppClassLoader 负责加载本身的目录下的 class 文件，加载不到时再交给 CommonClassLoader 加载，这和双亲委派刚好相反

tomcat 是一个 web 容器，主要解决以下问题：

1. 一个 web 容器可能要部署两个或多个应用程序，不同的应用程序之间可能会依赖同一个第三方类库的不同版本，因为要保证每个应用程序的类库都是独立的、相互隔离的
2. 部署在同一个 web 容器中的相同类库的相同版本可以共享，否则会有重复的类库被加载进 JVM 中
3. web 容器也有自己的类库，不能和应用程序的类库混淆，需要相互隔离
4. web 容器支持 jsp 文件修改后不用重启，jsp 文件也要编译成 class 文件，支持 HotSwap 功能

tomcat 使用 Java 默认加载器的问题：

1. 默认的类加载无法加载两个相同类库的不同版本，它只在乎类的全限定类名，并且只有一份
2. 在修改 jsp 文件后，因为类名一样，默认的类加载器不会重新加载，而是使用方法区中已经存在的类，所以需要每个 jsp 对应一个唯一的类加载器，当修改 jsp 的时候，直接卸载唯一的类加载器，然后重新创建类加载器，并加载 jsp 文件
