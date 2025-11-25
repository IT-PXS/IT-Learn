---
title: Java基础（5-类详解）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java类是面向对象编程的基本构建块，定义了对象的属性和行为。类包括字段（成员变量）和方法（成员函数），用于创建对象实例。Java支持继承、封装和多态等特性，允许类之间的关系建立和复用。构造方法用于初始化对象，this关键字引用当前对象，super用于访问父类成员。
published: true
abbrlink: 16634
date: 2024-12-23 22:57:31
---

## Java 访问修饰符

1. default：如果一个类、类属变量及方法没有用任何修饰符（即没有用 public、protected 及 private 中任何一种修饰），则其访问权限为 default（默认访问权限），在同一包内可见
2. private：在同一类内可见，不能修饰类
3. protected：对同一包内的类和所有包的子类可见，不能修饰类
4. public：对所有类可见

## 构造方法

特点：

1. 名字与类名相同
2. 没有返回值，但不能用 void 声明构造函数
3. 生成类的对象时自动执行，无需调用

注意：

1. 如果一个类没有声明构造方法，也可以执行，因为一个类即使没有声明构造方法也会有默认的“不带参数的构造方法”
2. Java 程序在执行子类的构造方法之前，如果没有用 super()来调用父类特定的构造方法，则会调用父类中“没有参数的构造方法”
3. 如果父类中只定义了有参数的构造方法，而在子类的构造方法中又没有用 super()来调用父类中特定的构造方法，则编译时将发生错误。解决方法是：在父类里加上一个不做事且没有参数的构造方法

## super 关键字

作用：

1. 访问父类的构造函数
2. 访问父类的成员

注意点：

1. super()和 this()均需放在构造方法内第一行
2. 调用 super()必须写在子类构造方法的第一行，否则编译不通过。每个子类的构造方法的第一条语句，都是隐含地调用 super()，如果父类没有这种形式的构造函数，那么在编译的时候就会报错
3. this 和 super 不能同时出现在一个构造函数里，因为 this 必然会调用其他的构造函数，其他的构造函数必然也会有 super 语句的存在，编译器不会通过
4. this()和 super()都指的是对象，所以均不可以在 static 环境中使用

## static 关键字

1. 静态变量：称为类变量，类所有的实例都共享静态变量，可以直接通过类名来访问它，静态变量在内存中只存在一份

2. 静态方法：静态方法在类加载的时候就存在了，它不依赖于任何实例。静态方法必须有实现，它不能是抽象方法。只能访问所属类的静态字段和静态方法，方法中不能有 this 和 supper 关键字

3. 静态语句块：静态语句块在类初始化时运行一次

4. 静态内部类：非静态内部类依赖于外部类的实例，而静态内部类不需要。静态内部类不能访问外部类的非静态的变量和方法

初始化顺序：静态变量和静态语句块优先于实例变量和普通语句块，静态变量和静态语句块的初始化顺序取决于它们在代码中的顺序

## Java 代码块

执行顺序：

1. 父类静态变量（只执行一次，其他每次 new 对象都要执行）
2. 父类静态代码块（只执行一次，其他每次 new 对象都要执行）
3. 子类静态变量（只执行一次，其他每次 new 对象都要执行）
4. 子类静态代码块（只执行一次，其他每次 new 对象都要执行）
5. 父类非静态变量
6. 父类非静态代码块
7. 父类构造函数
8. 子类非静态变量
9. 子类非静态代码块
10. 子类构造函数

注意：静态变量和静态代码块谁先声明的先执行

```java
public class CodeBlock01 {
    static {
        System.out.println("父类静态代码块执行");
    }
    {
        System.out.println("父类代码块执行");
    }
    public CodeBlock01(){
        System.out.println("父类构造函数执行");
    }
}
```

```java
public class CodeBlock02 extends CodeBlock01{
    static {
        System.out.println("子类静态代码块执行");
    }
    {
        System.out.println("子类代码块执行");
    }
    public CodeBlock02(){
        System.out.println("子类构造函数执行");
    }

    public static void main(String[] args) {
        new CodeBlock02();
    }
}

//执行结果：
父类静态代码块执行
子类静态代码块执行
父类代码块执行
父类构造函数执行
子类代码块执行
子类构造函数执行
```

