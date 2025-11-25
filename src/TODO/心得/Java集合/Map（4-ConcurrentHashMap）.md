---
title: Map（4-ConcurrentHashMap）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: false
abbrlink: 23204
date: 2025-01-27 22:38:34
description: ConcurrentHashMap是Java中线程安全的高性能哈希表实现，采用分段锁（JDK7）或CAS+synchronized（JDK8）保证并发安全。它支持高并发读写操作，避免了全局锁的开销，吞吐量优于Hashtable和Collections.synchronizedMap。适合多线程环境下高并发、高吞吐量的场景，是并发编程中的核心工具类之一。
---

## ConcurrentHashMap1.7

### 属性和接口

ConcurrentHashMap1.7 采用了数组+Segment+分段锁的方式实现，即 ConcurrentHashMap 把哈希桶数组切分成小数组（Segment），每个小数组有 n 个 HashEntry 组成

一个 ConcurrentHashMap 里包含一个 Segment 数组，Segment 的个数一旦初始化就不能改变。 Segment 数组的大小默认是 16，也就是说默认可以同时支持 16 个线程并发写。

Segment 的结构和 HashMap 类似，是一种数组和链表结构，一个 Segment 包含一个 HashEntry 数组，每个 HashEntry 是一个链表结构的元素，每个 Segment 守护着一个 HashEntry 数组里的元素，当对 HashEntry 数组的数据进行修改时，必须首先获得对应的 Segment 的锁。也就是说，对同一 Segment 的并发写入会被阻塞，不同 Segment 的写入是可以并发执行的。

![](Map（4-ConcurrentHashMap）/1.png)

```java
public class ConcurrentHashMap<K, V> extends AbstractMap<K, V>
        implements ConcurrentMap<K, V>, Serializable {
	//默认的初始容量
    static final int DEFAULT_INITIAL_CAPACITY = 16;
	//默认加载因子
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
	//默认的并发度，也就是默认的Segment数组长度
    static final int DEFAULT_CONCURRENCY_LEVEL = 16;
    //最大容量，ConcurrentMap最大容量
    static final int MAXIMUM_CAPACITY = 1 << 30;
	//每个segment中table数组的长度,必须是2^n,最小为2
    static final int MIN_SEGMENT_TABLE_CAPACITY = 2;
	//允许最大segment数量,用于限定concurrencyLevel的边界,必须是2^n
    static final int MAX_SEGMENTS = 1 << 16; // slightly conservative
	//在size方法和containsValue方法，会优先采用乐观的方式不加锁，直到重试次数达到2，
	//才会对所有Segment加锁，这个值的设定，是为了避免无限次的重试
    static final int RETRIES_BEFORE_LOCK = 2;
    //.......
}
```

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {
    /*
    1.segment的读操作不需要加锁，但需要volatile读
    2.当进行扩容时(调用reHash方法)，需要拷贝原始数据，在拷贝数据上操作，保证在扩容完成前读操作仍可以在原始数据上进行。
    3.只有引起数据变化的操作需要加锁。
    4.scanAndLock(删除、替换)/scanAndLockForPut(新增)两个方法提供了获取锁的途径，是通过自旋锁实现的。
    5.在等待获取锁的过程中，两个方法都会对目标数据进行查找，每次查找都会与上次查找的结果对比，虽然查找结果不会被调用它的方法使用，但是这样做可以减少后续操作可能的cache miss。
    */

    /*
     自旋锁的等待次数上限，多处理器时64次，单处理器时1次。
     每次等待都会进行查询操作，当等待次数超过上限时，不再自旋，调用lock方法等待获取锁。
    */
    static final int MAX_SCAN_RETRIES =
        Runtime.getRuntime().availableProcessors() > 1 ? 64 : 1;
    
    //segment中的hash表，与hashMap结构相同，表中每个元素都是一个链表。
    transient volatile HashEntry<K,V>[] table;

    //表中元素个数
    transient int count;

    //记录数据变化操作的次数。
    //这一数值主要为Map的isEmpty和size方法提供同步操作检查，这两个方法没有为全表加锁。
    //在统计segment.count前后，都会统计segment.modCount，如果前后两次值发生变化，
    //可以判断在统计count期间有segment发生了其它操作。
    transient int modCount;

    //容量阈值，超过这一数值后segment将进行扩容，容量变为原来的两倍,threshold = loadFactor*table.length
    transient int threshold;

    //加载因子
    final float loadFactor;

    Segment(float lf, int threshold, HashEntry<K,V>[] tab) {
        this.loadFactor = lf;
        this.threshold = threshold;
        this.table = tab;
    }
}
```

```java
static final class HashEntry<K,V> { 
   final K key;                       // 声明 key 为 final 型
   final int hash;                   // 声明 hash 值为 final 型 
   volatile V value;                 // 声明 value 为 volatile 型
   final HashEntry<K,V> next;      // 声明 next 为 final 型 

   HashEntry(K key, int hash, HashEntry<K,V> next, V value) { 
       this.key = key; 
       this.hash = hash; 
       this.next = next; 
       this.value = value; 
   } 
}
```

### 构造方法

```java
public ConcurrentHashMap() {
    this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR, DEFAULT_CONCURRENCY_LEVEL);
}

