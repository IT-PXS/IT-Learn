---
title: Java基础（2-equals与运算符==）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: 在 Java 中，== 比较的是对象的引用（内存地址），用于基本数据类型时比较值；equals() 方法则比较对象的内容，通常需要重写以实现自定义的内容比较。== 适用于判断对象是否相同实例，equals() 用于比较对象的实际内容，二者使用场景不同。
published: true
abbrlink: 16634
date: 2024-12-18 22:57:31
---

## == 运算符

1. 作用于基本数据类型时，是比较两个数值是否相等
2. 作用于引用数据类型时，是比较两个对象的内存地址是否相同，即判断它们是否为同一个对象

## equals()方法

作用：

1. 没有重写时，Object 默认以 == 来实现，即比较两个对象的内存地址是否相同
2. 进行重写后，一般会按照对象的内容来进行比较，若两个对象内容相同则认为对象相等，否则认为对象不等

注意：

1. equals 不能用于比较基本数据类型的变量；
2. 如果没有对 equals 方法进行重写，则比较的是引用类型的变量所指向的对象的地址

### java.lang.Object: equals

```java
public boolean equals(Object obj) {
    // Java中==符号在比较复合型数据类型（类）比较的是对象在内存中的地址
    // 只有同个new出来的对象，它们在内存中的存放地址才一样，比较结果才为true
    return (this == obj);
}
```

### java.lang.String: equals

```java
public boolean equals(Object anObject) {
    // 首先看一下是不是比较同一个对象，如果是直接返回true
    if (this == anObject) {
        return true;
    }
    // 判断anObject是否为String的一个实例，如果不是直接返回false
    // 如果是再进一步判断两个字符串是否相等：将字符串转化为char数组进行一一比较
    if (anObject instanceof String) {
        String anotherString = (String) anObject;
        int n = value.length;
        if (n == anotherString.value.length) {
            char v1[] = value;
            char v2[] = anotherString.value;
            int i = 0;
            while (n-- != 0) {
                if (v1[i] != v2[i])
                    return false;
                i++;
            }
            return true;
        }
    }
    return false;
}
```

### java.util.Arrays: equals

```java
public static boolean equals(int[] a, int[] b) {
    // 两个数组为同一对象返回true
    if(a == b)
        return true;
    // 两个数组全为null返回false
    if(a == null || b == null)
        return false;
    // 两个数组长度不一致返回false
    int length = a.length;
    if(b.length != length)
        return false;
    // 两个数组不是同一对象，不为null且长度相同再比较数组中的每一个元素是否相等
    for(int i = 0; i<length; ++i) {
        if(a[i] != b[i])
            return false;
    }
    return true;
}
```

### java.util.Object: equals

```java
public static boolean equals(Object a, Object b) {
    // 如果a,b都为null返回true，如果只有一个为null返回false，否则返回a.equals(b)的结果
    return (a == b) || (a != null && a.equals(b));
}
```

### java.util.Date: equals

```java
public boolean equals(Object obj) {
    // obj必须是Date类型，在把两个时间转化为GMT 1970-01-01 00:00:00
    // 到此date对象上时间的毫秒数进行比较
    return obj instance Date && getTime == ((Date)obj).getTime();
}
```

## 总结

| 特性     | `==` 比较运算符                              | `equals()` 方法                      |
| -------- | -------------------------------------------- | ------------------------------------ |
| 比较内容 | 比较对象的引用（内存地址）                   | 比较对象的内容（由类重写方法决定）   |
| 适用类型 | 基本数据类型、对象引用                       | 对象（通常需要重写 `equals` 方法）   |
| 默认行为 | 对象比较内存地址，基本类型比较值             | 默认比较对象引用；大多数类重写此方法 |
| 典型用法 | 用于比较基本数据类型和检查对象是否是同一实例 | 用于比较对象内容（如字符串、集合等） |