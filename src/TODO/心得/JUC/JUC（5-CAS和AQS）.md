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

## CAS

### 出现背景

原子操作（compare and swap）：不可中断的一个或者一系列操作，也就是不会被线程调度机制打断的操作, 运行期间不会有任何的上下文切换

```plain
问题：假如有100个线程同时调用 increment() 方法对 i 进行自增操作，i 的结果会是 100 吗？
答：由于 i++ 不是一个原子操作，所以是很难得到 100 的。i++ 这个操作，计算机需要分成三步来执行。
1、读取 i 的值。
2、把 i 加 1.
3、把 最终 i 的结果写入内存之中。

（1）假如线程 A 读取了 i 的值为 i = 0，
（2）这个时候线程 B 也读取了 i 的值 i = 0。
（3）接着 A 把 i 加 1，然后写入内存，此时 i = 1。
（4）紧接着，B也把 i 加 1，此时线程B中的 i = 1，然后线程 B 把 i 写入内存，此时内存中的 i = 1。
也就是说，线程 A, B 都对 i 进行了自增，但最终的结果却是 1，不是 2
```

### 操作方法

1. 需要读写的内存值 V：线程从内存中读取 i 的值，假如此时 i 的值为 0，我们把这个值称为 k ，即此时 k = 0。
2. 拟写入的新值：令 j = k + 1。
3. 进行比较的值：用 k 的值与内存中 i 的值相比，如果相等，这意味着没有其他线程修改过 i 的值，我们就把 j（此时为 1） 的值写入内存；如果不相等（意味着 i 的值被其他线程修改过），我们就不把 j 的值写入内存，而是重新跳回步骤 1，继续这三个操作。

### 存在问题（ABA 问题）

当线程 A 即将要执行第三步的时候，线程 B 把 i 的值加 1，之后又马上把 i 的值减 1，然后，线程 A 执行第三步，这个时候线程 A 是认为并没有人修改过 i 的值，因为 i 的值并没有发生改变

例如：一家火锅店推出了一个活动，凡是老用户卡里余额小于 20 的，赠送 10 元。假设有个线程 A 去判断账户里的钱此时是 15，满足条件，直接+20，这时候卡里余额是 35。但是正好在连锁店里，这个客人正在消费，又消费了 20，此时卡里余额又为 15，线程 B 去执行扫描账户的时候，发现它又小于 20，又给它加了 20，这样的话就相当于加了两次

### 解决方法（版本控制）

进行版本值的比较，每次有线程修改了引用的值，就会进行版本的更新，虽然两个线程持有相同的引用，但他们的版本不同，这样，我们就可以预防 ABA 问题了

## AQS

### 实现原理

![](JUC（5-CAS和AQS）/1.png)

1. AQS （AbstractQueuedSynchronizer）核心思想：如果被请求的共享资源空闲，则将当前请求资源的线程设置为有效的工作线程，并且将共享资源设置为锁定状态。如果被请求的共享资源被占用，那么就需要一套线程阻塞等待以及被唤醒时锁分配的机制，AQS 是用 CLH 队列锁实现的，即将暂时获取不到锁的线程加入到队列中

2. CLH 队列：一个虚拟的双向队列（不存在队列实例，仅存在结点之间的关联关系），AQS 是将每条请求共享资源的线程封装成一个 CLH 锁队列的一个结点来实现锁的分配

AQS 使用一个 int 成员变量（state）来表示同步状态，通过内置的 FIFO 队列来完成获取资源线程的排队工作，AQS 使用 CAS 对该同步状态进行原子操作实现对其值的修改

