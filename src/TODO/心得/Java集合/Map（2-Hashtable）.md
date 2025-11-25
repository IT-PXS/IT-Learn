---
title: Map（2-Hashtable）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: true
abbrlink: 23204
date: 2025-01-23 22:38:34
description: Java 的 Hashtable 是一种线程安全的键值对存储数据结构，基于哈希表实现。它不允许 null 键或 null 值，支持同步操作，因此适用于多线程环境。通过哈希函数存储数据，使用链表解决冲突，但性能较 HashMap 略低。常用于需要线程安全的场景，但多被 ConcurrentHashMap 替代。
---

## 属性和接口

底层是基于数组+链表实现的，无序，且键和值都不允许为 null，Hashtable 是线程安全的（基于 synchronized 实现）

![](Map（2-Hashtable）/1.png)

```java
public class Hashtable<K,V> extends Dictionary<K,V> 
    implements Map<K,V>, Cloneable, java.io.Serializable {
    //存储键值对Entry的哈希桶数组
    private transient Entry<?,?>[] table;
    //哈希桶数组table中存放的键值对Entry数量
    private transient int count;
    //哈希桶数组table扩容阈值，threshold=capacity(数组容量) * loadFactor(加载因子)
    private int threshold;
    //加载因子
    private float loadFactor;
    //Hashtable结构性修改次数
    private transient int modCount = 0;
    
    //静态内部类
    private static class Entry<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        V value;
        Entry<K,V> next;

        protected Entry(int hash, K key, V value, Entry<K,V> next) {
            this.hash = hash;
            this.key =  key;
            this.value = value;
            this.next = next;
        }
    }
}
```

## 构造方法

```java
public Hashtable() {
    this(11, 0.75f);
}

public Hashtable(int initialCapacity) {
    this(initialCapacity, 0.75f);
}

public Hashtable(int initialCapacity, float loadFactor) {
    //如果自定义初始容量小于0，则抛IllegalArgumentException
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal Capacity: "+ initialCapacity);
                                           
    //如果自定义的加载因子小于0或者为非数值类型，则抛IllegalArgumentException
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal Load: "+loadFactor);
    
    //如果自定义初始容量等于0，则使用1作为Hashtable的初始容量
    if (initialCapacity==0)
        initialCapacity = 1;
    this.loadFactor = loadFactor;
    //新建一个指定容量的Entry数组
    table = new Entry<?,?>[initialCapacity];
    //计算扩容阈值
    threshold = (int)Math.min(initialCapacity * loadFactor, MAX_ARRAY_SIZE + 1);
}
```

## 插入

```java
public synchronized V put(K key, V value) {
    //判断value是否为null，确保不存在null值
    if (value == null) {
        throw new NullPointerException();
    }

    //确定该键是否存在于哈希桶数组中
    Entry<?,?> tab[] = table;
    //获取键的哈希值
    int hash = key.hashCode();
    //计算键key在哈希桶数组table中的存储下标
    int index = (hash & 0x7FFFFFFF) % tab.length;
    
    @SuppressWarnings("unchecked")
    //将table数组index位置的值转换为Entry类型的数据
    Entry<K,V> entry = (Entry<K,V>)tab[index];
    //如果index位置的键值对entry不为空，则遍历链表，找到键相同的Entry键值对
    for(; entry != null ; entry = entry.next) {
        //如果Hashtable中原来的键值对的哈希值等于待插入的键值对的哈希值
        //并且两个键值对对应的键key相等，则覆盖原来的键值对的值，无需插入
        if ((entry.hash == hash) && entry.key.equals(key)) {
            //保存旧值
            V old = entry.value;
            //覆盖旧值
            entry.value = value;
            //返回旧值
            return old;
        }
    }
    //哈希桶数组中不存在相同的键，调用addEntry()方法实现添加
    addEntry(hash, key, value, index);
    //添加新的键值对成功，返回null
    return null;
}

private void addEntry(int hash, K key, V value, int index) {
    //结构性修改次数+1
    modCount++;
    //获取哈希桶数组table
    Entry<?,?> tab[] = table;
    //如果哈希桶数组中Entry键值对的数量大于扩容阈值threshold
    //则调用rehash()进行扩容
    if (count >= threshold) {
        // Rehash the table if the threshold is exceeded
        rehash();
        //获取扩容后哈希桶数组table
        tab = table;
        //重新获取键的哈希值
        hash = key.hashCode();
        //重新计算key在新的哈希桶数组中的下标index
        index = (hash & 0x7FFFFFFF) % tab.length;
    }
   
    @SuppressWarnings("unchecked")
    //将index位置的值的类型转换为Entry<K,V>类型
    Entry<K,V> e = (Entry<K,V>) tab[index];
    //新建一个Entry键值对，并将其存储到哈希表中index位置处
    tab[index] = new Entry<>(hash, key, value, e);
    //哈希桶数组中键值对数量+1
    count++;
}
```

