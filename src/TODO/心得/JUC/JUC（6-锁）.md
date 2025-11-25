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

## 锁类型

### 自旋锁

如果此时拿不到锁，它不马上进入阻塞状态，而是等待一段时间，类似于线程在做空循环，如果循环一定的次数还拿不到锁，那么它才会进入阻塞的状态。（线程从运行态进入阻塞态是非常耗时的，因为不仅需要保存线程此时的执行状态、上下文等数据，还涉及到用户态和内核态的状态。从阻塞态唤醒也是一样），可以人为指定循环次数

缺点：如果锁被其他线程长时间占用，一直不释放 CPU，会带来许多的性能开销

### 自适应自旋锁

不需要人为指定循环次数，它本身会进行判断要循环继承，能够根据线程最近获得锁的状态来调整循环次数的自旋锁

### 偏向锁

（认为对于一个方法，是很少有两个线程来执行的，相当于单线程的情况，那就没必要加锁了）。如果这个方法没有人进来过，那么一个线程首次进入这个方法的时候，会采用 CAS 机制，把这个方法标记为有人在执行了，并且把该线程的 ID 也记录进去。但这个线程退出这个方法的时候，它不会改变这个方法的状态，当这个线程想要再次进入这个方法的时候，会判断一下这个方法的状态，如果这个方法已经被标记为有人在执行了，并且线程的 ID 是自己，那么它就直接进入这个方法执行，啥也不用做

在没有锁竞争的情况下，锁总是“偏向”于第一个获得它的线程，偏向锁通过减少不必要的 CAS 操作来提高性能。

1. 加锁过程：当线程第一次请求锁时，JVM 会将该线程的 ID 记录在对象头的 Mark Word 中，表示锁偏向于该线程，后续该线程再进入该锁时，无需进行额外的同步操作。
2. 撤销偏向锁：如果在偏向锁持有期间，另一个线程请求同一把锁，JVM 会撤销偏向锁，并升级为轻量级锁。

### 轻量级锁

进入一个方法的时候不用加锁，只需要做一个标记就可以了，用一个变量来记录此时该方法是否有人在执行。如果这个方法没人在执行，当进入这个方法的时候，采用 CAS 机制，把这个状态标记为已经有人在执行，退出这个方法时，再把这个状态改为没有人在执行了

轻量级锁适用于多个线程短时间内争用同一锁的场景。

1. 加锁过程：当线程进入同步块时， 会在当前线程的栈帧中创建一个锁记录（Lock Record），并将对象头中的 Mark Word 拷贝到锁记录中。线程尝试使用 CAS 操作将对象头中的 Mark Word 更新为指向锁记录的指针。如果成功，则表示该线程获取了锁；如果失败，则表示其他线程已经持有该锁，此时锁会升级为重量级锁。
2. 解锁过程：线程退出同步块时，JVM 会将对象头中的 Mark Word 恢复为原始值。

### 重量级锁

获取不到锁就马上进入阻塞状态，当锁竞争激烈时，JVM 会升级为重量级锁，重量级锁使用操作系统的互斥量（Mutex）机制来实现线程的阻塞与唤醒。

1. 加锁过程：如果线程无法通过轻量级锁获取锁，JVM 会将该锁升级为重量级锁，并将当前线程阻塞
2. 解锁过程：当线程释放重量级锁时，JVM 会唤醒所有阻塞的线程，允许它们再次尝试获取锁。

### 悲观锁和乐观锁

1. 悲观锁：总是假设最坏的情况，每次去拿数据的时候都认为别人会修改，所以每次在拿数据的时候都会上锁，这样别人想拿这个数据就会阻塞直到它拿到锁（共享资源每次只给一个线程使用，其他线程阻塞，用完后再把资源转让给其他线程）
2. 乐观锁：总是假设最好的情况，每次去拿数据的时候都认为别人不会修改，所以不会上锁，但是再更新的时候会判断一下在此期间别人有没有去更新这个数据，可以使用版本号机制和 CAS 算法实现

**乐观锁常见的两种实现方式**