```java
private volatile int state;

//返回同步状态的当前值
protected final int getState() {
    return state;
}

//设置同步状态的值
protected final void setState(int newState) {
    state = newState;
}

//原子地（CAS操作）将同步状态值设置为给定值update,如果当前同步状态的值等于expect（期望值）
protected final boolean compareAndSetState(int expect, int update) {
    return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

AQS 底层使用了模板方法模式，需要由同步组件覆写的方法

| 方法                              | 说明                       |
| --------------------------------- | -------------------------- |
| boolean tryAcquire(int arg)       | 独占式获取同步状态         |
| boolean tryRelease(int arg)       | 独占式释放同步状态         |
| int tryAcquireShared(int arg)     | 共享式获取同步状态         |
| boolean tryReleaseShared(int arg) | 共享式释放同步状态         |
| boolean isHeldExclusively()       | 检测当前线程是否获取独占锁 |

在 AQS 中，线程的等待状态有以下几种：

1. 0：初始化时候的默认值
2. CANCELLED：值为 1，由于超时、中断或其他原因，该节点被取消
3. SIGNAL：值为 -1，表示该节点准备就绪，正常等待资源
4. CONDITION：值为 -2，表示该节点位于条件等待队列中
5. PROPAGATE：值为 -3，当处在 SHARED 情况下，该字段才有用，将 releaseShared 动作需要传播到其他节点

### CLH

针对自旋锁的问题，演进出一种基于队列的自旋锁即 CLH（Craiq, Landin, and Haqersten），它适用于多处理器环境下的高并发场景。

原理是通过维护一个隐式队列，使线程在等待锁时自旋在本地变量上，从而减少了对共享变量的争用和缓存一致性流量。它将争抢的线程组织成一个队列，通过排队的方式按序争抢锁，且每个线程不再 CAS 争抢一个变量，而是自旋判断排在它前面线程的状态，如果前面的线程状态为释放锁，那么后续的线程则抢锁。

![](JUC（5-CAS和AQS）/4.png)

CLH 通过排队按序争抢解决了锁饥饿的问题，通过 CAS 自旋监听前面线程的状态避免的总线风暴问题的产生

CLH 会占用 CPU 资源，自旋期间线程会一直占用 CPU 资源，适用于锁等待时间较短的场景。

注意：上面说了 CLH 是通过隐式队列实现的，这里的隐式指的是不同线程之前是没有真正通过指针连接的，仅仅是利用 AtomicReference +ThreadLocal 实现了隐式关联。

**AQS 对 CLH 的改造**

因为 CLH 有占用 CPU 资源问题，因此 AQS 将自旋等待前置节点改成了阻塞线程。而后续的线程阻塞就无法主动发现前面的线程释放锁，因此前面线程需要需要通知后续线程锁被释放了。所以 AQS 的变型版 CLH 需要显式地维护一个队列，且是一个双向列表实现，因为前面线程需要通知后续线程。

![](JUC（5-CAS和AQS）/2.png)

且前面线程如果等待超时或者主动取消后，需要从队列中移除，且后面的线程需要“顶”上来。

![](JUC（5-CAS和AQS）/3.png)

### 节点结构

在并发的情况下，AQS 会将未获取同步状态的线程封装成节点，并将其放入同步队列尾部，同步队列中的节点除了要保存线程，还要保存等待状态，不管是独占式还是共享式，在获取状态失败时都会用到节点类

```java
static final class Node {
    /** 共享类型节点，标记节点在共享模式下等待 */
    static final Node SHARED = new Node();

    /** 独占类型节点，标记节点在独占模式下等待 */
    static final Node EXCLUSIVE = null;

    /** 等待状态 - 取消 */
    static final int CANCELLED =  1;

    /** 等待状态 - 通知。某个节点是处于该状态，当该节点释放同步状态后，会通知后继节点线程，使之可以恢复运行 */
    static final int SIGNAL    = -1;

    /** 等待状态 - 条件等待。表明节点等待在 Condition 上 */
    static final int CONDITION = -2;

    /** 等待状态 - 传播。表示无条件向后传播唤醒动作 */
    static final int PROPAGATE = -3;

    /**
    * 等待状态，取值如下：
    *   SIGNAL,
    *   CANCELLED,
    *   CONDITION,
    *   PROPAGATE,
    *   0
    * 初始情况下，waitStatus = 0
    */
    volatile int waitStatus;

    /** 前驱节点 */
    volatile Node prev;

    /** 后继节点 */
    volatile Node next;

    /** 对应的线程 */
    volatile Thread thread;

    /** 下一个等待节点，用在 ConditionObject 中 */
    Node nextWaiter;

    /** 判断节点是否是共享节点 */
    final boolean isShared() {
        return nextWaiter == SHARED;
    }

    /** 获取前驱节点 */
    final Node predecessor() throws NullPointerException {
        Node p = prev;
        if (p == null)
            throw new NullPointerException();
        else
            return p;
    }

    Node() {
    }

    /** addWaiter 方法会调用该构造方法 */
    Node(Thread thread, Node mode) {
        this.nextWaiter = mode;
        this.thread = thread;
    }

    /** Condition 中会用到此构造方法 */
    Node(Thread thread, int waitStatus) { // Used by Condition
        this.waitStatus = waitStatus;
        this.thread = thread;
    }
}
```

### 资源共享模式

1. Exclusive（独占）：当锁被某个线程成功获取时，其他线程无法获取到该锁，锁的状态只有 0 和 1 两种情况，如：ReentrantLock，又可分为公平锁和非公平锁

+ 公平锁：按照线程在队列中的排队顺序，先到者先拿到锁
+ 非公平锁：当线程要获取锁时，无视队列顺序直接去抢锁，谁抢到就是谁的

2. Share（共享）：当锁被某个线程成功获取时，其他线程仍然可能获取到该锁，锁的状态大于或等于 0，如：CountDownLatch、Semaphore、CyclicBarrier、ReadWriteLock

### 获取锁总操作

1. tryAcquire(arg)：如果 tryAcquire(arg)成功，那就没有问题，已经拿到锁，整个 lock()过程就结束了，如果失败进行操作 2
2. addWaiter(Node.EXCLUSIVE)：创建一个独占节点（Node）并且此节点加入 CLH 队列末尾，进行操作 3
3. acquireQueued(addWaiter(Node.EXCLUSIVE))：自旋尝试获取锁，失败根据前一个节点来决定是否挂起（park()），直到成功获取到锁，进行操作 4
4. selfInterrupt()：如果当前线程已经中断过，那么就中断当前线程（清除中断位）

### 独占模式

```java
/**
 * 该方法将会调用子类复写的 tryAcquire 方法获取同步状态，
 * - 获取成功：直接返回
 * - 获取失败：将线程封装在节点中，并将节点置于同步队列尾部，
 *     通过自旋尝试获取同步状态。如果在有限次内仍无法获取同步状态，
 *     该线程将会被 LockSupport.park 方法阻塞住，直到被前驱节点唤醒
 */
