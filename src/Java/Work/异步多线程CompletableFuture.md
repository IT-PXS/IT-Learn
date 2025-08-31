---
title: 异步多线程CompletableFuture
tag: 工作技巧
category: Java
description: CompletableFuture 是 Java 8 引入的异步编程工具，提供非阻塞任务执行、回调处理、任务组合等功能。支持 thenApply()、thenCombine() 等方法，实现链式操作，可通过 exceptionally() 处理异常，allOf() 组合多个任务，并支持超时控制，提升并发性能。
date: 2025-01-10 22:38:34
---

## 任务开启

### runAsync 和 supplyAsync

```java
public static CompletableFuture<Void> runAsync(Runnable runnable);
public static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor);
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier);
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor);
```

1. runAsync 不支持返回值
2. supplyAsync 支持返回值

注意：没有指定 Executor 的方法会使用 ForkJoinPool.commonPool()作为它的线程池执行异步代码，如果指定线程池，则使用指定的线程池运行

```java
//无返回值
public static void runAsync() throws Exception {
    CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
        }
        System.out.println("run end ...");
    });
    
    future.get();
}

//有返回值
public static void supplyAsync() throws Exception {         
    CompletableFuture<Long> future = CompletableFuture.supplyAsync(() -> {
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
        }
        System.out.println("run end ...");
        return System.currentTimeMillis();
    });

    long time = future.get();
    System.out.println("time = "+time);
}
```

## 串行任务

### thenAccept 和 thenAcceptAsync

```java
public CompletionStage<Void> thenAccept(Consumer<? super T> action);
public CompletionStage<Void> thenAcceptAsync(Consumer<? super T> action);
public CompletionStage<Void> thenAcceptAsync(Consumer<? super T> action,Executor executor);
```

接收任务的处理结果并消费处理，无返回结果

1. thenAccept：使用主线程或者执行上一步任务的线程，串行执行任务。将上一步任务执行的【结果】作为当前任务方法执行时的【参数】，执行指定的函数，并且当前任务方法执行结束后，没有返回值。
2. thenAcceptAsync：串行执行任务，将上一步任务执行的【结果】作为当前任务方法执行时的【参数】，然后从公共的 commonPool 线程池中获取一个子线程，执行指定的函数，并且该任务方法执行结束后，没有返回值。

```java
public static void thenAccept() throws Exception{
    CompletableFuture<Void> future = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            return new Random().nextInt(10);
        }
    }).thenAccept(integer -> {
        System.out.println(integer);
    });
    future.get();
}
```

### thenRun 和 thenRunAsync

```java
public CompletionStage<Void> thenRun(Runnable action);
public CompletionStage<Void> thenRunAsync(Runnable action);
public CompletionStage<Void> thenRunAsync(Runnable action,Executor executor);
```

跟 thenAccept 不一样的是，不关心任务的处理结果，只要上面的任务执行完成，就开始执行 thenAccept

1. thenRun：使用主线程或者执行上一步任务的子线程，串行执行任务，并且该任务方法执行结束后，没有返回值。
2. thenRunAsync：串行执行任务，从公共的 commonPool 线程池中获取一个子线程，执行指定的代码逻辑，并且该任务方法执行结束后，没有返回值。

```java
public static void thenRun() throws Exception{
    CompletableFuture<Void> future = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            return new Random().nextInt(10);
        }
    }).thenRun(() -> {
        System.out.println("thenRun ...");
    });
    future.get();
}
```

### thenApply 和 thenApplyAsync

```java
public <U> CompletableFuture<U> thenApply(Function<? super T,? extends U> fn);
public <U> CompletableFuture<U> thenApplyAsync(Function<? super T,? extends U> fn);
public <U> CompletableFuture<U> thenApplyAsync(Function<? super T,? extends U> fn, Executor executor);
```

当一个线程依赖另一个线程时，可以使用 thenApply 来把这两个线程串行化

+ T：上一个任务返回结果的类型
+ U：当前任务的返回值类型