1. 判断 value 是否为 null，不为空则执行下面的操作
2. 计算键的哈希值，通过哈希值获取在哈希桶数组的下标
3. 将 table 数组 index 位置的值转换为 Entry 类型的数据
4. 如果 index 位置的键值对 entry 不为空，则遍历链表，找到键相同的 Entry 键值对进行替换；
5. 如果没有，则调用 addEntry 进行添加，要先判断是否需要扩容（如果哈希桶数组中 Entry 键值对的数量大于扩容阈值 threshold，则调用 rehash()进行扩容）

**为什么 HashTable 不能存 null 键和 null 值？**

1. 当 value 值为 null 时主动抛出空指针异常
2. 因为 key 值会进行哈希计算，如果为 null 的话，无法调用该方法，还是会抛出空指针异常

## 删除

```java
public synchronized V remove(Object key) {
    Entry<?,?> tab[] = table;
    int hash = key.hashCode();
    // 计算哈希桶的下标位置
    int index = (hash & 0x7FFFFFFF) % tab.length;
    @SuppressWarnings("unchecked")
    Entry<K,V> e = (Entry<K,V>)tab[index];
    for(Entry<K,V> prev = null ; e != null ; prev = e, e = e.next) {
        if ((e.hash == hash) && e.key.equals(key)) {
            modCount++;
            // 判断是否为头节点，是则将头节点指向下一节点
            if (prev != null) {
                prev.next = e.next;
            } else {
                tab[index] = e.next;
            }
            count--;
            V oldValue = e.value;
            e.value = null;
            return oldValue;
        }
    }
    return null;
}
```

## 查找

```java
public synchronized V get(Object key) {
    Entry<?,?> tab[] = table;
    int hash = key.hashCode();
    int index = (hash & 0x7FFFFFFF) % tab.length;
    for (Entry<?,?> e = tab[index] ; e != null ; e = e.next) {
        if ((e.hash == hash) && e.key.equals(key)) {
            return (V)e.value;
        }
    }
    return null;
}
```

## 扩容方法

 扩容公式：（当前哈希桶数组的容量*2）+1 

```java
protected void rehash() {
    int oldCapacity = table.length;
    Entry<?,?>[] oldMap = table;

    // 计算新的数组容量
    int newCapacity = (oldCapacity << 1) + 1;
    //如果新数组的容量大于Hashtable的最大容量
    if (newCapacity - MAX_ARRAY_SIZE > 0) {
        //如果原来数组的容量已经等于最大容量则结束扩容
        if (oldCapacity == MAX_ARRAY_SIZE)
            return;
        //否则，原数组还未达最大允许容量，则将最大容量作为扩容后的新容量
        newCapacity = MAX_ARRAY_SIZE;
    }
    //新建容量为上面计算的newCapacity的Entry数组
    Entry<?,?>[] newMap = new Entry<?,?>[newCapacity];
    //结构修改性次数+1
    modCount++;
    //重新计算扩容阈值
    threshold = (int)Math.min(newCapacity * loadFactor, MAX_ARRAY_SIZE + 1);
    //将扩容后的entry数组赋值给table
    table = newMap;
    //遍历原来的哈希桶数组，将原来数组中的键值对重新定位到新数组中    
    for (int i = oldCapacity ; i-- > 0 ;) {
        //遍历链表
        for (Entry<K,V> old = (Entry<K,V>)oldMap[i] ; old != null ; ) {
            Entry<K,V> e = old;
            old = old.next;
            //重新计算键值对在新数组的索引下标
            int index = (e.hash & 0x7FFFFFFF) % newCapacity;
            e.next = (Entry<K,V>)newMap[index];
            newMap[index] = e;
        }
    }
}
```
