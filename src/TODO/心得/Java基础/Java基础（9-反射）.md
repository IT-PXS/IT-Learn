---
title: Java基础（9-反射）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java反射是一种动态获取类信息并操作其属性、方法、构造器的机制。通过反射，可以在运行时访问对象的类型、调用私有方法、修改字段等。反射广泛用于框架设计、动态代理和工具开发，但滥用可能影响性能和安全性。
published: true
abbrlink: 16634
date: 2025-01-13 22:57:31
---

## 什么是反射？

Java 属于先编译再运行的语言，程序中对象的类型在编译期就确定下来了，而当程序在运行时可能需要动态加载某些类，这些类因为之前用不到，所以没有加载到 JVM。通过反射可以在运行时动态地创建对象并调用其属性，不需要提前在编译期知道运行的对象是谁

Java 反射机制的核心是在程序运行时动态加载类并获取类的详细信息，从而操作类或对象的属性或方法，本质是 JVM 得到 class 对象之后，从而获取对象的各种信息

## 为什么需要反射？

1. 在编译阶段不知道哪个类名，要在运行期从配置文件读取类名，这时候就没有硬编码

2. Java 程序中的对象在运行时可以表现为两种类型，即编译时类型和运行时类型。

例如 `Person p = new Student();` ，这行代码将会生成一个 p 变量，该变量的编译时类型为 Person，运行时类型为 Student。有时程序在运行时接收到外部传入的一个对象，该对象的编译时类型是 Object，但程序又需要调用该对象的运行时类型的方法，这就要求程序需要在运行时发现对象和类的真实信息

+ 假设在编译时和运行时都完全知道类型的具体信息，在这种情况下，可以先使用 instanceof 运算符进行判断，再利用强制类型转换将其转换成其运行时类型的变量即可。
+ 编译时根本无法预知该对象和类可能属于哪些类，程序只依靠运行时信息来发现该对象和类的真实信息，这就必须使用反射。

## 使用场景

1. 不能明确接口调用哪个函数，需要根据传入的参数在运行时决定
2. 不能明确传入函数的参数类型，需要在运行时处理任意对象
3. 用 JDBC 连接数据库时使用 Class.forName()通过反射加载数据库的驱动程序

项目底层有时用 MySQL，有时用 Oracle，需要动态地根据实际情况加载驱动类，假设 `com.java.dbtest.mysqlConnection`，`com.java.dbtest.oracleConnection` 要用这两个类，这时候程序就写得比较动态化，通过 `Class tc = Class.forName("com.java.dbtest.TestConnection");` 类的全类名让 JVM 在服务器中找到并加载这个类，而如果是 Oracle，则传入的参数就变成另一个了

4. Spring 框架也用到反射机制

Spring 通过 XML 配置装载 Bean 的过程：

+ 将程序内所有 XML 或 Properties 配置文件加载入内存中
+ Java 类里面解析 XML 或 Properties 里面的内容，得到对应实体类的字节码字符串以及相关的属性信息
+ 使用反射机制，根据这个字符串获得某个类的 Class 实例
+ 动态配置实例的属性

## 类加载器

ClassLoader：负责加载类的对象

Java 运行时具有以下内置类加载器：

1. Bootstrap class loader：虚拟机的内置类加载器，通常表示为 null，并且没有父加载器
2. Platform class loader：平台类加载器可以看到所有平台类，平台类包括由平台类加载器或其祖先定义的 Java  SE 平台 API，其实现类和 JDK 特定的运行时类
3. System class loader：应用程序类加载器，系统类加载器通常用于定义应用程序类路径，模块路径和 JDK 特定工具上的类

类加载器的继承关系：System 的父加载器为 Platform，而 Platform 的父加载器为 Bootstrap

```java
public static void main(String[] args) {
    // 返回用于委派的系统类加载器
    ClassLoader systemClassLoader = ClassLoader.getSystemClassLoader();
    System.out.println(systemClassLoader);

    // 返回父类加载器进行委派
    ClassLoader parent = systemClassLoader.getParent();
    System.out.println(parent);

    ClassLoader parent1 = parent.getParent();
    System.out.println(parent1);
}
```

## 使用案例

### 获取 Class 对象的方式

1. Class.forName("全类名")：将字节码文件加载进内存，返回 class 对象
2. 类型.class：通过类名的属性 class 获取
3. 对象.getClass()：getClass()方法在 Object 类中定义
4. 类型.TYPE

```java
@Data
class Person {
    public String name;
}

class Student extends Person {
    public Student() {
        this.name="学生";
    }
}

class Teacher extends Person {
    public Teacher() {
        this.name="老师";
    }
}
```

```java
package com.reflect;

public class Test02 {
    public static void main(String[] args) throws ClassNotFoundException {
        Person person = new Student();
        Class aClass = person.getClass();
        System.out.println(aClass);

        Class aClass1 = Class.forName("com.reflect.Student");
        System.out.println(aClass1);

        Class aClass2 = Student.class;
        System.out.println(aClass2);

        System.out.println(aClass == aClass1);
        System.out.println(aClass == aClass2);

        Class type = Integer.TYPE;
        System.out.println(type);
        
        Class integerClass = Integer.class;
        System.out.println(integerClass);
    }
}
```

结论：同一个字节码文件（*.class）在一次程序运行过程中，只会被加载一次，不论通过哪一种方式获取的 Class 对象都是同一个

```java
//只要元素类型与维度一样，就是同一个class
int[] a = new int[10];
int[] b = new int[100];
System.out.println(a.getClass().hashCode());
System.out.println(b.getClass().hashCode());
```

### 获取成员变量

Field：成员变量