public final void acquire(int arg) {
    if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}

/** 向同步队列尾部添加一个节点 */
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    // 尝试以快速方式将节点添加到队列尾部
    Node pred = tail;
    if (pred != null) {
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    // 快速插入节点失败，调用 enq 方法，不停的尝试插入节点
    enq(node);
    return node;
}

/** 通过 CAS + 自旋的方式插入节点到队尾 */
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        if (t == null) { // Must initialize
            // 设置头结点，初始情况下，头结点是一个空节点
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            /*
             * 将节点插入队列尾部。这里是先将新节点的前驱设为尾节点，之后在尝试将新节点设为尾节
             * 点，最后再将原尾节点的后继节点指向新的尾节点。除了这种方式，我们还先设置尾节点，
             * 之后再设置前驱和后继，即：
             * 
             *    if (compareAndSetTail(t, node)) {
             *        node.prev = t;
             *        t.next = node;
             *    }
             * 但但如果是这样做，会导致一个问题，即短时内，队列结构会遭到破坏。考虑这种情况，
             * 某个线程在调用 compareAndSetTail(t, node)成功后，该线程被 CPU 切换了。此时
             * 设置前驱和后继的代码还没带的及执行，但尾节点指针却设置成功，导致队列结构短时内会
             * 出现如下情况：
             *
             *      +------+  prev +-----+       +-----+
             * head |      | <---- |     |       |     |  tail
             *      |      | ----> |     |       |     |
             *      +------+ next  +-----+       +-----+
             * tail 节点完全脱离了队列，这样导致一些队列遍历代码出错。如果先设置
             * 前驱，在设置尾节点。及时线程被切换，队列结构短时可能如下：
             *
             *      +------+  prev +-----+ prev  +-----+
             * head |      | <---- |     | <---- |     |  tail
             *      |      | ----> |     |       |     |
             *      +------+ next  +-----+       +-----+
             * 这样并不会影响从后向前遍历，不会导致遍历逻辑出错。
             */
            node.prev = t;
            if (compareAndSetTail(t, node)) {
                t.next = node;
                return t;
            }
        }
    }
}

/**
 * 同步队列中的线程在此方法中以循环尝试获取同步状态，在有限次的尝试后，
 * 若仍未获取锁，线程将会被阻塞，直至被前驱节点的线程唤醒。
 */
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        // 循环获取同步状态
        for (;;) {
            final Node p = node.predecessor();
            /*
             * 前驱节点如果是头结点，表明前驱节点已经获取了同步状态。前驱节点释放同步状态后，
             * 在不出异常的情况下， tryAcquire(arg) 应返回 true。此时节点就成功获取了同
             * 步状态，并将自己设为头节点，原头节点出队。
             */ 
            if (p == head && tryAcquire(arg)) {
                // 成功获取同步状态，设置自己为头节点
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            
            /*
             * 如果获取同步状态失败，则根据条件判断是否应该阻塞自己。
             * 如果不阻塞，CPU 就会处于忙等状态，这样会浪费 CPU 资源
             */
            if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        /*
         * 如果在获取同步状态中出现异常，failed = true，cancelAcquire 方法会被执行。
         * tryAcquire 需同步组件开发者覆写，难免不了会出现异常。
         */
        if (failed)
            cancelAcquire(node);
    }
}

/** 设置头节点 */
private void setHead(Node node) {
    // 仅有一个线程可以成功获取同步状态，所以这里不需要进行同步控制
    head = node;
    node.thread = null;
    node.prev = null;
}

/**
 * 该方法主要用途是，当线程在获取同步状态失败时，根据前驱节点的等待状态，决定后续的动作。比如前驱
 * 节点等待状态为 SIGNAL，表明当前节点线程应该被阻塞住了。不能老是尝试，避免 CPU 忙等。
 *    —————————————————————————————————————————————————————————————————
 *    | 前驱节点等待状态 |                   相应动作                     |
 *    —————————————————————————————————————————————————————————————————
 *    | SIGNAL         | 阻塞                                          |
 *    | CANCELLED      | 向前遍历, 移除前面所有为该状态的节点               |
 *    | waitStatus < 0 | 将前驱节点状态设为 SIGNAL, 并再次尝试获取同步状态   |
 *    —————————————————————————————————————————————————————————————————
 */
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    int ws = pred.waitStatus;
    /* 
     * 前驱节点等待状态为 SIGNAL，表示当前线程应该被阻塞。
     * 线程阻塞后，会在前驱节点释放同步状态后被前驱节点线程唤醒
     */
    if (ws == Node.SIGNAL)
        return true;
        
    /*
     * 前驱节点等待状态为 CANCELLED，则以前驱节点为起点向前遍历，
     * 移除其他等待状态为 CANCELLED 的节点。
     */ 
    if (ws > 0) {
        do {
            node.prev = pred = pred.prev;
        } while (pred.waitStatus > 0);
        pred.next = node;
    } else {
        /*
         * 等待状态为 0 或 PROPAGATE，设置前驱节点等待状态为 SIGNAL，
         * 并再次尝试获取同步状态。
         */
        compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
    }
    return false;
}