1. 版本号机制：一般是在数据表中加上一个数据版本号 version 字段，表示数据被修改的次数，当数据被修改时，version 值会加 1。当线程 A 要更新数据值时，在读取数据的同时也会读取 version 值，在提交更新时，若刚才读取到的 version 值为当前数据库中的 version 值相等时才更新，否则重试更新操作，直到更新成功。
2. CAS 算法（compare and swap）：无锁编程，即不使用锁的情况下实现多线程之间的变量同步，也就是在没有线程被阻塞的情况下实现变量的同步，也叫非阻塞同步。

**乐观锁的缺点**

1. ABA 问题：如果一个变量 V 初次读取的时候是 A 值，并且在准备赋值的时候检查到它仍然是 A 值，无法说明它的值没有被其他线程修改过
2. 循环时间长开销大：自旋 CAS 如果长时间不成功，会给 CPU 带来非常大的执行开销
3. 只能保证一个共享变量的原子操作：CAS 只对单个共享变量有效，当操作涉及跨多个共享变量时 CAS 无效

### 总结

**锁升级**

1. 偏向锁：当一个线程第一次获取锁时，JVM 会将该线程标记为“偏向”状态，后续若该线程再获取该锁，几乎没有开销
2. 轻量级锁：当另一个线程尝试获取已经被偏向的锁时，锁会升级为轻量级锁，使用 CAS 操作来减少锁竞争的开销
3. 重量级锁：当 CAS 失败无法获取锁，锁会升级为重量级锁，线程会被挂起，直到锁被释放。

## Lock

1. 可重入锁：某个线程已经获得某个锁，可以再次获取锁而不会出现死锁
2. 可中断锁：在等待获取锁过程中可中断
3. 公平锁：按等待获取锁的线程的等待时间进行获取，等待时间长的具有优先获取锁权利
4. 读写锁：对资源读取和写入的时候拆分为 2 部分处理，读的时候可以多线程一起读，写的时候必须同步地写

```java
public interface Lock {
	//获得锁。
    void lock(); 

    /**
    除非当前线程被中断，否则获取锁。
    
	如果可用，则获取锁并立即返回。
	如果锁不可用，则当前线程将出于线程调度目的而被禁用并处于休眠状态，直到发生以下两种情况之一：
		锁被当前线程获取； 
		要么其他一些线程中断当前线程，支持中断获取锁。
	如果当前线程在进入此方法时设置其中断状态；要么获取锁时中断，支持中断获取锁，
    */
    void lockInterruptibly() throws InterruptedException; 

    /**
    仅在调用时空闲时才获取锁。
	如果可用，则获取锁并立即返回值为true 。 如果锁不可用，则此方法将立即返回false值。
	*/
    boolean tryLock();
    
    //比上面多一个等待时间 
    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;  

   	// 解锁
    void unlock(); 
    
    //返回绑定到此Lock实例的新Condition实例。
    Condition newCondition();  
}
```

### lock 和 unlock

1. lock：获取锁，如果锁已经被其他线程获得，则当前线程将被禁用以进行线程调度，并处于休眠状态，等待，直到获取锁
2. unlock：主动释放锁

注意：如果使用到了 lock 的话，那么必须去主动释放锁，就算发生了异常，也需要我们主动释放锁，因为 lock 并不会像 synchronized 一样被自动释放，所以使用 lock 的话，必须是在 try{}catch(){}中进行，并将释放锁的代码放在 finally{}中，以确保锁一定会被释放，以防止死锁现象的发生

```java
public class Demo01 implements Runnable{
    private Lock lock=new ReentrantLock();
    
    @Override
    public void run() {
        say();
    }

    private void say(){
        try {
            lock.lock();
            System.out.println("上锁");
            System.out.println(Thread.currentThread().getName());
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            lock.unlock();
            System.out.println("释放锁");
        }
    }

    public static void main(String[] args) {
        Demo01 demo01 = new Demo01();
        for (int i = 0; i < 10; i++) {
            new Thread(demo01,"test"+i).start();
        }
    }
}
```

### newCondition