## 覆盖（重写）和重载

| 区别   | 覆盖（Override）                 | 重载（Overload）           |
| ------ | -------------------------------- | -------------------------- |
| 发生场所 | 在继承关系的子类和父类之间 | 在同一个类中 |
|        | 覆盖是针对父类方法的重写         | 同类中的方法均可重载       |
| 参数   | 与父类同名同参                   | 与别的方法同名不同参       |
| 次数限制 | 父类一个方法只能在子类覆盖一次   | 重写只要参数不同，可以多次 |
| 返回类型 | 子类与父类返回类型要一致         | 可以不同                 |
| 权限修饰符 | 子类不能覆盖父类的 private 方法    | 无                         |
| 异常处理 | 重写要求子类比父类抛出更少的异常 | 无                         |

方法的重写要遵循“两同两小一大”

1. “两同”：方法名相同、形参列表相同
2. “两小”：子类方法返回值类型应比父类方法返回值类型更小或相等，子类方法声明抛出的异常类应比父类方法声明抛出的异常类更小或相等
3. “一大”：子类的访问权限应比父类方法的访问权限更大或相等（例如：父类的方法是 protected，子类不能将其修改为 private，但可以改为 public）

## 变量

1. 成员变量：成员变量是在类的范围里定义的变量，有默认初始值

2. 局部变量

* 局部变量是在方法里定义的变量，没有默认初始值
* 局部变量存储于栈内存中，作用的范围结束，变量空间会自动地释放
* 局部变量不能被访问控制修饰符及 static 所修饰，但是，成员变量和局部变量都能被 final 所修饰

3. 静态变量

* 被 static 修饰的变量称为类变量，它属于类，存储于方法区中，生命周期与当前类相同，因此不管创建多少个对象，静态变量在内存中有且仅有一个拷贝；
* 静态变量可以实现让多个对象共享内存

4. 实例变量

* 未被 static 修饰的成员变量叫实例变量，它存储于对象所在的堆内存中，生命周期与对象相同
* 属于某一实例，需要先创建对象，然后通过对象才能访问到它

**为什么成员变量有默认值？**

1. 默认值有两种设置方式：手动和自动。变量存储的是内存地址对应的任意随机值，程序读取该值运行会出现意外，所以没有手动赋值一定要自动赋值。成员变量在运行时可借助反射等方法手动赋值，而局部变量不行。
2. 对于编译器（javac）来说，局部变量没赋值很好判断，可以直接报错。而成员变量可能是运行时赋值，无法判断，误报“没默认值”又会影响用户体验，所以采用自动赋默认值。

## 静态方法和实例方法

静态方法为什么不能调用非静态成员？

1. 静态方法是属于类的，在类加载的时候就会分配内存，可以通过类名直接访问。而非静态成员属于实例对象，只有在对象实例化之后才存在，需要通过类的实例对象去访问
2. 在类的非静态成员不存在的时候静态成员就已经存在了，此时调用在内存中还不存在非静态成员，属于非法操作

区别：

1. 调用方法：在外部调用静态方法时，可以使用类名.方法名的方式，也可以使用对象.方法名的方式，而实例方法只有后面这种方法，调用静态方法可以无需创建对象。一般不建议使用对象.方法名的方法来调用静态方法
2. 访问类成员是否存在限制：静态方法在访问本类的成员时，只允许访问静态成员（即静态成员变量和静态方法），不允许访问实例成员（即实例成员变量和实例方法），而实例方法不存在这个限制

## 抽象类和接口

共同点：

1. 都不能被实例化
2. 都可以包含抽象方法
3. 都可以有默认实现的方法（Java8 可以用 default 关键字在接口中定义默认方法）

区别：

