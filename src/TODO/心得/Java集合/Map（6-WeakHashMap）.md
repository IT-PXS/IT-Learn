---
title: Set（1-HashSet）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: false
abbrlink: 23204
date: 2024-12-11 22:38:34
description:
---

## 接口和属性

```java
public class WeakHashMap<K,V> extends AbstractMap<K,V> implements Map<K,V> {

    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    private static final int MAXIMUM_CAPACITY = 1 << 30;

    private static final float DEFAULT_LOAD_FACTOR = 0.75f;

    Entry<K,V>[] table;

    private int size;

    private int threshold;

    private final float loadFactor;
    
	private final ReferenceQueue<Object> queue = new ReferenceQueue<>();
}
```

在 Map 家族中，WeakHashMap 是一个很特殊的成员，它的特殊之处在于 WeakHashMap 里的元素可能会被 GC 自动删除，即使程序员没有显示调用 remove() 或者 clear() 方法。

当主动调用 GC 回收器的时候，再次查询 WeakHashMap 里面的数据的时候，内容为空。

更直观的说，当使用 WeakHashMap 时，即使没有显式的添加或删除任何元素，也可能发生如下情况：

1. 调用两次 size() 方法返回不同的值；
2. 两次调用 isEmpty() 方法，第一次返回 false，第二次返回 true；
3. 两次调用 containsKey() 方法，第一次返回 true，第二次返回 false，尽管两次使用的是同一个 key；
4. 两次调用 get() 方法，第一次返回一个 value，第二次返回 null，尽管两次使用的是同一个对象。

## 特点

1. 自动清理：由于键是弱引用的，WeakHashMap 可以自动清理不再使用的条目，这有助于避免内存泄漏。
2. 内存敏感：WeakHashMap 特别适合于那些对内存使用敏感且需要临时存储大量键值对的应用。
3. 性能考虑：尽管 WeakHashMap 提供了自动内存管理的好处，但它的操作可能比使用强引用的 Map 慢，因为需要额外的垃圾收集和弱引用处理。

## 使用场景

1. 缓存系统：可以使用 WeakHashMap 作为缓存的实现，这样在缓存中存储的键值对会在 key 不再被其他对象所引用时自动被移除，避免浪费内存；
2. 生命周期管理：对于一些需要动态管理生命周期的对象，如数据库连接、线程池等，可以使用 WeakHashMap 来保存这些对象，避免因为忘记关闭连接或者资源而造成的内存泄漏问题；
3. 监听器管理：在一些应用中，需要使用监听器来处理事件，这些监听器往往会注册到某些对象中去。如果不在需要时将这些监听器移除，就会造成内存泄漏。可以使用 WeakHashMap 来存储这些对象和其对应的监听器。当这些对象不再被其他对象所引用时，对应的监听器就会被自动移除。

## 优缺点

优点：

1. 可以避免内存泄漏问题：WeakHashMap 使用弱引用保存 key，当一个 key 不再被其他对象所引用时，对应的键值对会被自动移除，从而避免了内存泄漏问题；
2. 在动态管理大量对象时具有很好的性能：由于 WeakHashMap 自动回收已经失效的键值对，因此可以避免内存占用过多的问题，从而提高应用的性能；
3. 适用于一些需要动态管理对象的应用：如缓存系统、生命周期管理、监听器管理等。

缺点：

1. 线程不安全：WeakHashMap 是线程不安全的，因此在多线程环境下需要使用 Collections.synchronizedMap 方法将其封装成线程安全的 Map；
2. 由于需要频繁回收已经失效的键值对，因此在性能上会比 HashMap 略差一些。
