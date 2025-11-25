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

## 属性和接口

```java
public class TreeMap<K,V> extends AbstractMap<K,V>
    implements NavigableMap<K,V>, Cloneable, java.io.Serializable
{
    
    private final Comparator<? super K> comparator;

    private transient Entry<K,V> root;

    private transient int size = 0;

    private transient int modCount = 0;
}
```

1. NavigableMap 接口声明了一些具有导航功能的方法，通过这些导航方法，我们可以快速定位到目标的 key 或 Entry

```java
public interface NavigableMap<K,V> extends SortedMap<K,V> {
    // ....
    //返回红黑树中最小键所对应的 Entry
    Map.Entry<K,V> firstEntry();
    //返回最大的键 maxKey，且 maxKey 仅小于参数 key
    K lowerKey(K key);
    //返回最小的键 minKey，且 minKey 仅大于参数 key
    K higherKey(K key);
}
```

2. SortedMap 接口提供了一些基于有序键的操作

```java
public interface SortedMap<K,V> extends Map<K,V> {
	// ....
    //返回包含键值在 [minKey, toKey) 范围内的 Map
    SortedMap<K,V> headMap(K toKey);
    //返回包含键值在 [fromKey, toKey) 范围内的 Map
    SortedMap<K,V> subMap(K fromKey, K toKey);
}
```

## 构造方法

```java
public TreeMap() {
    comparator = null;
}

public TreeMap(Comparator<? super K> comparator) {
    this.comparator = comparator;
}

public TreeMap(Map<? extends K, ? extends V> m) {
    comparator = null;
    putAll(m);
}

public TreeMap(SortedMap<K, ? extends V> m) {
    comparator = m.comparator();
    try {
        buildFromSorted(m.size(), m.entrySet().iterator(), null, null);
    } catch (java.io.IOException cannotHappen) {
        
    } catch (ClassNotFoundException cannotHappen) {
        
    }
}
```

## 查找

TreeMap 的查找操作流程和二叉查找树一致，在 TreeMap 中，节点（Entry）存储的是键值对 <k,v>，在查找过程中，比较的是键的大小，返回的是值，如果没找到，则返回 null

```java
public V get(Object key) {
    Entry<K,V> p = getEntry(key);
    return (p==null ? null : p.value);
}

final Entry<K,V> getEntry(Object key) {
    if (comparator != null)
        return getEntryUsingComparator(key);
    if (key == null)
        throw new NullPointerException();
    @SuppressWarnings("unchecked")
		Comparable<? super K> k = (Comparable<? super K>) key;
    Entry<K,V> p = root;
    
    // 查找操作的核心逻辑就在这个 while 循环里
    while (p != null) {
        int cmp = k.compareTo(p.key);
        if (cmp < 0)
            p = p.left;
        else if (cmp > 0)
            p = p.right;
        else
            return p;
    }
    return null;
}

final Entry<K,V> getEntryUsingComparator(Object key) {
    @SuppressWarnings("unchecked")
        K k = (K) key;
    Comparator<? super K> cpr = comparator;
    if (cpr != null) {
        Entry<K,V> p = root;
        while (p != null) {
            int cmp = cpr.compare(k, p.key);
            if (cmp < 0)
                p = p.left;
            else if (cmp > 0)
                p = p.right;
            else
                return p;
        }
    }
    return null;
}
```

## 遍历

TreeMap 默认是正序，在初始化 KeyIterator 时，会将 TreeMap 中包含最小键的 Entry 传给 PrivateEntryIterator，当调用 nextEntry 方法时，通过调用 successor 方法找到当前 entry 的后继，并让 next 指向后继，最后返回当前的 entry，通过这种方法即可实现按正序返回键值的逻辑

```java
public Set<K> keySet() {
    return navigableKeySet();
}

public NavigableSet<K> navigableKeySet() {
    KeySet<K> nks = navigableKeySet;
    return (nks != null) ? nks : (navigableKeySet = new KeySet<>(this));
}

static final class KeySet<E> extends AbstractSet<E> implements NavigableSet<E> {
    private final NavigableMap<E, ?> m;
    KeySet(NavigableMap<E,?> map) { 
        m = map; 
    }

    public Iterator<E> iterator() {
        if (m instanceof TreeMap)
            return ((TreeMap<E,?>)m).keyIterator();
        else
            return ((TreeMap.NavigableSubMap<E,?>)m).keyIterator();
    }
}

Iterator<K> keyIterator() {
    return new KeyIterator(getFirstEntry());
}

final class KeyIterator extends PrivateEntryIterator<K> {
    KeyIterator(Entry<K,V> first) {
        super(first);
    }
    public K next() {
        return nextEntry().key;
    }
}

abstract class PrivateEntryIterator<T> implements Iterator<T> {
    Entry<K,V> next;
    Entry<K,V> lastReturned;
    int expectedModCount;

    PrivateEntryIterator(Entry<K,V> first) {
        expectedModCount = modCount;
        lastReturned = null;
        next = first;
    }

    public final boolean hasNext() {
        return next != null;
    }

    final Entry<K,V> nextEntry() {
        Entry<K,V> e = next;
        if (e == null)
            throw new NoSuchElementException();
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
        // 寻找节点 e 的后继节点
        next = successor(e);
        lastReturned = e;
        return e;
    }
}
```

