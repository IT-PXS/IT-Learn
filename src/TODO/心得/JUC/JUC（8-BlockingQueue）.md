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

## BlockingQueue

### 什么是 BlockingQueue？

![](JUC（8-BlockingQueue）/1.png)

BlockingQueue 不同于普通的 Queue 的区别主要是：

1. 通过在入队和出队时进行加锁，保证了队列线程安全
2. 当队列满时，会阻塞入队的线程，直到队列不满；当队列为空时，会阻塞出队的线程，直到队列中有元素

### 主要实现类

1. ArrayBlockingQueue：基于数组的阻塞队列，使用数组存储数据，并需要指定其长度，所以是一个有界队列
2. LinkedBlockingQueue：基于链表的阻塞队列，使用链表存储数据，默认是一个无界队列，也可以通过构造方法中的 capacity 设置最大元素数量，所以也可以作为有界队列
3. SynchronousQueue：一种没有缓冲的队列，生产者产生的数据直接会被消费者获取并且立刻消费
4. PriorityBlockingQueue：基于优先级别的阻塞队列，底层基于数组实现，是一个无界队列
5. DelayQueue：延迟队列，其中的元素只有到了其指定的延迟时间，才能够从队列中出队

## ArrayBlockingQueue

### 接口和属性

```java
public class ArrayBlockingQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
    /** 使用数组存储队列中的元素 */
    final Object[] items;
    /** 下一个出队元素在items数组中的索引 */
    int takeIndex;
    /** 下一个入队元素需要存放在items数组中的索引 */
    int putIndex;
    /** 队列中的元素数量 */
    int count;
    /** 使用独占锁ReetrantLock */
    final ReentrantLock lock;
    /** 等待出队的条件 */
    private final Condition notEmpty;
    /** 等待入队的条件 */
    private final Condition notFull;
}
```

### 构造方法

主要功能是初始化元素数组以及锁和 condition 条件，可以通过 capacity 变量指定有界队列的元素数量，以及通过 fair 指定是否使用公平锁

```java
/** 指定队列元素数量capacity，并使用非公平锁进行并发控制 */
public ArrayBlockingQueue(int capacity) {
	this(capacity, false);
}

/** 指定队列元素数量capacity，并通过fair变量指定使用公平锁/非公平锁进行并发控制*/
public ArrayBlockingQueue(int capacity, boolean fair) {
    if (capacity <= 0)
    throw new IllegalArgumentException();
    this.items = new Object[capacity]; // 初始化元素数组
    lock = new ReentrantLock(fair);	// 初始化锁
    notEmpty = lock.newCondition(); // 初始化出队条件
    notFull =  lock.newCondition();	// 初始化入队条件
}
```

### 入队

put 函数会在队列末尾添加元素，如果队列已经满了，无法添加元素的话，就一直阻塞等待到可以加入为止

```java
public void put(E e) throws InterruptedException {
    checkNotNull(e);
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        while (count == items.length) 
            // 如果队列已满，线程阻塞，并添加到notFull条件队列中等待唤醒
            notFull.await();
        // 如果队列未满，则调用enqueue方法进行入队操作
        enqueue(e);
    } finally {
        lock.unlock();
    }
}

/**
 * 在当前位置插入元素，并修改索引值，并唤醒非空队列的线程
 * 只有在获取锁的情况才会调用
 */
private void enqueue(E x) {
    final Object[] items = this.items;
    // 将元素插入到putIndex处
    items[putIndex] = x;
    // 修改putIndex索引
    if (++putIndex == items.length)
        // 如果修改后putIndex超出items数组最大索引，则指向索引0处
        putIndex = 0;
    // 元素数量+1
    count++;
    // 唤醒一个非空队列中的线程
    notEmpty.signal();
}
```

### 出队

take 函数在队列为空时会被阻塞，一直到阻塞队列加入了新的元素

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        while (count == 0)
            // 判断队列是否为空，如果为空则线程阻塞，添加到notEmpty条件队列等待
            notEmpty.await();
        // 队列不为空，进行出队操作
        return dequeue();
    } finally {
        lock.unlock();
    }
}

/**
 * 在当前位置获取一个元素，并修改索引值，并唤醒非满队列的线程
 * 只有在获取锁的情况下才会调用
 */
private E dequeue() {
    final Object[] items = this.items;
    // 获取当前索引处元素
    E x = (E) items[takeIndex];
    // 将当前索引处置为空
    items[takeIndex] = null;
    // 修改takeIndex索引
    if (++takeIndex == items.length)
        // 如果修改后takeIndex超出items数组最大索引，则指向索引0处
        takeIndex = 0;
    // 元素数量-1
    count--;
    if (itrs != null)
        itrs.elementDequeued();
    // 唤醒一个非满队列中的线程
    notFull.signal();
    return x;
}
```