1. thenApply：使用主线程或者执行上一步任务的线程，串行执行任务。将上一步任务执行的【结果】作为当前任务方法执行时的【参数】，执行指定的函数，并且该任务方法执行结束后，将返回指定类型结果。
2. thenApplyAsync：串行执行任务，将上一步任务执行的【结果】作为当前任务方法执行时的【参数】，然后从公共的 commonPool 线程池中获取一个子线程，执行指定的函数，并且该任务方法执行结束后，将返回指定类型结果。

```java
public static void thenApply() throws Exception {
    CompletableFuture<Long> future = CompletableFuture.supplyAsync(new Supplier<Long>() {
        @Override
        public Long get() {
            long result = new Random().nextInt(100);
            System.out.println("result1="+result);
            return result;
        }
    }).thenApply(new Function<Long, Long>() {
        @Override
        public Long apply(Long t) {
            long result = t*5;
            System.out.println("result2="+result);
            return result;
        }
    });
    
    long result = future.get();
    System.out.println(result);
}
```

### handle 和 handleAsync

```java
public <U> CompletionStage<U> handle(BiFunction<? super T, Throwable, ? extends U> fn);
public <U> CompletionStage<U> handleAsync(BiFunction<? super T, Throwable, ? extends U> fn);
public <U> CompletionStage<U> handleAsync(BiFunction<? super T, Throwable, ? extends U> fn,Executor executor);
```

handle 是执行任务完成时对结果的处理，和 thenApply 处理方式基本一样。不同的是 handle 是在任务完成后再执行，还可以处理异常的任务，thenApply 只可以执行正常的任务，任务出现异常则不执行

1. handle：使用主线程或者执行上一步任务的线程，串行执行任务。将上一步任务执行的【结果】和【异常】作为当前任务方法执行时的【参数】，执行指定的函数。并且该任务方法执行结束后，将返回指定类型结果。
2. handleAsync：串行执行任务，将上一步任务执行的【结果】和【异常】作为当前任务方法执行时的【参数】，然后从公共的 commonPool 线程池中获取一个子线程，执行指定的函数。并且该任务方法执行结束后，将返回指定类型结果。

```java
public static void handle() throws Exception{
    CompletableFuture<Integer> future = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int i= 10/0;
            return new Random().nextInt(10);
        }
    }).handle(new BiFunction<Integer, Throwable, Integer>() {
        @Override
        public Integer apply(Integer param, Throwable throwable) {
            int result = -1;
            if(throwable==null){
                result = param * 2;
            }else{
                System.out.println(throwable.getMessage());
            }
            return result;
        }
     });
    System.out.println(future.get());
}
```

### whenComplete 和 whenCompleteAsync

```java
public CompletableFuture<T> whenComplete(BiConsumer<? super T,? super Throwable> action);
public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T,? super Throwable> action);
public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T,? super Throwable> action, Executor executor);
```

当 CompletableFuture 的计算结果完成，或者抛出异常的时候，可以执行特定的 action

1. whenComplete：使用主线程或者执行上一步任务的线程，串行执行任务。将上一步任务执行的【结果】和【异常】作为当前任务方法执行时的【参数】，执行指定函数。并且当前任务执行结束后，没有返回值。
2. whenCompleteAsync：串行执行任务，将上一步任务执行的【结果】和【异常】作为当前任务方法执行时的【参数】，然后从公共的 commonPool 线程池中获取一个子线程，执行指定的函数。并且该任务方法执行结束后，没有返回值。

+ 如果上一阶段中正常执行结束，则该方法的结果参数不为 null；
+ 如果上一阶段中抛出异常，则该方法的异常参数不为 null；

```java
public static void whenComplete() throws Exception {
    CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
        }
        if(new Random().nextInt()%2>=0) {
            int i = 12/0;
        }
        System.out.println("run end ...");
    }).whenComplete(new BiConsumer<Void, Throwable>() {
        @Override
        public void accept(Void t, Throwable action) {
            System.out.println("执行完成！");
        }
    });
    TimeUnit.SECONDS.sleep(2);
}
```

### thenCompose 和 thenComposeAsync

```java
public <U> CompletableFuture<U> thenCompose(Function<? super T, ? extends CompletionStage<U>> fn);
public <U> CompletableFuture<U> thenComposeAsync(Function<? super T, ? extends CompletionStage<U>> fn);
public <U> CompletableFuture<U> thenComposeAsync(Function<? super T, ? extends CompletionStage<U>> fn, Executor executor);
```