1. 关键字 synchronized 与 wait()/notify()这两个方法一起使用可以实现等待/通知模式
2. Lock 锁的 newCondition()方法返回 Condition 对象，Condition 类也可以实现等待/通知模式

注意：用 notify()通知时，JVM 会随机唤醒某个等待的线程，使用 Condition 类可以进行选择性通知

### await 和 signal

1. await()：会使当前线程等待，同时会释放锁，当其他线程调用 signal()方法时，此时这个沉睡线程会重新获得锁并继续执行代码（在哪里沉睡就在哪里唤醒）
2. signal()：用于唤醒一个等待的线程

注意：在调用 Condition 的 await()/signal()方法前，也需要线程持有相关的 Lock 锁，调用 await()后线程会释放这个锁，在调用 signal()方法后会从当前 Condition 对象的等待队列中，唤醒一个线程，后被唤醒的线程开始尝试去获得锁，一旦成功获得锁就继续往下执行

```java
public class Demo02 {
    private Integer number=0;
    private ReentrantLock lock=new ReentrantLock();
    private Condition newCondition1=lock.newCondition();
    private Condition newCondition2=lock.newCondition();

    public void incr(){
        try {
            lock.lock();
            while (number!=0){
                newCondition1.await();//沉睡
            }
            ++number;
            System.out.println(Thread.currentThread().getName()+"::"+number);
            newCondition2.signal();//唤醒另一个沉睡的线程
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            lock.unlock();
        }
    }

    public void decr(){
        try {
            lock.lock();
            while (number!=1){
                newCondition2.await();
            }
            --number;
            System.out.println(Thread.currentThread().getName()+"::"+number);
            newCondition1.signal();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        Demo02 demo02 = new Demo02();
        new Thread(()->{
            for (int i=0;i<10;++i){
                demo02.incr();
            }
        },"AA").start();
        new Thread(()->{
            for (int i = 0; i < 10; i++) {
                demo02.decr();
            }
        },"BB").start();
    }
}

/*
运行结果：
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
AA::1
BB::0
*/
```

## ReentrantLock（可重入锁）

### 接口和属性

```java
public class ReentrantLock implements Lock, java.io.Serializable {

    private final Sync sync;

    abstract static class Sync extends AbstractQueuedSynchronizer {

        abstract void lock();

        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }

        protected final boolean tryRelease(int releases) {
            int c = getState() - releases;
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            boolean free = false;
            if (c == 0) {
                free = true;
                setExclusiveOwnerThread(null);
            }
            setState(c);
            return free;
        }

        protected final boolean isHeldExclusively() {
            return getExclusiveOwnerThread() == Thread.currentThread();
        }

        final ConditionObject newCondition() {
            return new ConditionObject();
        }

        final Thread getOwner() {
            return getState() == 0 ? null : getExclusiveOwnerThread();
        }

        final int getHoldCount() {
            return isHeldExclusively() ? getState() : 0;
        }

        final boolean isLocked() {
            return getState() != 0;
        }

        private void readObject(java.io.ObjectInputStream s)
            throws java.io.IOException, ClassNotFoundException {
            s.defaultReadObject();
            setState(0); // reset to unlocked state
        }
    }

    static final class NonfairSync extends Sync {

        final void lock() {
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1);
        }

        protected final boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }

    static final class FairSync extends Sync {

        final void lock() {
            acquire(1);
        }

        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0)
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
    }
}
```

### 构造方法

当我们 new 一个 ReentrantLock 对象时，底层默认采用非公平锁，NonfairSync 和 FairSync 都是基于 AQS 队列实现

```java
public ReentrantLock() {
    sync = new NonfairSync(); //无参默认非公平锁
}

public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();//传参为true为公平锁
}
```

### 释放锁

1. 获取锁的状态值，释放锁将状态值-1
2. 判断当前释放锁的线程和锁中保存的线程信息是否一致，不一致会抛出异常
3. 状态值-1 直到为 0，锁状态值为 0 表示不再占用，为空闲状态

### 公平锁的 lock()

