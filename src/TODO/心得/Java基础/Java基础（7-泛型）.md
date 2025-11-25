---
title: Java基础（7-泛型）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java泛型允许在类、接口和方法中使用类型参数，增强代码的重用性和类型安全。通过泛型，程序员可以在编译时检查类型，避免运行时类型转换异常。常见的泛型类型包括List<T>、Map<K, V>等，支持类型推断和约束条件（如<T extends Number>）。泛型提供了灵活的代码结构，同时减少了类型转换的使用，提高了代码可维护性。
published: true
abbrlink: 16634
date: 2024-12-25 22:57:31
---

## 什么是泛型？

Java 集合有个缺点：把一个对象“丢进”集合里之后，集合就会“忘记”这个对象的数据类型，当再次取出该对象时，该对象的编译类型就变成了 Object 类型，还需要进行强制类型转换。从 Java 5 开始，Java 引入了“参数化类型”的概念，允许程序在创建集合时指定集合元素的类型，Java 的参数类型被称为泛型。例如：List \< String > 只能保存 String 类型的对象

## 类型擦除

```java
List list = new ArrayList();
list.add("yes"); // 加入string
list.add(233); // 加入int
```

泛型信息只存在于代码编译阶段，在进入 JVM 之前，与泛型相关的信息会被擦除掉。例如：在代码中定义的 List \< Object >、List \< String > 等类型，在编译之后都会变成 List。在泛型类被类型擦除的时候，之前泛型类中的类型参数部分如果没有指定上限，如 \< T > 则会被转译成普通的 Object 类型，如果指定了上限如 \< T extends String > 则类型参数就被替换成类型上限

```java
List<Integer> list = new ArrayList<>();
list.add(12);
//这里直接添加会报错
list.add("a");

Class<? extends List> clazz = list.getClass();
Method add = clazz.getDeclaredMethod("add", Object.class);
//但是通过反射添加是可以的，这就说明在运行期间所有的泛型信息都会被擦掉
add.invoke(list, "kl");
System.out.println(list);
```

**为什么泛型的实现是类型擦除？**

主要原因是为了向下兼容，即兼容 Java5 之前的编译的 class 文件，例如：Java1.2 上正在跑的代码可以在 Java5 的 JRE 上运行

## 常用的通配符

1. ?：表示不确定的 Java 类型
2. T（type）：表示具体的一个 Java 类型
3. K V（key value）：分别代表 Java 键值对中的 Key Value
4. E（element）：代表 Element

## 限定和非限定通配符

1. <? extends T> 通过确保类型必须是 T 的子类来设定类型的上界
2. <? super T> 通过确保类型必须是 T 的父类来设定类型的下界

**List <? extends T> 和 List <? super T> 的区别**

1. List <? extends T> 可以接收任何继承自 T 的类型的 List，通常用于读取操作，确保可以读取为 T 或 T 的子类的对象

2. List <? super T> 可以接收任何 T 的父类构成的 List，通常用于写入操作，确保可以安全地向泛型集合中插入 T 类型的对象

注意：Array 不支持泛型，要用 List 代替 Array，因为 List 可以提供编译器的类型安全保证，而 Array 却不能

```java
public void process(List<? extends Number> list) {
    Number num = list.get(0); // 读取时是安全的，返回类型是 Number 或其子类
    // list.add(1); // 编译错误，不能往其中添加元素
}

public void addToList(List<? super Integer> list) {
    list.add(1); // 可以安全地添加 Integer 类型的元素
    // Integer value = list.get(0); // 编译错误，不能安全地读取
}
```

**PECS 原则**

1. Producer Extends：如果某个对象提供数据（即生产者），使用 extends（上界限定符）
2. Consumer Super：如果某个对象使用数据（即消费者），使用 super（下界限定符）

## 协变和逆变

1. 协变：子类型可以替换父类型

```java
class Animal {}
class Dog extends Animal {}

List<? extends Animal> animals;  // 协变
animals = new ArrayList<Dog>();  // 子类型（Dog）替换父类型（Animal）
```

2. 逆变：父类型可以替换子类型

```java
class Animal {}
class Dog extends Animal {}

List<? super Dog> dogs;       // 逆变
dogs = new ArrayList<Animal>();  // 父类型（Animal）替换子类型（Dog）
```

## 使用案例

### 泛型类

```java
//此处T可以随便写为任意标识，常见的如T、E、K、V等形式的参数常用于表示泛型
//在实例化泛型类时，必须指定T的具体类型
public class Generic<T> {
    private T key;
    
    public Generic(T key) {
        this.key = key;
    }
    
    public T getKey() {
        return key;
    }
}

//实例化泛型类
Generic<Integer> genericInteger = new Generic<Integer>(123456);
```

### 泛型接口

```java
public interface Generator<T> {
    public T method();
}

//不指定类型
class GeneratorImpl<T> implements Generator<T>{
    @Override
    public T method() {
        return null;
    }
}

//指定类型
class GeneratorImpl implements Generator<String>{
    @Override
    public String method() {
        return "hello";
    }
}
```

### 泛型方法

```java
public static <E> void printArray(E[] inputArray) {
    for (E element : inputArray) {
        System.out.printf("%s ", element);
    }
    System.out.println();
}

// 创建不同类型数组： Integer, Double 和 Character
Integer[] intArray = { 1, 2, 3 };
String[] stringArray = { "Hello", "World" };
printArray(intArray);
printArray(stringArray);
```

### 注意点

**当泛型遇到重载**

```java
public class GenericTypes {

    public static void method(List<String> list) {
        System.out.println("invoke method(List<String> list)");
    }

    public static void method(List<Integer> list) {
        System.out.println("invoke method(List<Integer> list)");
    }
}
```

上面这段代码，有两个重载的函数，因为他们的参数类型不同，一个是 `List<String>` 另一个是 `List<Integer>` ，但是，这段代码是编译通不过的。因为我们前面讲过，参数 `List<Integer>` 和 `List<String>` 编译之后都被擦除了，变成了一样的原生类型 List，擦除动作导致这两个方法的特征签名变得一模一样。

**当泛型遇到 catch**

泛型的类型参数不能用在 Java 异常处理的 catch 语句中，因为异常处理是由 JVM 在运行时刻来进行的，由于类型信息被擦除，JVM 是无法区分两个异常类型 `MyException<String>` 和 `MyException<Integer>` 的

**当泛型内包含静态变量**

```java
public class StaticTest{
    public static void main(String[] args){
        GT<Integer> gti = new GT<Integer>();
        gti.var=1;
        GT<String> gts = new GT<String>();
        gts.var=2;
        System.out.println(gti.var);
    }
}

class GT<T>{
    public static int var=0;
    public void nothing(T x){}
}
```

以上代码输出结果为：2！，由于经过类型擦除，所有的泛型类实例都关联到同一份字节码上，泛型类的静态变量是共享的。上面例子里的 `GT<Integer>.var` 和 `GT<String>.var` 其实是一个变量
