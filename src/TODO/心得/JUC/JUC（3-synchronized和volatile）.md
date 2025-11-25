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

## synchronized

### 基本使用

#### 修饰实例方法

作用于当前对象实例加锁，进入同步代码前要获得当前对象实例的锁

```java
public class SyncTest implements Runnable{
    //共享资源变量
    int count = 0;

    @Override
    public synchronized void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName()+":"+count++);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        SyncTest syncTest1 = new SyncTest();
        Thread thread1 = new Thread(syncTest1,"thread1");
        Thread thread2 = new Thread(syncTest1, "thread2");
        thread1.start();
        thread2.start();
    }
}

/**
* 输出结果
thread1:0
thread1:1
thread1:2
thread1:3
thread1:4
thread2:5
thread2:6
thread2:7
thread2:8
thread2:9
*/
```

```java
public class SyncTest implements Runnable{
    //共享资源变量
    int count = 0;

    @Override
    public synchronized void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName()+":"+count++);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        SyncTest syncTest1 = new SyncTest();
        SyncTest syncTest2 = new SyncTest();
        Thread thread1 = new Thread(syncTest1,"thread1");
        Thread thread2 = new Thread(syncTest2, "thread2");
        thread1.start();
        thread2.start();
    }
}

/**
* 输出结果
thread1:0
thread2:0
thread1:1
thread2:1
thread1:2
thread2:2
thread1:3
thread2:3
thread1:4
thread2:4
*/
```

如果线程 A 需要访问实例对象 obj1 的 synchronized 方法（当前对象锁为 obj1），线程 B 需要访问实例对象 obj2 的 synchronized 方法（当前对象锁为 obj2），这是允许的，因为两个实例对象锁不相同，且两个线程操作的数据不是共享的。如果两个线程操作的是共享数据，那么线程安全就无法保证

#### 修饰静态方法

作用于当前类对象加锁，进入同步代码前要获得当前类对象的锁

```java
public class SyncTest implements Runnable {
    //共享资源变量
    static int count = 0;

    @Override
    public synchronized void run() {
        increaseCount();
    }

    private synchronized static void increaseCount() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + ":" + count++);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        SyncTest syncTest1 = new SyncTest();
        SyncTest syncTest2 = new SyncTest();
        Thread thread1 = new Thread(syncTest1, "thread1");
        Thread thread2 = new Thread(syncTest2, "thread2");
        thread1.start();
        thread2.start();
    }
}

/**
* 输出结果
thread1:0
thread1:1
thread1:2
thread1:3
thread1:4
thread2:5
thread2:6
thread2:7
thread2:8
thread2:9
*/
```

1. 静态 synchronized 方法占用的锁是当前类的 class 对象
2. 非静态 synchronized 方法占用的锁是当前实例对象锁

#### 修饰代码块

指定加锁对象，对给定对象加锁，进入同步代码块前要获得给定对象的锁

```java
public class SyncTest implements Runnable {
    //共享资源变量
    static int count = 0;
    private byte[] mBytes = new byte[0];

    @Override
    public synchronized void run() {
        increaseCount();
    }

    private void increaseCount() {
        synchronized (this) {
            for (int i = 0; i < 5; i++) {
                System.out.println(Thread.currentThread().getName() + ":" + count++);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        SyncTest syncTest1 = new SyncTest();
        SyncTest syncTest2 = new SyncTest();
        Thread thread1 = new Thread(syncTest1, "thread1");
        Thread thread2 = new Thread(syncTest2, "thread2");
        thread1.start();
        thread2.start();
    }
}

/**
* 输出结果
thread1:0
thread2:0
thread1:1
thread2:2
thread2:4
thread1:3
thread2:5
thread1:5
thread2:7
thread1:6
*/
```

指定锁为 this，指的是调用这个方法的实例对象，两个对象实例不同，所以有两个锁，想要保证线程同步的话，那么 synchronized 后面的括号应改为 xxx.class

#### 修饰多个普通方法

一个对象里面如果有多个 synchronized 非静态方法，某一时刻内，只要一个线程去调用了其中的一个用 synchronized 修饰的方法，其它的线程只能等待