//通过指定的容量，加载因子和并发等级创建一个新的ConcurrentHashMap
@SuppressWarnings("unchecked")
public ConcurrentHashMap(int initialCapacity,float loadFactor, int concurrencyLevel) {
    // 参数校验
    if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
    // 校验并发级别大小，大于 1<<16，重置为 65536
    if (concurrencyLevel > MAX_SEGMENTS)
        concurrencyLevel = MAX_SEGMENTS;
    // 下面即通过并发等级来确定Segment的大小
    // sshift用来记录向左按位移动的次数
    int sshift = 0;
    // ssize用来记录Segment数组的大小
    int ssize = 1;
    // 这个循环可以找到 concurrencyLevel 之上最近的 2的次方值
    while (ssize < concurrencyLevel) {
        ++sshift;
        ssize <<= 1;
    }
    // 记录段偏移量
    this.segmentShift = 32 - sshift;
    // 记录段掩码
    this.segmentMask = ssize - 1;
    // 设置容量
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    // c = 容量 / ssize ，默认 16 / 16 = 1，这里是计算每个 Segment 中的类似于 HashMap 的容量
    int c = initialCapacity / ssize;
    if (c * ssize < initialCapacity)
        ++c;
    int cap = MIN_SEGMENT_TABLE_CAPACITY;
    //Segment 中的类似于 HashMap 的容量至少是2或者2的倍数
    while (cap < c)
        cap <<= 1;
    // 创建 Segment 数组，设置 segments[0]
    Segment<K,V> s0 = new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                         (HashEntry<K,V>[])new HashEntry[cap]);
    Segment<K,V>[] ss = (Segment<K,V>[])new Segment[ssize];
    UNSAFE.putOrderedObject(ss, SBASE, s0); // ordered write of segments[0]
    this.segments = ss;
}
```

1. 进行参数校验，成功则进行下面的操作
2. 校验并发级别 concurrencyLevel 大小，如果大于最大值，重置为最大值，无参构造默认值是 16
3. 寻找并发级别 concurrencyLevel 之上最近的 2 的幂次方值（ssize），作为初始化容量大小，默认是 16
4. 记录 segmentShift 偏移量（segmentShift），这个值为【容量 = 2 的 N 次方】中的 N，在后面 put 时计算位置时会用到。默认是 32-sshift = 28
5. 记录 segmentMask 段掩码（segmentMark = 2^n-1），默认是 ssize-1 = 16-1 = 15
6. 计算每个 Segment 中的类似于 HashMap 的容量 c
7. Segment 中的类似于 HashMap 的容量 c 必须是 2 的倍数，计算出大于 c 的 2 的 n 次方（cap）
8. 初始化 segment [0]，默认大小为 2，负载因子为 0.75，扩容阈值为 2 \*0.75 = 1.5（cap* loadFactor），插入第二个值才会进行扩容

### 插入

```java
public V put(K key, V value) {
    Segment<K,V> s;
    if (value == null)
        throw new NullPointerException();
    int hash = hash(key);
    // hash 值无符号右移 28位（初始化时获得），然后与 segmentMask=15 做与运算
    // 其实也就是把高4位与segmentMask（1111）做与运算
    int j = (hash >>> segmentShift) & segmentMask;
    if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
         (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
        // 如果查找到的 Segment 为空，初始化
        s = ensureSegment(j);
    return s.put(key, hash, value, false);
}

@SuppressWarnings("unchecked")
private Segment<K,V> ensureSegment(int k) {
    final Segment<K,V>[] ss = this.segments;
    long u = (k << SSHIFT) + SBASE; // raw offset
    Segment<K,V> seg;
    // 判断 u 位置的 Segment 是否为null
    if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
        Segment<K,V> proto = ss[0]; // use segment 0 as prototype
        // 获取segment[0] 里的 HashEntry<K,V> 初始化长度
        int cap = proto.table.length;
        // 获取segment[0] 里的 hash 表里的扩容负载因子，所有的 segment 的 loadFactor 是相同的
        float lf = proto.loadFactor;
        // 计算扩容阀值
        int threshold = (int)(cap * lf);
        // 创建一个 cap 容量的 HashEntry 数组
        HashEntry<K,V>[] tab = (HashEntry<K,V>[])new HashEntry[cap];
        // 再次检查 u 位置的 Segment 是否为null，因为这时可能有其他线程进行了操作
        if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) { // recheck
            Segment<K,V> s = new Segment<K,V>(lf, threshold, tab);
            // 自旋检查 u 位置的 Segment 是否为null
            while ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
                // 使用CAS 赋值，只会成功一次
                if (UNSAFE.compareAndSwapObject(ss, u, null, seg = s))
                    break;
            }
        }
    }
    return seg;
}
```

1. 计算要 put 的 key 的位置，获取指定位置的 Segment
2. 如果指定位置的 Segment 为空，则初始化这个 Segment
3. Segment.put 插入 key，value 值

初始化 Segment 流程：

1. 检查计算得到的位置的 Segment 是否为 null
2. 为 null 则继续初始化，使用 Segment [0] 的容量和负载因子创建一个 cap 容量的 HashEntry 数组
3. 再次检查计算得到的指定位置的 Segment 是否为 null，因为这时可能有其他线程进行了操作
4. 为 null 则使用创建的 HashEntry 数组初始化这个 Segment
5. 自旋判断计算得到的指定位置的 Segment 是否为 null，是的话使用 CAS 在这个位置赋值为 Segment

```java
final V put(K key, int hash, V value, boolean onlyIfAbsent) {
    // 获取 ReentrantLock 独占锁，获取不到，scanAndLockForPut 获取。
    HashEntry<K,V> node = tryLock() ? null : scanAndLockForPut(key, hash, value);
    V oldValue;
    try {
        HashEntry<K,V>[] tab = table;
        // 计算要put的数据位置
        int index = (tab.length - 1) & hash;
        // CAS 获取 index 坐标的值
        HashEntry<K,V> first = entryAt(tab, index);
        for (HashEntry<K,V> e = first;;) {
            if (e != null) {
                // 检查是否 key 已经存在，如果存在，则遍历链表寻找位置，找到后替换 value
                K k;
                if ((k = e.key) == key || (e.hash == hash && key.equals(k))) {
                    oldValue = e.value;
                    if (!onlyIfAbsent) {
                        e.value = value;
                        ++modCount;
                    }
                    break;
                }
                e = e.next;
            }
            else {
                //node不为null,设置node的next为first，node为当前链表的头节点
                if (node != null)
                    node.setNext(first);
                else
                //node为null,创建头节点,指定next为first，node为当前链表的头节点
                    node = new HashEntry<K,V>(hash, key, value, first);
                int c = count + 1;
                // 容量大于扩容阀值，小于最大容量，进行扩容
                if (c > threshold && tab.length < MAXIMUM_CAPACITY)
                    rehash(node);
                else
                    // index 位置赋值 node，node 可能是一个元素，也可能是一个链表的表头
                    setEntryAt(tab, index, node);
                ++modCount;
                count = c;
                oldValue = null;
                break;
            }
        }
    } finally {
        unlock();
    }
    return oldValue;
}
```

如果指定的 Segment 不为空，由于 Segment 继承了 ReentrantLock，所以 Segment 内部可以很方便地获取锁

1. tryLock()获取锁，获取不到使用 scanAndLockForPut 方法继续获取
2. 计算 put 的数据要放入的 index 位置，然后获取这个位置上的 HashEntry
3. 遍历 put 新元素，因为这里获取的 HashEntry 可能是一个空元素，也可能是链表已存在，所以要区别对待

如果这个位置上的 HashEntry 不存在：

+ 如果当前容量大于扩容阈值，小于最大容量，进行扩容
+ 直接头插法插入

如果这个位置上的 HashEntry 存在：

+ 判断链表当前元素 key 和 hash 值是否和要 put 的 key 和 hash 值一致，一致则替换值；不一致则获取链表下一个节点，直到发现相同进行值替换，或者链表里没有相同的

4. 如果要插入的位置之前已经存在，替换后返回旧值，否则返回 null

**scanAndLockForPut（自旋）**

在不超过最大重试次数 MAX_SCAN_RETRIES 通过 CAS 获取锁

```java
private HashEntry<K,V> scanAndLockForPut(K key, int hash, V value) {
    //first,e:键值对的hash值定位到数组tab的第一个键值对
    HashEntry<K,V> first = entryForHash(this, hash);
    HashEntry<K,V> e = first;
    HashEntry<K,V> node = null;
    int retries = -1; // negative while locating node
    //线程尝试通过CAS获取锁
    while (!tryLock()) {
        HashEntry<K,V> f; // to recheck first below
        if (retries < 0) {
            //当e==null或key.equals(e.key)时retry=0，走出这个分支
            if (e == null) {
                if (node == null) // speculatively create node
                    //初始化键值对，next指向null
                    node = new HashEntry<K,V>(hash, key, value, null);
                retries = 0;
            }
            else if (key.equals(e.key))
                retries = 0;
            else
                e = e.next;
        }
        //超过最大自旋次数，阻塞
        else if (++retries > MAX_SCAN_RETRIES) {
            lock();
            break;
        }
        //头节点发生变化，重新遍历
        else if ((retries & 1) == 0 && (f = entryForHash(this, hash)) != first) {
            e = first = f; // re-traverse if entry changed
            retries = -1;
        }
    }
    return node;
}
```

### rehash（扩容）

ConcurrentHahsMap 的扩容只会扩容到原来的两倍。老数组里的数据移动到新的数组时，位置要么不变，要么变为 index+oldSize，参数里的 node 会在扩容之后使用链表头插法插入到指定位置

```java
private void rehash(HashEntry<K,V> node) {
    HashEntry<K,V>[] oldTable = table;
    // 老容量
    int oldCapacity = oldTable.length;
    // 新容量，扩大两倍
    int newCapacity = oldCapacity << 1;
    // 新的扩容阀值 
    threshold = (int)(newCapacity * loadFactor);
    // 创建新的数组
    HashEntry<K,V>[] newTable = (HashEntry<K,V>[]) new HashEntry[newCapacity];
    // 新的掩码，默认2扩容后是4，-1是3，二进制就是11。
    int sizeMask = newCapacity - 1;
    for (int i = 0; i < oldCapacity ; i++) {
        // 遍历老数组
        HashEntry<K,V> e = oldTable[i];
        if (e != null) {
            HashEntry<K,V> next = e.next;
            // 计算元素在新数组的索引
            int idx = e.hash & sizeMask;
            if (next == null) 
                // 如果当前位置还不是链表，只是一个元素，直接赋值
                newTable[idx] = e;
            else { 
                // 如果是链表了
                HashEntry<K,V> lastRun = e;
                int lastIdx = idx;
                // 新的位置只可能是不便或者是老的位置+老的容量。
                // 遍历结束后，lastRun 后面的元素位置都是相同的
                for (HashEntry<K,V> last = next; last != null; last = last.next) {
                    // k是单链表元素在新数组的位置
                    int k = last.hash & sizeMask;
                    // lastRun是最后一个扩容后不在原桶处的Entry
                    if (k != lastIdx) {
                        lastIdx = k;
                        lastRun = last;
                    }
                }
                // lastRun 后面的元素位置都是相同的，直接作为链表赋值到新位置。
                newTable[lastIdx] = lastRun;
                // Clone remaining nodes
                for (HashEntry<K,V> p = e; p != lastRun; p = p.next) {
                    // 遍历剩余元素，头插法到指定 k 位置。
                    V v = p.value;
                    int h = p.hash;
                    int k = h & sizeMask;
                    HashEntry<K,V> n = newTable[k];
                    newTable[k] = new HashEntry<K,V>(h, p.key, v, n);
                }
            }
        }
    }
    // 头插法插入新的节点
    int nodeIndex = node.hash & sizeMask; // add the new node
    node.setNext(newTable[nodeIndex]);
    newTable[nodeIndex] = node;
    table = newTable;
}
```

### 查找

```java
public V get(Object key) {
    Segment<K,V> s; // manually integrate access methods to reduce overhead
    HashEntry<K,V>[] tab;
    int h = hash(key);
    long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;
    // 计算得到 key 的存放位置
    if ((s = (Segment<K,V>)UNSAFE.getObjectVolatile(segments, u)) != null &&
        (tab = s.table) != null) {
        for (HashEntry<K,V> e = (HashEntry<K,V>) UNSAFE.getObjectVolatile
                 (tab, ((long)(((tab.length - 1) & h)) << TSHIFT) + TBASE);
             e != null; e = e.next) {
            // 如果是链表，遍历查找到相同 key 的 value。
            K k;
            if ((k = e.key) == key || (e.hash == h && key.equals(k)))
                return e.value;
        }
    }
    return null;
}
```

1. 通过 key 值的 hash 值定位到对应 Segment 对象，再通过 hash 值定位到具体的 entry 对象
2. 遍历链表，通过 equals 取出数据
3. 由于 HashEntry 中的 value 属性是用 volatile 关键字修饰的，保证了内存可见性，所以每次获取时都是最新值，整个过程不需要加锁

### 删除

```java
public V remove(Object key) {
    int hash = hash(key);
    Segment<K,V> s = segmentForHash(hash);
    return s == null ? null : s.remove(key, hash, null);
}