private final boolean parkAndCheckInterrupt() {
    // 调用 LockSupport.park 阻塞自己
    LockSupport.park(this);
    return Thread.interrupted();
}

/** 取消获取同步状态 */
private void cancelAcquire(Node node) {
    if (node == null)
        return;
    node.thread = null;

    // 前驱节点等待状态为 CANCELLED，则向前遍历并移除其他为该状态的节点
    Node pred = node.prev;
    while (pred.waitStatus > 0)
        node.prev = pred = pred.prev;

    // 记录 pred 的后继节点，后面会用到
    Node predNext = pred.next;
    // 将当前节点等待状态设为 CANCELLED
    node.waitStatus = Node.CANCELLED;

    /*
     * 如果当前节点是尾节点，则通过 CAS 设置前驱节点 prev 为尾节点。设置成功后，再利用 CAS 将 
     * prev 的 next 引用置空，断开与后继节点的联系，完成清理工作。
     */ 
    if (node == tail && compareAndSetTail(node, pred)) {
        /* 
         * 执行到这里，表明 pred 节点被成功设为了尾节点，这里通过 CAS 将 pred 节点的后继节点
         * 设为 null。注意这里的 CAS 即使失败了，也没关系。失败了，表明 pred 的后继节点更新
         * 了。pred 此时已经是尾节点了，若后继节点被更新，则是有新节点入队了。这种情况下，CAS 
         * 会失败，但失败不会影响同步队列的结构。
         */
        compareAndSetNext(pred, predNext, null);
    } else {
        int ws;
        // 根据条件判断是唤醒后继节点，还是将前驱节点和后继节点连接到一起
        if (pred != head &&
            ((ws = pred.waitStatus) == Node.SIGNAL ||
             (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) &&
            pred.thread != null) {
            
            Node next = node.next;
            if (next != null && next.waitStatus <= 0)
                /*
                 * 这里使用 CAS 设置 pred 的 next，表明多个线程同时在取消，这里存在竞争。
                 * 不过此处没针对 compareAndSetNext 方法失败后做一些处理，表明即使失败了也
                 * 没关系。实际上，多个线程同时设置 pred 的 next 引用时，只要有一个能设置成
                 * 功即可。
                 */
                compareAndSetNext(pred, predNext, next);
        } else {
            /*
             * 唤醒后继节点对应的线程。这里简单讲一下为什么要唤醒后继线程，考虑下面一种情况：
             *        head          node1         node2         tail
             *        ws=0          ws=1          ws=-1         ws=0
             *      +------+  prev +-----+  prev +-----+  prev +-----+
             *      |      | <---- |     | <---- |     | <---- |     |  
             *      |      | ----> |     | ----> |     | ----> |     |
             *      +------+  next +-----+  next +-----+  next +-----+
             *      
             * 头结点初始状态为 0，node1、node2 和 tail 节点依次入队。node1 自旋过程中调用 
             * tryAcquire 出现异常，进入 cancelAcquire。head 节点此时等待状态仍然是 0，它
             * 会认为后继节点还在运行中，所它在释放同步状态后，不会去唤醒后继等待状态为非取消的
             * 节点 node2。如果 node1 再不唤醒 node2 的线程，该线程面临无法被唤醒的情况。此
             * 时，整个同步队列就回全部阻塞住。
             */
            unparkSuccessor(node);
        }
        node.next = node; // help GC
    }
}

private void unparkSuccessor(Node node) {
    int ws = node.waitStatus;
    /*
     * 通过 CAS 将等待状态设为 0，让后继节点线程多一次
     * 尝试获取同步状态的机会
     */
    if (ws < 0)
        compareAndSetWaitStatus(node, ws, 0);

    Node s = node.next;
    if (s == null || s.waitStatus > 0) {
        s = null;
       /*
        * 这里如果 s == null 处理，是不是表明 node 是尾节点？答案是不一定。原因之前在分析 
        * enq 方法时说过。这里再啰嗦一遍，新节点入队时，队列瞬时结构可能如下：
        *                      node1         node2
        *      +------+  prev +-----+ prev  +-----+
        * head |      | <---- |     | <---- |     |  tail
        *      |      | ----> |     |       |     |
        *      +------+ next  +-----+       +-----+
        * 
        * node2 节点为新入队节点，此时 tail 已经指向了它，但 node1 后继引用还未设置。
        * 这里 node1 就是 node 参数，s = node1.next = null，但此时 node1 并不是尾
        * 节点。所以这里不能从前向后遍历同步队列，应该从后向前。
        */
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null)
        // 唤醒 node 的后继节点线程
        LockSupport.unpark(s.thread);
}
```

**获取同步状态**

1. 调用 tryAcquire 方法尝试获取同步状态，获取成功，直接返回；获取失败则进行操作 2
3. 将线程封装到节点中，并将节点置于同步队列尾部，入队节点在 acquireQueued 方法中自旋获取同步状态
4. 若节点的前驱节点是头节点，则再次调用 tryAcquire 尝试获取同步状态

+ 获取成功，当前节点将自己设为头节点并返回
+ 获取失败，如果在有限次内仍无法获取同步状态，该线程将会被 LockSupport.park 方法阻塞住，直到被前驱节点唤醒

```java
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        Node h = head;
        if (h != null && h.waitStatus != 0)
            // 唤醒后继节点
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

**释放同步状态**

1. 调用 tryRelease(arg)尝试释放同步状态，成功则执行下面 3 步，返回 true

+ 如果 head 还未初始化（head = null），当第一个节点入队后，head 会被初始化为一个虚拟节点。这里如果还没节点入队就调用 release 释放同步状态，就会出现 head == null 的情况
+ 如果 head!= null&&waitStatus == 0，表明后继节点对应的线程仍在运行中，不需要唤醒
+ 如果 head!= null&&waitStatus < 0，表明后续节点对应的线程可能被阻塞了，需要唤醒

2. 不成功则返回 false

### 共享模式

```java
public final void acquireShared(int arg) {
    // 尝试获取共享同步状态，tryAcquireShared 返回的是整型
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}

private void doAcquireShared(int arg) {
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        // 这里和前面一样，也是通过有限次自旋的方式获取同步状态
        for (;;) {
            final Node p = node.predecessor();
            /*
             * 前驱是头结点，其类型可能是 EXCLUSIVE，也可能是 SHARED.
             * 如果是 EXCLUSIVE，线程无法获取共享同步状态。
             * 如果是 SHARED，线程则可获取共享同步状态。
             * 能不能获取共享同步状态要看 tryAcquireShared 具体的实现。比如多个线程竞争读写
             * 锁的中的读锁时，均能成功获取读锁。但多个线程同时竞争信号量时，可能就会有一部分线
             * 程因无法竞争到信号量资源而阻塞。
             */ 
            if (p == head) {
                // 尝试获取共享同步状态
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    // 设置头结点，如果后继节点是共享类型，唤醒后继节点
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
   
/**
 * 这个方法做了两件事情：
 * 1. 设置自身为头结点
 * 2. 根据条件判断是否要唤醒后继节点
 */ 
private void setHeadAndPropagate(Node node, int propagate) {
    Node h = head;
    // 设置头结点
    setHead(node);
    
    /*
     * 这个条件分支由 propagate > 0 和 h.waitStatus < 0 两部分组成。
     * h.waitStatus < 0 时，waitStatus = SIGNAL 或 PROPAGATE。这里仅依赖
     * 条件 propagate > 0 判断是否唤醒后继节点是不充分的，至于原因请参考第五章
     */
    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next;
        /*
         * 节点 s 如果是共享类型节点，则应该唤醒该节点
         * 至于 s == null 的情况前面分析过，这里不在赘述。
         */ 
        if (s == null || s.isShared())
            doReleaseShared();
    }
}

/**
 * 该方法用于在 acquires/releases 存在竞争的情况下，确保唤醒动作向后传播。
 */ 
private void doReleaseShared() {
    /*
     * 下面的循环在 head 节点存在后继节点的情况下，做了两件事情：
     * 1. 如果 head 节点等待状态为 SIGNAL，则将 head 节点状态设为 0，并唤醒后继节点
     * 2. 如果 head 节点等待状态为 0，则将 head 节点状态设为 PROPAGATE，保证唤醒能够正
     *    常传播下去。关于 PROPAGATE 状态的细节分析，后面会讲到。
     */
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                unparkSuccessor(h);
            }
            /* 
             * ws = 0 的情况下，这里要尝试将状态从 0 设为 PROPAGATE，保证唤醒向后
             * 传播。setHeadAndPropagate 在读到 h.waitStatus < 0 时，可以继续唤醒
             * 后面的节点。
             */
            else if (ws == 0 && !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```

**获取同步状态**

1. 获取共享同步状态，成功则直接返回，若获取失败则进行操作 2
2. 生成节点，并入队
3. 如果前驱为头节点，再次尝试获取共享同步状态
4. 获取成功则将自己设为头节点，如果后继节点是共享类型的，则唤醒
5. 若失败，将节点状态设为 SIGNAL，再次尝试；若再次失败，线程进入等待状态

```java
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

**释放共享状态**

共享状态主要逻辑在 doReleaseShared 中，共享节点线程在获取同步状态和释放同步状态时都会调用 doReleaseShare，所以 doReleaseShare 是多线程竞争集中的地方

## CountDownLatch（减计数器）

latch 指门闩，countdown 指从上往下数，CountDownLatch 是一个同步辅助类，允许一个或多个线程等待，一直到其他线程执行的操作完成后再执行，数到某个值（0）的时候打开门闩

CountDownLatch 是通过一个计数器实现的，计数器的初始值是线程的数量，每当有一个线程执行完毕后，然后通过 countDown 方法来让计数器的值-1，当计数器的值为 0 时，表示所有线程都执行完毕，然后继续执行 await 方法之后的语句，即在锁上等待的线程就可以恢复工作

### 属性和接口

```java
public class CountDownLatch {

    private static final class Sync extends AbstractQueuedSynchronizer {

        Sync(int count) {
            setState(count);
        }

        int getCount() {
            return getState();
        }

        protected int tryAcquireShared(int acquires) {
            return (getState() == 0) ? 1 : -1;
        }

        protected boolean tryReleaseShared(int releases) {
            for (;;) {
                int c = getState();
                if (c == 0)
                    return false;
                int nextc = c-1;
                if (compareAndSetState(c, nextc))
                    return nextc == 0;
            }
        }
    }

    private final Sync sync;
}
```

### 构造方法

```java
public CountDownLatch(int count) {
    if (count < 0) throw new IllegalArgumentException("count < 0");
    this.sync = new Sync(count);
}
```

CountDownLatch 是基于共享锁实现的，内部类 Sync 继承同步器 AQS

### countDown

```java
public void countDown() {
    sync.releaseShared(1);
}

public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}

