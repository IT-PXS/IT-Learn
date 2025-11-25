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

## 基本思想

把一个规模大的问题划分为规模较小的子问题，然后分而治之，最后合并子问题的解得到原问题的解

## 运行流程

![](JUC（9-ForkJoin）/1.png)

```java
if(任务很小）{
    直接计算得到结果
}else{
    分拆成N个子任务
    调用子任务的fork()进行计算
    调用子任务的join()合并计算结果
}
```

## ForkJoin 和 ThreadPool

1. 在 Java 中，ForkJoin 框架与 ThreadPool 共存，并不是要替换 ThreadPool，在 Java8 中引入的并行流计算，内部就是采用的 ForkJoinPool 实现的
2. ForkJoin 和 ThreadPoolExecutor 一样，也实现了 Executor 和 ExecutorService 接口，它使用了一个无限队列来保存需要执行的任务，而线程的数量则是通过构造函数传入，如果没有向构造函数中传入指定的线程数量，那么当前计算机可用的 CPU 数量会被设置为线程数量作为默认值
3. 当使用 ThreadPoolExecutor 时，使用分治法会存在问题，因为 ThreadPoolExecutor 中的线程无法向任务队列中再添加一个任务并在等待该任务完成之后再继续执行；而 ForkJoinPool 能够让其中的线程创建新的任务，并挂起当前的任务，此时线程就能够从队列中选择子任务执行

## 工作窃取算法

把一个大的任务分割为若干个互不依赖的子任务，为了减少线程间的竞争，于是把这些子任务分别放到不同的队列里，并为每个队列创建一个单独的线程来执行队列里的任务，线程和队列一一对应，比如：A 线程负责处理 A 队列里的任务，但是有的线程会先把自己队列里的任务干完，然后等待其他线程完成。这时该线程会去其他线程帮忙，通常使用双端队列，被窃取任务线程永远从双端队列的头部拿任务执行，而窃取任务的线程永远从双端队列的尾部拿任务执行

缺点：当双端队列里只有一个任务时，并且该算法会消耗更多的系统资源，如：创建多个线程和双端队列

注意：Java 8 中的并行流（Parallel Streams）底层正是基于 ForkloinPool 实现的。通过 parallelStream()方法，可以轻松地利用 ForkJoinPool 来实现并行操作，从而提高处理效率。

## 局限性

1. 任务只能使用 Fork 和 Join 操作来进行同步机制，如果使用了其他同步机制，则在同步操作时，工作线程就不能执行其他任务了。例如：在 ForkJoin 框架中使任务进行了睡眠，那么在睡眠期间，正在执行这个任务的工作线程将不会执行其他任务了
2. 在 ForkJoin 框架中，所拆分的任务不应该去执行 I/O 操作，比如：读写文件
3. 任务不能抛出检查异常，必须通过必要的代码来处理这些异常

## 使用方法

```java
@Slf4j
public class ForkJoinTaskExample extends RecursiveTask<Integer> {
    public static final int threshold = 2;
    private int start;
    private int end;
    
    public ForkJoinTaskExample(int start, int end) {
        this.start = start;
        this.end = end;
    }
    
    @Override
    protected Integer compute() {
        int sum = 0;
        //如果任务足够小就计算任务
        boolean canCompute = (end - start) <= threshold;
        if (canCompute) {
            for (int i = start; i <= end; i++) {
                sum += i;
            }
        } else {
            // 如果任务大于阈值，就分裂成两个子任务计算
            int middle = (start + end) / 2;
            ForkJoinTaskExample leftTask = new ForkJoinTaskExample(start, middle);
            ForkJoinTaskExample rightTask = new ForkJoinTaskExample(middle + 1, end);
            // 执行子任务
            leftTask.fork();
            rightTask.fork();
            // 等待任务执行结束合并其结果
            int leftResult = leftTask.join();
            int rightResult = rightTask.join();
            // 合并子任务
            sum = leftResult + rightResult;
        }
        return sum;
    }
    
    public static void main(String[] args) {
        ForkJoinPool forkjoinPool = new ForkJoinPool();
        //生成一个计算任务，计算1+2+3+4
        ForkJoinTaskExample task = new ForkJoinTaskExample(1, 100);
        //执行一个任务
        Future<Integer> result = forkjoinPool.submit(task);
        try {
            log.info("result:{}", result.get());
        } catch (Exception e) {
            log.error("exception", e);
        }
    }
}
```