final V remove(Object key, int hash, Object value) {
    //获取同步锁
    if (!tryLock())
        scanAndLock(key, hash);
    V oldValue = null;
    try {
        HashEntry<K,V>[] tab = table;
        int index = (tab.length - 1) & hash;
        HashEntry<K,V> e = entryAt(tab, index);
        //遍历链表用来保存当前链表节点的前一个节点
        HashEntry<K,V> pred = null;
        while (e != null) {
            K k;
            HashEntry<K,V> next = e.next;
            //找到key对应的键值对
            if ((k = e.key) == key ||
                    (e.hash == hash && key.equals(k))) {
                V v = e.value;
                //键值对的值与传入的value相等
                if (value == null || value == v || value.equals(v)) {
                    //当前元素为头节点，把当前元素的下一个节点设为头节点
                    if (pred == null)
                        setEntryAt(tab, index, next);
                    //不是头节点，把当前链表节点的前一个节点的next指向当前节点的下一个节点
                    else
                        pred.setNext(next);
                    ++modCount;
                    --count;
                    oldValue = v;
                }
                break;
            }
            pred = e;
            e = next;
        }
    } finally {
        unlock();
    }
    return oldValue;
}
```

**scanAndLock（自旋）**

扫描是否含有指定的 key 并且获取同步锁，当方法执行完毕，即跳出循环成功获取到同步锁，跳出循环的方式：

1. tryLock 方法尝试获取独占锁成功
2. 尝试获取超过最大自旋次数 MAX_SCAN_RETRIES 线程堵塞，当线程从等待队列中被唤醒获取到锁跳出循环

```java
private void scanAndLock(Object key, int hash) {
    // similar to but simpler than scanAndLockForPut
    HashEntry<K,V> first = entryForHash(this, hash);
    HashEntry<K,V> e = first;
    int retries = -1;
    while (!tryLock()) {
        HashEntry<K,V> f;
        if (retries < 0) {
            if (e == null || key.equals(e.key))
                retries = 0;
            else
                e = e.next;
        }
        else if (++retries > MAX_SCAN_RETRIES) {
            lock();
            break;
        }
        else if ((retries & 1) == 0 && (f = entryForHash(this, hash)) != first) {
            e = first = f;
            retries = -1;
        }
    }
}
```

## ConcurrentHashMap1.8

### 属性和接口

ConcurrentHashMap 采用了数组+链表+红黑树的实现方法，内部大量采用 CAS 操作，只需要这个链表头节点（红黑树的根节点），就不会影响其他的哈希桶数组元素的读写

![](Map（4-ConcurrentHashMap）/2.png)

```java
public class ConcurrentHashMap<K,V> extends AbstractMap<K,V>
    implements ConcurrentMap<K,V>, Serializable {
    
    // node数组最大容量：2^30=1073741824
    private static final int MAXIMUM_CAPACITY = 1 << 30;
    // 默认初始值，必须是2的幂数
    private static final int DEFAULT_CAPACITY = 16;
    // 数组可能最大值，需要与toArray（）相关方法关联
    static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
    // 并发级别，遗留下来的，为兼容以前的版本
    private static final int DEFAULT_CONCURRENCY_LEVEL = 16;
    // 负载因子
    private static final float LOAD_FACTOR = 0.75f;
    // 链表转红黑树阀值,> 8 链表转换为红黑树
    static final int TREEIFY_THRESHOLD = 8;
    // 树转链表阀值，小于等于6（tranfer时，lc、hc=0两个计数器分别++记录原bin、新binTreeNode数量，<=UNTREEIFY_THRESHOLD 则untreeify(lo)）
    static final int UNTREEIFY_THRESHOLD = 6;
    // 最小树容量
    static final int MIN_TREEIFY_CAPACITY = 64;
    private static final int MIN_TRANSFER_STRIDE = 16;
    private static int RESIZE_STAMP_BITS = 16;
    // 2^15-1，help resize的最大线程数
    private static final int MAX_RESIZERS = (1 << (32 - RESIZE_STAMP_BITS)) - 1;
    // 32-16=16，sizeCtl中记录size大小的偏移量
    private static final int RESIZE_STAMP_SHIFT = 32 - RESIZE_STAMP_BITS;
    // forwarding nodes的hash值
    static final int MOVED     = -1; 
    // 树根节点的hash值
    static final int TREEBIN   = -2; 
    // ReservationNode的hash值
    static final int RESERVED  = -3; 
    // 可用处理器数量
    static final int NCPU = Runtime.getRuntime().availableProcessors();
    // 存放node的数组
    transient volatile Node<K,V>[] table;
    // 扩容总进度
    transient volatile int transferIndex;
    // 转移的时候用的数组
    transient volatile Node<K,V>[] nextTable;
    // 控制标识符，用来控制table的初始化和扩容的操作，不同的值有不同的含义
    private transient volatile int sizeCtl;
    // 该属性保存着整个哈希表中存储的所有的结点的个数总和，有点类似于 HashMap 的 size 属性。
    transient volatile long baseCount;
}
```

### 构造方法

```java
public ConcurrentHashMap() {
}

