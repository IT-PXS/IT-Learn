---
title: Optional
tag: 工作技巧
category: Java
description: Java的Optional类是一个容器对象，用于防止空指针异常（NullPointerException）。它提供了许多方法，如isPresent()、ifPresent()、orElse()等，帮助开发者优雅地处理可能为空的值。通过使用Optional，可以更清晰地表达“值可能为空”的语义，提升代码的可读性和健壮性。
date: 2024-10-22 22:38:34
---

## of

通过一个非 null 的 value 来构造一个 Optional，返回的 Optional 包含了 value 这个值，对于该方法，传入的参数一定不能为 null，否则会抛出 NullPointerException

```java
public static <T> Optional<T> of(T value) {
    return new Optional<>(value);
}
```

```java
Optional<String> opt = Optional.of("abc");
System.out.println(opt.isPresent()); // 输出：true
```

## ofNullable

与 of 的区别在于，传入的参数可以为 null，进行三目运算，判断传入的参数是否为 null，如果为 null 的话，返回的就是 Optional.empty()

```java
public static <T> Optional<T> ofNullable(T value) {
    return value == null ? empty() : of(value);
}
```

```java
Optional<String> optOrNull = Optional.ofNullable(null);
System.out.println(optOrNull.isPresent()); // 输出：false
```

## empty

用来构造一个空的 Optional，即该 Optional 中不包含值

```java
public static<T> Optional<T> empty() {
    @SuppressWarnings("unchecked")
    Optional<T> t = (Optional<T>) EMPTY;
    return t;
}
```

## ifPresent

如果 Optional 中有值，则对该值调用 consumer.accept，否则什么也不做

```java
public boolean isPresent() {
    return value != null;
}

public void ifPresent(Consumer<? super T> consumer) {
    if (value != null)
        consumer.accept(value);
}
```

```java
Optional<User> user = Optional.ofNullable(getUserById(id));
user.ifPresent(u -> System.out.println("Username is: " + u.getUsername()));
```

## orElse

如果 Optional 中有值则将其返回，否则返回 orElse 方法传入的参数

```java
public T orElse(T other) {
    return value != null ? value : other;
}
```

```java
User user = Optional.ofNullable(getUserById(id))
        			.orElse(new User(0, "Unknown"));
System.out.println("Username is: " + user.getUsername());
```

## orElseGet

与 orElse 方法的区别在于：orElseGet 方法传入的参数为一个 Supplier 接口的实现，当 Optional 中有值的时候，返回值；当 Optional 中没有值的时候，返回从该 Supplier 获得的值

```java
public T orElseGet(Supplier<? extends T> ither) {
    return value != null ? value : other.get();
}
```

```java
User user = Optional.ofNullable(getUserById(id))
                    .orElseGet(() -> new User(0, "Unknown"));
System.out.println("Username is: " + user.getUsername());
```

## orElseThrow

与 orElse 方法的区别在于：orElseThrow 方法当 Optional 中有值的时候，返回值；没有值的时候会抛出异常，抛出的异常由传入的 exceptionSupplier 提供

```java
public <X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier) throws X {
    if (value != null) {
        return value;
    } else {
        throw exceptionSupplier.get();
    }
}
```

```java
User user = Optional.ofNullable(getUserById(id))
        			.orElseThrow(() -> new EntityNotFoundException("id 为 " + id + " 的用户没有找到"));
```

## map

如果当前 Optional 为 Optional.empty，则依旧返回 Optional.empty；否则返回一个新的 Optional，该 Optional 包含的是：函数 mapper 在以 value 作为输入时的输出值

```java
public <U> Optional<U> map(Function<? super T, ? extends U> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent()){
        return empty();
    } else {
        return Optional.ofNullable(mapper.apply(value));
    }
}
```

```java
Optional<String> username = Optional.ofNullable(getUserById(id))
                                    .map(user -> user.getUsername())
                                    .map(name -> name.toLowerCase())
                                    .map(name -> name.replace('_', ' '));
System.out.println("Username is: " + username.orElse("Unknown"));
```

## flatMap

与 map 方法的区别在于：map 方法参数中的函数 mapper 输出的是值，然后 map 方法会使用 Optional.ofNullable 将其包装为 Optional，而 flatMap 要求参数中的函数 mapper 输出的就是 Optional

```java
public <U> Optional<U> flatMap(Function<? super T, Optional<U>> mapper) {
    Objects.requireNonNull(mapper);
    if (!isPresent()){
        return empty();
    } else {
        return Objects.requireNonNull(mapper.apply(value));
    }  
}
```

```java
Optional<String> username = Optional.ofNullable(getUserById(id))
                                    .flatMap(user -> Optional.of(user.getUsername()))
                                    .flatMap(name -> Optional.of(name.toLowerCase()));
System.out.println("Username is: " + username.orElse("Unknown"));
```

## filter

filter 方法接受一个 Predicate 来对 Optional 中包含的值进行过滤，如果包含的值满足条件，那么还是返回这个 Optional，否则返回 Optional.empty

```java
public Optional<T> filter(Predicate<? super T> predicate) {
    Objects.requireNonNull(predicate);
    if(!isPresent()) {
        return this;
    } else {
        return predicate.test(value) ? this : empty();
    }
}
```

```java
Optional<String> username = Optional.ofNullable(getUserById(id))
                                    .filter(user -> user.getId() < 10)
                                    .map(user -> user.getUsername());
System.out.println("Username is: " + username.orElse("Unknown"));
```