```java
static final class FairSync extends Sync {
    final void lock() {
        acquire(1);
    }
    // AbstractQueuedSynchronizer.acquire(int arg)
    public final void acquire(int arg) {
        if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
    
    protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            // 和非公平锁相比，这里多了一个判断：是否有线程在等待
            if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }
}
```

! hasQueuedPredcessors()方法指当前同步队列没有前驱节点（即没有线程在等待）时才会去 compareAndSetState(0, acquires)使用 CAS 修改同步状态变量，根据线程发出的请求顺序获取锁

### 非公平锁的 lock()

```java
static final class NonfairSync extends Sync {
    final void lock() {
        // 和公平锁相比，这里会直接先进行一次CAS，成功就返回了
        if (compareAndSetState(0, 1))
            setExclusiveOwnerThread(Thread.currentThread());
        else
            acquire(1);
    }
    // AbstractQueuedSynchronizer.acquire(int arg)
    public final void acquire(int arg) {
        if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
    protected final boolean tryAcquire(int acquires) {
        return nonfairTryAcquire(acquires);
    }
}

final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // 直接CAS，没有判断前面是否还有节点
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```

非公平锁在刚进入 lock 方法时会直接使用一次 CAS 去尝试获取锁，不成功才会到 acquire 方法，而在 nonfairTryAcquire 方法中并没有判断是否有前驱节点在等待，直接 CAS 尝试获取锁，由此实现了非公平锁

### 公平锁和非公平锁的区别

非公平锁在调用 lock 后，首先就会调用 CAS 进行一次抢锁，如果这个时候恰好锁没有被占用，那么直接就获取到锁返回了；非公平锁在 CAS 失败后，和公平锁一样都会进入到 tryAcquire 方法，在 tryAcquire 方法中，如果发现锁这个时候被释放了（state = 0），非公平锁会直接 CAS 抢锁，但是公平锁会判断等待队列是否有线程处于等待状态，如果有则不去抢锁，乖乖排到后面

### 基本使用

```java
public class Demo03 {
    public static void main(String[] args) {
        ReentrantLock lock = new ReentrantLock();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    lock.lock();
                    System.out.println("第1次获取锁，这个锁是："+lock);
                    for (int i = 2; i < 11; i++) {
                        try {
                            lock.lock();
                            System.out.println("第"+i+"次获取锁，这个锁是："+lock);
                            Thread.sleep(new Random().nextInt(200));
                        }catch (Exception e){
                            e.printStackTrace();
                        }finally {
                            lock.unlock();//把这里注释掉，程序会陷入死锁
                        }
                    }
                }catch (Exception e){
                    e.printStackTrace();
                }finally {
                    lock.unlock();
                }
            }
        }).start();

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    lock.lock();
                    System.out.println("这里是为了测试死锁而多写一个的线程");
                }finally {
                    lock.unlock();
                }
            }
        }).start();
    }
}
```

## ReadWriteLock（读写锁）

分为读锁和写锁，将读写进行分离，使多个线程可以进行读操作，从而提高了效率

```java
public interface ReadWriteLock {	
    // 获取读锁
    Lock readLock();
	// 获取写锁
    Lock writeLock();
}
```

## ReentrantReadWriteLock

### 接口和属性

```java
public class ReentrantReadWriteLock implements ReadWriteLock,java.io.Serializable {
    /** 读锁 */
    private final ReentrantReadWriteLock.ReadLock readerLock;
    /** 写锁 */
    private final ReentrantReadWriteLock.WriteLock writerLock;
    final Sync sync;

    /** 使用默认（非公平）的排序属性创建一个新的ReentrantReadWriteLock */
    public ReentrantReadWriteLock() {
        this(false);
    }
    
    /** 使用给定的公平策略创建一个新的 ReentrantReadWriteLock */
    public ReentrantReadWriteLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
        readerLock = new ReadLock(this);
        writerLock = new WriteLock(this);
    }
    
    /** 返回用于写入操作的锁 */
    public ReentrantReadWriteLock.WriteLock writeLock() { return writerLock; }

    /** 返回用于读取操作的锁 */
    public ReentrantReadWriteLock.ReadLock readLock() { return readerLock; }
    abstract static class Sync extends AbstractQueuedSynchronizer {}
    static final class NonfairSync extends Sync {}
    static final class FairSync extends Sync {}
    public static class ReadLock implements Lock, java.io.Serializable {}
    public static class WriteLock implements Lock, java.io.Serializable {}
}
```

