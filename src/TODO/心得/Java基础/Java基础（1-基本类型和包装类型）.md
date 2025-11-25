---
title: Java基础（1-基本类型和包装类型）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java中的基本数据类型是直接存储值，如int、char等，而包装类型是对应的对象类，如Integer、Character等。基本类型存储在栈上，性能高；包装类型存储在堆上，提供更多功能（如转换、比较）。Java支持基本类型和包装类型之间的自动装箱和拆箱。
published: true
abbrlink: 16634
date: 2024-12-17 22:57:31
---

## 基本数据类型和包装类型

| 基本类型 | 包装类型  | 位数 | 字节 | 默认值  |
| -------- | --------- | ---- | ---- | ------- |
| byte     | Byte      | 8    | 1    | 0       |
| short    | Short     | 16   | 2    | 0       |
| int      | Integer   | 32   | 4    | 0       |
| long     | Long      | 64   | 8    | 0L      |
| char     | Character | 16   | 2    | 'u0000' |
| float    | Float     | 32   | 4    | 0f      |
| double   | Double    | 64   | 8    | 0d      |
| boolean  | Boolean   | 1    |      | false   |

注意：float 的精度为 6~7 位，double 的精度为 15~16

### 区别

| 特性           | 基本数据类型                   | 包装类型                           |
| -------------- | ------------------------------ | ---------------------------------- |
| 类型           | 直接存储值                     | 存储为对象                         |
| 默认值         | 有默认值（如 `0`、`false` 等） | `null`                             |
| 存储位置       | 栈内存                         | 堆内存                             |
| 性能           | 高效，访问速度快               | 较低，因为涉及对象的创建和拆箱     |
| 是否为对象     | 否                             | 是                                 |
| 支持的功能     | 无                             | 提供多种实用方法（如解析、转换等） |
| 是否为可变对象 | 否（不可修改值）               | 否（包装类型对象不可变）           |

### 适用场景

1. 基本数据类型：

- 用于对性能要求较高的场景，如大规模的数值计算、循环处理等。
- 更适用于需要较少内存分配的简单数据存储。

2. 包装类型：

- 用于需要对象的场景，如需要存储在集合类（如 `List`、`Set`）中的数据，或者需要与其他类进行交互时。
- 包装类对象用于 Java 泛型类型，因为泛型不支持基本数据类型。

### 自动装箱拆箱

对于 Java 基本数据类型，均对应一个包装类

1. 装箱：自动将基本数据类型转换为包装器类型，如 `int -> Integer`
2. 拆箱：自动将包装器类型转换为基本数据类型，如 `Integer -> int`

注意：装箱其实就是调用了 包装类的 `valueOf()` 方法，拆箱其实就是调用了 `xxxValue()` 方法。

- `Integer i = 10` 等价于 `Integer i = Integer.valueOf(10)`
- `int n = i` 等价于 `int n = i.intValue()`;

## 缓存信息

### Integer 缓存源码

```java
public static Integer valueOf(int i) {
    if (i >= IntegerCache.low && i <= IntegerCache.high)
        return IntegerCache.cache[i + (-IntegerCache.low)];
    return new Integer(i);
}

 private static class IntegerCache {
    static final int low = -128;
    static final int high;
    static final Integer cache[];

    static {
        // high value may be configured by property
        int h = 127;
        String integerCacheHighPropValue =
            sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
        if (integerCacheHighPropValue != null) {
            try {
                int i = parseInt(integerCacheHighPropValue);
                i = Math.max(i, 127);
                // Maximum array size is Integer.MAX_VALUE
                h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
            } catch( NumberFormatException nfe) {
                // If the property cannot be parsed into an int, ignore it.
            }
        }
        high = h;

        cache = new Integer[(high - low) + 1];
        int j = low;
        for(int k = 0; k < cache.length; k++)
            cache[k] = new Integer(j++);

        // range [-128, 127] must be interned (JLS7 5.1.7)
        assert IntegerCache.high >= 127;
    }

    private IntegerCache() {}
}
```

优点：对-128 到 127 的 Integer 对象进行缓存，当创建新的 Integer 对象时，如果符合这个范围，并且已有存在的相同值的对象，则返回这个对象（地址），不需要再创建一个新的 Integer 对象，否则创建新的 Integer 对象。在做 == 运算时，Integer 会自动拆箱为 int 类型，然后再进行比较

```java
public class Demo2 {
    public static void main(String[] args) {
        Integer a=123;
        Integer b=123;
        System.out.println(a==b);//true

        a=128;
        b=128;
        System.out.println(a==b);//false     
        
        int c=128;
        int d=128;
        System.out.println(c==d);//true
        
        Integer e = new Integer(12);
        Integer f = new Integer(12);
        System.out.println(e==f);//false
        Integer g=12;
        System.out.println(e==g);//false
    }
}
```