```java
public class Demo01 {
    public static void main(String[] args) {
        Demo01 demo01 = new Demo01();
        new Thread(()->{
            demo01.test1();
        },"AA").start();

        new Thread(()->{
            demo01.test2();
        },"BB").start();
    }

    public synchronized void test1(){
        try {
            Thread.sleep(1000);
            for (int i = 0; i < 10; i++) {
                System.out.println(Thread.currentThread().getName()+"::循环第"+i+"次");
            }
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    public synchronized void test2(){
        System.out.println(Thread.currentThread().getName()+"::只循环一次的方法");
    }
}
```

#### 父子继承

synchronized 关键字不能被继承，如果父类中某方法使用了 synchronized 关键字，子类又正巧覆盖了，此时，子类默认情况下是不同步的，必须显式地在子类的方法上加上才可。如果在子类中调用父类中的方法，虽然子类并没有同步方法，但子类调用父类的同步方法，子类方法也相当同步了

```java
public class Son extends Father{
}

public class SonDemo extends Father{
    @Override
    public void say() {
        System.out.println("AA--"+Thread.currentThread().getName());
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("BB--"+Thread.currentThread().getName());
    }

//    @Override
//    public synchronized void say() {
//        System.out.println("AA--"+Thread.currentThread().getName());
//        try {
//            Thread.sleep(10);
//        } catch (InterruptedException e) {
//            e.printStackTrace();
//        }
//        System.out.println("BB--"+Thread.currentThread().getName());
//    }
}

public class Father implements Runnable{
    @Override
    public void run() {
        say();
    }

    public synchronized void say(){
        System.out.println("AA--"+Thread.currentThread().getName());
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("BB--"+Thread.currentThread().getName());
    }

    public static void main(String[] args) {
        Father father = new Father();
        for (int i = 0; i < 10; i++) {
            new Thread(father,String.valueOf(i)).start();
        }
/*结果为：
AA--0
BB--0
AA--7
BB--7
AA--6
BB--6
AA--3
BB--3
AA--9
BB--9
AA--2
BB--2
AA--8
BB--8
AA--5
BB--5
AA--4
BB--4
AA--1
BB--1
*/ 
        Son son = new Son();
        for (int i = 0; i < 10; i++) {
            new Thread(son,String.valueOf(i)).start();
        }
/*结果为：
AA--0
BB--0
AA--9
BB--9
AA--8
BB--8
AA--6
BB--6
AA--7
BB--7
AA--5
BB--5
AA--3
BB--3
AA--4
BB--4
AA--2
BB--2
AA--1
BB--1
*/
        SonDemo sonDemo = new SonDemo();
        for (int i = 0; i < 10; i++) {
            new Thread(sonDemo,String.valueOf(i)).start();
        }
    }
}
/*结果为：
AA--1
AA--4
AA--3
AA--2
AA--0
AA--7
AA--6
AA--9
AA--5
AA--8
BB--7
BB--3
BB--8
BB--2
BB--5
BB--9
BB--6
BB--1
BB--4
BB--0
*/
```

synchronized 的同步效率非常低，因为如果某一块代码被 synchronized 修饰了，当某一个线程进入了 synchronized 修饰的代码块，那么其他线程只能一直等待，等待获取锁的线程释放锁，才能再次进入同步代码块

释放锁的情况只有两种：

1. 正常执行完，然后释放锁
2. 执行过程中，发生异常，JVM 让线程自动释放锁

**同步方法和同步代码块的区别**

1. 同步是高开销的操作，因此尽量减少同步的内容，通常没有必要同步整个方法，同步代码块即可
2. 同步方法默认用 this 或者当前类 class 对象作为锁；同步代码块可以选择以什么来加锁，比同步方法要更颗粒化

#### wait 和 notify

```java
public class Demo05 {
    private int flag=1;
    private int count=1;

    public synchronized void printNum(){
        if (flag!=1){
            try {
                wait();
            }catch (InterruptedException e){
                e.printStackTrace();
            }
        }
        System.out.println(count);
        flag=2;
        notify();
    }

    public synchronized void printChar(){
        if (flag!=2){
            try {
                wait();
            }catch (InterruptedException e){
                e.printStackTrace();
            }
        }
        System.out.println((char) (count-1+'A'));
        count++;
        flag=1;
        notify();
    }

    public static void main(String[] args) {
        Demo05 demo05 = new Demo05();
        new Thread(()->{
            for (int i = 0; i < 26; i++) {
                demo05.printNum();
            }
        }).start();
        
        new Thread(()->{
            for (int i = 0; i < 26; i++) {
                demo05.printChar();
            }
        }).start();
    }
}
```