1. 当读写锁是写加锁状态时，在这个锁被解锁之前，所有试图对这个锁加锁的线程都会被阻塞，因为写锁是独占锁。线程进行写锁的前提条件：

+ 没有读者线程正在访问
+ 没有其他写者线程正在访问

2. 当读写锁在读加锁状态时，所有试图以读模式对它进行加锁的线程都可以得到访问权，但如果以写模式尝试对此锁进行加锁，它必须等到所有的线程释放锁。线程进入读锁的前提条件：

+ 不存在其他线程的写锁
+ 没有写请求，或者有写请求，但调用线程和持有锁的线程是同一个（可重入锁）

通常，当读写锁处于读模式锁住状态时，如果有另外线程试图以写模式加锁，读写锁通常会阻塞随后的读模式锁请求，这样可以避免读模式锁长期占用，而等待的写模式锁请求长期阻塞

### 基本使用

```java
public class Demo04 {
    public static void main(String[] args) {
        Demo04 demo04 = new Demo04();
        new Thread(()->{
            demo04.get(Thread.currentThread());
        }).start();

        new Thread(()->{
            demo04.get(Thread.currentThread());
        }).start();
    }

    public synchronized void get(Thread thread){
        long start=System.currentTimeMillis();
        while (System.currentTimeMillis()-start<=0.05){
            System.out.println(thread.getName()+"正在进行读操作");
        }
        System.out.println(thread.getName()+"读操作完毕");
    }
}

/**
 * 输出
 * Thread-0正在进行读操作
 * Thread-0读操作完毕
 * Thread-1正在进行读操作
 * Thread-1正在进行读操作
 * Thread-1正在进行读操作
 * ....
 * Thread-1读操作完毕
 */
```

改成读写锁之后，线程 1 和线程 2 同时在读，速度变快了

```java
public class Demo05 {
    private ReentrantReadWriteLock lock=new ReentrantReadWriteLock();

    public static void main(String[] args) {
        Demo05 demo05 = new Demo05();
        new Thread(()->{
            demo05.get(Thread.currentThread());
        }).start();

        new Thread(()->{
            demo05.get(Thread.currentThread());
        }).start();
    }

    public void get(Thread thread){
        lock.readLock().lock();
        try {
            long start=System.currentTimeMillis();
            while (System.currentTimeMillis()-start<=1){
                System.out.println(thread.getName()+"正在进行读操作");
            }
            System.out.println(thread.getName()+"读操作完毕");
        }finally {
            lock.readLock().unlock();
        }
    }
}

---------------
Thread-0正在进行读操作
Thread-0正在进行读操作
Thread-1正在进行读操作
Thread-1正在进行读操作
Thread-1正在进行读操作
Thread-0读操作完毕
Thread-1正在进行读操作
Thread-1正在进行读操作
Thread-1正在进行读操作
Thread-1正在进行读操作
Thread-1正在进行读操作
Thread-1读操作完毕
```

注意：

1. 若此时已经有一个线程占用了读锁，此时其他线程申请读锁是可以的，但是若此时其他线程申请写锁，则只有等待读锁释放，才能成功获得
2. 若此时已经有一个线程占用了写锁，那么此时其他线程申请写锁或读锁，都只有持有写锁的线程释放写锁，才能成功获得

### 锁降级

指当前拥有的写锁，再获取到读锁，随后释放（先前拥有的）写锁，最后释放读锁的过程，写锁降级为读锁，而读锁是不可以升级为写锁的。如果当前线程拥有写锁，然后将其释放，最后再获取读锁，这种分段完成的过程不能称之为锁降级

编程模型：获取写锁-> 获取读锁-> 释放写锁-> 释放读锁

