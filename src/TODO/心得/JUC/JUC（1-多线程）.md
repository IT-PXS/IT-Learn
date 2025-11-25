---
title: JUC（1-多线程）
series: JUC
tags:
  - JUC
categories: 
  - JUC
cover: /img/index/juc.jpg
top_img: /img/index/juc.jpg
published: true
abbrlink: 48844
date: 2025-05-01 22:38:34
description: JUC（Java Util Concurrent）提供强大的并发工具，如线程池（ThreadPoolExecutor）、锁（ReentrantLock）、原子类（AtomicInteger）等，提升多线程编程效率。它优化了线程管理，减少资源消耗，并发控制更精准，适用于高并发场景，如任务调度、异步处理，保障系统稳定性。
---

## 串行、并行和并发

1. 串行：所有任务都是按先后顺序进行，一次只能取一个任务，并执行这个任务
2. 并行：可以同时取得多个任务，并同时去执行所取得的这些任务
3. 并发：多个程序可以同时运行的一种现象

**并行和并发的区别**

1. 并行是指两个或者多个事件在同一时刻发生，而并发是指两个或多个事件在同一时间间隔发生
2. 并行是在不同实体上的多个事件，并发是在同一实体上的多个事件

## 线程和进程的区别

1. 进程和线程的定义

* 进程：是程序运行和资源分配的基本单位，一个程序至少有一个进程，一个进程至少有一个线程。进程在执行过程中拥有独立的内存单元，而多个线程共享内存资源，减少切换次数，从而效率更高
* 线程：是进程的一个实体，是 CPU 调度和分派的基本单位，是比程序更小的能独立运行的基本单位。同一进程中的多个线程之间可以并发执行

2. 资源管理的差异

- 进程：独立资源意味着每个进程有自己的代码段、数据段和堆；即使一个进程崩溃，其他进程仍然可以正常运行。
- 线程：线程共享进程的堆、方法区、全局变量等，但拥有独立的栈和程序计数器。线程共享资源会带来高效的通信，但也需要额外注意同步问题。

3. 性能对比

- 线程创建比进程快：线程复用进程资源，无需重新分配。
- 上下文切换：进程切换涉及到切换内存页、文件描述符、资源等，线程切换仅需保存和加载线程的寄存器状态。

## 线程状态及转换

![](JUC（1-多线程）/2.png)

![](JUC（1-多线程）/3.png)

```java
public enum State {
    // 新生
    NEW,
    // 运行
    RUNNABLE,
    // 阻塞
    BLOCKED,
    // 等待
    WAITING,
    // 超时等待
    TIMED_WAITING,
    // 终止
    TERMINATED;
}
```

```java
public class TestThread09 {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            System.out.println("///////");
        });

        //观察状态
        Thread.State state = thread.getState();
        System.out.println(state);

        //观察启动后
        thread.start();
        state=thread.getState();
        System.out.println(state);

        while (state!=Thread.State.TERMINATED){//线程不终止
            Thread.sleep(100);
            state=thread.getState();//更新线程状态
            System.out.println(state);
        }
    }
}
```

**运行-> 就绪**

- 线程失去处理器资源。线程不一定完整执行的，执行到一半，说不定就被别的线程抢走了。
- 调用 yield()静态方法，暂时暂停当前线程，让系统的线程调度器重新调度一次，它自己完全有可能再次运行

**其他状态 -> 就绪**

- 线程调用 start()，新建状态转化为就绪状态。
- 线程 sleep(long)时间到，等待状态转化为就绪状态。
- 阻塞式 IO 操作结果返回，线程变为就绪状态。
- 其他线程调用 join()方法，结束之后转化为就绪状态。
- 线程对象拿到对象锁之后，也会进入就绪状态。

**运行-> 等待**

- 当前线程运行过程中，其他线程调用 `join` 方法，当前线程将会进入等待状态。
- 当前线程对象调用 `wait()` 方法。
- `LockSupport.park()`：出于线程调度的目的禁用当前线程。

**等待-> 就绪**

- 等待的线程被其他线程对象唤醒，`notify()` 和 `notifyAll()`。
- `LockSupport.unpark(Thread)`，与上面 park 方法对应，给出许可证，解除等待状态。

**运行-> 超时等待**

- 调用静态方法，`Thread.sleep(long)`
- 线程对象调用 `wait(long)` 方法
- 其他线程调用指定时间的 `join(long)`。
- `LockSupport.parkNanos()`。
- `LockSupport.parkUntil()`。

**超时等待-> 就绪**