### 底层原理

#### 执行互斥代码过程

1. 获得同步锁
2. 清空工作内存
3. 从主内存拷贝对象副本到工作内存
4. 执行代码（计算或输出等）
5. 刷新主内存数据
6. 释放同步锁

#### synchronized 修饰同步语句块

1. monitorenter（同步代码块的开始位置）

每个对象都是一个监视器锁（monitor），当 monitor 被占用时就会处于锁定状态，线程执行 monitorenter 指令时尝试获取 monitor 的所有权，过程如下：

+ 如果 monitor 的进入数为 0，则该线程进入 monitor，然后将进入数设置为 1，该线程即为 monitor 的所有者
+ 如果线程已经占有该 monitor，只是重新进入，则进入 monitor 的进入数加 1
+ 如果其他线程已经占用了 monitor，则该线程进入阻塞状态，直到 monitor 的进入为 0，再重新尝试获取 monitor 的所有权

<img src="JUC（3-synchronized和volatile）/1.png" style="zoom:67%;" />

2. monitorexit（同步代码块的结束位置）

执行 monitorexit 的线程必须是 objectref 所对应的 monitor 持有者。指令执行时，monitor 的进入数减 1，如果减 1 后进入数为 0，那线程退出 monitor，不再是这个 monitor 的所有者。其他被这个 monitor 阻塞的线程可以尝试去获取这个 monitor 的所有权

monitorexit 指令出现了两次，第 1 次为同步正常退出释放锁，第 2 次为发生异常退出释放锁

<img src="JUC（3-synchronized和volatile）/2.png" style="zoom:67%;" />

#### synchronized 修饰方法

synchronized 修饰的方法并没有 monitorenter 指令和 monitorexit 指令，而是 ACC_SYNCHRONIZED 标识，该标识指明了该方法是一个同步方法，JVM 通过该 ACC_SYNCHRONIZED 访问标志来辨别一个方法是否声明为同步方法，从而执行相应的同步调用

### JVM 对 synchronized 的优化

#### 锁膨胀

膨胀方向为：无锁-> 偏向锁-> 轻量级锁-> 重量级锁

锁竞争：如果多个线程轮流获取一个锁，但是每次获取锁的时候都很顺利，没有发生阻塞，那么就不存在锁竞争，只有当某线程尝试获取锁的时候，发现该锁已经被占用，只能等待其释放，这才发生了锁竞争

![](JUC（3-synchronized和volatile）/3.png)

1. 无锁：指没有对资源进行锁定，所有的线程都能访问并修改同一个资源，但同时只有一个线程能修改成功。无锁的特点是修改操作会在循环内进行，线程会不断地尝试修改共享资源。如果没有冲突就修改成功并退出，否则就继续循环尝试；如果有多个线程修改同一个值，必定有一个线程能修改成功，而其他修改失败的线程会不断重试直到修改成功
2. 偏向锁：指当一段同步代码一直被同一个线程所访问时，即不存在多个线程的竞争时，那么该线程在后续访问时便会自动获得锁，从而降低获取锁带来的消耗，即提高性能。如果一个线程获得了锁，那么锁就进入偏向模式，此时 Mark Word 的结构也就变为偏向锁结构，当该线程再次请求锁时，无需再做任何同步操作，即获取锁的过程只需要检查 Mark Word 的锁标记位为偏向锁 以及 当前线程 ID 等于 Mark Work 的 ThreadID 即可，这样就省去了大量有关锁申请的操作
3. 轻量级锁：指当锁是偏向锁的时候，却被另外的线程所访问，此时偏向锁就会升级为轻量级锁，其他线程会通过自旋的形式尝试获取锁，线程不会阻塞，从而提高性能。只有当线程尝试获取锁的时候，发现该锁已经被占用，只能等待其释放，这才发生了锁竞争。在轻量级锁状态下继续锁竞争，没有抢到锁的线程将自旋，即不停地循环判断锁是否能够被成功获取。
4. 重量级锁：指当有一个线程获取锁之后，其余所有等待获取该锁的线程都会处于阻塞状态。如果锁竞争情况严重，某个达到最大自旋次数的线程，会将轻量级锁升级为重量级锁（依然是 CAS 修改锁标志位，但不修改持有锁的线程 ID），当后续线程尝试获取锁时，发现被占用的锁是重量级锁，则直接将自己挂起（而不是忙等），等待将来被唤醒

