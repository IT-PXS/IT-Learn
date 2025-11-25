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

## 接口和属性

ThreadLocal 提供了线程内部的局部变量，当在多线程环境中使用 ThreadLocal 维护变量时，会为每个线程生成该变量的副本，每个线程只操作自己线程中的变量副本，不同线程间的数据相互隔离、互不影响，从而保证了线程的安全

```java
public class Thread implements Runnable {
    //与此线程有关的ThreadLocal值。由ThreadLocal类维护
    ThreadLocal.ThreadLocalMap threadLocals = null;

    //与此线程有关的InheritableThreadLocal值。由InheritableThreadLocal类维护
    ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
}
```

```java
public class ThreadLocal<T> {
    
    static class ThreadLocalMap {
        //哈希表中的节点，一个节点用来存储一个共享变量的本地副本
        static class Entry extends WeakReference<ThreadLocal<?>> {
            //共享变量的本地副本
            Object value;
            //使用软引用连接创建此共享变量的ThreadLocal对象
            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
        //哈希表
        private Entry[] table;
        private static final int INITIAL_CAPACITY = 16;
        //.....

        //初始化ThreadLocalMap的构造方法
        ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
            //创建哈希表
            table = new Entry[INITIAL_CAPACITY];
            //通过散列函数计算Entry节点在哈希表中的位置，计算的键值是threadLocalHashCode
            //散列函数是threadLocalHashCode & (INITIAL_CAPACITY - 1)
            int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);
            //Entry节点存入哈希表中
            table[i] = new Entry(firstKey, firstValue);
            //哈希表中元素数量变为1
            size = 1;
            //重置扩容阈值
            setThreshold(INITIAL_CAPACITY);
        }

        //获得一个ThreadLocal对象极其创建的共享变量在当前线程中的副本
        private Entry getEntry(ThreadLocal<?> key) {
            //通过散列函数计算节点在哈希表中的初始位置
            int i = key.threadLocalHashCode & (table.length - 1);
            Entry e = table[i];
            //如果该位置的Entry节点确实是ThreadLocal对象创建的
            if (e != null && e.get() == key)
                return e;
            else
                //说明发生了哈希冲突，在哈希表中从i位置开始，
                //从前向后继续寻找变量所在的节点
                return getEntryAfterMiss(key, i, e);
        }
        //.......
    }
}
```

在 JDK8 中，每个线程 Thread 内部都维护了一个 ThreadLocalMap 的数据结构，ThreadLocalMap 中有一个由内部类 Entry 组成的 table 数组，Entry 的 key 就是线程的本地化对象 ThreadLocal，而 value 则存放了当前线程所操作的变量副本，每个 ThreadLocal 只能保存一个副本 value，并且各个线程的数据互不干扰，如果想要一个线程保存多个副本变量，就需要创建多个 ThreadLocal

1. 一个 Thread 有一个 ThreadLocalMap，Thread 只能通过自己的 ThreadLocalMap，根据 ThreadLocal 获取对应的 value
2. 一个 ThreadLocalMap 包含多个 Entry 对
3. 一个 Entry 对为一个 ThreadLocal 对象和 value 构成
4. 一个 ThreadLocal 可以作为多个 Thread 的 ThreadLocalMap 的 key

Thead-> ThreadLocalMap-> Entry（ThreadLocal、value）

![](JUC（7-ThreadLocal）/2.png)

## 常用方法

```java
public T get() {
    Thread t = Thread.currentThread();//获得当前线程对象
    ThreadLocalMap map = getMap(t);//线程对象对应的map
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);// 以当前threadlocal为key,尝试获得实体
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    // 如果当前线程对应map不存在
    // 如果map存在但是当前threadlocal没有关连的entry。
    return setInitialValue();
}

// 获取当前线程对象维护的ThreadLocalMap
ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}
    
// 初始化
private T setInitialValue() {
    T value = initialValue();
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
    return value;
}

// 设置当前线程对应的ThreadLocal值
public void set(T value) {
    Thread t = Thread.currentThread(); // 获取当前线程对象
    ThreadLocalMap map = getMap(t);
    if (map != null) // 判断map是否存在
        map.set(this, value); 
        // 调用map.set 将当前value赋值给当前threadLocal。
    else
        createMap(t, value);
        // 如果当前对象没有ThreadLocalMap 对象。
        // 创建一个对象 赋值给当前线程
}
 
// 给传入的线程 配置一个threadlocals
void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}

public void remove() {
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null)
        m.remove(this);
}

protected T initialValue() {
    return null;
}
```