- 同样的，等待的线程被其他线程对象唤醒，`notify()` 和 `notifyAll()`。
- `LockSupport.unpark(Thread)`。

## 创建线程的方式

1. 继承 Thread 类创建线程

```java
//继承Thread类  
public class MyThread extends Thread { 
    public void run(){  
        //重写run方法 
    }
}

public class Main {  
    public static void main(String[] args){
        new MyThread().start();//创建并启动线程
    }               
}
```

2. 实现 Runnable 接口创建线程

```java
//实现Runnable接口
public class MyThread2 implements Runnable {
　　public void run(){
		//重写run方法
　　}
}

public class Main {
　　public static void main(String[] args){
　　　　//创建并启动线程
　　　　MyThread2 myThread=new MyThread2();
　　　　Thread thread=new Thread(myThread);
　　　　thread().start();
　　　　//或者    new Thread(new MyThread2()).start();
　　}
}
```

3. 通过 Callable 和 FutureTask 创建线程

```java
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception; //计算结果，如果无法计算则抛出异常。
}
```

```java
public class Demo01 implements Callable {
    int i=10;

    public static void main(String[] args) {
        FutureTask futureTask=new FutureTask(new Demo01());
        new Thread(futureTask).start();
        try {
            System.out.println(futureTask.get());
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        }
    }

    @Override
    public Object call() throws Exception {
        System.out.println("子线程:"+i--);
        return i;
    }
}
```

**线程写法（lambda 表达式）**

```java
//1.定义一个函数式接口
interface ILike{
    void like();
}

//2.实现类
class Like implements ILike{
    public void like() {
        System.out.println("I Love You!");
    }
}
```

```java
public class TestLambda01 {
    //3.静态内部类
    static class Like2 implements ILike{
        public void like() {
            System.out.println("I Love You Too!");
        }
    }

    public static void main(String[] args) {
        ILike like1 = new Like();
        like1.like();

        Like2 like2 = new Like2();
        like2.like();

        //4.局部内部类
        class Like3 implements ILike{
            public void like() {
                System.out.println("I Love You More!");
            }
        }

        Like3 like3 = new Like3();
        like3.like();

        //5.匿名内部类
        ILike iLike4 = new ILike() {
            public void like() {
                System.out.println("I Love You More Than You!");
            }
        };
        iLike4.like();

        //6.用lambda简化
        like1=()->System.out.println("I Love You More Than You Hi Hi...!");
        like1.like();
    }
}
```

**能否重复启动线程？**

只能对处于新建状态的线程调用 start()方法，否则将引发 IllegalThreadStateException 异常

## run()和 start()的区别

1. start()：启动一个线程，这时无需等待 run()方法体代码执行完毕，可以直接继续执行下面的代码，这时此线程处于就绪状态，并没有运行
2. run()：是在本线程里的，只是线程里的一个函数，如果直接调用 run()，其实就相当于调用了一个普通函数而已

![](JUC（1-多线程）/1.png)

## sleep()和 wait()的区别

1. sleep()方法指正在执行的线程主动让出 CPU（然后 CPU 就可以去执行其他任务），在 sleep 指定时间后 CPU 再回到该线程继续往下执行（注意： sleep 方法只让出了 CPU，而并不会释放同步资源锁）；wait()方法指当前线程让自己暂时退让出同步资源锁，以便其他正在等待该资源的线程得到该资源进而运行，只有调用了 notify()方法，之前调用 wait()的线程才会解除 wait 状态，可以去参与竞争同步资源锁，而并不会给它分配任务
2. sleep()方法可以在任何地方使用；而 wait()方法则只能在同步方法或同步块中使用
3. sleep()是线程类（Thread）的方法，调用会暂停此线程指定的时间，但监控依然保持，不会释放对象锁，到时间自动恢复；wait()是 Object 的方法，调用会放弃对象锁，进入等待队列，待调用 notify()/notifyAll()唤醒指定的线程或者所有线程，才会进入锁池准备获得对象锁进入运行状态
4. sleep()方法必须捕获 InterruptedException 异常；而 wait()不需要捕获异常

**为什么 wait() 方法不定义在 Thread 中？**

wait() 是让获得对象锁的线程实现等待，会自动释放当前线程占有的对象锁。每个对象（Object）都拥有对象锁，既然要释放当前线程占有的对象锁并让其进入 WAITING 状态，自然是要操作对应的对象（Object）而非当前的线程（Thread）。

**为什么 sleep() 方法定义在 Thread 中？**

因为 sleep() 是让当前线程暂停执行，不涉及到对象类，也不需要获得对象锁