#### 锁清除

在 JIT 编译时，对运行上下文进行扫描，去除不可能存在竞争的锁。例如：下面的 object 锁是私有变量，不存在竞争关系

```java
public class Test4{
    public void method1(){
        Object object=new Object();
        synchronized(object){
            // 执行同步代码
            System.out.println("hello world");
        }
    }

    // 优化后的方法，跟上面method1执行效率一样
    public void method2(){
        Object object=new Object();
        System.out.println("hello world");
    }
}
```

#### 锁粗化

通过扩大锁的范围，避免反复加锁和释放锁

```java
public void method3(){
    for(int i=0;i<10000;++i){
        synchronized(Test4.class){
            System.out.println("hello world");
        }
    }
}

// 锁粗化，跟上面一样
public void method4(){
    synchronized(Test4.class){
        for(int i=0;i<10000;++i){
            System.out.println("hello world");
        }
    }
}
```

#### 锁升级

### Java 对象结构

Java 中对象结构主要包括对象头、实例数据、对其填充三部分

1. 对象头

Java 中的对象头进一步分为 Mark Word、类型指针和数组长度三部分

Mark Word 主要用来存储对象自身的运行时数据，例如：对象的 hash 码、GC 的分代年龄、锁的状态标志、对象的线程锁状态信息、偏向线程 ID、获得的偏向锁的时间戳等

![](JUC（3-synchronized和volatile）/4.png)

2. 实例数据

主要存储的是对象的成员变量信息

3. 对齐填充

在 HotSpot JVM 中，对象的起始地址必须是 8 的整数倍。由于对象头占用的存储空间已经是 8 的整数倍，所以如果当前对象的实例变量占用的存储空间不是 8 的整数倍，则需要使用填充数据来保证 8 字节的对齐

## volatile

### 多线程问题

在 JDK1.2 之前，Java 的内存模型实现总是从主存（即共享内存）读取变量，而在当前的 Java 内存模型下，线程可以把变量保存本地内存（比如机器的寄存器）中，而不是直接在主存中进行读写。这就可能造成一个线程在主存中修改了一个变量的值，而另一个线程还继续使用它在寄存器中的变量值的拷贝，造成数据的不一致

1. 主内存：所有线程创建的实例对象都存放在主内存中，不管该实例对象是成员变量还是方法中的本地变量（也称局部变量）
2. 本地内存：每个线程都有一个私有的本地内存来存储共享变量的副本，并且每个线程只能访问自己的本地内存，无法访问其他线程的本地内存。

<img src="JUC（3-synchronized和volatile）/5.png" style="zoom: 80%;" />

要解决这个问题，就需要把变量声明为 volatile，这就指示 JVM，这个变量是共享且不稳定的，每次使用它都到主存中进行读取

<img src="JUC（3-synchronized和volatile）/6.png" style="zoom:80%;" />

### 内存屏障（内存栅栏）

是一类同步屏障指令，是 CPU 或编译器在对内存随机访问的操作中的一个同步点，使得此点之前的所有读写操作都执行后才可以执行此点之后的操作，避免代码重排序。内存屏障其实是一种 JVM 指令，Java 内存模型的重排规则会要求 Java 编译器在生成 JVM 指令时插入特定的内存屏障指令，通过这些内存屏障指令，volatile 实现了 Java 内存模型中的可见性和有序性，但无法保证原子性

1. 内存屏障之前的所有写操作都要回写到主内存
2. 内存屏障之后的所有读操作都能获得内存屏障之前的所有写操作的最新结果（实现了可见性）

| 内存屏障       | 说明                                                  |
| -------------- | ----------------------------------------------------- |
| StoreStore 屏障 | 禁止上面的普通写和下面的 volatile 写重排序              |
| StoreLoad 屏障  | 防止上面的 volatile 写与下面可能有的 volatile 读/写重排序 |
| LoadLoad 屏障   | 禁止下面所有的普通读操作和上面的 volatile 读重排序      |
| LoadStore 屏障  | 禁止下面所有的普通写操作和上面的 volatile 读重排序      |

### 特点

1. 可见性

在多线程环境下，某个共享变量如果被其中一个线程给修改了，其他线程能够立即知道这个共享变量已经被修改了，当其他线程要读取这个变量的时候，最终会去内存中读取，而不是从自己的工作空间中读取

