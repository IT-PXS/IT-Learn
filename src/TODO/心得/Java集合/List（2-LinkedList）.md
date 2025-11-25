---
title: List（2-LinkedList）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: true
abbrlink: 2256
date: 2024-12-10 22:38:34
description: LinkedList是Java集合框架中的双向链表实现，位于java.util包中。它支持列表、队列和双端队列操作，适合频繁插入和删除元素的场景。与ArrayList相比，LinkedList在随机访问上效率较低，但在插入和删除中间元素时性能更优。线程不安全，如需同步需手动处理。
---

## 属性和接口

LinkedList 是双向链表，可通过头和尾节点遍历查询指定的数据

```java
public class LinkedList<E> extends AbstractSequentialList<E> 
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable {
    
    //表示链表的长度
    transient int size = 0;
    //链表的第一个节点
    transient Node<E> first;
    //链表的最后一个节点
    transient Node<E> last;
    
    private static class Node<E> {
        //数据域
        E item;
        //指向下一个节点
        Node<E> next;
        //指向上一个节点
        Node<E> prev;

        //构造方法
        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
}
```

**LinkedList 为什么不能实现 RandomAccess 接口？**

RandomAccess 是一个标记接口，用来表明实现该接口的类支持随机访问（即可以通过索引快速访问元素）。由于 LinkedList 底层数据结构是链表，内存地址不连续，只能通过指针来定位，不支持随机快速访问，所以不能实现 RandomAccess 接口。

## 构造方法

```java
public LinkedList() {
}

public LinkedList(Collection<? extends E> c) {
    this();
    addAll(c);
}
```

传入集合时，会调用 addAll 方法初始化链表信息

## 插入

1. 从头部或尾部插入元素

![](List（2-LinkedList）/1.png)

```java
//从链表尾部插入元素
public boolean add(E e) {
    linkLast(e);
    return true;
}

void linkLast(E e) {
    final Node<E> l = last;
    //e 的前驱节点为 l，后继节点为 null
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    //如果头节点为 null，则设置为新节点
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}

//从链表头部插入元素
public void addFirst(E e) {
    linkFirst(e);
}

private void linkFirst(E e) {
    final Node<E> f = first;
    final Node<E> newNode = new Node<>(null, e, f);
    first = newNode;
    if (f == null)
        last = newNode;
    else
        f.prev = newNode;
    size++;
    modCount++;
}

//从链表尾部插入元素
public void addLast(E e) {
    linkLast(e);
}
```

2. 从指定位置插入元素

![](List（2-LinkedList）/2.png)

```java
public void add(int index, E element) {
    //判断 index 下标是否越界
    checkPositionIndex(index);

    // 判断插入的位置
    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}

private void checkPositionIndex(int index) {
    if (!isPositionIndex(index))
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}

private boolean isPositionIndex(int index) {
    return index >= 0 && index <= size;
}

void linkBefore(E e, Node<E> succ) {
    //找到 succ 的上一个节点
    final Node<E> pred = succ.prev;
    //新节点插入到前继节点 pred, 后继节点 succ 之间
    final Node<E> newNode = new Node<>(pred, e, succ);
    //后继节点的 prev 指向新节点
    succ.prev = newNode;
    //前继节点 pred 为空，则新节点作为首节点 first，否则把前一个节点的 next 指向新节点
    if (pred == null)
        first = newNode;
    else
        pred.next = newNode;
    size++;
    modCount++;
}

Node<E> node(int index) {
    //如果 index < size/2，从前半部分找
    if (index < (size >> 1)) {
        Node<E> x = first;
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

## 查找

```java
public E get(int index) {
    //判断 index 下标是否越界
    checkElementIndex(index);
    return node(index).item;
}

private void checkElementIndex(int index) {
    if (!isElementIndex(index))
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}

private boolean isElementIndex(int index) {
    return index >= 0 && index < size;
}
```

## 删除

```java
public E remove(int index) {
    //判断 index 下标是否越界
    checkElementIndex(index);
    return unlink(node(index));
}

E unlink(Node<E> x) {
    final E element = x.item;
    final Node<E> next = x.next;
    final Node<E> prev = x.prev;

    //prev 为空，说明移除的节点是头节点
    if (prev == null) {
        first = next;
    } else {
        prev.next = next;
        x.prev = null;
    }

    //next 为空，说明移除的节点是尾结点
    if (next == null) {
        last = prev;
    } else {
        next.prev = prev;
        x.next = null;
    }

    x.item = null;
    size--;
    modCount++;
    return element;
}
```