## 哈希冲突（线性探测法）

和 HashMap 不同，ThreadLocalMap 结构中没有 next 引用，即 ThreadLocalMap 中解决哈希冲突的方式并非链表的方式，而是采用线性探测的方式，当发生哈希冲突时就将步长加 1 或减 1，寻找下一个相邻的位置

```java
private void set(ThreadLocal<?> key, Object value) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);//计算索引位置
 
    for (Entry e = tab[i];
        e != null;
        e = tab[i = nextIndex(i, len)]) { // 开放定址法解决哈希冲突
        ThreadLocal<?> k = e.get();
 
        //直接覆盖
        if (k == key) {
            e.value = value;
            return;
        }
 
        if (k == null) {// 如果key不是空value是空，垃圾清除内存泄漏防止。
            replaceStaleEntry(key, value, i);
            return;
        }
    }
    // 如果ThreadLocal对应的key不存在并且没找到旧元素，则在空元素位置创建个新Entry
    tab[i] = new Entry(key, value);
    int sz = ++size;
    if (!cleanSomeSlots(i, sz) && sz >= threshold)
        rehash();
}
 
// 环形数组 下一个索引
private static int nextIndex(int i, int len) {
    return ((i + 1 < len) ? i + 1 : 0);
}
```

## 扩容机制

在 ThreadLocalMap.set()方法的最后，如果执行完启发式清理工作后，未清理到任何数据，且当前散列数组中 Entry 的数量已经达到了列表的扩容阈值(len*2/3)，就开始执行 rehash()逻辑：

这里会先去清理过期的 Entry，然后还要根据条件判断 size >= threshold - threshold / 4 也就是 size >= threshold* 3/4 来决定是否需要扩容。

```java
if (!cleanSomeSlots(i, sz) && sz >= threshold)
    rehash();


private void rehash() {
    //清理过期Entry
    expungeStaleEntries();

    //扩容
    if (size >= threshold - threshold / 4)
        resize();
}

//清理过期Entry
private void expungeStaleEntries() {
    Entry[] tab = table;
    int len = tab.length;
    for (int j = 0; j < len; j++) {
        Entry e = tab[j];
        if (e != null && e.get() == null)
            expungeStaleEntry(j);
    }
}
```

![](JUC（7-ThreadLocal）/3.png)

## 内存泄露

在使用 ThreadLocal 时，当使用完变量时，必须手动调用 remove()方法删除 entry 对象，否则会造成 value 的内存泄露，严格来说，ThreadLocal 是没有内存泄露问题，有的话，也是忘记执行 remove()引起的，这是使用不规范导致的

![](JUC（7-ThreadLocal）/1.png)

1. 如果 key 使用强引用

如果在业务代码中使用完 ThreadLocal，则此时 Stack 中的 ThreadLocalRef 就会被回收了，但是此时 ThreadLocalMap 中的 Entry 中的 key 是强引用 ThreadLocal 的，会造成 ThreadLocal 实例无法回收，如果没有删除 Entry 并且 CurrentThread 依然运行的情况下，会导致 Entry 内存泄露

2. 如果 key 使用弱引用

如果在业务中使用完 ThreadLocal，则此时 Stack 中的 ThreadLocalRef 就会被回收了，但是此时 ThreadLocalMap 中的 Entry 中的 Key 是弱引用 ThreadLocal 的，会造成 ThreadLocal 实例被回收，此时 Entry 中的 key = null，但是当没有手动删除 Entry 以及 CurrentThread 依然运行的时候，还是存在强引用链，但因为 ThreadLocalRef 已经被回收了，那么此时的 value 就无法访问到了，导致 value 内存泄露

### 内存泄露的原因

1. ThreadLocalRef 用完后 Entry 没有手动删除

