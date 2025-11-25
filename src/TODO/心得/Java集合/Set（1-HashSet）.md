---
title: Set（1-HashSet）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: true
abbrlink: 23204
date: 2025-01-26 22:38:34
description: Java 的 HashSet 是基于哈希表实现的集合，用于存储不重复的元素。它不保证元素顺序，支持快速查找、添加和删除操作，时间复杂度为 O(1)。适合处理需要高效去重的场景，但因无序性不适合需要保持顺序的需求。
---

## 实现原理

1. HashSet 的实现是依赖于 HashMap 的，HashSet 的值都是存储在 HashMap 中的。在 HashSet 的构造法中会初始化一个 HashMap 对象，HashSet 不允许值重复。因此，HashSet 的值是作为 HashMap 的 key 存储在 HashMap 中的，当存储的值已经存在时返回 false
2. HashSet 非线程安全，允许 null 值，添加值的时候会先获取对象的 hashCode 方法，如果 hashCode 方法返回的值一致，则再调用 equals 方法判断是否一致，如果不一致才 add 元素。HashSet 不保证迭代时顺序，也不保证存储的元素的顺序保持不变

## 接口和属性

```java
public class HashSet<E> extends AbstractSet<E> 
    implements Set<E>, Cloneable, java.io.Serializable  {  
   // 底层使用HashMap来保存HashSet中所有元素。  
   private transient HashMap<E,Object> map;  
     
   // 定义一个虚拟的Object对象作为HashMap的value，将此对象定义为static final。  
   private static final Object PRESENT = new Object(); 

   //........
}
```

## 构造方法

```java
/** 
* 默认的无参构造器，构造一个空的HashSet。 
* 实际底层会初始化一个空的HashMap，并使用默认初始容量为16和加载因子0.75。 
*/  
public HashSet() {  
    map = new HashMap<E,Object>();  
}  

/** 
* 构造一个包含指定collection中的元素的新set。 
* 实际底层使用默认的加载因子0.75和足以包含指定collection中所有元素的初始容量来创建一个HashMap。 
*/  
public HashSet(Collection<? extends E> c) {  
    map = new HashMap<E,Object>(Math.max((int) (c.size()/.75f) + 1, 16));  
    addAll(c);  
} 

/** 
* 以指定的initialCapacity和loadFactor构造一个空的HashSet。 
* 实际底层以相应的参数构造一个空的HashMap。 
*/  
public HashSet(int initialCapacity, float loadFactor) {  
    map = new HashMap<E,Object>(initialCapacity, loadFactor);  
}  

/** 
* 以指定的initialCapacity构造一个空的HashSet。 
* 实际底层以相应的参数及加载因子loadFactor为0.75构造一个空的HashMap。  
*/  
public HashSet(int initialCapacity) {  
    map = new HashMap<E,Object>(initialCapacity);  
}  

/** 
* 以指定的initialCapacity和loadFactor构造一个新的空链接哈希集合。 
* 此构造函数为包访问权限，不对外公开，实际只是是对LinkedHashSet的支持。 
* 实际底层会以指定的参数构造一个空LinkedHashMap实例来实现。 
*/  
public HashSet(int initialCapacity, float loadFactor, boolean dummy) {  
    map = new LinkedHashMap<E,Object>(initialCapacity, loadFactor);  
}  
```

## 插入

```java
/** 
* 如果此set中尚未包含指定元素，则添加指定元素。 
* 更确切地讲，如果此 set 没有包含满足(e==null?e2==null:e.equals(e2))的元素e2，则向此set添加指定的元素e。 
* 
* 底层实际将将该元素作为key放入HashMap。 
* 当新放入HashMap的Entry中key与集合中原有Entry的key相同
* 新添加的Entry的value会将覆盖原来Entry的value，但key不会有任何改变， 
* 因此如果向HashSet中添加一个已经存在的元素时，新添加的集合元素将不会被放入HashMap中， 
* 原来的元素也不会有任何改变，这也就满足了Set中元素不重复的特性。 
*/  
public boolean add(E e) {  
    return map.put(e, PRESENT)==null;  
} 
```

## 删除

```java
/** 
* 如果指定元素存在于此set中，则将其移除。 
* 更确切地讲，如果此set包含一个满足(o==null?e==null:o.equals(e))的元素e，则将其移除。如果此set已包含该元素，则返回true 
* 
* 底层实际调用HashMap的remove方法删除指定Entry。 
*/  
public boolean remove(Object o) {  
    return map.remove(o)==PRESENT;  
}  
```

## 包含

```java
public boolean contains(Object o) {
    return map.containsKey(o);
}
```

## 其他

### 怎么保证元素不重复？

元素值作为的是 map 的 key，map 的 value 则是 PRESENT 变量，这个变量只作为放入 map 时的一个占位符而存在，没实际用处。HashMap 的 key 是不能重复的，而 HashSet 的元素又作为 map 的 key，所以也不能重复

**为什么 val 要放上一个静态常量 present？**

1. HashMap 使用 put 的时候，会把 put 的数据放在其位置上，如果该位置上已经存在当前 key，会对其 key 映射的 val 给替换掉，并且返回之前的 val；如果没有 key，则返回 null
2. val 放了一个 hashset 类的静态常量 present，如果 put 返回的是 null，不是 present，就说明 put 的 key 是不存在的，add 也会返回 true。如果 put 返回的是 present 就说明之前的 key 是存在的，并不是没有 put 上，所以 add 方法返回的 false 并不是存失败的意思

### HashSet 是有序的吗？

HashSet 是无序的，它不能保证存储和取出顺序一致

```java
public class SetOfInteger {
    public static void main(String[] args) {
        Random rand = new Random(47);
        Set<Integer> intset = new HashSet<Integer>();
        for (int i = 0; i<10000; i++) {
            intset.add(rand.nextInt(30));
        }
        System.out.println(intset);
    }
}

// 运行结果：
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
```

```java
// HashSet 源码节选-JKD8
public boolean add(E e) {
    return map.put(e, PRESENT)==null;
}

// HashMap 源码节选-JDK8
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

// HashMap 源码节选-JDK8
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// 这里因为value的类型是Integer，所以使用的是Integer的hashCode
public static int hashCode(int value) {
    return value;
}
```

Integer 中 hashCode 方法的返回值就是这个数本身，当数值小于 65536 时，得到的 hash 值是本身，插入到 HashMap 中的顺序即 hash 的顺序，所以是有序的；当超过该值时，HashSet 是无序的