允许对两个 CompletionStage 进行流水线操作，第一个操作完成时，将其结果作为参数传递给第二个操作

1. thenCompose：使用主线程或者执行上一步任务的线程，串行执行任务。按顺序组合两个有依赖关系的任务，将上一步任务执行的【结果】作为当前任务方法执行时的【参数】，执行指定的函数。并且该任务方法完成后，将返回并执行一个新的任务。
2. thenComposeAsync：串行执行任务，按顺序组合俩个有依赖关系的任务，将上一步任务执行的【结果】作为当前任务方法执行时的【参数】，然后从公共的 commonPool 线程池中获取一个子线程，执行指定的函数，并且该任务方法完成后，将返回并执行一个新的任务。

```java
public static void thenCompose() throws Exception {
    CompletableFuture<Integer> f = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            System.out.println("t1="+t);
            return t;
        }
    }).thenCompose(new Function<Integer, CompletionStage<Integer>>() {
        @Override
        public CompletionStage<Integer> apply(Integer param) {
            return CompletableFuture.supplyAsync(new Supplier<Integer>() {
                @Override
                public Integer get() {
                    int t = param *2;
                    System.out.println("t2="+t);
                    return t;
                }
            });
        }
    });
    System.out.println("thenCompose result : "+f.get());
}
```

## 并行任务

### thenCombine 和 thenCombineAsync

```java
public <U,V> CompletionStage<V> thenCombine(CompletionStage<? extends U> other,BiFunction<? super T,? super U,? extends V> fn);
public <U,V> CompletionStage<V> thenCombineAsync(CompletionStage<? extends U> other,BiFunction<? super T,? super U,? extends V> fn);
public <U,V> CompletionStage<V> thenCombineAsync(CompletionStage<? extends U> other,BiFunction<? super T,? super U,? extends V> fn,Executor executor);
```

thenCombine 会把两个 CompletionStage 的任务都执行任务后，把两个任务的结果一块交给 thenCombine 来处理

1. thenCombine：并行执行任务，从 commonPool 线程池中获取线程，并行执行两个任务，等到两个任务都执行结束后，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，将返回指定类型结果。
2. thenCombineAsync：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，等到两个任务都执行结束后，继续从公共的 commonPool 线程池中获取一个子线程，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，将返回指定类型结果。

```java
public static void thenCombine() throws Exception {
    CompletableFuture<String> future1 = CompletableFuture.supplyAsync(new Supplier<String>() {
        @Override
        public String get() {
            return "hello";
        }
    });
    CompletableFuture<String> future2 = CompletableFuture.supplyAsync(new Supplier<String>() {
        @Override
        public String get() {
            return "hello";
        }
    });
    CompletableFuture<String> result = future1.thenCombine(future2, new BiFunction<String, String, String>() {
        @Override
        public String apply(String t, String u) {
            return t+" "+u;
        }
    });
    System.out.println(result.get());
}
```

### thenAcceptBoth 和 thenAcceptBothAsync

```java
public <U> CompletionStage<Void> thenAcceptBoth(CompletionStage<? extends U> other,BiConsumer<? super T, ? super U> action);
public <U> CompletionStage<Void> thenAcceptBothAsync(CompletionStage<? extends U> other,BiConsumer<? super T, ? super U> action);
public <U> CompletionStage<Void> thenAcceptBothAsync(CompletionStage<? extends U> other,BiConsumer<? super T, ? super U> action,Executor executor);
```

当两个 CompletionStage 都执行完成后，把结果一块交给 thenAcceptBoth 来进行消耗

1. thenAcceptBoth：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，等到两个任务都执行结束后，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，没有返回值。
2. thenAcceptBothAsync：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，等到两个任务都执行结束后，继续从公共的 commonPool 线程池中获取一个子线程，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，没有返回值。