当我们使用完 ThreadLocal 后，调用其对应的 remove()方法删除对应的 Entry 就可以避免内存泄露

2. ThreadLocalRef 用完后 CurrentThread 依然在运行

ThreadLocalMap 是 CurrentThread 的一个属性，被当前线程引用，生命周期跟 CurrentThread 一样，如果当前线程结束 ThreadLocalMap 被回收，自然里面的 Entry 也被回收了，但问题是此时的线程不一定会被回收，比如：线程是从线程池中获取的，用完就放入池子里

### 为什么使用弱引用？

1. Entry 中的 key（ThreadLocal）是弱引用，目的是将 ThreadLocal 对象的生命周期跟线程周期解绑，用 WeakReference 弱引用关联的对象，只能生存到下一次垃圾回收之前，GC 发生前，不管内存够不够，都会被回收
2. 当我们使用完 ThreadLocal，而 Thread 仍然运行时，即便忘记调用 remove()方法，弱引用也会比强引用多一层保障：当 GC 发生时，弱引用的 ThreadLocal 被收回，那么 key 也就为 null 了，而 ThreadLocalMap 中的 set()、get()方法，会针对 key ==null（也就是 ThreadLocal 为 null）的情况进行处理，如果 key== null，则系统认为 value 也应该是无效了应该设置为 null，即对应的 value 会在下次调用 ThreadLocal 的 set()、get()方法时，执行底层 ThreadLocalMap 中的 enpungeState()方法进行清除无用的 value，从而避免内存泄露

## 应用场景

ThreadLocal 适用于无状态、副本变量独立后不影响业务逻辑的高并发场景

1. Hibernate 的 session 获取：每个线程访问数据库都应当是一个独立的 session 会话，如果多个线程共享同一个 session 会话，有可能其他线程关闭连接了，当前线程再执行提交时就会出现会话已关闭的异常，导致系统异常，使用 ThreadLocal 的方式能避免线程争抢 session，提高并发安全性
2. Spring 的事务管理：事务需要保证一组操作同时成功或失败，意味着一个事务的所有操作需要在同一个数据库连接上，Spring 采用 ThreadLocal 的方式，来保证单个线程中的数据库操作使用的是同一个数据库连接，同时采用这种方式可以使业务层使用事务时不需要感知并管理 connection 对象，通过传播级别，巧妙地管理多个事务配置之间的切换、挂起和恢复

## 其他

**为什么一般用 ThreadLocal 都要用 static？**

ThreadLocal 能实现线程的隔离，不在于他自己本身，而在于 Thread 的 ThreadLocalMap，所以，ThreadLocal 可以只实例化一次，只分配一块存储空间就行了，没有必要作为成员变量多次被初始化

**如何跨线程传递 ThreadLocal 的值？**

由于 ThreadLocal 的变量值存放在 Thread 里，而父子线程属于不同的 Thread 的。因此在异步场景下，父子线程的 ThreadLocal 值无法进行传递。

如果想要在异步场景下传递 ThreadLocal 值，有两种解决方案：

1. InheritableThreadLocal ：InheritableThreadLocal 是 JDK1.2 提供的工具，继承自 ThreadLocal 。使用 InheritableThreadLocal 时，会在创建子线程时，令子线程继承父线程中的 ThreadLocal 值，但是无法支持线程池场景下的 ThreadLocal 值传递。

2. TransmittableThreadLocal ： TransmittableThreadLocal （简称 TTL） 是阿里巴巴开源的工具类，继承并加强了 InheritableThreadLocal 类，可以在线程池的场景下支持 ThreadLocal 值传递。

## InheritableThreadLocal

### 出现背景

父线程生成的变量需要传递到子线程中进行使用，那么在使用 ThreadLocal 似乎就解决不了这个问题，ThreadLocal 有一个子类 InheritableThreadLocal 就是为了解决这个问题而产生的，使用 InheritableThreadLocal 可以实现多个线程访问 ThreadLocal 的值

### 基本使用