// 通过循环+CAS的方式修改同步状态state
protected boolean tryReleaseShared(int releases) {
    for (;;) {
        int c = getState();
        if (c == 0)
            return false;
        int nextc = c-1;
        if (compareAndSetState(c, nextc))
            return nextc == 0;
    }
}
```

递减锁存器的计数，如果计数达到零，则释放所有等待的线程。如果当前计数大于零，则递减；如果当前计数为零，则什么也不会发生

### await

```java
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}

public final void acquireSharedInterruptibly(int arg) throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    if (tryAcquireShared(arg) < 0)
        doAcquireSharedInterruptibly(arg);
}

protected int tryAcquireShared(int acquires) {
    return (getState() == 0) ? 1 : -1;
}
```

1. 使当前线程等待直到闭锁倒计时为零，除非线程被中断，如果当前计数大于零，则当前线程出于线程调度目的而被禁用并处于休眠状态
2. 如果当前计数为零，则此方法立即返回，即 await 方法阻塞的线程会被唤醒，继续执行

### 基本使用

```java
public class Demo01 {
    public static void main(String[] args) {
        //初始值8 有八个人需要出寝室门
        CountDownLatch countDownLatch=new CountDownLatch(8);
        for (int i=1;i<=8;++i){
            new Thread(()->{
                System.out.println(Thread.currentThread().getName()+"出去啦");
                //出去一个人计数器就减1
                countDownLatch.countDown();
            },String.valueOf(i)).start();
        }
        try {
            countDownLatch.await();//阻塞等待计数器归零
        }catch (InterruptedException e){
            e.printStackTrace();
        }
        System.out.println(Thread.currentThread().getName()+"=====寝室人都已经出来了");
    }
}
```

缺点：CountDownLatch 是一次性的，计算器的值只能在构造方法中初始化一次，之后没有任何机制再次对其设置值，当 CountDownLatch 使用完毕后，它不能再次被使用

## CyclicBarrier（循环栅栏）

### 属性和接口

```java
public class CyclicBarrier {
	//CyclicBarrier使用完了可以重置，每使用一次都会有一个新的Generation对象，broken表示当前屏障是否被损坏
    private static class Generation {
        boolean broken = false;
    }