## 插入

把 Entry 称为节点，并把新插入的节点称为 N，N 的父节点为 P，P 的父节点为 G，且 P 是 G 的左孩子，P 的兄弟节点为 U，在往红黑树中插入新的节点 N 后（新节点为红色），会产生下面 5 种情况：

1. N 是根节点
2. N 的父节点是黑色
3. N 的父节点是红色，叔叔节点也是红色
4. N 的父节点是红色，叔叔节点是黑色，且 N 是 P 的右孩子
5. N 的父节点是红色，叔叔节点是黑色，且 N 是 P 的左孩子

情况 2 不会破坏红黑树性质，所以无须处理；情况 1 会破坏红黑树性质 2（根是黑色），情况 3、4、5 会破坏红黑树性质 4（每个红色节点必须有两个黑色的子节点）

```java
public V put(K key, V value) {
    Entry<K,V> t = root;
    // 1.如果根节点为 null，将新节点设为根节点
    if (t == null) {
        compare(key, key);
        root = new Entry<>(key, value, null);
        size = 1;
        modCount++;
        return null;
    }
    int cmp;
    Entry<K,V> parent;
    // split comparator and comparable paths
    Comparator<? super K> cpr = comparator;
    if (cpr != null) {
        // 2.为 key 在红黑树找到合适的位置
        do {
            parent = t;
            cmp = cpr.compare(key, t.key);
            if (cmp < 0)
                t = t.left;
            else if (cmp > 0)
                t = t.right;
            else
                return t.setValue(value);
        } while (t != null);
    } else {
        // 与上面代码逻辑类似，省略
    }
    Entry<K,V> e = new Entry<>(key, value, parent);
    // 3.将新节点链入红黑树中
    if (cmp < 0)
        parent.left = e;
    else
        parent.right = e;
    // 4.插入新节点可能会破坏红黑树性质，这里修正一下
    fixAfterInsertion(e);
    size++;
    modCount++;
    return null;
}
```

![](Map（5-TreeMap）/1.png)

## 删除

把最终被删除的节点称为 X，X 的替换节点称为 N，N 的父节点为 P，且 N 是 P 的左孩子，N 的兄弟节点为 S，S 的左孩子为 SL，右孩子为 SR

1. 最终被删除的节点 X 是红色节点
2. X 是黑色节点，但该节点的孩子节点是红色
3. 替换节点 N 是新的根
4. N 为黑色，N 的兄弟节点 S 为红色，其他节点为黑色
5. N 为黑色，N 的父节点 P，兄弟节点 S 和 S 的孩子节点均为黑色
6. N 为黑色，P 是红色，S 和 S 孩子均为黑色
7. N 为黑色，P 可红可黑，S 为黑色，S 的左孩子 SL 为红色，右孩子 SR 为黑色
8. N 为黑色，P 可红可黑，S 为黑色，SR 为红色，SL 可红可黑

```java
public V remove(Object key) {
    Entry<K,V> p = getEntry(key);
    if (p == null)
        return null;

    V oldValue = p.value;
    deleteEntry(p);
    return oldValue;
}

private void deleteEntry(Entry<K,V> p) {
    modCount++;
    size--;

    /* 
     * 1. 如果 p 有两个孩子节点，则找到后继节点，
     * 并把后继节点的值复制到节点 P 中，并让 p 指向其后继节点
     */
    if (p.left != null && p.right != null) {
        Entry<K,V> s = successor(p);
        p.key = s.key;
        p.value = s.value;
        p = s;
    } // p has 2 children

    // Start fixup at replacement node, if it exists.
    Entry<K,V> replacement = (p.left != null ? p.left : p.right);

    if (replacement != null) {
        /*
         * 2. 将 replacement parent 引用指向新的父节点，
         * 同时让新的父节点指向 replacement。
         */ 
        replacement.parent = p.parent;
        if (p.parent == null)
            root = replacement;
        else if (p == p.parent.left)
            p.parent.left  = replacement;
        else
            p.parent.right = replacement;

        // Null out links so they are OK to use by fixAfterDeletion.
        p.left = p.right = p.parent = null;

        // 3. 如果删除的节点 p 是黑色节点，则需要进行调整
        if (p.color == BLACK)
            fixAfterDeletion(replacement);
    } else if (p.parent == null) { // 删除的是根节点，且树中当前只有一个节点
        root = null;
    } else { // 删除的节点没有孩子节点
        // p 是黑色，则需要进行调整
        if (p.color == BLACK)
            fixAfterDeletion(p);

        // 将 P 从树中移除
        if (p.parent != null) {
            if (p == p.parent.left)
                p.parent.left = null;
            else if (p == p.parent.right)
                p.parent.right = null;
            p.parent = null;
        }
    }
}
```

deleteEntry 方法的执行流程：

1. 如果待删除节点 P 有两个孩子，则先找到 P 的后继 S，然后将 S 中的值拷贝到 P 中，并让 P 指向 S
2. 如果最终被删除节点 P（P 现在指向最终被删除节点）的孩子不为空，则用其孩子节点替换掉
3. 如果最终被删除的节点是黑色的话，调用 fixAfterDeletion 方法进行修复

fixAfterDeletion 方法流程：

![](Map（5-TreeMap）/2.png)