1. Field [] getFields()：获取所有 public 修饰的成员变量
2. Field getField(String name)：获取指定名称的 public 修饰的成员变量
3. Field [] getDeclaredFields()：获取所有的成员变量，不考虑修饰符
4. Field getDeclaredField(String name)：获取指定名称的成员变量，不考虑修饰符
5. void set(Object obj, Object value)：设置值
6. get(Object obj)：获取值
7. setAccessible(true)：暴力反射（忽略访问权限修饰符的安全检查）

```java
@Data
public class Person {
    private String name;
    private int age;
    public int a;
    public String b;

    public Person() {
    }
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void eat(){
        System.out.println("吃");
    }
    public void eat(String s){
        System.out.println("吃"+s);
    }
}
```

```java
public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException {
    Class personClass = Person.class;
    Field[] fields = personClass.getFields();
    for (Field field:fields){
        System.out.println(field);
    }
    System.out.println("-------------");

    Field a = personClass.getField("a");
    System.out.println(a);
    Person person = new Person();
    Object o = a.get(person);
    System.out.println(o);
	System.out.println("-------------");
    
    a.set(person,12);
    System.out.println(person);
    System.out.println("-------------");

    Field[] declaredFields = personClass.getDeclaredFields();
    for (Field field:declaredFields){
        System.out.println(field);
    }
    System.out.println("-------------");

    Field a1 = personClass.getDeclaredField("a");
    a1.setAccessible(true);
    Object o1 = a1.get(person);
    System.out.println(o1);
}
```

### 获取构造方法

Constructor：构造方法

1. Constructor <?> []  getConstructors()
2. Constructor \< T >  getConstructor(类 <?>...  parameterTypes)
3. Constructor \< T >  getDeclaredConstructor(类 <?>...  parameterTypes)
4. Constructor <?> []  getDeclaredConstructors()

创建对象：T  newInstance(Object...  initargs)

如果使用空参数构造方法创建对象，操作可以简化：Class 对象.newInstance()

```java
public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException {
    Class personClass = Person.class;
    Constructor constructor = personClass.getConstructor(String.class, int.class);
    System.out.println(constructor);
    
    Object dad = constructor.newInstance("dad", 12);
    System.out.println(dad);
    System.out.println("---------------");

    Constructor constructor1 = personClass.getConstructor();
    System.out.println(constructor1);
    
    Object dad1 = constructor1.newInstance();
    System.out.println(dad1);
    System.out.println("----------------");

    Object o = personClass.newInstance();
    System.out.println(o);
}
```

### 获取成员方法

Method：方法对象

1. Method []  getMethods()：获取所有 public 修饰的方法
2. Method getMethod(String name, 类 <?>...  parameterTypes)
3. Method [] getDeclaredMethods()
4. Method getDeclaredMethod(String name, 类 <?>...  parameterTypes)

执行方法：Object  invoke(Object  obj，Object...  args)

获取方法名称：String  getName()

```java
public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    Class personClass = Person.class;
    Method method = personClass.getMethod("eat");
    System.out.println(method);
    
    Person person=new Person();
    method.invoke(person);
    
    Method eat = personClass.getMethod("eat", String.class);
    eat.invoke(person,"饭");
    System.out.println("------------------");

    Method[] methods = personClass.getMethods();
    for (Method method1:methods){
        System.out.println(method1);
        String name = method1.getName();
        System.out.println(name);
    }
    
    System.out.println("------------------");
    String name = personClass.getName();
    System.out.println(name);
}
```

### 获取类名

1. String  getName()：获取包名+类名
2. String  getSimpleName()：获取类名

```java
package com.reflect;

public class Test06 {
    public static void main(String[] args) throws ClassNotFoundException {
        Class aClass = Class.forName("com.reflect.Person");
        //获取包名+类名
        System.out.println(aClass.getName());
        //获取类名
        System.out.println(aClass.getSimpleName());
    }
}
```

### 反射效率

```java
public class Test07 {
    public static void test01(){
        User user=new User();
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100000000; i++) {
            user.getName();
        }
        long end=System.currentTimeMillis();
        System.out.println(end-start);
    }

    public static void test02() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        User user=new User();
        Class aClass = user.getClass();
        Method getName = aClass.getDeclaredMethod("getName", null);
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100000000; i++) {
            getName.invoke(user,null);
        }
        long end=System.currentTimeMillis();
        System.out.println(end-start);
    }

    public static void test03() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        User user=new User();
        Class aClass = user.getClass();
        Method getName = aClass.getDeclaredMethod("getName", null);
        getName.setAccessible(true);
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100000000; i++) {
            getName.invoke(user,null);
        }
        long end=System.currentTimeMillis();
        System.out.println(end-start);
    }

    public static void main(String[] args) throws InvocationTargetException, NoSuchMethodException, IllegalAccessException {
        test01();
        test02();
        test03();
    }
}
```

注意：设置 setAccessible()能使加快速率

### 获取父类类型

```java
Class aClass1 = Class.forName("com.reflect.Student");
System.out.println(aClass1);

Class superclass = aClass1.getSuperclass();
System.out.println(superclass);
```

注意：

1. .getClass().getResource(fileName)：表示只会在当前调用类所在的同一路径下查找该 fileName 文件
2. .getClass().getClassLoader().getResource(fileName)：表示只会在根目录下（/）查找该文件
3. fileName 如果前面加“/”，如“/fileName”，则表示绝对路径，取/目录下的该文件；
4. fileName 如果前面没有加“/”，如“fileName”，则表示相对路径，取与调用类同一路径下的该文件
5. 如果路径中包含包名，getClass().getResource("com/xxx/1.xml"); 包名的层级使用“/”隔开，而非“.”

