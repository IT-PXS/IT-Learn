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

## CAS 和 synchronized 

使用场景：

1. CAS 适用于写比较少的情况下（多读场景，冲突一般较少），CAS 基于硬件实现，不需要切换线程，操作自旋几率较少
2. synchronized 适用于写比较多的情况下（多写场景，冲突一般较多），对于资源竞争严重的情况，CAS 自旋的概率会比较大，从而浪费更多的 CPU 资源

## synchronized 和 Lock 

区别：

1. Lock 是一个接口；synchronized 是 Java 的关键字，当它用来修饰一个方法或者一个代码块的时候，能够保证在同一时刻最多只有一个线程执行该段代码
2. Lock 发生异常时，如果没有主动通过 unLock()去释放锁，则很可能造成死锁现象，因此使用 Lock 时需要在 finally 块中释放锁；synchronized 在发生异常时，会自动释放线程占有的锁，因此不会导致死锁现象发生
3. Lock 可以让等待锁的线程响应中断；而 synchronized 却不行，使用 synchronized 时，等待的线程会一直等待下去，不能够响应中断；
4. Lock 可以通过 tryLock()知道有没有成功获取锁；而 synchronized 却无法办到
5. Lock 有多个锁获取的方式，可以尝试获得锁，线程可以不用一直等待；在 synchronized 中，A 线程获得锁，B 线程等待，如果 A 线程阻塞，B 线程会一直等待

## synchronized 和 volatile 

区别：

1. volatile 本质是在告诉 JVM 当前变量在寄存器（工作内存）中的值是不确定的，需要从主存中读取；synchronized 则是锁定当前变量，只有当前线程可以访问该变量，其他线程被阻塞住
2. volatile 仅能使用在变量级别；synchronized 则可以使用在变量、方法和类级别的
3. volatile 仅能实现变量的修改可见性，不能保证原子性；而 synchronized 则可以保证变量的修改可见性和原子性
4. volatile 不会造成线程的阻塞；synchronized 可能会造成线程的阻塞
5. volatile 标记的变量不会被编译器优化；synchronized 标记的变量可以被编译器优化

## synchronized 和 ReentrantLock 

区别：

1. synchronized 是和 for、while 一样的关键字，ReentrantLock 是类，这是二者的本质区别。既然 ReentrantLock 是类，那么它就提供了比 synchronized 更多更灵活的特性：等待可中断、可实现公平锁、可实现选择性通知（锁可以绑定多个条件），性能已不是选择标准
2. synchronized 依赖于 JVM，而 ReentrantLock 依赖于 API。synchronized 依赖于 JVM 实现的，但是这些优化都是在虚拟机层面实现的，并没有直接暴露给我们。而 ReentrantLock 是 JDK 层面实现的（需要 lock()和 unlock()方法配合 try/finally 语句块来完成）
3. synchronized 是非公平的；ReentrantLcok 默认是非公平的，但是可以通过修改参数来实现公平锁

```java
// 可重入降低了编程复杂性
public class WhatReentrant {
	public static void main(String[] args) {
		new Thread(new Runnable() {
			@Override
			public void run() {
				synchronized (this) {
					System.out.println("第1次获取锁，这个锁是：" + this);
					int index = 1;
					while (true) {
						synchronized (this) {
							System.out.println("第" + (++index) + "次获取锁，这个锁是：" + this);
						}
						if (index == 10) {
							break;
						}
					}
				}
			}
		}).start();
	}
}
```

```java
// 演示可重入锁是什么意思
public class WhatReentrant2 {
	public static void main(String[] args) {
		ReentrantLock lock = new ReentrantLock();
		
		new Thread(new Runnable() {
			@Override
			public void run() {
				try {
					lock.lock();
					System.out.println("第1次获取锁，这个锁是：" + lock);
					int index = 1;
					while (true) {
						try {
							lock.lock();
							System.out.println("第" + (++index) + "次获取锁，这个锁是：" + lock);
							try {
								Thread.sleep(new Random().nextInt(200));
							} catch (InterruptedException e) {
								e.printStackTrace();
							}
							if (index == 10) {
								break;
							}
						} finally {
							lock.unlock();
						}
					}
				} finally {
					lock.unlock();
				}
			}
		}).start();
	}
}
```

## 如何减少上下文切换？

1. 无锁并发编程：多线程竞争锁时，会引起上下文切换，所以多线程处理数据时，可以用一些办法来避免使用锁，如将数据的 ID 按照 hash 算法取模分段，不同的线程处理不同段的数据
2. CAS 算法：Java 的 Atomic 包使用 CAS 算法来更新数据，而不需要加锁
3. 使用最少线程：避免创建不需要的线程，比如任务很少，但是创建了很多线程来处理，这样会造成大量线程都处于等待状态
4. 协程：在单线程里实现多任务的调度，并在单线程里维持多个任务间的切换

## Future 和 CompletableFuture

**CompletableFuture 和 Future 的区别**

1. Future 在执行结束后没法回调，调用 get 方法会被阻塞；CompletableFuture 调用 get 方法获取结果也会被阻塞，但是 CompletableFuture 可以回调，可不通过 get 方法获取结果
2. Future 模式执行批量任务，在完成任务后要想执行其他任务得通过 get 方法获取结果，在依次遍历 Future 列表时，各个 get 方法依赖于 Future 列表顺序
3. 通过实现 CompletionStage 接口，CompletableFuture 对象可以直接通过 thenAccept、thenApply、thenCompose 等方式将前面异步处理的结果交给另外一个异步事件处理线程来处理

### Future

Future 接口提供方法来检测任务是否被执行完，等待任务执行完获得结果，也可以设置任务执行的超时时间。这个设置超时的方法就是实现 Java 程序执行超时的关键