    //重入锁
    private final ReentrantLock lock = new ReentrantLock();
    //condition实现线程等待与唤醒
    private final Condition trip = lock.newCondition();
    //表示线程数，在parties个线程都调用await方法后，barrier才算是被通过(tripped)了。
    private final int parties;
    //通过构造方法设置一个Runnable对象，用来在所有线程都到达barrier时执行。
    private final Runnable barrierCommand;
    /** The current generation */
    private Generation generation = new Generation();

    //count表示还剩下未到达barrier（未调用await)的线程数量
    private int count;
}
```

### 构造方法

```java
//构造函数
public CyclicBarrier(int parties, Runnable barrierAction) {
    if (parties <= 0) throw new IllegalArgumentException();
    this.parties = parties;
    this.count = parties;
    this.barrierCommand = barrierAction;
}

public CyclicBarrier(int parties) {
    this(parties, null);
}
```

### await

```java
public int await() throws InterruptedException, BrokenBarrierException {
    try {
        return dowait(false, 0L);
    } catch (TimeoutException toe) {
        throw new Error(toe); // cannot happen
    }
}

public int await(long timeout, TimeUnit unit) throws InterruptedException,BrokenBarrierException,TimeoutException {
    return dowait(true, unit.toNanos(timeout));
}

private int dowait(boolean timed, long nanos) throws InterruptedException, BrokenBarrierException,TimeoutException {
    //独占锁
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        //Generation对象
        final Generation g = generation;

        //屏障被破坏，抛出异常
        if (g.broken)
            throw new BrokenBarrierException();
        //线程被中断
        if (Thread.interrupted()) {
            breakBarrier();
            throw new InterruptedException();
        }

        int index = --count;
        //最后一个到达同步点的线程
        if (index == 0) {  // tripped
            boolean ranAction = false;
            try {
                final Runnable command = barrierCommand;
                if (command != null)
                    command.run();
                ranAction = true;
                nextGeneration();
                return 0;
            } finally {
                if (!ranAction)
                    breakBarrier();
            }
        }

        //一直循环直到最后一个线程到达同步点、屏障破损(genneration的broken属性为true)、中断或超时
        for (;;) {
            try {
                if (!timed)
                    trip.await();
                else if (nanos > 0L)
                    nanos = trip.awaitNanos(nanos);
            } catch (InterruptedException ie) {
                // g == generation && !g.broken说明此时当前这一轮还没结束，并且没有其它线程执行过
                // breakBarrier方法。这种情况会执行breakBarrier置generation的broken标识为true并
                // 唤醒其它线程，之后继续抛出InterruptedException。 
                if (g == generation && ! g.broken) {
                    breakBarrier();
                    throw ie;
                } else {
                    // 如果g!= generation,此时这一轮已经结束，后面返回index作为到达barrier的次序;
                    // 如果g.broken说明之前已经有其它线程执行了breakBarrier方法，后面会抛出
                    // BrokenBarrierException。
                    Thread.currentThread().interrupt();
                }
            }

            if (g.broken)
                throw new BrokenBarrierException();
            if (g != generation)
                return index;

            //超时
            if (timed && nanos <= 0L) {
                breakBarrier();
                throw new TimeoutException();
            }
        }
    } finally {
        lock.unlock();
    }
}
```

dowait()：如果该线程池不是最后一个调用 await 方法的线程，则它会一直处于等待状态，除非发生以下情况：

1. 最后一个线程到达，即 index = 0
2. 某个参与线程等待超时
3. 某个参与线程被中断
4. 调用了 CyclicBarrier 的 reset()方法，该方法会将屏障重置为初始状态

### 基本使用

```java
public class Demo02 {
    public static void main(String[] args) {
        //第一个参数：目标障碍数
        //第二个参数：一个Runnable任务，当达到目标障碍数，就会执行我们传入的Runnable
        CyclicBarrier cyclicBarrier=new CyclicBarrier(201,()->{
            System.out.println("恭喜你，已经抽奖201次，幸运值已满");
        });

        for (int i = 1; i <= 201; i++) {
            new Thread(()->{
                System.out.println(Thread.currentThread().getName()+"抽奖一次");
                try {
                    cyclicBarrier.await();
                }catch (InterruptedException e){
                    e.printStackTrace();
                }catch (BrokenBarrierException e){
                    e.printStackTrace();
                }
            },String.valueOf(i)).start();
        }
        
        // 这行代码是重置计数
        cyclicBarrier.reset();
        // 可以看到最后结果中输出了两次 "恭喜你"
        for (int i=1;i<=201;i++){
            final int count=i;
            new Thread(()->{
                System.out.println(Thread.currentThread().getName()+"抽奖一次");
                try {
                    cyclicBarrier.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (BrokenBarrierException e) {
                    e.printStackTrace();
                }
            },String.valueOf(i)).start();
        }
    }
}
```

CyclicBarrier 和 CountDownLatch 的区别：

1. CyclicBarrier 只能唤醒一个任务；CountDownLatch 可以唤醒多个任务
2. CyclicBarrier 可以重置，重新使用；CountDownLatch 的值等于 0 时，就不可重复用了

## Semaphore（信号量）

通常用于限制可以访问某些（物理或逻辑）资源的线程数，synchronized 和 ReentrantLock 都是一次只允许一个线程访问某个资源，Semaphore（信号量）可以指定多个线程同时访问某个资源，执行 acquire 方法阻塞，直到有一个许可证可以获得，然后拿走一个许可证；每个 release 方法增加一个许可证，这可能会释放一个阻塞的 acquire 方法。然而，并没有实际的许可证这个对象，Semaphore 经常用于限制获取某种资源的线程数量

### 属性和接口

```java
public class Semaphore implements java.io.Serializable {

