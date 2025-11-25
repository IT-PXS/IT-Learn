---
title: Map（3-LinkedHashMap）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: true
abbrlink: 23204
date: 2025-01-25 22:38:34
description: Java LinkedHashMap是基于哈希表和双向链表实现的Map集合，维护元素的插入顺序或访问顺序。它支持快速插入、删除和访问操作，同时可通过设置accessOrder为true实现按最近访问排序。常用于缓存实现等场景，需注意其空间开销较普通HashMap稍高。
---

## 接口和属性

```java
public class LinkedHashMap<K,V> extends HashMap<K,V> implements Map<K,V> {
    //双链表头节点
    transient Entry<K,V> head;
    //双链表尾节点
    transient Entry<K,V> tail;
    //为true则表示按照基于访问的顺序来排列，意思就是最近使用的entry，放在链表的最末尾，
    //为false表示按照基于插入的顺序来排列，后插入的放在链表末尾，不指定默认为false
    final boolean accessOrder;

    static class Entry<K,V> extends HashMap.Node<K,V> {
        //双链表前继、后继节点
        Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }
}
```

## 构造方法

```java
//指定accessOrder的值
public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}

//按照默认值初始化
public LinkedHashMap() {
    super();
    accessOrder = false;
}

public LinkedHashMap(Map<? extends K, ? extends V> m) {
    super();
    accessOrder = false;
    putMapEntries(m, false);
}

//指定初始化时的容量
public LinkedHashMap(int initialCapacity) {
    super(initialCapacity);
    accessOrder = false;
}

//指定初始化时的容量，和扩容的加载因子
public LinkedHashMap(int initialCapacity, float loadFactor) {
    super(initialCapacity, loadFactor);
    accessOrder = false;
}
```

## 插入

```java
// HashMap 中实现
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

// HashMap 中实现
final V putVal(int hash, K key, V value, boolean onlyIfAbsent, boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    if ((tab = table) == null || (n = tab.length) == 0) {...}
    // 通过节点 hash 定位节点所在的桶位置，并检测桶中是否包含节点引用
    if ((p = tab[i = (n - 1) & hash]) == null) {...}
    else {
        Node<K,V> e; K k;
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;
        else if (p instanceof TreeNode) {...}
        else {
            // 遍历链表，并统计链表长度
            for (int binCount = 0; ; ++binCount) {
                // 未在单链表中找到要插入的节点，将新节点接在单链表的后面
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    if (binCount >= TREEIFY_THRESHOLD - 1) {...}
                    break;
                }
                // 插入的节点已经存在于单链表中
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                p = e;
            }
        }
        if (e != null) { // existing mapping for key
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null) {...}
            afterNodeAccess(e);    // 回调方法，后续说明
            return oldValue;
        }
    }
    ++modCount;
    if (++size > threshold) {...}
    afterNodeInsertion(evict);    // 回调方法，后续说明
    return null;
}
```

LinkedHashMap 重写了 newNode 和回调方法 afterNodeAccess、afterNodeInsertion

```java
//在构建新节点时，构建的是LinkedHashMap.Entry 不再是Node.
Node<K,V> newNode(int hash, K key, V value, Node<K,V> e) {
    Entry<K,V> p = new Entry<K,V>(hash, key, value, e);
    linkNodeLast(p);
    return p;
}

//将新增的节点，连接在链表的尾部
private void linkNodeLast(Entry<K,V> p) {
    Entry<K,V> last = tail;
    tail = p;
    //若集合是空的
    if (last == null)
        head = p;
    //新节点插到链表顶部
    else {
        p.before = last;
        last.after = p;
    }
}

//仅仅在accessOrder为true时进行，把当前访问的元素移动到链表尾部
void afterNodeAccess(Node<K,V> e) { // move node to last
    Entry<K,V> last;
    //当accessOrder的值为true，且e不是尾节点
    if (accessOrder && (last = tail) != e) {
        //将e赋值临时节点p， b是e的前一个节点， a是e的后一个节点
        Entry<K,V> p = (Entry<K,V>)e, b = p.before, a = p.after;
        //设置p的后一个节点为null，因为执行后p在链表末尾，after肯定为null
        p.after = null;
        //p的前一个节点不存在，p就是头节点，那么把p放到最后，a就是头节点
        if (b == null)
            head = a;
        //p的前一个节点存在，p放到最后，b的后一个节点指向a
        else
            b.after = a;
        //p的后一个节点存在，p放到最后，a的前一个节点指向a
        if (a != null)
            a.before = b;
        //p的后一个节点不存在
        else
            last = b;
        //只有一个p节点
        if (last == null)
            head = p;
        //last不为空，把p放到last节点后面
        else {
            p.before = last;
            last.after = p;
        }
        //p为尾节点
        tail = p;
        ++modCount;
    }
}

//回调函数，新节点插入之后回调，根据evict和accessOrder判断是否需要删除最老/早插入的节点。
//如果实现LruCache会用到这个方法。
//removeEldestEntry制定删除规则，JDK8中默认返回false
void afterNodeInsertion(boolean evict) { // possibly remove eldest
    Entry<K,V> first;
    if (evict && (first = head) != null && removeEldestEntry(first)) {
        K key = first.key;
        removeNode(hash(key), key, null, false, true);
    }
}

protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
    return false;
}
```

**LinkedHashMap 如何实现 LRU 缓存？**