```java
public static void thenAcceptBoth() throws Exception {
    CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f1="+t);
            return t;
        }
    });
    CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f2="+t);
            return t;
        }
    });
    f1.thenAcceptBoth(f2, new BiConsumer<Integer, Integer>() {
        @Override
        public void accept(Integer t, Integer u) {
            System.out.println("f1="+t+";f2="+u+";");
        }
    });
}
```

### runAfterBoth 和 runAfterBothAsync

```java
public CompletionStage<Void> runAfterBoth(CompletionStage<?> other,Runnable action);
public CompletionStage<Void> runAfterBothAsync(CompletionStage<?> other,Runnable action);
public CompletionStage<Void> runAfterBothAsync(CompletionStage<?> other,Runnable action,Executor executor);
```

两个 CompletionStage 都完成了计算才会执行下一步的操作（Runnable）

1. runAfterBoth：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，等到两个任务都执行结束后，执行一个新的任务方法，该方法执行结束后将返回并执行一个新任务。新任务方法执行结束后，没有返回值。
2. runAfterBothAsync：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，等到两个任务都执行结束后，继续从 commonPool 线程池中获取一个子线程，执行一个新的任务方法，该方法执行结束后将返回并执行一个新任务。新任务执行结束后，没有返回值。

```java
public static void runAfterBoth() throws Exception {
    CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f1="+t);
            return t;
        }
    });
    CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f2="+t);
            return t;
        }
    });
    f1.runAfterBoth(f2, new Runnable() {
        @Override
        public void run() {
            System.out.println("上面两个任务都执行完成了。");
        }
    });
}
```

### applyToEither 和 applyToEitherAsync

```java
public <U> CompletionStage<U> applyToEither(CompletionStage<? extends T> other,Function<? super T, U> fn);
public <U> CompletionStage<U> applyToEitherAsync(CompletionStage<? extends T> other,Function<? super T, U> fn);
public <U> CompletionStage<U> applyToEitherAsync(CompletionStage<? extends T> other,Function<? super T, U> fn,Executor executor);
```

两个 CompletonStage 谁执行返回的结果快，就用那个 CompletionStage 的结果进行下一步的转化操作

1. applyToEither：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，两个任务任意一个执行结束后，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，没有返回值。
2. applyToEitherAsync：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，两个任务任意一个执行结束后，继续从 commonPool 线程池中获取一个子线程，执行一个新的任务方法，将之前先执行结束的任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，没有返回值。

```java
public static void applyToEither() throws Exception {
    CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f1="+t);
            return t;
        }
    });
    CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f2="+t);
            return t;
        }
    });
    
    CompletableFuture<Integer> result = f1.applyToEither(f2, new Function<Integer, Integer>() {
        @Override
        public Integer apply(Integer t) {
            System.out.println(t);
            return t * 2;
        }
    });
    System.out.println(result.get());
}
```

### runAfterEither 和 runAfterEitherAsync

```java
public CompletionStage<Void> runAfterEither(CompletionStage<?> other,Runnable action);
public CompletionStage<Void> runAfterEitherAsync(CompletionStage<?> other,Runnable action);
public CompletionStage<Void> runAfterEitherAsync(CompletionStage<?> other,Runnable action,Executor executor);
```

两个 CompletionStage 任何一个完成了都会执行下一步的操作（Runnable）

1. runAfterEither：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，两个任务任意一个执行结束后，执行一个新的任务方法，该方法执行结束后将返回并执行一个新任务。新任务执行结束后，没有返回值。
2. runAfterEitherAsync：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，两个任务任意一个执行结束后，继续从 commonPool 线程池中获取一个子线程，执行一个新的任务方法，该方法执行结束后将返回并执行一个新任务。新任务执行结束后，没有返回值。

```java
public static void runAfterEither() throws Exception {
    CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f1="+t);
            return t;
        }
    });    
    CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f2="+t);
            return t;
        }
    });
    
    f1.runAfterEither(f2, new Runnable() {
        @Override
        public void run() {
            System.out.println("上面有一个已经完成了。");
        }
    });
}
```

### acceptEither 和 acceptEitherAsync

```java
public CompletionStage<Void> acceptEither(CompletionStage<? extends T> other,Consumer<? super T> action);
public CompletionStage<Void> acceptEitherAsync(CompletionStage<? extends T> other,Consumer<? super T> action);
public CompletionStage<Void> acceptEitherAsync(CompletionStage<? extends T> other,Consumer<? super T> action,Executor executor);
```