    private final Sync sync;

    abstract static class Sync extends AbstractQueuedSynchronizer {

        Sync(int permits) {
            setState(permits);
        }

        final int getPermits() {
            return getState();
        }
        
		final int nonfairTryAcquireShared(int acquires) {
            for (;;) {
                int available = getState();
                int remaining = available - acquires;
                if (remaining < 0 ||
                    compareAndSetState(available, remaining))
                    return remaining;
            }
        }
    }

    static final class NonfairSync extends Sync {

        NonfairSync(int permits) {
            super(permits);
        }

        protected int tryAcquireShared(int acquires) {
            return nonfairTryAcquireShared(acquires);
        }
    }

    static final class FairSync extends Sync {

        FairSync(int permits) {
            super(permits);
        }

        protected int tryAcquireShared(int acquires) {
            for (;;) {
                if (hasQueuedPredecessors())
                    return -1;
                int available = getState();
                int remaining = available - acquires;
                if (remaining < 0 ||
                    compareAndSetState(available, remaining))
                    return remaining;
            }
        }
    }
}
```

### 构造方法

```java
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}

public Semaphore(int permits, boolean fair) {
    sync = (fair)? new FairSync(permits) : new NonfairSync(permits);
}
```

### 常用方法

1. acquire()：获取一个令牌，在获取到令牌、或者被其他线程调用中断之前线程一直处于阻塞状态。
2. acquire(int permits)：获取一个令牌，在获取到令牌、或者被其他线程调用中断、或超时之前线程一直处于阻塞状态。
3. acquireUninterruptibly()：获取一个令牌，在获取到令牌之前线程一直处于阻塞状态（忽略中断）。
4. tryAcquire()：尝试获得令牌，返回获取令牌成功或失败，不阻塞线程。
5. tryAcquire(long timeout, TimeUnit unit)：尝试获得令牌，在超时时间内循环尝试获取，直到尝试获取成功或超时返回，不阻塞线程。
6. release()：释放一个令牌，唤醒一个获取令牌不成功的阻塞线程。
7. hasQueuedThreads()：等待队列里是否还存在等待线程。
8. getQueueLength()：获取等待队列里阻塞的线程数。
9. drainPermits()：清空令牌把可用令牌数置为 0，返回清空令牌的数量。
10. availablePermits()：返回可用的令牌数量。

### 基本使用

```java
public class Demo03 {
    public static void main(String[] args) {
        //10台电脑
        Semaphore semaphore=new Semaphore(10);

        //20个小伙伴想要上网
        for (int i = 0; i < 20; i++) {
            new Thread(()->{
                try {
                    //等待获取许可证
                    semaphore.acquire();
                    System.out.println(Thread.currentThread().getName()+"抢到了电脑");
                    TimeUnit.SECONDS.sleep(10);
                }catch (InterruptedException e){
                    e.printStackTrace();
                }finally {
                    System.out.println(Thread.currentThread().getName()+"离开了");
                    //释放资源，离开了就把电脑让给别人
                    semaphore.release();
                }
            },String.valueOf(i)).start();
        }
    }
}
```

## Phaser（阶段器）

```java
//默认的构造方法，初始化注册的线程数量为0,可以动态注册
Phaser();