public ConcurrentHashMap(int initialCapacity) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException();
    int cap = ((initialCapacity >= (MAXIMUM_CAPACITY >>> 1)) ?
               MAXIMUM_CAPACITY :
               tableSizeFor(initialCapacity + (initialCapacity >>> 1) + 1));
    this.sizeCtl = cap;
}

public ConcurrentHashMap(Map<? extends K, ? extends V> m) {
    this.sizeCtl = DEFAULT_CAPACITY;
    putAll(m);
}

public ConcurrentHashMap(int initialCapacity, float loadFactor) {
    this(initialCapacity, loadFactor, 1);
}

public ConcurrentHashMap(int initialCapacity, float loadFactor, int concurrencyLevel) {
    if (!(loadFactor > 0.0f) || initialCapacity < 0 || concurrencyLevel <= 0)
        throw new IllegalArgumentException();
    if (initialCapacity < concurrencyLevel)   
        initialCapacity = concurrencyLevel;  
    long size = (long)(1.0 + (long)initialCapacity / loadFactor);
    int cap = (size >= (long)MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : tableSizeFor((int)size);
    //初始化时根据这个值作为桶数组table的长度
    this.sizeCtl = cap;
}
```

在调用构造方法创建 ConcurrentHashMap 对象时，只是根据传入参数计算桶数组初始长度赋值给 sizeCtl，并没有初始化 table 数组，只有在插入元素时才用 initTable 方法进行延迟加载

**initTable（初始化）**

```java
private final Node<K,V>[] initTable() {
    Node<K,V>[] tab; int sc;
    while ((tab = table) == null || tab.length == 0) {
        //　如果 sizeCtl < 0 ,说明另外的线程执行CAS 成功，正在进行初始化。
        if ((sc = sizeCtl) < 0)
            // 让出 CPU 使用权
            Thread.yield(); 
        // sizeCtl设为-1，由当前线程负责桶数组的初始化
        else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
            try {
                if ((tab = table) == null || tab.length == 0) {
                    // 得出数组的大小
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                    @SuppressWarnings("unchecked")
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                    table = tab = nt;
                    // 计算数组中可用的大小：实际大小n*0.75（加载因子）
                    sc = n - (n >>> 2);
                }
            } finally {
                sizeCtl = sc;
            }
            break;
        }
    }
    return tab;
}
```

ConcurrentHashMap 的初始化是通过自旋和 CAS 操作完成的。里面需要注意的是变量 sizeCtl，它的值决定着当前的初始化状态

1. sizeCtl =-1：表示有线程正在进行真正的初始化操作
2. sizeCtl =-(1+nThreads)：表示有 nThreads 个线程正在扩容操作
3. sizeCtl > 0：如果 table 数组还没有初始化，这就是初始化的长度；如果已经初始化了，sizeCtl 是 table 数组长度的 0.75 倍，代表扩容阈值
4. sizeCtl = 0：默认值，此时在真正的初始化操作中使用默认容量

### 插入

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}

final V putVal(K key, V value, boolean onlyIfAbsent) {
    // key 和 value 不能为空
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        // f = 目标位置元素
        Node<K,V> f; int n, i, fh;// fh 后面存放目标位置的元素 hash 值
        if (tab == null || (n = tab.length) == 0)
            // 数组桶为空，初始化数组桶（自旋+CAS)
            tab = initTable();
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            // 桶内为空，CAS 放入，不加锁，成功了就直接 break 跳出
            if (casTabAt(tab, i, null,new Node<K,V>(hash, key, value, null)))
                break;  // no lock when adding to empty bin
        }
        //桶里的节点是ForwardingNode,ConcurrentHashMap处于扩容阶段，让当前线程帮助扩容
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            // 使用 synchronized 加锁加入节点
            synchronized (f) {
                if (tabAt(tab, i) == f) {
                    // 说明是链表
                    if (fh >= 0) {
                        binCount = 1;
                        // 循环加入新的或者覆盖节点
                        for (Node<K,V> e = f;; ++binCount) {
                            K ek;
                            if (e.hash == hash &&
                                ((ek = e.key) == key || (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K,V> pred = e;
                            if ((e = e.next) == null) {
                                pred.next = new Node<K,V>(hash, key, value, null);
                                break;
                            }
                        }
                    }
                    else if (f instanceof TreeBin) {
                        // 红黑树
                        Node<K,V> p;
                        binCount = 2;
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key, value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            //检查是否需要把链表转为红黑树
            if (binCount != 0) {
                if (binCount >= TREEIFY_THRESHOLD)
                    treeifyBin(tab, i);
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    //更新ConcurrentHashMap中存放键值对个数
    addCount(1L, binCount);
    return null;
}
```