两个 CompletionStage 谁执行返回的结果快，就用那个 CompletionStage 的结果进行下一步的消耗操作

1. AcceptEither：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，两个任务任意一个执行结束后，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，没有返回值。
2. AcceptEitherAsync：并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行两个任务，两个任务任意一个执行结束后，继续从公共的 commonPool 线程池中获取一个子线程，执行一个新的任务方法，将之前两个任务的执行【结果】作为新任务方法的【参数】，然后返回并执行新任务。新任务执行结束后，没有返回值。

```java
public static void acceptEither() throws Exception {
    CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f1="+t);
            return t;
        }
    }); 
    CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(new Supplier<Integer>() {
        @Override
        public Integer get() {
            int t = new Random().nextInt(3);
            try {
                TimeUnit.SECONDS.sleep(t);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("f2="+t);
            return t;
        }
    });
    
    f1.acceptEither(f2, new Consumer<Integer>() {
        @Override
        public void accept(Integer t) {
            System.out.println(t);
        }
    });
}
```

### allOf

并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行多个任务方法，等待全部任务方法都执行完成后结束。任务执行结束后，没有返回值。

注意：如果传入的 CompletableFuture <?> 中的其中一个阶段异常完成时，那么返回的 CompletableFuture \< Void > 也异常完成，并将此异常作为异常原因

```java
public static void allOf() throws Exception {
    // 创建聚合数据的 Map 集合
    Map<String, String> userMap = new ConcurrentHashMap<>(3);

    // 创建待执行的 Runnable 参数
    Runnable runnable1 = () -> {
        System.out.println("任务1-成功获取用户基本信息");
        userMap.put("userInfo", "{name: mydlq, age: 18}");
    };
    Runnable runnable2 = () -> {
        System.out.println("任务2-成功获取用户头像");
        userMap.put("avatar", "http://www.xxx.com/avatar");
    };
    Runnable runnable3 = () -> {
        System.out.println("任务3-成功获取用户余额");
        userMap.put("balance", "1000");
    };

    // 执行多个 CompletableFuture，需要等待全部完成
    CompletableFuture<Void> cf = CompletableFuture.allOf(
            CompletableFuture.runAsync(runnable1),
            CompletableFuture.runAsync(runnable2),
            CompletableFuture.runAsync(runnable3)
    );

    // 进入堵塞状态，等待执行完成
    cf.join();
    // 输出用户信息
    System.out.println("获取的用户信息:");
    for (Map.Entry<String, String> entry : userMap.entrySet()) {
        System.out.println(entry.getKey() + ": " + entry.getValue());
    }
}
```

### anyOf

并行执行任务，从公共的 commonPool 线程池中获取线程，并行执行多个任务方法，等待多个任务方法中任意一个执行完成后结束。任务执行结束后，返回第一个先执行完成任务的返回值。

注意：如果传入的全部 CompletableFuture <?> 阶段都没有完成前，任意一个阶段执行过程出现异常并没有处理，那么返回的 CompletableFuture \< Object > 也异常完成，并将此异常作为异常原因

```java
public static void anyOf() throws Exception {
    Supplier<String> supplier1 = () -> {
        System.out.println("通道1");
        return "通道1-成功获取信息";
    };
    Supplier<String> supplier2 = () -> {
        System.out.println("通道2");
        return "通道2-成功获取信息";
    };
    Supplier<String> supplier3 = () -> {
        System.out.println("通道3");
        return "通道3-成功获取信息";
    };

    // 执行多个 CompletableFuture，只要任意一个执行完成就执行下一步
    CompletableFuture<Object> cf = CompletableFuture.anyOf(
            CompletableFuture.supplyAsync(supplier1),
            CompletableFuture.supplyAsync(supplier2),
            CompletableFuture.supplyAsync(supplier3)
    );

    // 进入堵塞状态，等待执行完成，输出获取的信息
    Object result = cf.join();
    System.out.println(result);
}
```

## 任务结束

### get