```java
public interface Future<V> {
    //尝试取消此任务的执行。
    boolean cancel(boolean mayInterruptIfRunning); 
	//如果此任务在正常完成之前被取消，则返回 true 
    boolean isCancelled();
	//如果此任务完成，则返回 true 。 完成可能是由于正常终止、异常或取消——在所有这些情况下，此方法将返回 true 
    boolean isDone(); 
	//获得任务计算结果
    V get() throws InterruptedException, ExecutionException; 
	//可等待多少时间去获得任务计算结果
    V get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException;
}
```

```java
ExecutorService executorService = Executors.newSingleThreadExecutor();

/**
 * 往线程池中提交一个 Callable，立刻返回 Future 对象，但是该 Future 对象里面的返回值目前还是 null
 * 只有当你调用 get 方法时，才会阻塞地获取该任务真实的返回值
 */
Future<Object> objectFuture = executorService.submit(new Callable<Object>() {
    @Override
    public Object call() throws Exception {
        System.out.println(Thread.currentThread().getName() + "========>正在执行！");
        Thread.sleep(2000); //执行耗时操作
        return "SUCCESS";
    }
});

Object result = objectFuture.get();
System.out.println(result);
executorService.shutdownNow();
```

**FutureTask**

此类提供 Future 的基本实现，具有启动和取消计算，查询以查看计算是否完成以及检索计算结果的方法。计算完成后才能检索结果，如果计算尚未完成，get 方法将阻塞。一旦计算完成，就不能重新开始或取消计算（除非使用 runAndReset 调用计算）

1. 未启动状态：还未执行 run()方法
2. 已启动状态：已经在执行 run()方法
3. 完成状态：已经执行完 run()方法，或者被取消了，或者方法中发生异常而导致中断结束

**应用场景**

1. 在主线执行比较耗时的操作时，但同时又不能去阻塞主线程时，就可以将这样的任务交给 FutureTask 对象在后台完成，然后等之后主线程需要的时候，就可以直接 get()来获得返回数据或者通过 isDone()来获得任务的状态
2. 一般 FutureTask 多应用于耗时的计算，这样主线程就可以把一个耗时的任务交给 FutureTask，然后等到完成自己的任务后，再去获取计算结果

注意：

1. 仅在计算完成时才能检索结果，如果计算尚未完成，则阻塞 get 方法
2. 一旦计算完成，就不能再重新开始或取消计算
3. get 方法的获取结果只有在计算完成时获取，否则会一直阻塞直到任务转入完成状态，然后会返回结果或者抛出异常。因为只会计算一次，因此通常 get 方法放到最后

### CompletableFuture

**使用**

1. get 方法获取结果

```java
public class CompletableFutureUseDemo {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        CompletableFuture<Object> objectCompletableFuture = CompletableFuture.supplyAsync(()->{
            System.out.println(Thread.currentThread().getName()+"----副线程come in");
            int result = ThreadLocalRandom.current().nextInt(10);//产生一个随机数
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("1秒钟后出结果"+result);
            return result;
        });

        System.out.println(Thread.currentThread().getName()+"线程先去忙其他任务");
        System.out.println(objectCompletableFuture.get());
    }
}
//main 线程先去忙其他任务
//ForkJoinPool.commonPool-worker-9----副线程 come in
//1 秒钟后出结果 6
//6
```

2. whenComplete 减少阻塞和轮询

```java
public class CompletableFutureUseDemo {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        CompletableFuture.supplyAsync(()->{
            System.out.println(Thread.currentThread().getName()+"--------副线程come in");
            int result = ThreadLocalRandom.current().nextInt(10);//产生随机数
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return result;
        }).whenComplete((v,e) -> {//没有异常, v 是值，e 是异常
            if(e == null){
                System.out.println("------------------计算完成，更新系统updataValue"+v);
            }
        }).exceptionally(e->{//有异常的情况
            e.printStackTrace();
            System.out.println("异常情况"+e.getCause()+"\t"+e.getMessage());
            return null;
        });

        //线程不要立刻结束，否则 CompletableFuture 默认使用的线程池会立刻关闭：暂停 3 秒钟线程
        System.out.println(Thread.currentThread().getName()+"线程先去忙其他任务");
        try {
            TimeUnit.SECONDS.sleep(3);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
//ForkJoinPool.commonPool-worker-9--------副线程 come in（这里用的是默认的 ForkJoinPool）
//main 线程先去忙其他任务
//------------------计算完成，更新系统updataValue3
```

3. 自定义线程池

```java
public class CompletableFutureUseDemo {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        ExecutorService threadPool = Executors.newFixedThreadPool(3);
        CompletableFuture.supplyAsync(()->{
            System.out.println(Thread.currentThread().getName()+"--------副线程come in");
            int result = ThreadLocalRandom.current().nextInt(10);//产生随机数
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return result;
        },threadPool).whenComplete((v,e) -> {//没有异常, v 是值，e 是异常
            if(e == null){
                System.out.println("------------------计算完成，更新系统updataValue"+v);
            }
        }).exceptionally(e->{//有异常的情况
            e.printStackTrace();
            System.out.println("异常情况"+e.getCause()+"\t"+e.getMessage());
            return null;
        });

        //线程不要立刻结束，否则 CompletableFuture 默认使用的线程池会立刻关闭：暂停 3 秒钟线程
        System.out.println(Thread.currentThread().getName()+"线程先去忙其他任务");
        try {
            TimeUnit.SECONDS.sleep(3);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
//pool-1-thread-1--------副线程 come in
//main 线程先去忙其他任务
//------------------计算完成，更新系统updataValue6
```