1. 根据 key 计算出 hashCode，判断下面的 4 种情况

+ 判断是否需要进行初始化，如果桶数组为空，初始化桶数组（CAS+自旋，即执行 initTable 方法）
+ 判断当前 key 定位出的 Node，如果桶数组中的元素为空表示当前位置可以写入数据，利用 CAS 尝试写入，失败则自旋，保证成功
+ 如果当前位置的 hashCode = MOVED（-1），说明其他线程在扩容，则需要进行扩容
+ 如果都不满足，则利用 synchronized 锁写入数据

2. 如果数量大于 TREEIFY_THRESHOLD 则要执行树化方法，在 treeifyBin 中会首先判断当前数组长度 >= 64 时才会将链表转换为红黑树
3. 判断是否需要扩容，如果超过了临界值就需要扩容

### 触发扩容的情况

```java
//新增元素时，也就是在调用 putVal 方法后，为了通用，增加了个 check 入参，用于指定是否可能会出现扩容的情况
//check >= 0 即为可能出现扩容的情况，例如 putVal方法中的调用
private final void addCount(long x, int check){
    // ...
    if (check >= 0) {
        Node<K,V>[] tab, nt; int n, sc;
        //检查当前集合元素个数 s 是否达到扩容阈值 sizeCtl ，扩容时 sizeCtl 为负数，依旧成立，同时还得满足数组非空且数组长度不能大于允许的数组最大长度这两个条件才能继续
        //这个 while 循环除了判断是否达到阈值从而进行扩容操作之外还有一个作用就是当一条线程完成自己的迁移任务后，如果集合还在扩容，则会继续循环，继续加入扩容大军，申请后面的迁移任务
        while (s >= (long)(sc = sizeCtl) && (tab = table) != null && (n = tab.length) < MAXIMUM_CAPACITY) {
            int rs = resizeStamp(n);
            // sc < 0 说明集合正在扩容当中
            if (sc < 0) {
                //判断扩容是否结束或者并发扩容线程数是否已达最大值，如果是的话直接结束while循环
                if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 || sc == rs + MAX_RESIZERS || (nt = nextTable) == null || transferIndex <= 0)
                    break;
                //扩容还未结束，并且允许扩容线程加入，此时加入扩容大军中
                if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1))
                    transfer(tab, nt);
            }
            //如果集合还未处于扩容状态中，则进入扩容方法，并首先初始化 nextTab 数组，也就是新数组
            //(rs << RESIZE_STAMP_SHIFT) + 2 为首个扩容线程所设置的特定值，后面扩容时会根据线程是否为这个值来确定是否为最后一个线程
            else if (U.compareAndSwapInt(this, SIZECTL, sc, (rs << RESIZE_STAMP_SHIFT) + 2))
                transfer(tab, null);
            s = sumCount();
        }
    }
}
```