## sleep()和 yield()的区别

1. yield()方法

* 让出当前线程的 CPU 执行权，但并不阻塞线程。
* 当前线程从运行状态（Running） 切换到就绪状态（Runnable），等待重新被调度。
* 不保证当前线程一定会暂停执行，也不保证其他线程会获得 CPU 执行权。

2. sleep() 方法

* 强制让当前线程进入阻塞状态（Timed Waiting），在指定时间内暂停执行。
* 线程在睡眠时间结束后重新进入就绪状态（Runnable）。
* sleep()方法一定会暂停当前线程。

## notify()和 notifyAll()的区别

1. notify()：用于唤醒一个正在等待相应对象锁的线程，使其进入就绪队列，以便在当前线程释放锁后竞争锁，进而得到 CPU 的执行
2. notifyAll()：用于唤醒所有正在等待相应对象锁的线程，使它们进入就绪队列，以便在当前线程释放锁后竞争锁，进而得到 CPU 的执行

## Runnable 和 Callable 的区别

1. Runnable 接口中的 run()方法的返回值是 void，它做的事情只是纯粹地去执行 run()方法中的代码而已；Callable 接口中的 call()方法是有返回值的，是一个泛型，和 Future、FutureTask 配合可以用来获取异步执行的结果
2. 线程类只是实现了 Runnable 或 Callable 接口，还可以继承其他类；而使用 Thread 的话，就不能再继承其他父类

## 停止、中断线程

1. 使用 JDK 提供的 stop()、destroy()方法（不推荐）
2. 使用一个标志位进行终止变量，当 flag = false，则终止线程运行

```java
public class TestStop implements Runnable{
    private boolean runThread = true;

    public void run(){
        int i=0;
        while (runThread){
            System.out.println("run..."+i++);
        }
    }
    //对外部提供方法改变标识
    public void stop(){
        this.runThread = false;
    }

    public static void main(String[] args) {
        TestStop testStop = new TestStop();
        new Thread(testStop).start();

        for (int i = 0; i < 10000; i++) {
            System.out.println("main");
            if (i==9000){
                //调用stop方法切换标志位，让线程停止
                testStop.stop();
                System.out.println("线程停止了");
            }
        }
    }
}
```

3. 使用 interrupt 中断线程

```java
public class ThreadTest07 {
    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(new Processor07());
        t1.setName("t1");
        t1.start();
        Thread.sleep(5000);
        t1.interrupt();
    }
}

class Processor07 implements Runnable {
    @Override
    public void run() {
        try {
            Thread.sleep(10000000000000L);
            System.out.println("Sleep is end");
        } catch (Exception e) {
            e.printStackTrace();
        }
        for(int i=0; i<20; i++){
            System.out.println(Thread.currentThread().getName() + "-->" + i);
        }
    }
}
```

## 线程休眠（sleep）

sleep(时间)指定当前线程阻塞的毫秒数，时间达到后线程进入就绪状态；sleep 存在 InterruptedException 异常；每一个对象都有一个锁，sleep 不会释放锁

```java
public class TestSleep {
    public static void main(String[] args) {
        //打印当前时间
        Date date = new Date(System.currentTimeMillis());

        while (true){
            try {
                Thread.sleep(1000);
                System.out.println(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date));
                date = new Date(System.currentTimeMillis());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

**sleep(0)和 sleep(1)**

sleep(0)是一个特殊的情况，它的目的并不是为了让程序真正休眠，而是为了让当前线程主动放弃时间片，让其他等待执行的任务有机会执行。这在多线程或多任务的环境中特别有用，可以提高程序的效率。

sleep(1)就是一个相对较短的休眠时间，通常是 1ms。它会在极短的 1 毫秒内进入睡眠（被放入等待队列中，进入等待状态，暂时放弃 CPU 竞争），1 毫秒后立刻又再次参与 CPU 的竞争。这种情况常用于需要在执行之间添加短暂延迟的场景，或者等待一些异步操作完成。

1. Sleep(1)导致线程释放剩余的时间片，并停止运行至少 1 毫秒，然后恢复为就绪状态。
2. Sleep(0)导致线程释放剩余的时间片，并立即进入就绪状态。

所以如果有两个同等优先级的线程一个使用 Sleep(1)，一个使用 Sleep(0)，后者将更多的抢到时间片。

## 线程礼让（yield）

礼让线程，将线程从运行状态转为就绪状态，让 CPU 重新调度（礼让不一定成功，看 CPU 心情）

```java
public class TestThread07 {