获取任务执行结果，如果任务尚未完成则进行堵塞状态，如果任务正常完成则返回执行结果，如果异常完成或执行过程中引发异常，这时就会抛出（运行时）异常。

```java
public static void get() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "执行结果");
    // 调用 get 方法进行等待，获取执行结果
    cf.get();
}
```

### join

获取任务执行结果，如果任务尚未完成则进行堵塞状态，如果任务正常完成则返回执行结果，如果异常完成或执行过程中引发异常，这时就会抛出（未经检查）异常。

```java
public static void join() throws Exception {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "执行结果");
    // 调用 join 方法进行等待，获取执行结果
    cf.join();
}
```

### getNow

立即获取任务执行结果，如果任务没有完成则返回设定的默认值，如果任务正常完成则返回执行结果。

```java
public static void getNow() throws Exception {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {
        // 睡眠5毫秒
        sleep(5);
        return "示例-执行完成";
    });
    // 随机睡眠1~10毫秒
    sleep(new Random().nextInt(10));
    // 调用 getNow 方法获取执行结果，如果任务未执行完成则输出设置的默认值
    String result = cf.getNow("默认值");
    System.out.println(result);
}

/**
 * 线程睡眠
 * @param millis 睡眠时间(单位:毫秒)
 */
public static void sleep(long millis){
    try {
        Thread.sleep(millis);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
}
```

### cancel

取消任务，如果任务尚未执行结束，调用该方法成功取消任务时返回 true，否则返回 false。并且任务取消成功后，通过 get/join 方法获取结果时，会抛出 CancellationException 异常。

```java
public static void cancel() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<Void> cf = CompletableFuture.runAsync(() -> {
        // 随机睡眠1~10毫秒
        sleep(new Random().nextInt(10));
        System.out.println("示例-执行任务完成");‘
    });
    // 随机睡眠1~10毫秒
    sleep(new Random().nextInt(10));
    // 调用 cancel 方法取消任务
    boolean cancelResult = cf.cancel(true);
    System.out.println("取消任务: " + cancelResult);
    // 调用 get 方法获取执行结果，如果取消任务将抛出 CancellationException 异常，这里对该异常进行处理
    try {
        cf.get();
    } catch (CancellationException e) {
        System.out.println("获取任务失败，任务已经被取消");
    }
}

/**
 * 线程睡眠
 * @param millis 睡眠时间(单位:毫秒)
 */
public static void sleep(long millis){
    try {
        Thread.sleep(millis);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
}
```

## 查看任务状态

### isDone

查看任务是否执行完成，如果当前阶段执行完成（无论是正常完成还是异常完成）则返回 true，否则返回 false。

```java
public static void isDone() throws InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<Void> cf = CompletableFuture.runAsync(() -> System.out.println("任务执行中..."));
    // 调用 isDone 方法查看任务是否执行完成
    System.out.println("任务是否完成: " + cf.isDone());
    // 等待1秒时间
    Thread.sleep(1000L);
    // 调用 isDone 方法再次查看任务是否执行完成
    System.out.println("任务是否完成: " + cf.isDone());
}
```

### isCancelled

查看当前阶段任务是否成功取消，如果此阶段任务在完成之前被取消则返回 true，否则返回 false。

```java
public static void isCancelled() throws Exception {
    // 执行 CompletableFuture 任务
    CompletableFuture<Void> cf = CompletableFuture.runAsync(() -> System.out.println("执行 CompletableFuture 任务"));
    // 调用 cancel 方法取消任务
    cf.cancel(true);
    // 调用 isCancelled 方法，查询任务是否成功被取消
    System.out.println("是否取消任务: " + cf.isCancelled());
}
```

### isCompletedExceptionally

查看当前阶段任务是否以异常的方式执行完成，比如取消任务、突然终止任务或者执行过程出现异常等，都属于异常方式执行完成，如果是以异常方式完成则返回 true，否则返回 false。

```java
public static void isCompletedExceptionally() throws InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<Void> cf = CompletableFuture.runAsync(() -> {
        System.out.println("执行中...");
        // 模拟发生异常
        System.out.println(1/0);
    });

    // 等待1秒确保任务执行完成
    Thread.sleep(1000L);
    // 调用 isCompletedExceptionally 方法验证当前阶段是否异常完成
    System.out.println("是否异常完成: " + cf.isCompletedExceptionally());
}
```