```java
public class ReadWriteLockDemo2 {
    public static void main(String[] args) {
        ReentrantReadWriteLock reentrantReadWriteLock = new ReentrantReadWriteLock();
        // 获取读锁
        ReentrantReadWriteLock.WriteLock writeLock = reentrantReadWriteLock.writeLock();
        // 获取写锁
        ReentrantReadWriteLock.ReadLock readLock = reentrantReadWriteLock.readLock();
        //1、获取到写锁
        writeLock.lock();
        System.out.println("获取到了写锁");
        //2、继续获取到读锁
        readLock.lock();
        System.out.println("继续获取到读锁");
        //3、释放写锁
        writeLock.unlock();
		//4、释放读锁
        readLock.unlock();
    }
}
/**
 * 获取到了写锁
 * 继续获取到读锁
 */
```

```java
public class ReadWriteLockDemo2 {

    public static void main(String[] args) {
        ReentrantReadWriteLock reentrantReadWriteLock = new ReentrantReadWriteLock();
        // 获取读锁
        ReentrantReadWriteLock.WriteLock writeLock = reentrantReadWriteLock.writeLock();
        // 获取写锁
        ReentrantReadWriteLock.ReadLock readLock = reentrantReadWriteLock.readLock();

        //1、 获取到读锁
        readLock.lock();
        System.out.println("获取到了读锁");

        writeLock.lock();
        System.out.println("继续获取到写锁");

        writeLock.unlock();
        readLock.unlock();
        // 释放写锁
    }
}
/*
获取到了读锁
*/
```

1. 在线程持有读锁的情况下，该线程不能取得写锁（因为获取写锁的前提是：当前没有读者线程，也没有其他写者线程，如果发现当前的读锁被占用，就马上获取失败，不管读锁是不是被当前线程持有）
2. 在线程持有写锁的情况下，该线程可以继续获取读锁（获取读锁时如果发现写锁被占用，只有写锁没有被当前线程占用的情况才会获取失败）。原因：当线程获取读锁的时候，可能有其他线程同时也在持有读锁，因为不能把获取读锁的线程“升级”为写锁，而对于获得写锁的线程，它一定独占了读写锁，因此可以继续让它获取读锁，当它同时获取了写锁和读锁后，还可以先释放写锁继续持有读锁，这样一个写锁就“降级”为了读锁

```java
public class CacheDemo {
    /**
     * 缓存器,这里假设需要存储1000左右个缓存对象，按照默认的负载因子0.75，则容量=750，大概估计每一个节点链表长度为5个
     * 那么数组长度大概为：150,又有雨设置map大小一般为2的指数，则最近的数字为：128
     */
    private Map<String, Object> map = new HashMap<>(128);
    private ReadWriteLock rwl = new ReentrantReadWriteLock();
    private Lock writeLock=rwl.writeLock();
    private Lock readLock=rwl.readLock();

    public Object get(String id) {
        Object value = null;
        readLock.lock();//首先开启读锁，从缓存中去取
        try {
            //如果缓存中没有 释放读锁，上写锁
            if (map.get(id) == null) { 
                readLock.unlock();
                writeLock.lock();
                try {
                    //防止多写线程重复查询赋值
                    if (value == null) {
                        //此时可以去数据库中查找，这里简单的模拟一下
                        value = "redis-value";  
                    }
                    //加读锁降级写锁
                    readLock.lock(); 
                } finally {
                    //释放写锁
                    writeLock.unlock(); 
                }
            }
        } finally {
            //最后释放读锁
            readLock.unlock(); 
        }
        return value;
    }
}
```

如果不使用锁降级功能，如先释放写锁，然后获得读锁，在这个获取读锁的过程中，可能会有其他线程竞争到写锁或者是更新数据，则获得的数据是其他线程更新的数据，可能会造成数据的污染，即产生脏读的问题

注意：锁降级中读锁的获取是必要的。为了保证数据的可见性，如果当前线程不获取读锁而是直接释放写锁，假设此时另一个线程（线程 T）获取了写锁并修改了数据，那么当前线程无法感知线程 T 的数据更新。如果当前线程获取读锁，即遵循降级的步骤，则线程 T 将会被阻塞，直到当前线程使用数据并释放读锁之后，线程 T 才能获取写锁进行数据更新