1. 抽象类中可以定义构造函数，接口不能定义构造函数
2. 抽象类中可以有抽象方法和具体方法，而接口中只能有抽象方法（public abstract）
3. 抽象类中的成员权限可以是 public、default、protected（抽象类中抽象方法就是为了重写，所以不能被 private 修饰）。而接口中的成员只可以是 public（方法默认：public abstract，成员变量默认：public static final）
4. 抽象类中可以包含静态方法，而接口中不可以包含静态方法

**JDK8 后的改变**

1. 允许在接口中包含带有具体实现的方法，使用 default 修饰，这类方法是默认方法
2. 接口中可以包含静态方法
3. Java 9 允许在接口中使用 `private` 方法。`private` 方法可以用于在接口内部共享代码，不对外暴露。

```java
public interface MyInterface {
    // default 方法
    default void defaultMethod() {
        commonMethod();
    }

    // static 方法
    static void staticMethod() {
        commonMethod();
    }

    // 私有静态方法，可以被 static 和 default 方法调用
    private static void commonMethod() {
        System.out.println("This is a private method used internally.");
    }

	// 实例私有方法，只能被 default 方法调用。
    private void instanceCommonMethod() {
        System.out.println("This is a private instance method used internally.");
    }
}
```

## 内部类

**一个 Java 文件里可以有多个类吗（不含内部类）？**

1. 一个 Java 文件里可以有多个类，但最多只能有一个被 public 修饰的类
2. 如果这个 Java 文件中包含 public 修饰的类，则这个类的名称必须和 Java 文件名一致

### 成员内部类

```java
public class OutClass {
    public void test1() {
    }
    
    private void test2() {
    }
    
    private static void test3() {
    }
    
    //成员内部类
    class InnerClass {
        private String testStrInner = "";
        private void testInner() {
            test1();
            test2();
            test3();//成员内部类可以访问外部类所有的属性和方法。静态方法直接访问。
        }
    }
}
```

### 静态内部类

```java
public class OutClass {
    private static String s = "";
    
    public void test1() {
    }
    
    private void test2() {
    }
    
    private static void test3() {
    }
    
    //静态内部类
    static class InnerClass {
        private static String testStrInner = "";
        private static void testInner() {
            test3();
            String ss = s;
        }
    }
}
```

1. 静态内部类可以包含静态成员，也可以包含非静态成员
2. 静态内部类不能访问外部类的实例成员，只能访问它的静态成员
3. 外部类的所有方法、初始化块都能访问其内部定义的静态内部类
4. 在外部类的外部，也可以实例静态内部类，语法：外部类.内部类 变量名 = new 外部类.内部类构造方法()

### 匿名内部类

```java
//父类  Animal 
public class Animal {
    public void bellow() {
        //动物吼叫的类型
        System.out.println("动物吼叫");
    }
}

class Demo {
    public static void main(String[] args) {
        Demo demo = new Demo();
        demo.getDogBellow(new Animal(){
            //匿名内部类，重写父类方法。当然接口也是一样
            @Override
            public void bellow() {
                System.out.println("狗 汪汪汪。。。。");
            }
        });
    }
    
    public void getDogBellow(Animal animal){
        animal.bellow();
    }
}
```

### 局部内部类

```java
public class Animal {
    public static void bellow() {
        String bellowStr = "动物吼叫";
        System.out.println(bellowStr);
        
        final class Dog {//局部内部类
            String dogBellowStr = bellowStr + "；狗 ：汪汪汪";

            public void dogBellow() {
                System.out.println(dogBellowStr);
            }
        }
    }
}
```

### 作用

1. 内部类可以很好地实现隐藏

非内部类是不可以使用 private 和 protected 修饰的，但是内部类可以，从而达到隐藏的作用，同时也可以将一定逻辑关系的类组织在一起，增强可读性

2. 间接的实现多继承

每个内部类都能独立地继承一个接口的实现，所以无论外部类是否已经继承了某个接口的实现，对于内部类没有影响。如果没有内部类提供的可以继承多个具体的或抽象的类的能力，一些设计与编程问题就很难解决