```java
/**
 * 使用ThreadLocal的时候，在异步场景下是无法给子线程共享父线程中创建的线程副本数据的
 */
public class InheritableThreadLocalDemo {
    public static void main(String[] args) {
        ThreadLocal<String> ThreadLocal = new ThreadLocal<>();
        ThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();
        ThreadLocal.set("父线程数据:threadLocal");
        inheritableThreadLocal.set("父线程数据:inheritableThreadLocal");

        new Thread(()->{
            System.out.println("子线程获取父类ThreadLocal数据：" + ThreadLocal.get());
            System.out.println("子线程获取父类inheritableThreadLocal数据：" + inheritableThreadLocal.get());
        }).start();
    }
}

// 运行结果：
//子线程获取父类ThreadLocal数据：null
//子线程获取父类inheritableThreadLocal数据：父线程数据:inheritableThreadLocal
```

### 实现原理

子线程是通过在父线程中通过调用 `new Thread()` 方法来创建子线程，`Thread#init` 方法在 `Thread` 的构造方法中被调用。在 `init` 方法中拷贝父线程数据到子线程中

```java
public Thread(Runnable target) {
    init(null, target, "Thread-" + nextThreadNum(), 0);
}

private void init(ThreadGroup g, Runnable target, String name, long stackSize) {
    init(g, target, name, stackSize, null, true);
}

private void init(ThreadGroup g, Runnable target, String name,
                  long stackSize, AccessControlContext acc,
                  boolean inheritThreadLocals) {
    if (name == null) {
        throw new NullPointerException("name cannot be null");
    }
    this.name = name;

    Thread parent = currentThread();
    SecurityManager security = System.getSecurityManager();
    if (g == null) {
        if (security != null) {
            g = security.getThreadGroup();
        }

        if (g == null) {
            g = parent.getThreadGroup();
        }
    }
    g.checkAccess();

    if (security != null) {
        if (isCCLOverridden(getClass())) {
            security.checkPermission(SUBCLASS_IMPLEMENTATION_PERMISSION);
        }
    }
    g.addUnstarted();

    this.group = g;
    this.daemon = parent.isDaemon();
    this.priority = parent.getPriority();
    if (security == null || isCCLOverridden(parent.getClass()))
        this.contextClassLoader = parent.getContextClassLoader();
    else
        this.contextClassLoader = parent.contextClassLoader;
    this.inheritedAccessControlContext =
            acc != null ? acc : AccessController.getContext();
    this.target = target;
    setPriority(priority);
    // 如果父线程的inheritableThreadLocals不为空，就赋值给当前新建的线程，实现变量传递
    if (inheritThreadLocals && parent.inheritableThreadLocals != null)
        this.inheritableThreadLocals =
            ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);

    this.stackSize = stackSize;
    tid = nextThreadID();
}
```

但 `InheritableThreadLocal` 仍然有缺陷，一般我们做异步化处理都是使用的线程池，而 `InheritableThreadLocal` 是在 `new Thread` 中的 `init()` 方法给赋值的，而线程池是线程复用的逻辑，所以这里会存在问题。多线程变量传递问题示例如下：

```java
public class InheritableThreadLocalFailDemo {

    // 创建线程池
    private static ExecutorService fixedThreadPool = Executors.newFixedThreadPool(1);

    public static void main(String[] args) {
        //TransmittableThreadLocal<String> context = new TransmittableThreadLocal<String>();
        InheritableThreadLocal<String> context = new InheritableThreadLocal<>();
        context.set("value1-set-in-parent");
        fixedThreadPool.submit(()->{
            // 第一个子线程打印value1-set-in-parent，毋庸置疑
            System.out.println(context.get());
        });
        // 父线程修改InheritableThreadLocal变量值
        context.set("value2-set-in-parent");
        // 再次新建一个子线程，这时候就要看这个子线程是新建的，还是复用线程池里面的之前的线程
        // 如上面线程池核心数和最大线程数都为1，说明线程池只能创建一个线程，此时这个子线程会复用前面那个子线程，这时候InheritableThreadLocal
        // 的变量值就等于前面那个线程的，所以这里和第一个子线程一样打印value1-set-in-parent
        // 如果上面线程池核心数和最大线程数都为2，这时候会新建一个子线程，此时会获取父线程的最新值，打印value2-set-in-parent
        fixedThreadPool.submit(()->{
            System.out.println(context.get());
        });
    }
}
```