```java
public class Demo04 implements Runnable{
    //用来修改flag值
    public boolean flag=false;

    @Override
    public void run() {
        try {
            Thread.sleep(200);
        }catch (InterruptedException e){
            e.printStackTrace();
        }
        flag=true;
        System.out.println("ThreadDemo线程修改后的值：flag="+flag);
    }
}

public class Demo05 {
    public static void main(String[] args) {
        //用来读取flag
        Demo04 demo04 = new Demo04();
        new Thread(demo04).start();
        while (true){
            if (demo04.flag){
                System.out.println("主线程读取到的flag="+demo04.flag);
                break;
            }
        }
    }
}
```

![](JUC（3-synchronized和volatile）/7.png)

程序进入了死循环，说明主线程读取到的 flag 还是 false，但是另一个线程已经将 flag 改为 true 了，这就是内存可见性问题（当多个线程操作共享数据时，彼此不可见）

解决方法：可以加锁，就可以让 while 循环每次都从主存中去读取数据。但是一旦加了锁，每次只能有一个线程访问，当一个线程持有锁时，其他的就会阻塞，效率非常低

```java
while (true){
    synchronized (threadDemo){
        if (threadDemo.isFlag()){
            System.out.println("主线程读取到的flag = " + threadDemo.isFlag());
            break;
        }
    }
}
```

2. 有序性

例如：`int a = 1; int b = 2;` 对于这两句代码，你会发现无论是先执行 a = 1 还是执行 b = 2，都不会对 a, b 最终的值造成影响。所以虚拟机在编译的时候，是有可能把他们进行重排序的。假如执行 `int a = 1` 这句代码需要 100ms 的时间，但执行 `int b = 2` 这句代码需要 1ms 的时间，并且先执行哪句代码并不会对 a, b 最终的值造成影响。那当然是先执行 `int b = 2` 这句代码了。所以，虚拟机在进行代码编译优化的时候，对于那些改变顺序之后不会对最终变量的值造成影响的代码，是有可能将他们进行重排序的。

注意：重排序是有可能导致线程安全问题的

```java
public class NoVisibility{
    private static boolean ready;
    private static int number;
    
    private static class Reader extends Thread{
        public void run(){
            while(!ready){
                Thread.yield();
            }
            System.out.println(number);
        }
    }
    
    public static void main(String[] args){
        new Reader().start();
        number = 42;
        ready = true;
    }
}
```

 如果没有重排序的话，打印的确实会是 42，但如果 number = 42 和 ready = true 被进行了重排序，颠倒了顺序，那么就有可能打印出 0 了，而不是 42。（因为 number 的初始值会是 0）

 解决方法：如果一个变量被声明 volatile 的话，那么这个变量不会被进行重排序，也就是说，虚拟机会保证这个变量之前的代码一定会比它先执行，而之后的代码一定会比它慢执行 

3.  非原子性

volatile 无法保证线程安全，Java 中的运算并非是原子操作 

```java
public class Test{
    public static volatile int t = 0;

    public static void main(String[] args){
        Thread[] threads = new Thread[10];
        for(int i = 0; i < 10; i++){
            //每个线程对t进行1000次加1的操作
            threads[i]=new Thread(new Runnable(){
                @Override
                public void run(){
                    for(int j = 0; j < 1000; j++){
                        t = t + 1;
                    }
                }
            });
            threads[i].start();
        }

        //等待所有累加线程都结束
        while(Thread.activeCount() > 1){
            Thread.yield();
        }
        //打印t的值
        System.out.println(t);
    }
}
```

 线程 1 读取了 t 的值，假如 t = 0。之后线程 2 读取了 t 的值，此时 t = 0。然后线程 1 执行了加 1 的操作，此时 t = 1。但是这个时候，处理器还没有把 t = 1 的值写回主存中。这个时候处理器跑去执行线程 2，注意，刚才线程 2 已经读取了 t 的值，所以这个时候并不会再去读取 t 的值了，所以此时 t 的值还是 0，然后线程 2 执行了对 t 的加 1 操作，此时 t = 1 

### 保证线程安全的情况

1.  运算结果并不依赖变量的当前值，或者能够确保只有单一的线程修改变量的值 
2.  变量不需要与其他状态变量共同参与不变约束 