    public static void main(String[] args) {
        MyYield myYield = new MyYield();
        new Thread(myYield,"a").start();
        new Thread(myYield,"b").start();
    }
}

class MyYield implements Runnable{

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName()+"线程开始执行");
        Thread.yield();//礼让
        System.out.println(Thread.currentThread().getName()+"线程停止执行");
    }
}
```

## 线程阻塞（join）

待此线程执行完成后，再执行其他线程，此时其他线程阻塞

如何实现子线程先执行，主线程再执行？启动子线程后，立即调用该线程的 join()方法，则主线程必须等待子线程执行完成后再执行

```java
public class TestThread08 implements Runnable{
    @Override
    public void run() {
        for (int i = 0; i < 1000; i++) {
            System.out.println("线程VIP来了......."+i);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        TestThread08 testThread08 = new TestThread08();
        Thread thread = new Thread(testThread08);
        thread.start();

        for (int i = 0; i < 1000; i++) {
            if (i==200){
                thread.join();//插队
            }
            System.out.println("main......."+i);
        }
    }
}
```

## 用户线程和守护线程

1. 用户线程：指不需要内核支持而在用户程序中实现的线程，其不依赖于操作系统核心，应用进程利用线程库提供创建、同步、调度和管理线程的函数来控制用户线程
2. 守护线程：指在程序运行的时候在后台提供一种通用服务的线程，用来服务于用户线程；不需要上层逻辑介入，也可以手动创建一个守护线程（当用户线程死亡，守护线程也会随之死亡）。在 JVM 中，所有非守护线程都执行完毕后，无论有没有守护线程，虚拟机都会自动退出

```java
//守护线程
public class TestThread10 {
    public static void main(String[] args) {
        You you = new You();
        God god = new God();

        Thread thread = new Thread(god);
        thread.setDaemon(true); //默认是false，表示是用户线程，正常的线程都是用户线程
        thread.start();

        new Thread(you).start();
    }
}

class God implements Runnable{
    @Override
    public void run() {
        while (true){
            System.out.println("hi.........");
        }
    }
}

class You implements Runnable{
    @Override
    public void run() {
        for (int i = 0; i < 36500; i++) {
            System.out.println("hello........");
        }
        System.out.println("=============");
    }
}
```

## 线程优先级

线程的优先级用数字表示，范围从 1~10

1. Thread.MIN_PRIORITY = 1；
2. Thread.MAX_PRIORITY = 10；
3. Thread.NORM_PRIORITY = 5；

使用以下方式改变或获取优先级：getPriority().setPriority(int xxx)

## 怎么保证线程安全？

当多个线程同时访问一个对象时，如果不用考虑这些线程在运行时环境下的调用和交替执行，也不需要进行额外的同步，或者在调用方进行任何其他的协调操作，调用这个对象的行为都可以获得正确的结果，那么称这个对象是线程安全的

**怎么保证多线程的运行安全？**

1. 原子性：提供互斥访问，同一时刻只能有一个线程对数据进行操作（atomic、synchronized）
2. 可见性：一个线程对主内存的修改可以及时地被其他线程看到（synchronized、volatile）
3. 有序性：一个线程观察其他线程中的指令执行顺序，由于指令重排序，该观察结果一般杂乱无序（happens-before 原则）

**使用案例**

```java
public class Demo01 {
    public static void main(String[] args) {
        List<String> list=new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            new Thread(()->{
                list.add(UUID.randomUUID().toString());
                System.out.println(list);
            },"线程"+i).start();
        }
    }
}
```

会报一个 ConcurrentModificationException 的异常，中文名为：并发修改异常

### Vector

```java
public class Demo02 {
    public static void main(String[] args) {
        List<String> list=new Vector<>();
        for (int i = 0; i < 20; i++) {
            new Thread(()->{
                list.add(UUID.randomUUID().toString());
                System.out.println(list);
            },"线程"+i).start();
        }
    }
}
```

add 方法上加了 synchronized 关键字，让这个方法成为了同步方法块

```java
public synchronized boolean add(E e) {
    modCount++;
    add(e, elementData, elementCount);
    return true;
}
```

### Collections

Collections 提供了方法 synchronizedList 保证 list 是同步线程安全的，Collections 仅包含对集合进行操作或返回集合的静态方法

```java
public class Demo03 {
    public static void main(String[] args) {
        List<String> list= Collections.synchronizedList(new ArrayList<>());
        for (int i = 0; i < 20; i++) {
            new Thread(()->{
                list.add(UUID.randomUUID().toString());
                System.out.println(list);
            },"线程"+i).start();
        }
    }
}
```

```java
public void add(int index, E element) {
    synchronized (mutex) {
        list.add(index, element);
    }
}
```

### CopyOnWriteArrayList

1. CopyOnWriteArrayList 和 ArrayList 一样，是个可变数组，线程安全的，更新操作开销大（add()、set()、remove()等），因为要复制整个数组
2. 独占锁效率低，采用读写分离思想，写线程获取到锁，其他写线程阻塞

```java
public class Demo04 {
    public static void main(String[] args) {
        List<String> list=new CopyOnWriteArrayList<>();
        for (int i = 0; i < 20; i++) {
            new Thread(()->{
                list.add(UUID.randomUUID().toString());
                System.out.println(list);
            },"线程"+i).start();
        }
    }
}
```

思想：当要添加一个元素的时候，不直接往当前容器中添加，而是应该先将当前容器复制一份，然后在新的容器中进行添加操作，等到添加完成后，再让原容器的引用指向新的容器

问题：如果写线程还没来得及写进内存，那么其他的线程就会读到了脏数据

CopyOnWriteArrayList 在涉及到更新操作时，都会新建数组，所以 CopyOnWriteArrayList 效率都会很低，但是如果只是进行遍历查找的话，效率还是比较高的

```java
public boolean add(E element) {
    synchronized (lock) {
        checkForComodification();
        CopyOnWriteArrayList.this.add(offset + size, element);
        expectedArray = getArray();
        size++;
    }
    return true;
}