将 accessOrder 设置为 true 并重写 removeEldestEntry 方法当链表大小超过容量时返回 true，使得每次访问一个元素时，该元素会被移动到链表的末尾。一旦插入操作让 removeEldestEntry 返回 true 时，视为缓存已满，LinkedHashMap 就会将链表首元素移除，由此我们就能实现一个 LRU 缓存。

```java
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    /**
     * 判断size超过容量时返回true，告知LinkedHashMap移除最老的缓存项(即链表的第一个元素)
     */
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}
```

```java
LRUCache<Integer, String> cache = new LRUCache<>(3);
cache.put(1, "one");
cache.put(2, "two");
cache.put(3, "three");
cache.put(4, "four");
cache.put(5, "five");
for (int i = 1; i <= 5; i++) {
    System.out.println(cache.get(i));
}
```

## 删除

```java
// HashMap 中实现
public V remove(Object key) {
    Node<K,V> e;
    return (e = removeNode(hash(key), key, null, false, true)) == null ? null : e.value;
}

// HashMap 中实现
final Node<K,V> removeNode(int hash, Object key, Object value, boolean matchValue, boolean movable) {
    Node<K,V>[] tab; Node<K,V> p; int n, index;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (p = tab[index = (n - 1) & hash]) != null) {
        Node<K,V> node = null, e; K k; V v;
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            node = p;
        else if ((e = p.next) != null) {
            if (p instanceof TreeNode) {...}
            else {
                // 遍历单链表，寻找要删除的节点，并赋值给 node 变量
                do {
                    if (e.hash == hash &&
                        ((k = e.key) == key ||
                         (key != null && key.equals(k)))) {
                        node = e;
                        break;
                    }
                    p = e;
                } while ((e = e.next) != null);
            }
        }
        if (node != null && (!matchValue || (v = node.value) == value ||
                             (value != null && value.equals(v)))) {
            if (node instanceof TreeNode) {...}
            // 将要删除的节点从单链表中移除
            else if (node == p)
                tab[index] = node.next;
            else
                p.next = node.next;
            ++modCount;
            --size;
            afterNodeRemoval(node);    // 调用删除回调方法进行后续操作
            return node;
        }
    }
    return null;
}

// LinkedHashMap 中覆写
void afterNodeRemoval(Node<K,V> e) { // unlink
    LinkedHashMap.Entry<K,V> p = (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
    // 将 p 节点的前驱后后继引用置空
    p.before = p.after = null;
    // b 为 null，表明 p 是头节点
    if (b == null)
        head = a;
    else
        b.after = a;
    // a 为 null，表明 p 是尾节点
    if (a == null)
        tail = b;
    else
        a.before = b;
}
```

1. 根据 hash 定位到桶位置
2. 遍历链表或调用红黑树相关的删除方法
3. 从 LinkedHashMap 维护的双链表中移除要删除的节点

## 查找

默认情况下，LinkedHashMap 是按插入顺序维护链表，不过我们可以在初始化 LinkedHashMap，指定 accessOrder 参数为 true，即可让它按访问顺序维护链表，当我们调用 get/getOrDefault/replace 等方法时，只要将这些方法访问的节点移动到链表的尾部即可（其前驱和后继也会跟着更新）

```java
// LinkedHashMap 中覆写
public V get(Object key) {
    Node<K,V> e;
    if ((e = getNode(hash(key), key)) == null)
        return null;
    // 如果 accessOrder 为 true，则调用 afterNodeAccess 将被访问节点移动到链表最后
    if (accessOrder)
        afterNodeAccess(e);
    return e.value;
}

public V getOrDefault(Object key, V defaultValue) {
   Node<K,V> e;
   if ((e = getNode(hash(key), key)) == null)
       return defaultValue;
   if (accessOrder)
       afterNodeAccess(e);
   return e.value;
}

void afterNodeAccess(Node<K,V> e) { // move node to last
    LinkedHashMap.Entry<K,V> last;
    if (accessOrder && (last = tail) != e) {
        LinkedHashMap.Entry<K,V> p =
            (LinkedHashMap.Entry<K,V>)e, b = p.before, a = p.after;
        p.after = null;
        if (b == null)
            head = a;
        else
            b.after = a;
        if (a != null)
            a.before = b;
        else
            last = b;
        if (last == null)
            head = p;
        else {
            p.before = last;
            last.after = p;
        }
        tail = p;
        ++modCount;
    }
}
```

1. 访问键值为 3 的节点前

![](Map（3-LinkedHashMap）/5.png)

2. 访问后，键值为 3 的节点将会被移动到双向链表的最后位置，其前驱和后继也会跟着更新

![](Map（3-LinkedHashMap）/6.png)

**插入顺序遍历**

```java
HashMap<String, String> map = new LinkedHashMap<>();
map.put("a", "2");
map.put("g", "3");
map.put("r", "1");
map.put("e", "23");

for (Map.Entry<String, String> entry: map.entrySet()) {
    System.out.println(entry.getKey() + ":" + entry.getValue());
}
```

**访问顺序遍历**

```java
LinkedHashMap<Integer, String> map = new LinkedHashMap<>(16, 0.75f, true);
map.put(1, "one");
map.put(2, "two");
map.put(3, "three");
map.put(4, "four");
map.put(5, "five");
//访问元素2,该元素会被移动至链表末端
map.get(2);
//访问元素3,该元素会被移动至链表末端
map.get(3);
for (Map.Entry<Integer, String> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " : " + entry.getValue());
}
```

