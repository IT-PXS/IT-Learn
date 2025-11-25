---
title: List（3-CopyOnWriteArrayList）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: true
abbrlink: 20923
date: 2024-12-11 22:38:34
description: CopyOnWriteArrayList是Java集合框架中线程安全的列表实现，适用于并发环境。其核心特性是在写操作时复制底层数组，确保读操作不受影响。适合读多写少的场景，提供一致性快照和线程安全性，但因复制开销较高，不适用于高频写操作。位于java.util.concurrent包中。
---

## 实现原理

CopyOnWriteArrayList 允许线程并发访问读操作，这个时候是没有加锁限制的，性能较高。而写操作的时候，则首先将容器复制一份，然后再新的副本上执行写操作，这个时候写操作是上锁的，结束之后再将原容器的引用指向新容器。

注意：在上锁执行写操作的过程中，如果有需要读操作，会作用在原容器上。因此上锁的写操作不会影响到并发访问的读操作

## 属性和接口

```java
public class CopyOnWriteArrayList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    //互斥锁
    final transient ReentrantLock lock = new ReentrantLock();

    //底层存储数据数组，只能通过 getArray/setArray 访问设置，volatile 动态数组
    private transient volatile Object[] array;
    
    final void setArray(Object[] a) {
        array = a;
    }
}
```

## 构造方法

```java
public CopyOnWriteArrayList() {
    setArray(new Object[0]);
}

//传入 Collection 集合对象，将集合中元素存入 CopyOnWriteArrayList
public CopyOnWriteArrayList(Collection<? extends E> c) {
    Object[] elements;
    if (c.getClass() == CopyOnWriteArrayList.class)
        elements = ((CopyOnWriteArrayList<?>)c).getArray();
    else {
        elements = c.toArray();
        // c.toArray might (incorrectly) not return Object [] (see 6260652)
        if (elements.getClass() != Object[].class)
            elements = Arrays.copyOf(elements, elements.length, Object[].class);
    }
    setArray(elements);
}

//传入数组
public CopyOnWriteArrayList(E[] toCopyIn) {
    setArray(Arrays.copyOf(toCopyIn, toCopyIn.length, Object[].class));
}
```

## 插入

```java
public boolean add(E e) {
    //获得互斥锁
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        //获取原始数组
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);
        newElements[len] = e;
        //用新的拷贝数组代替原始数组
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();
    }
}

public void add(int index, E element) {
    //互斥锁
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        //原始数组
        Object[] elements = getArray();
        int len = elements.length;
        //检查 index 有效性
        if (index > len || index < 0)
            throw new IndexOutOfBoundsException("Index: "+index+", Size: "+len);
        //拷贝数组
        Object[] newElements;
        //从 index 到数组末尾要向后移动一位数组元素的个数
        int numMoved = len - index;
        //如果 index == length，直接把原数组复制到新数组
        if (numMoved == 0)
            newElements = Arrays.copyOf(elements, len + 1);
        //否则分成两段复制，原始数组 index 前面的元素位置一一对应赋值到新数组，原数组 index 开始的元素复制到
        //新数组 index+1 到 length+1，相当于依次后移。空出来的 index 就是新元素插入的位置
        else {
            newElements = new Object[len + 1];
            System.arraycopy(elements, 0, newElements, 0, index);
            System.arraycopy(elements, index, newElements, index + 1, numMoved);
        }
        //插入新元素
        newElements[index] = element;
        setArray(newElements);
    } finally {
        lock.unlock();
    }
}
```

1. 在写入过程中使用了互斥锁，所以同一时间只有一个线程在修改 CopyOnWriteArrayList
2. 增加元素并不是直接在原数组操作，而是在原数组的拷贝数组上添加元素的，添加完元素再调用 setArray 方法用新数组代替原始数组

## 删除