`Integer g = 12` 会发生装箱，等价于 `Integer g = Integer.valueOf(12)`，因此，g 直接使用的常量池中的对象，而 `Integer e = new Integer(40)` 会直接创建新的对象。所有整型包装类对象之间值的比较，全部使用 equals 方法比较

### Long 缓存源码

```java
public static Long valueOf(long l) {
    final int offset = 128;
    if (l >= -128 && l <= 127) { // will cache
        return LongCache.cache[(int)l + offset];
    }
    return new Long(l);
}   

private static class LongCache {
    private LongCache(){}

    static final Long cache[] = new Long[-(-128) + 127 + 1];

    static {
        for(int i = 0; i < cache.length; i++)
            cache[i] = new Long(i - 128);
    }
}
```

### Short 缓存源码

```java
public static Short valueOf(short s) {
    final int offset = 128;
    int sAsInt = s;
    if (sAsInt >= -128 && sAsInt <= 127) { // must cache
        return ShortCache.cache[sAsInt + offset];
    }
    return new Short(s);
}

private static class ShortCache {
    private ShortCache(){}

    static final Short cache[] = new Short[-(-128) + 127 + 1];

    static {
        for(int i = 0; i < cache.length; i++)
            cache[i] = new Short((short)(i - 128));
    }
}
```

### Character 缓存源码

```java
public static Character valueOf(char c) {
    if (c <= 127) { // must cache
      return CharacterCache.cache[(int)c];
    }
    return new Character(c);
}

private static class CharacterCache {
    private CharacterCache(){}

    static final Character cache[] = new Character[127 + 1];

    static {
        for (int i = 0; i < cache.length; i++)
            cache[i] = new Character((char)i);
    }
}
```

### Byte 缓存源码

```java
public static Byte valueOf(byte b) {
    final int offset = 128;
    return ByteCache.cache[(int)b + offset];
}

private static class ByteCache {
    private ByteCache(){}

    static final Byte cache[] = new Byte[-(-128) + 127 + 1];

    static {
        for(int i = 0; i < cache.length; i++)
            cache[i] = new Byte((byte)(i - 128));
    }
}
```

### Boolean 缓存源码

```java
public static Boolean valueOf(boolean b) {
    return (b ? TRUE : FALSE);
}
```

### 总结

1. Integer 和 Long、Short 会缓存-128~127 的数据
2. Character 会缓存 0~127 的数据
3. Byte 会缓存-128~127 的数据

注意：两种浮点数类型的包装类 Float，Double 并没有实现常量池技术。

## 其他

### Integer 和 Double 类型比较

Integer、Double 不能直接进行比较，这包括：

1. 不能用 == 进行直接比较，因为它们是不同的数据类型
2. 不能转为字符串进行比较，因为转为字符串后，浮点数带小数点，整数值不带，这样它们永远都不相等
3. 不能使用 compareTo 方法进行比较，虽然它们都有 compareTo 方法，但该方法只能对相同类型进行比较

```java
Integer i = 100;
Double d = 100.00;
System.out.println(i.doubleValue() == d.doubleValue());
```

### 逃逸分析

逃逸分析的基本行为就是分析对象的动态作用域：当一个对象在方法中被定义后，它可能被外部方法所引用

1. 方法逃逸：在一个方法体内，定义一个局部变量，而它可能被外部方法引用。例如：作为调用参数传递到其他方法中
2. 线程逃逸：这个对象有可能被外部线程访问到。例如：赋值给类变量或可以在其他线程中访问的实例变量

**为什么说是几乎所有对象实例都存在于堆中呢？** 

这是因为 HotSpot 虚拟机引入了 JIT 优化之后，会对对象进行逃逸分析，如果发现某一个对象并没有逃逸到方法外部，那么就可能通过标量替换来实现栈上分配，而避免堆上分配内存

注意：基本数据类型存放在栈中是一个常见的误区！基本数据类型的存储位置取决于它们的作用域和声明方式。如果它们是局部变量，那么它们会存放在栈中；如果它们是成员变量，那么它们会存放在堆/方法区/元空间中。

```java
public class Test {
    // 成员变量，存放在堆中
    int a = 10;
    // 被 static 修饰的成员变量，JDK 1.7 及之前位于方法区，1.8 后存放于元空间，均不存放于堆中。
    // 变量属于类，不属于对象。
    static int b = 20;

    public void method() {
        // 局部变量，存放在栈中
        int c = 30;
        static int d = 40; // 编译错误，不能在方法中使用 static 修饰局部变量
    }
}
```