```java
//扩容状态下其他线程对集合进行插入、修改、删除、合并、compute等操作时遇到 ForwardingNode 节点会调用该帮助扩容方法 (ForwardingNode 后面介绍)
final Node<K,V>[] helpTransfer(Node<K,V>[] tab, Node<K,V> f) {
    Node<K,V>[] nextTab; int sc;
    if (tab != null && (f instanceof ForwardingNode) && (nextTab = ((ForwardingNode<K,V>)f).nextTable) != null) {
        int rs = resizeStamp(tab.length);
        //此处的 while 循环是上面 addCount 方法的简版，可以参考上面的注释
        while (nextTab == nextTable && table == tab && (sc = sizeCtl) < 0) {
            if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 ||
                sc == rs + MAX_RESIZERS || transferIndex <= 0)
                break;
            if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1)) {
                transfer(tab, nextTab);
                break;
            }
        }
        return nextTab;
    }
    return table;
}
```

```java
//putAll批量插入或者插入节点后发现链表长度达到8个或以上，但数组长度为64以下时触发的扩容会调用到这个方法
private final void tryPresize(int size) {
    int c = (size >= (MAXIMUM_CAPACITY >>> 1)) ? MAXIMUM_CAPACITY : tableSizeFor(size + (size >>> 1) + 1);
    int sc;
    //如果不满足条件，也就是 sizeCtl < 0 ，说明有其他线程正在扩容当中，这里也就不需要自己去扩容了，结束该方法
    while ((sc = sizeCtl) >= 0) {
        Node<K,V>[] tab = table; int n;
        //如果数组初始化则进行初始化，这个选项主要是为批量插入操作方法 putAll 提供的
        if (tab == null || (n = tab.length) == 0) {
            n = (sc > c) ? sc : c;
            //初始化时将 sizeCtl 设置为 -1 ，保证单线程初始化
            if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
                try {
                    if (table == tab) {
                        @SuppressWarnings("unchecked")
                        Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                        table = nt;
                        sc = n - (n >>> 2);
                    }
                } finally {
                    //初始化完成后 sizeCtl 用于记录当前集合的负载容量值，也就是触发集合扩容的阈值
                    sizeCtl = sc;
                }
            }
        }
        else if (c <= sc || n >= MAXIMUM_CAPACITY)
            break;
        //插入节点后发现链表长度达到8个或以上，但数组长度为64以下时触发的扩容会进入到下面这个 else if 分支
        else if (tab == table) {
            int rs = resizeStamp(n);
            //下面的内容基本跟上面 addCount 方法的 while 循环内部一致，可以参考上面的注释
            if (sc < 0) {
                Node<K,V>[] nt;
                if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 || sc == rs + MAX_RESIZERS || (nt = nextTable) == null || transferIndex <= 0)
                    break;
                if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1))
                    transfer(tab, nt);
            }
            else if (U.compareAndSwapInt(this, SIZECTL, sc, (rs << RESIZE_STAMP_SHIFT) + 2))
                transfer(tab, null);
        }
    }
}
```

1. 在调用 addCount 方法增加集合元素计数后发现当前集合元素个数到达扩容阈值时就会触发扩容
2. 扩容状态下其他线程对集合进行插入、修改、删除、合并、compute 等操作时遇到 ForwardingNode 节点会触发扩容
3. putAll 批量插入或者插入节点后发现存在链表长度达到 8 个以上，但数组长度为 64 以下时会触发扩容

### 扩容方法

调用该扩容方法的地方：

1. addCount：向集合中插入新数据后更新容量计数时发现到达扩容阈值而触发的扩容
2. helpTransfer：扩容状态下其他线程对集合进行插入、修改、删除、合并、compute 等操作时遇到 ForwardingNode 节点时触发的扩容
3. tryPresize：putAll 批量插入或者插入后发现链表长度达到 8 个或以上，但数组长度为 64 以下时触发的扩容