public void add(int index, E element) {
    synchronized (lock) {
        Object[] es = getArray();
        int len = es.length;
        if (index > len || index < 0)
            throw new IndexOutOfBoundsException(outOfBounds(index, len));
        Object[] newElements;
        int numMoved = len - index;
        if (numMoved == 0)
            newElements = Arrays.copyOf(es, len + 1);
        else {
            newElements = new Object[len + 1];
            System.arraycopy(es, 0, newElements, 0, index);
            System.arraycopy(es, index, newElements, index + 1, numMoved);
        }
        newElements[index] = element;
        setArray(newElements);
    }
}
```

```java
public class Demo07 implements Runnable{
//    private static List<String> list= Collections.synchronizedList(new ArrayList<>());
//    private static List<String> list= new Vector<>();
    
    //上面两种操作会报错
    private static List<String> list=new CopyOnWriteArrayList<>();
    static {
        list.add("aaa");
        list.add("bbb");
        list.add("ccc");
    }

    @Override
    public void run() {
        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()){
            System.out.println(iterator.next());//读
            list.add("ddd");//写
        }
    }

    public static void main(String[] args) {
        Demo07 demo07 = new Demo07();
        for (int i = 0; i < 10; i++) {
            new Thread(demo07).start();
        }
    }
}
```

### volatile 和 synchronized

1. 通过 volatile 数组来保存数据。一个线程读取 volatile 数组时，总能看到其他线程对该 volatile 变量最后的写入，保证读取到的数据总是最新的
2. 通过互斥锁来保护数据。在更新操作时，都会率先去获取互斥锁，在修改完毕之后，先将数据更新到 volatile 数组中，然后再释放互斥锁，这样就能保证数据的安全

## 进程间通信的方式

1. 管道（Pipe）：提供单向或双向通信，适用于父子进程间的数据传输。
2. 消息队列（Message Queue）：允许进程通过消息传递来通信，具有队列特性，可以实现异步通信。
3. 共享内存（Shared Memory）：通过共享一块内存区域实现数据共享，效率高，但需要同步机制防止并发问题。
4. 信号（Signal）：用于进程间发送简单的通知或控制信号，轻量级但功能有限。
5. 套接字（Socket）：支持网络通信，也可用于同一主机上的进程通信，提供可靠的全双工通信。
6. 文件（File）：进程通过读写共享的文件交换数据，简单但速度较慢。

## Java 线程同步和通信

线程同步：指多线程通过特定的东西（如互斥量）来控制线程之间的执行顺序，即线程之间通过同步建立起执行顺序的关系

### 线程同步的方法

1. 使用 synchronized 关键字
2. wait 和 notify
3. 使用特殊域变量 volatile 实现线程同步
4. 使用可重入锁（ReentrantLock）实现线程同步
5. 使用阻塞队列实现线程同步
6. 使用信号量 Semaphore

### 多线程之间的通信方法

1. wait()、notify()、notifyAll()
2. await()、signal()、signalAll()
3. BlockingQueue