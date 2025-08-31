---
title: 异步多线程CompletionService
tag: 工作技巧
category: Java
description: CompletionService 是 Java 并发工具，提供异步任务管理和结果收集能力。它按任务完成顺序返回结果，避免遍历 Future 阻塞等待，提升并发任务效率。适用于批量查询、爬虫、多数据源检索等场景，常用实现为 ExecutorCompletionService，基于线程池和阻塞队列优化任务执行和结果处理。
date: 2025-01-26 22:38:34
---

## 什么是 CompletionService？

当我们使用 ExecutorService 启动多个 Callable 时，每个 Callable 返回一个 Future，而当我们执行 Future 的 get 方法获取结果时，可能拿到的 Future 并不是第一个执行完成的 Callable 的 Future，就会进行阻塞，从而不能获取到第一个完成的 Callable 结果，那么这样就造成了很严重的性能损耗问题。而 CompletionService 正是为了解决这个问题，它是 Java8 的新增接口，它的实现类是 ExecutorCompletionService。CompletionService 会根据线程池中 Task 的执行结果按执行完成的先后顺序排序，任务先完成的可优先获取到。

## 常用方法

1. 构造方法：构建 ExecutorCompletionService 对象
+ executor：关联的线程池
+ completionQueue：自定义的结果存储队列

```java
ExecutorCompletionService(Executor executor);
ExecutorCompletionService(Executor executor, BlockingQueue<Future<V>> completionQueue);
```

2. submit：提交一个 Callable 或者 Runnable 类型的任务，并返回 Future

```java
Future<V> submit(Callable<V> task);
Future<V> submit(Runnable task, V result);
```

3. take：阻塞方法，从结果队列中获取并移除一个已经执行完成的任务的结果，如果没有就阻塞，直到任务完成返回结果

```java
Future<V> take() throws InterruptedException;
```

4. poll：从结果队列中获取并移除一个已经执行完成的任务的结果，如果没有就会返回 null，该方法不会阻塞
+ timeout：最多等待多长时间
+ unit：时间单位

```java
Future<V> poll();
Future<V> poll(long timeout, TimeUnit unit);
```

## 使用案例

```java
public class CompletionServiceExample {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExecutorService executorService = Executors.newFixedThreadPool(2);

        List<Callable<Integer>> callables = Arrays.asList(
                    ()->{
                        mySleep(20);
                        System.out.println("=============20 end==============");
                        return 20;
                    },
                    ()->{
                        mySleep(10);
                        System.out.println("=============10 end==============");
                        return 10;
                    }
                );
        List<Future<Integer>> futures = new ArrayList<>();
        //提交任务, 并将 future 添加到 list 集合中
        futures.add(executorService.submit(callables.get(0)));
        futures.add(executorService.submit(callables.get(1)));
        //遍历 Future, 因为不知道哪个任务先完成, 所以这边模拟第一个拿到的就是执行时间最长的任务, 那么执行时间较短的任务就必须等待执行时间长的任务执行完
        for (Future future:futures) {
            System.out.println("结果: "+future.get());
        }
        System.out.println("============main end=============");
    }
    
    private static void mySleep(int seconds){
        try {
            TimeUnit.SECONDS.sleep(seconds);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

```java
public class CompletionServiceExample {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExecutorService executorService = Executors.newFixedThreadPool(2);

        List<Callable<Integer>> callables = Arrays.asList(
                    ()->{
                        mySleep(20);
                        System.out.println("=============20 end==============");
                        return 20;
                    },
                    ()->{
                        mySleep(10);
                        System.out.println("=============10 end==============");
                        return 10;
                    }
                );
        //构建 ExecutorCompletionService, 与线程池关联
        CompletionService completionService = new ExecutorCompletionService(executorService);
        //提交 Callable 任务
        completionService.submit(callables.get(0));
        completionService.submit(callables.get(1));

        //获取 future 结果, 不会阻塞
        Future<Integer> pollFuture = completionService.poll();
        //这里因为没有执行完成的 Callable, 所以返回 null
        System.out.println(pollFuture);
        //获取 future 结果, 最多等待 3 秒, 不会阻塞
        Future<Integer> pollTimeOutFuture = completionService.poll(3,TimeUnit.SECONDS);
        //这里因为没有执行完成的 Callable, 所以返回 null
        System.out.println(pollTimeOutFuture);
        //通过 take 获取 Future 结果, 此方法会阻塞
        for(int i=0;i<callables.size();i++){
            System.out.println(completionService.take().get());
        }
        System.out.println("============main end=============");
    }
    
    private static void mySleep(int seconds){
        try {
            TimeUnit.SECONDS.sleep(seconds);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

## CompletionService 和 ExecutorService

| 特性             | CompletionService                           | ExecutorService                  |
| ---------------- | ------------------------------------------- | -------------------------------- |
| 任务管理方式     | 提供任务完成队列，任务完成后即可获取        | 需要遍历 Future 逐个获取任务结果 |
| 结果获取顺序     | 按完成顺序返回任务结果                      | 按提交顺序返回 Future 需 get()   |
| 是否自动管理任务 | 是，take()直接返回已完成任务                | 否，需手动调用 future.get()      |
| 使用场景         | 适用于并发批量任务，如 Web 爬虫、批量查询等 | 适用于简单的并行任务             |