```java
//根据下标删除元素
public E remove(int index) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;
        //数组 index 处要移除的元素
        E oldValue = get(elements, index);
        int numMoved = len - index - 1;
        if (numMoved == 0)
            setArray(Arrays.copyOf(elements, len - 1));
        else {
            Object[] newElements = new Object[len - 1];
            System.arraycopy(elements, 0, newElements, 0, index);
            System.arraycopy(elements, index + 1, newElements, index, numMoved);
            setArray(newElements);
        }
        return oldValue;
    } finally {
        lock.unlock();
    }
}

//根据元素删除
public boolean remove(Object o) {
    Object[] snapshot = getArray();
    //查找指定元素下标
    int index = indexOf(o, snapshot, 0, snapshot.length);
    return (index < 0) ? false : remove(o, snapshot, index);
}

private static int indexOf(Object o, Object[] elements, int index, int fence) {
    if (o == null) {
        for (int i = index; i < fence; i++)
            if (elements[i] == null)
                return i;
    } else {
        for (int i = index; i < fence; i++)
            if (o.equals(elements[i]))
                return i;
    }
    return -1;
}

private boolean remove(Object o, Object[] snapshot, int index) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] current = getArray();
        int len = current.length;
        //判断当前数组元素是否相同，如果不相同则重新查找元素的下标
        if (snapshot != current) findIndex: {
            int prefix = Math.min(index, len);
            for (int i = 0; i < prefix; i++) {
                if (current[i] != snapshot[i] && eq(o, current[i])) {
                    index = i;
                    break findIndex;
                }
            }
            if (index >= len)
                return false;
            if (current[index] == o)
                break findIndex;
            index = indexOf(o, current, index, len);
            if (index < 0)
                return false;
        }
        Object[] newElements = new Object[len - 1];
        System.arraycopy(current, 0, newElements, 0, index);
        System.arraycopy(current, index + 1, newElements, index, len - index - 1);
        setArray(newElements);
        return true;
    } finally {
        lock.unlock();
    }
}

//根据指定范围删除删除
void removeRange(int fromIndex, int toIndex) {
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        Object[] elements = getArray();
        int len = elements.length;

        if (fromIndex < 0 || toIndex > len || toIndex < fromIndex)
            throw new IndexOutOfBoundsException();
        int newlen = len - (toIndex - fromIndex);
        int numMoved = len - toIndex;
        if (numMoved == 0)
            setArray(Arrays.copyOf(elements, newlen));
        else {
            Object[] newElements = new Object[newlen];
            System.arraycopy(elements, 0, newElements, 0, fromIndex);
            System.arraycopy(elements, toIndex, newElements, fromIndex, numMoved);
            setArray(newElements);
        }
    } finally {
        lock.unlock();
    }
}
```

注意：根据元素进行删除时，第一次获取元素下标后，拿到锁后会重新判断元素的下标（防止此时数组元素的顺序被修改而删错其他元素）

## 查找

```java
public E get(int index) {
    return get(getArray(), index);
}

@SuppressWarnings("unchecked")
private E get(Object[] a, int index) {
    //返回数组 index 处位置
    return (E) a[index];
}
```

## 优缺点

1. 优点：读操作性能很高，因为无需任何同步措施，比较适用于读多写少的并发场景。在遍历传统的 List 时，若中途有别的线程对其进行修改，则会抛出 ConcurrentModificationException 异常。而 CopyOnWriteArrayList 由于其“读写分离”的思想，遍历和修改操作分别作用在不同的 List 容器，所以在使用迭代器进行遍历时候，也就不会抛出 ConcurrentModificationException 异常
2. 缺点：一是内存占用问题，每次执行写操作都要将原容器拷贝一份，数据量大时，对内存压力较大，可能会引起频繁 GC。二是无法保证实时性，Vector 对于读写操作均加锁操作，可以保证读和写的一致性。而 CopyOnWriteArrayList 由于其实现策略的原因，写和读分别作用在新老不同容器上，在写操作执行过程中，读不会阻塞但读取到的却是老容器的数据