```java
private final void transfer(Node<K,V>[] tab, Node<K,V>[] nextTab) {
    int n = tab.length, stride;
    //计算每条线程处理的桶个数，每条线程处理的桶数量一样，如果CPU为单核，则使用一条线程处理所有桶
    //每条线程至少处理16个桶，如果计算出来的结果少于16，则一条线程处理16个桶
    if ((stride = (NCPU > 1) ? (n >>> 3) / NCPU : n) < MIN_TRANSFER_STRIDE)
        stride = MIN_TRANSFER_STRIDE; // subdivide range
    if (nextTab == null) {            // 初始化新数组(原数组长度的2倍)
        try {
            @SuppressWarnings("unchecked")
            Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n << 1];
            nextTab = nt;
        } catch (Throwable ex) {      // try to cope with OOME
            sizeCtl = Integer.MAX_VALUE;
            return;
        }
        nextTable = nextTab;
        //将 transferIndex 指向最右边的桶，也就是数组索引下标最大的位置
        transferIndex = n;
    }
    int nextn = nextTab.length;
    //新建一个占位对象，该占位对象的 hash 值为 -1 该占位对象存在时表示集合正在扩容状态，key、value、next 属性均为 null ，nextTable 属性指向扩容后的数组
    //该占位对象主要有两个用途：
    //   1、占位作用，用于标识数组该位置的桶已经迁移完毕，处于扩容中的状态。
    //   2、作为一个转发的作用，扩容期间如果遇到查询操作，遇到转发节点，会把该查询操作转发到新的数组上去，不会阻塞查询操作。
    ForwardingNode<K,V> fwd = new ForwardingNode<K,V>(nextTab);
    //该标识用于控制是否继续处理下一个桶，为 true 则表示已经处理完当前桶，可以继续迁移下一个桶的数据
    boolean advance = true;
    //该标识用于控制扩容何时结束，该标识还有一个用途是最后一个扩容线程会负责重新检查一遍数组查看是否有遗漏的桶
    boolean finishing = false; // to ensure sweep before committing nextTab
    //这个循环用于处理一个 stride 长度的任务，i 后面会被赋值为该 stride 内最大的下标，而 bound 后面会被赋值为该 stride 内最小的下标
    //通过循环不断减小 i 的值，从右往左依次迁移桶上面的数据，直到 i 小于 bound 时结束该次长度为 stride 的迁移任务
    //结束这次的任务后会通过外层 addCount、helpTransfer、tryPresize 方法的 while 循环达到继续领取其他任务的效果
    for (int i = 0, bound = 0;;) {
        Node<K,V> f; int fh;
        while (advance) {
            int nextIndex, nextBound;
            //每处理完一个hash桶就将 bound 进行减 1 操作
            if (--i >= bound || finishing)
                advance = false;
            else if ((nextIndex = transferIndex) <= 0) {
                //transferIndex <= 0 说明数组的hash桶已被线程分配完毕，没有了待分配的hash桶，将 i 设置为 -1 ，后面的代码根据这个数值退出当前线的扩容操作
                i = -1;
                advance = false;
            }
            //只有首次进入for循环才会进入这个判断里面去，设置 bound 和 i 的值，也就是领取到的迁移任务的数组区间
            else if (U.compareAndSwapInt(this, TRANSFERINDEX, nextIndex, nextBound = (nextIndex > stride ? nextIndex - stride : 0))) {
                bound = nextBound;
                i = nextIndex - 1;
                advance = false;
            }
        }
        if (i < 0 || i >= n || i + n >= nextn) {
            int sc;
            //扩容结束后做后续工作，将 nextTable 设置为 null，表示扩容已结束，将 table 指向新数组，sizeCtl 设置为扩容阈值
            if (finishing) {
                nextTable = null;
                table = nextTab;
                sizeCtl = (n << 1) - (n >>> 1);
                return;
            }
            //每当一条线程扩容结束就会更新一次 sizeCtl 的值，进行减 1 操作
            if (U.compareAndSwapInt(this, SIZECTL, sc = sizeCtl, sc - 1)) {
                //(sc - 2) != resizeStamp(n) << RESIZE_STAMP_SHIFT 成立，说明该线程不是扩容大军里面的最后一条线程，直接return回到上层while循环
                if ((sc - 2) != resizeStamp(n) << RESIZE_STAMP_SHIFT)
                    return;
                //(sc - 2) == resizeStamp(n) << RESIZE_STAMP_SHIFT 说明这条线程是最后一条扩容线程
                //之所以能用这个来判断是否是最后一条线程，因为第一条扩容线程进行了如下操作：
                //    U.compareAndSwapInt(this, SIZECTL, sc, (rs << RESIZE_STAMP_SHIFT) + 2)
                //除了修改结束标识之外，还得设置 i = n; 以便重新检查一遍数组，防止有遗漏未成功迁移的桶
                finishing = advance = true;
                i = n; // recheck before commit
            }
        }
        else if ((f = tabAt(tab, i)) == null)
            //遇到数组上空的位置直接放置一个占位对象，以便查询操作的转发和标识当前处于扩容状态
            advance = casTabAt(tab, i, null, fwd);
        else if ((fh = f.hash) == MOVED)
            //数组上遇到hash值为MOVED，也就是 -1 的位置，说明该位置已经被其他线程迁移过了，将 advance 设置为 true ，以便继续往下一个桶检查并进行迁移操作
            advance = true; // already processed
        else {
            synchronized (f) {
                if (tabAt(tab, i) == f) {
                    Node<K,V> ln, hn;
                    //该节点为链表结构
                    if (fh >= 0) {
                        int runBit = fh & n;
                        Node<K,V> lastRun = f;
                        //遍历整条链表，找出 lastRun 节点
                        for (Node<K,V> p = f.next; p != null; p = p.next) {
                            int b = p.hash & n;
                            if (b != runBit) {
                                runBit = b;
                                lastRun = p;
                            }
                        }
                        //根据 lastRun 节点的高位标识(0 或 1)，首先将 lastRun设置为 ln 或者 hn 链的末尾部分节点，后续的节点使用头插法拼接
                        if (runBit == 0) {
                            ln = lastRun;
                            hn = null;
                        }
                        else {
                            hn = lastRun;
                            ln = null;
                        }
                        //使用高位和低位两条链表进行迁移，使用头插法拼接链表
                        for (Node<K,V> p = f; p != lastRun; p = p.next) {
                            int ph = p.hash; K pk = p.key; V pv = p.val;
                            if ((ph & n) == 0)
                                ln = new Node<K,V>(ph, pk, pv, ln);
                            else
                                hn = new Node<K,V>(ph, pk, pv, hn);
                        }
                        //setTabAt方法调用的是 Unsafe 类的 putObjectVolatile 方法
                        //使用 volatile 方式的 putObjectVolatile 方法，能够将数据直接更新回主内存，并使得其他线程工作内存的对应变量失效，达到各线程数据及时同步的效果
                        //使用 volatile 的方式将 ln 链设置到新数组下标为 i 的位置上
                        setTabAt(nextTab, i, ln);
                        //使用 volatile 的方式将 hn 链设置到新数组下标为 i + n(n为原数组长度) 的位置上
                        setTabAt(nextTab, i + n, hn);
                        //迁移完成后使用 volatile 的方式将占位对象设置到该 hash 桶上，该占位对象的用途是标识该hash桶已被处理过，以及查询请求的转发作用
                        setTabAt(tab, i, fwd);
                        //advance 设置为 true 表示当前 hash 桶已处理完，可以继续处理下一个 hash 桶
                        advance = true;
                    }
                    //该节点为红黑树结构
                    else if (f instanceof TreeBin) {
                        TreeBin<K,V> t = (TreeBin<K,V>)f;
                        //lo 为低位链表头结点，loTail 为低位链表尾结点，hi 和 hiTail 为高位链表头尾结点
                        TreeNode<K,V> lo = null, loTail = null;
                        TreeNode<K,V> hi = null, hiTail = null;
                        int lc = 0, hc = 0;
                        //同样也是使用高位和低位两条链表进行迁移
                        //使用for循环以链表方式遍历整棵红黑树，使用尾插法拼接 ln 和 hn 链表
                        for (Node<K,V> e = t.first; e != null; e = e.next) {
                            int h = e.hash;
                            //这里面形成的是以 TreeNode 为节点的链表
                            TreeNode<K,V> p = new TreeNode<K,V>
                                (h, e.key, e.val, null, null);
                            if ((h & n) == 0) {
                                if ((p.prev = loTail) == null)
                                    lo = p;
                                else
                                    loTail.next = p;
                                loTail = p;
                                ++lc;
                            }
                            else {
                                if ((p.prev = hiTail) == null)
                                    hi = p;
                                else
                                    hiTail.next = p;
                                hiTail = p;
                                ++hc;
                            }
                        }
                        //形成中间链表后会先判断是否需要转换为红黑树：
                        //1、如果符合条件则直接将 TreeNode 链表转为红黑树，再设置到新数组中去
                        //2、如果不符合条件则将 TreeNode 转换为普通的 Node 节点，再将该普通链表设置到新数组中去
                        //(hc != 0) ? new TreeBin<K,V>(lo) : t 这行代码的用意在于，如果原来的红黑树没有被拆分成两份，那么迁移后它依旧是红黑树，可以直接使用原来的 TreeBin 对象
                        ln = (lc <= UNTREEIFY_THRESHOLD) ? untreeify(lo) :
                        (hc != 0) ? new TreeBin<K,V>(lo) : t;
                        hn = (hc <= UNTREEIFY_THRESHOLD) ? untreeify(hi) :
                        (lc != 0) ? new TreeBin<K,V>(hi) : t;
                        //setTabAt方法调用的是 Unsafe 类的 putObjectVolatile 方法
                        //使用 volatile 方式的 putObjectVolatile 方法，能够将数据直接更新回主内存，并使得其他线程工作内存的对应变量失效，达到各线程数据及时同步的效果
                        //使用 volatile 的方式将 ln 链设置到新数组下标为 i 的位置上
                        setTabAt(nextTab, i, ln);
                        //使用 volatile 的方式将 hn 链设置到新数组下标为 i + n(n为原数组长度) 的位置上
                        setTabAt(nextTab, i + n, hn);
                        //迁移完成后使用 volatile 的方式将占位对象设置到该 hash 桶上，该占位对象的用途是标识该hash桶已被处理过，以及查询请求的转发作用
                        setTabAt(tab, i, fwd);
                        //advance 设置为 true 表示当前 hash 桶已处理完，可以继续处理下一个 hash 桶
                        advance = true;
                    }
                }
            }
        }
    }
}
```

