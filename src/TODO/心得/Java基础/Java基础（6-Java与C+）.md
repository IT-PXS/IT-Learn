---
title: Java基础（6-Java与C++）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java与C++都是强类型的编程语言，但在设计理念上有所不同。Java强调跨平台性，采用虚拟机（JVM）运行，内存管理自动化（垃圾回收），并支持多线程。C++则更注重性能，提供了直接的内存控制（指针和手动管理），支持面向对象和泛型编程。Java更易于学习，C++更适合需要高性能的应用。

published: true
abbrlink: 16634
date: 2024-12-24 22:57:31
---

## Java 与 C++

**区别**

Java 和 C++都是面向对象的语言，都支持封装、继承和多态

1. Java 不提供指针来直接访问内存，程序内存更加安全，C++需要手动释放内存
2. Java 的类是单继承的（接口可以多继承），C++支持多重继承
3. Java 有自动内存管理垃圾回收机制（GC），不需要程序员手动释放无用内存
4. Java 只支持方法重载（操作符重载增加了复杂性，与 Java 最初的设计思想不符），C++同时支持方法重载和操作符重载 

**Java 单继承的原因**

1. 如果在一个子类继承的多个父类中拥有相同名字的实例变量，子类在引用该变量时将产生歧义，无法判断应该使用哪个父类的变量
2. 如果在一个子类继承的多个父类中拥有相同方法，子类中又没有覆盖该方法，那么调用该方法时将产生歧义，无法判断应该调用哪个父类的方法

**为什么接口可以多实现？**

Java8 之前接口是无法定义具体方法实现的，所以即使有多个接口必须子类自己实现，所以并不会发生歧义

Java8 之后出了默认方法，可能会出现歧义的情况，所以 Java 强制规定，如果多个接口内有相同的默认方法，子类必须重写这个方法，否则编译期就会报错

## 面向对象和面向过程

**概念**

1. 面向过程 POP（步骤化）：分析出实现需求所需要的步骤，通过函数（方法）一步一步实现这些步骤，接着依次调用

```java
public class Main {
    public static void main(String[] args) {
        // 定义圆的半径
        double radius = 3.0;

        // 计算圆的面积和周长
        double area = Math.PI * radius * radius;
        double perimeter = 2 * Math.PI * radius;

        // 输出圆的面积和周长
        System.out.println("圆的面积为：" + area);
        System.out.println("圆的周长为：" + perimeter);
    }
}
```

2. 面向对象 OOP（行为化）：把整个需求按照特点、功能划分，将这些存在共性的部分封装成类，创建对象不是为了完成某一个步骤，而是描述某个事物在解决问题的步骤中的行为

```java
public class Circle {
    // 定义圆的半径
    private double radius;

    // 构造函数
    public Circle(double radius) {
        this.radius = radius;
    }

    // 计算圆的面积
    public double getArea() {
        return Math.PI * radius * radius;
    }

    // 计算圆的周长
    public double getPerimeter() {
        return 2 * Math.PI * radius;
    }

    public static void main(String[] args) {
        // 创建一个半径为3的圆
        Circle circle = new Circle(3.0);

        // 输出圆的面积和周长
        System.out.println("圆的面积为：" + circle.getArea());
        System.out.println("圆的周长为：" + circle.getPerimeter());
    }
}
```

**OOP 和 POP 的区别**

1. 编程思路不同：面向过程以实现功能的函数开发为主，而面向对象要首先抽象出类、属性及其方法，然后通过实例化类、执行方法来完成功能
2. 封装性：都具有封装性，但是面向过程封装的是功能，而面向对象封装的是数据和功能
3. 继承性和多态性：面向对象具有，而面向过程没有

**面向对象特点**

1. 封装：把一个对象的状态信息（也就是属性）隐藏在对象内部，不允许外部对象直接访问对象的内部信息，但是可以提供一些可以被外界访问的方法来操作属性
2. 继承：子类继承父类的属性和方法，它可以使用现有类的所有功能，并在无需重新编写原来的类的情况下对这些功能进行扩展
3. 多态：指一个类实例的相同方法在不同情形有不同表现形式，多态机制使具有不同内部结构的对象可以共享相同的外部接口

* 编译时多态（静态多态）：在编译阶段确定方法的调用，主要是通过方法重载实现

```java
class Example {
    void display(int a) {
        System.out.println("Integer: " + a);
    }

    void display(double a) {
        System.out.println("Double: " + a);
    }

    void display(String a) {
        System.out.println("String: " + a);
    }
}

public class Main {
    public static void main(String[] args) {
        Example obj = new Example();
        obj.display(5);         // 调用 display(int a)
        obj.display(3.14);      // 调用 display(double a)
        obj.display("Hello");   // 调用 display(String a)
    }
}
```

* 运行时多态（动态动态）：在运行时确定方法的调用，主要是通过方法重写实现

```java
class Animal {
    void sound() {
        System.out.println("Animal makes a sound");
    }
}

class Dog extends Animal {
    @Override
    void sound() {
        System.out.println("Dog barks");
    }
}

class Cat extends Animal {
    @Override
    void sound() {
        System.out.println("Cat meows");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal myDog = new Dog(); // Animal reference but Dog object
        Animal myCat = new Cat(); // Animal reference but Cat object

        myDog.sound(); // 输出: Dog barks
        myCat.sound(); // 输出: Cat meows
    }
}
```