## 设置任务结果

### obtrudeValue

设置（重置）调用 get/join 方法时返回指定值，无论任务是否执行完成。

```java
public static void obtrudeValue() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "示例-执行完成");
    // 设置或重置 get 方法和与其相关方法的返回的值
    cf.obtrudeValue("示例-强制设置返回值-无论成功失败");
    // 调用 get 方法进行等待，获取执行结果并输出到控制台
    String result = cf.get();
    System.out.println(result);
}
```

### obtrudeException

设置（重置）调用 get/join 方法时返回指定异常，无论任务是否执行完成。

```java
public static void obtrudeException() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "示例-执行完成");
    // 设置 get 方法和与其相关的方法后续执行抛出指定异常
    cf.obtrudeException(new Exception("未知异常"));
    // 调用 get 方法进行等待，获取执行结果并输出
    String result = cf.get();
    System.out.println(result);
}
```

### complete

设置调用 get/join 方法时返回指定值。不过需要注意的是，如果任务没有执行完成，则可以通过该方法设置返回值，并且返回 true。如果任务已经完成，则无法配置，并且返回 false。

```java
public static void complete() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "示例-执行完成");

    // 设置或重置 get 方法和与其相关方法的返回的值，任务没有执行完成返回 true，否则返回 false
    boolean setResult = cf.complete("示例-任务没有完成-设置返回值");
    System.out.println("设置返回值为执行结果: " + setResult);

    // 调用 get 方法进行等待，获取执行结果并输出
    String result = cf.get();
    System.out.println(result);
}
```

### completeException

设置调用 get/join 方法时返回指定异常。不过需要注意的是，如果任务没有执行完成，则可以通过该方法设置返回值，并且返回 true。如果任务已经完成，则无法配置，并且返回 false。

```java
public static void completeExceptionally() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 任务
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "示例-执行完成");

    // 设置或重置 get 方法和与其相关方法的返回的值，任务没有执行完成返回 true，否则返回 false
    boolean setResult = cf.completeExceptionally(new Exception("未知异常"));
    System.out.println("设置返回值为执行结果: " + setResult);

    // 调用 get 方法进行等待，获取执行结果并输出
    String result = cf.get();
    System.out.println(result);
}
```

## 设置超时时间

### orTimeout

设置任务超时后抛出异常信息

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    sleep(3000);
    return "完成";
}).orTimeout(2, TimeUnit.SECONDS);

future.get(); // 超时异常
```

### completeOnTimeout

设置任务超时后返回的默认值

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    sleep(3);
    return "完成";
}).completeOnTimeout("超时默认值", 2, TimeUnit.SECONDS);

System.out.println(future.get()); // 超时后返回 "超时默认值"
```

## 任务异常处理

### exceptionally

```java
public CompletableFuture<T> exceptionally(Function<Throwable,? extends T> fn)
```

判断上一个任务执行时是否发生异常，如果是则就会执行 exceptionally 方法，并且将上一步异常作为当前方法的参数，然后对异常进行处理。当然，如果上一阶段执行过程中没有出现异常，则不会执行 exceptionally 方法。

```java
public static void exceptionally() throws ExecutionException, InterruptedException {
    // 执行 CompletableFuture 串行任务，并且使用 exceptionally 方法:
    // - 如果 exceptionally 方法的上一阶段执行过程中出现异常，则会执行 exceptionally 阶段；
    // - 如果 exceptionally 方法的上一阶段执行过程中没有出现异常，则不会执行 exceptionally 阶段；
    CompletableFuture<String> cf = CompletableFuture
            // 执行任务，50%概率发生异常，50%概率返回正常值
            .supplyAsync(() -> {
                if (new Random().nextInt(2) != 0) {
                    throw new RuntimeException("模拟发生异常");
                }
                return "正常结束";
            })
            // 处理上一步中抛出的异常
            .exceptionally(Throwable::getMessage);

    // 调用 get 方法进行等待，获取执行结果
    String result = cf.get();
    System.out.println(result);
}
```
