---
title: JVM（1-基本介绍）
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

## 分类

**基本类型**

1. AtomicInteger：整型原子类
2. AtomicLong：长整型原子类
3. AtomicBoolean：布尔型原子类

**数组类型**

1. AtomicIntegerArray：整型数组原子类
2. AtomicLongArray：长整型数组原子类
3. AtomicReferenceArray：引用类型数组原子类

**引用类型**

1. AtomicReference：引用类型原子类
2. AtomicStampedReference：原子更新带有版本号的引用类型，该类将整数值与引用关联起来，可用于解决原子的更新数据和数据的版本号，可以解决使用 CAS 进行原子更新时可能出现的 ABA 问题
3. AtomicMarkableReference：原子更新带有标记位的引用类型

**对象的属性修改类型**

1. AtomicIntegerFieldUpdater：原子更新整型字段的更新器
2. AtomicLongFieldUpdater：原子更新长整型字段的更新器
3. AtomicReferenceFieldUpdater：原子更新引用类型字段的更新器

## AtomicInteger

### 内部结构

```java
public class AtomicInteger extends Number implements java.io.Serializable {
    private static final Unsafe unsafe = Unsafe.getUnsafe();
    private static final long valueOffset;

    static {
        try {
            // 获取 value 的内存偏移量
            valueOffset = unsafe.objectFieldOffset(AtomicInteger.class.getDeclaredField("value"));
        } catch (Exception ex) {
            throw new Error(ex);
        }
    }

    // 使用 volatile 修饰，确保线程间可见性
    private volatile int value;

    public AtomicInteger(int initialValue) {
        value = initialValue;
    }
}
```

AtomicInteger 类主要利用 CAS+volatile 和 native 方法来保证原子操作，从而避免 synchronized 的高开销，执行效率大为提升

1. 优势：

- 简单且高效：AtomicXXX 类在低并发场景下非常高效，因为它不涉及线程阻塞，避免了传统锁的性能开销。
- 保证原子性：通过 CAS 保证了对共享变量的原子操作。

2. 适用场景：适合低并发场景，尤其是计数器、状态标记等简单的共享变量

### 使用案例

```java
//获取当前的值
public final int get() 
//获取当前的值，并设置新的值
public final int getAndSet(int newValue)
//获取当前的值，并自增
public final int getAndIncrement()
//获取当前的值，并自减
public final int getAndDecrement()
//获取当前的值，并加上预期的值
public final int getAndAdd(int delta)
//如果输入的数值等于预期值，则以原子方式将该值设置为输入值（update）
boolean compareAndSet(int expect, int update) 
public final void lazySet(int newValue)//最终设置为 newValue, 使用 lazySet 设置之后可能导致其他线程在之后的一小段时间内还是可以读到旧的值。
```

```java
class AtomicIntegerTest {
    private AtomicInteger count = new AtomicInteger();
    //使用 AtomicInteger 之后，不需要对该方法加锁，也可以实现线程安全。
    public void increment() {
        count.incrementAndGet();
    }

    public int getCount() {
        return count.get();
    }
}
```

## LongAdder

LongAdder 类是专为高并发场景下频繁累加的操作而设计的。它通过将一个变量分成多个槽（Cell），避免多个线程竞争同一个槽，从而减少了锁的争夺。每个线程在更新时尽量操作不同的槽，只有在最终需要合并结果时，才会将所有槽的值加起来。

1. 优势：

- 高并发友好：LongAdder 适合大量线程并发访问的场景，减少了 CAS 竞争的瓶颈。
- 性能优化：它比 AtomicLong 更适合高并发累加操作，特别是在大量线程竞争的情况下，能显著提高性能。

2. 适用场景：高并发的计数器，特别是频繁进行累加或更新的场景

- 例如，在处理高吞吐量的计数（如 QPS 统计、日志收集等）时，LongAdder 的性能优势明显。

## AtomicInteger 与 LongAdder 区别

| **特性**     | **AtomicInteger**                    | **LongAdder**                                    |
| ------------ | ------------------------------------ | ------------------------------------------------ |
| 实现方式     | 单变量基于 CAS。                     | 多槽（`cells[]`）分散竞争，最终求和。            |
| 线程竞争     | 所有线程竞争同一变量。               | 线程竞争不同的槽，降低冲突。                     |
| 适用场景     | 低并发场景，更新次数较少时性能优越。 | 高并发场景下性能更优，特别是频繁累加的操作。     |
| 内存开销     | 内存占用较少，只有一个变量。         | 内存开销较高，需要分配多个槽（`cells[]` 数组）。 |
| 典型应用场景 | 计数器、简单的累加操作。             | 高并发环境下的计数器，例如监控、日志统计等。     |