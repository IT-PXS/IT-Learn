---
title: Java基础（3-hashCode）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java 中的 hashCode 方法用于生成对象的哈希码，常用于哈希表（如 HashMap、HashSet）中的对象存储和查找。重写 hashCode 时，必须确保与 equals 方法一致，即相等的对象必须有相同的哈希码。正确实现 hashCode 可以提高哈希集合的性能并避免哈希冲突。
published: true
abbrlink: 16634
date: 2024-12-19 22:57:31
---

## 作用

```java
public native int hashCode();
// 获取哈希码（散列码），这个哈希码的作用是确定该对象在哈希表中的索引位置
```

注意：hashCode 的值保存在对象中，只有第一次调用时产生 hashCode，并保存在 hash 中

```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    
    // .....
    private int hash;
    
    public int hashCode() {
        int h = hash;
        if (h == 0 && value.length > 0) {
            char val[] = value;

            for (int i = 0; i < value.length; i++) {
                h = 31 * h + val[i];
            }
            // 第一次调用时产生 hashCode，并保存在 hash
            hash = h;
        }
        return h;
    }
    // ....
}
```

## 特点

1. 相等（相同）的对象必须具有相等的哈希码（或者散列码）
2. 如果两个对象的 hashCode 相等，它们不一定相等，可能不同对象的哈希码计算相同（哈希冲突）。
3. equals()方法被覆盖过，则 hashCode()方法也必须被覆盖（如果重写 equals 时没有重写 hashCode 方法的话，就可能导致 equals 方法判断是相等的两个对象，hashCode 值却不相等）

## 方法实现

实现 hashCode 方法时，应尽量确保：

1. 相等对象的哈希码相同：如通过对象的所有参与比较的字段来生成哈希码。

2. 性能优化：避免使用过多的字段参与计算，选择合适的字段生成哈希值。

通常的实现方式：

1. 使用对象的重要字段来计算哈希值，通常是 equals 方法中比较的字段。
2. 使用素数和常数来混合哈希码值，减少哈希冲突的概率。

## String 的 hashCode 计算方法

选择 31 的理由：

1. 31 可以被 JVM 优化，31*i =（i << 5）-i
2. 31 是一个不大不小的质数，是作为 hashCode 乘子的优选质数之一

+ 如果选择 2 时，哈希值会分布在一个较小的数值区间内，分布性不佳，最终可能会导致冲突率上升
+ 如果选择 101 时，计算结果太大了，如果用 int 类型表示哈希值，结果会溢出，最终导致数值信息丢失

```java
public int hashCode() {
    int h = hash;
    if (h == 0 && value.length > 0) {
        char val[] = value;        
        for(int i = 0; i < value.length; ++i) {
            h = 31*h + val[i];
        }
        hash = h;
    }
    return h;
}

/* 
公式为：s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]
假设 n=3
i=0 -> h = 31 * 0 + val[0]
i=1 -> h = 31 * (31 * 0 + val[0]) + val[1]
i=2 -> h = 31 * (31 * (31 * 0 + val[0]) + val[1]) + val[2]
       h = 31*31*31*0 + 31*31*val[0] + 31*val[1] + val[2]
       h = 31^(n-1)*val[0] + 31^(n-2)*val[1] + val[2]
*/
```

## hashCode()和 equals()的联系

如果你重写了 equals 方法，通常也需要重写 hashCode 方法，以确保遵循 Java 的规范：当两个对象通过 equals 判断相等时，它们的 hashCode 也必须相等，否则哈希表中的查找可能会失败。

**为什么要重写 equals()？**

例如：当把对象加入 HashSet 时，HashSet 会先计算对象的 hashCode 值来判断对象加入的位置，同时也会与其他已经加入的对象的 hashCode 值作比较，如果没有相符的 hashCode，HashSet 会假设对象没有重复出现。但是如果发现有相同 hashCode 值的对象，这时会调用 equals()方法来检查 hashCode 相等的对象是否真的相同。如果两者相同，HashSet 就不会让其加入操作成功；如果不同的话，就会重新散列到其他位置，这样我们就大大减少了 equals 的次数，相应就大大提高了执行速度