1. 扩容期间在未迁移到的 hash 桶插入数据会发生什么？

只要插入的位置扩容线程还未迁移到，就可以插入，当迁移到该插入的位置时，就会阻塞等待插入操作完成再继续迁移

2. 正在迁移的 hash 桶遇到 get 操作会发生什么？

在扩容过程期间形成的 hn 和 ln 链是使用的类似于复制引用的方式，即 ln 和 hn 链是复制出来的，而非原来的链表迁移过去的，所以原来 hash 桶上的链表并没有受到影响，因此从迁移开始到迁移结束这段时间都是可以正常访问原数组 hash 桶上面的链表，迁移结束后放置上 fwd，往后的询问请求就直接转发到扩容后的数组去了

3. 如果 lastRun 节点正好在一条全部都为高位或者都为低位的链表上，会不会形成死循环？

在数组长度为 64 之前会导致一直扩容，但是到了 64 或者以上后就会转换为红黑树，因此不会一直死循环

4. 扩容后 ln 和 hn 链不用经过 hash 取模运算，分别被直接放置在新数组的 i 和 n+1 的位置上，那么如何保证这种方式依旧可以用过 h&(n-1)正确算出 hash 桶的位置？

如果 fh&(n-1)= i，那么扩容之后的 hash 计算方法应该是 fh&(2n-1)，因此 n 是 2 的幂次方数组，所以如果 n = 16，n-1 就是 1111（二进制），那么 2n-1 就是 11111（二进制），所以说如果 fh 的第 5 位不是 1 的话，fh&n = 0 可得出 fh&(2n-1)== fh&(n-1)= i；如果是 1 的话，fh&n = n 可得出 fh&(2n-1)= i+n

### 查找

```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    // key 所在的 hash 位置
    int h = spread(key.hashCode());
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (e = tabAt(tab, (n - 1) & h)) != null) {
        // 如果指定位置元素存在，头结点hash值相同
        if ((eh = e.hash) == h) {
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                // key hash 值相等，key值相同，直接返回元素 value
                return e.val;
        }
        else if (eh < 0)
            // 头结点hash值小于0，说明正在扩容或者是红黑树，find查找
            return (p = e.find(h, key)) != null ? p.val : null;
        while ((e = e.next) != null) {
            // 是链表，遍历查找
            if (e.hash == h &&
                ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```

1. 根据 hash 值计算位置
2. 查找到指定位置，如果头节点就是要找的，直接返回它的 value
3. 如果头节点 hash 值小于 0，说明正在扩容或者是红黑树，find 查找
4. 如果是链表，遍历查找

### 为什么不支持 Key 或 Value 为 null？

1. 避免歧义：在多线程环境下，get(key)方法如果返回 null，不知道这个 null 是代表 key 不存在或者是值本来就是 null; 

2. 简化实现：如果允许 null，代码里面就需要频繁的去判断 null 到底是代表 key 不存在或者是值本来就是 null

**HashMap 为什么可以?**

HashMap 设计的初衷是单线程，它有 containsKey 方法可以判断 key 是否存在。ConcurrentHashMap 不能用 containsKey，因为多线程环境下也会有歧义。比如：刚判断完 key 不存在，然后就有一个线程插入了这个 key