//指定了线程数量的构造方法
Phaser(int parties);

//添加一个注册者  向此移相器添加一个新的未到达方。 
//如果正在进行对onAdvance调用，则此方法可能会在返回之前等待其完成。
register();

//添加指定数量的注册者  将给定数量的新未到达方添加到此移相器(移相器就是Phaser)。
bulkRegister(int parties);

// 到达屏障点直接执行 无需等待其他人到达。
arrive();

//到达屏障点后，也必须等待其他所有注册者到达这个屏障点才能继续下一步
arriveAndAwaitAdvance();

//到达屏障点，把自己注销了，不用等待其他的注册者到达
arriveAndDeregister();

//多个线程达到注册点之后，会回调这个方法，可以做一些逻辑的补充
onAdvance(int phase, int registeredParties);
```

```java
/**
 * 定义一个移相器来自定义输出
 */
public class MyPhaser extends Phaser {
    /**
     * @param phase     	进入此方法的当前阶段号，在此移相器前进之前
     * @param registeredParties     当前注册方的数量
     * @return
     */
    @Override
    protected boolean onAdvance(int phase, int registeredParties) {
        if (phase==0){
            System.out.println("所有人都到达了网吧，准备开始开黑");
            return false;
        }else if(phase==1){
            System.out.println("大家都同意，一起去吃烧烤");
            return false;
        }else if (phase==2){
            System.out.println("大家一起回寝室");
            return true;
        }
        return true;
    }
}
```

```java
public class Demo04 implements Runnable{
    private static Phaser phaser=new MyPhaser();

    @Override
    public void run() {
        //向此移相器添加一个新的未到达方
        phaser.register();
        System.out.println(Thread.currentThread().getName()+"从家里出发，准备去学校上网开黑");
        phaser.arriveAndAwaitAdvance();
        System.out.println(Thread.currentThread().getName()+"上着上着饿了，去吃烧烤");
        phaser.arriveAndAwaitAdvance();
        System.out.println(Thread.currentThread().getName()+"烧烤吃完了");
        phaser.arriveAndAwaitAdvance();
    }

    public static void main(String[] args) {
        Demo04 demo04 = new Demo04();
        new Thread(demo04,"小明").start();
        new Thread(demo04,"小黑").start();
        new Thread(demo04,"小白").start();
    }
}
/**
 * 小李从家里出发，准备去学校后街上网开黑！！！
 * 小王从家里出发，准备去学校后街上网开黑！！！
 * 小明从家里出发，准备去学校后街上网开黑！！！
 * 所有人都到达了网吧，准备开始开黑！！！
 * 小李上着上着饿了，说去次烧烤吗？
 * 小明上着上着饿了，说去次烧烤吗？
 * 小王上着上着饿了，说去次烧烤吗？
 * 大家都同意，一起去次烧烤咯！！！
 * 小明烧烤次完了
 * 小李烧烤次完了
 * 小王烧烤次完了
 * 大家一起回寝室！！！
 */
```
