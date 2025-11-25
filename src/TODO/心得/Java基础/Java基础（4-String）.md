---
title: Java基础（4-String）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java中的String是不可变的字符序列，一旦创建，其内容不能修改。每次对String的修改都会创建一个新的String对象。String类提供了多种方法，如substring(), toUpperCase(), replace()等用于字符串操作。在Java中，String常与StringBuilder和StringBuffer类一起使用，后者提供了可变的字符串操作方式。
published: true
abbrlink: 16634
date: 2024-12-22 22:57:31
---

## String、StringBuffer 与 StringBuilder

**区别**

运行速度快慢：StringBuilder > StringBuffer > String

1. String：采用 final 修饰的字符数组进行字符串保存，因此不可变。如果对 String 类型对象修改，需要新建对象，将老字符和新增加的字符一并存进去
2. StringBuilder：采用无 final 修饰的字符数组进行保存，因此可变，但线程不安全
3. StringBuffer：采用无 final 修饰的字符数组进行保存，可理解为实现线程安全的 StringBuilder，其实比 StringBuilder 多了 synchronized 修饰符

StringBuilder 与 StringBuffer 都继承自 AbstractStringBuilder 类，在 AbstractStringBuilder 中也是使用字符数组保存字符串，不过没有使用 final 和 private 关键字修饰

```java
abstract class AbstractStringBuilder implements Appendable, CharSequence {
    char[] value;

    int count;	

    AbstractStringBuilder() {
    }

    AbstractStringBuilder(int capacity) {
        value = new char[capacity];
    }

    public AbstractStringBuilder append(String str) {
        if (str == null)
            return appendNull();
        int len = str.length();
        ensureCapacityInternal(count + len);
        str.getChars(0, len, value, count);
        count += len;
        return this;
    }
}
```

**使用场景**

1. 当需要频繁修改字符串时，建议使用 StringBuilder（性能较好）。

2. 如果在多线程环境下使用，则可以选择 StringBuffer。

**final 修饰 StringBuffer 后还可以 append 吗？**

可以，final 修饰的是一个引用变量，那么这个引用始终只能指向这个对象，但是这个对象内部的属性是可以变化的

## String 字符串修改实现原理

当用 String 类型来对字符串进行修改时，其实现方法是首先创建一个 StringBuilder，其次调用 StringBuilder 的 append()方法，最后调用 StringBuilder 的 toString()方法把结果返回

在循环内使用“+”进行字符串的拼接的话，存在比较明显的缺陷：编译器不会创建单个 StringBuilder 以复用，会导致创建过多的 StringBuilder 对象。

```java
String[] arr = {"he", "llo", "world"};
String s = "";
for (int i = 0; i < arr.length; i++) {
    s += arr[i];
}
System.out.println(s);
```

StringBuilder 对象是在循环内部被创建的，这意味着每循环一次就会创建一个 StringBuilder 对象。

如果直接使用 StringBuilder 对象进行字符串拼接的话，就不会存在这个问题了。

```java
String[] arr = {"he", "llo", "world"};
StringBuilder s = new StringBuilder();
for (String value : arr) {
    s.append(value);
}
System.out.println(s);
```

## String.intern()

String.intern 是一个 Native 方法，底层调用 C++的 StringTable:: intern 方法

作用：当调用 intern 方法时，如果常量池中已经存在该字符串，则返回池中的字符串；否则将此字符串添加到常量池中，并返回字符串的引用

优点：使用 intern 方法可以提高内存使用效率，减少重复的字符串

```java
// s1 指向字符串常量池中的 "Java" 对象
String s1 = "Java";
// s2 也指向字符串常量池中的 "Java" 对象，和 s1 是同一个对象
String s2 = s1.intern();
// 在堆中创建一个新的 "Java" 对象，s3 指向它
String s3 = new String("Java");
// s4 指向字符串常量池中的 "Java" 对象，和 s1 是同一个对象
String s4 = s3.intern();
// s1 和 s2 指向的是同一个常量池中的对象
System.out.println(s1 == s2); // true
// s3 指向堆中的对象，s4 指向常量池中的对象，所以不同
System.out.println(s3 == s4); // false
// s1 和 s4 都指向常量池中的同一个对象
System.out.println(s1 == s4); // true
```

## String 类的不可变性

```java
public final class String implements java.io.Serializable, Comparable<String>, CharSequence {
    private final char value[];
}
```

String 类由 final 修饰，所以不能被继承

1. 性能优化（字符串常量池的需要）：字符串常量池是 Java 堆内存中一个特殊的存储区域，当创建一个 String 对象时，假设此字符串值已经存在于常量池中，则不会创建一个新的对象，而是引用已经存在的对象。若字符串可变，基于常量池的 String.intern()方法也失效，每次创建新的字符串将在堆中开辟出新的空间，占据更多的内存
2. 允许 String 对象缓存 HashCode：字符串不变性保证类 hash 码的唯一性，因此可以放心地进行缓存，意味着不必每次都去计算新的哈希码
3. 安全性：例如：网络连接地址 URL 等，如果字符串是可变的，黑客就有可能改变字符串指向对象的值，那么会引起严重的安全问题
4. 线程安全：在多线程中，只有不变的对象和值是线程安全的，可以在多个线程中共享数据。由于 String 的不可变，当一个线程修改了字符串的值，只会产生一个新的字符串对象，不会对其他线程的访问产生副作用，访问的都是同样的字符串数据，不需要任何同步操作

## Java9 将 String 的底层实现由 char [] 改成了 byte []

```java
public final class String implements java.io.Serializable,Comparable<String>, CharSequence {
	// 表示变量最多被修改一次，称为“稳定的”。
    @Stable
    private final byte[] value;
    private final byte coder;
}

abstract class AbstractStringBuilder implements Appendable, CharSequence {
    byte[] value;
}
```

在 Java9 之后，String、StringBuilder 与 StringBuffer 的实现改用 byte 数组存储字符串，并增加了 coder 来表示编码。这样做的好处是在 Latin1 字符为主的程序里，可以把 String 占用的内存减少一半

使用 char [] 来表示 String 就导致了即使 String 中的字符只用一个字节就能表示，也得占用两个字节，仅仅将 char [] 优化为 byte [] 是不够的，还要配合 Latin-1 的编码方式，该编码方式是用单个字节来表示字符的。为了区别编码方式，追加了一个 coder 字段来区分，Java 会根据字符串的内容自动设置为相应的编码，要么 Latin-1 要么 UTF-16

也就是说，从 char [] 到 byte []，中文是两个字节，纯英文是一个字节，在此之前呢，中文是两个字节，英文也是两个字节。

**为什么用 UTF-16 而不用 UTF-8？**

在 UTF-8 中，0-127 号的字符用 1 个字节来表示，使用和 ASCII 相同的编码，只有 128 号以上的字符才用 2 个、3 个或者 4 个字节来表示

1. 如果只有一个字节，那么最高的比特位为 0
2. 如果有多个字节，那么第一个字节从最高位开始，连续有几个比特位的值为 1，就使用几个字节编码，剩下的字节均以 10 开头

+ 0xxxxxxx：一个字节
+ 110xxxxx 10xxxxxx：两个字节（开始两个 1）
+ 1110xxxx 10xxxxxx 10xxxxxx：三个字节（开始三个 1）

UTF-8 是变长的，对于 String 这种有随机访问方法的类来说，就很不方便。所谓的随机访问，就是 charAt、subString 这种方法，随便指定一个数字，String 就能给出结果。如果字符串中的每个字符占用的内存是不定长的，那么进行随机访问的时候，就需要从头开始数每个字符的长度，才能找到想要的字符

**UTF-16 使用 2 个或者 4 个字节来存储字符**

1. 对于 Unicode 编号范围在 0-FFFF 之间的字符，UTF-16 使用两个字节存储
2. 对于 Unicode 编号范围在 10000-10FFFF 之间的字符，UTF-16 使用四个字节存储，具体来说就是：将字符编号的所有比特位分成两部分，较高的一些比特位用一个值介于 D800-DBFF 之间的双字节存储，较低的一些比特位（剩下的比特位）用一个值介于 DC00-DFFF 之间的双字节存储

在 Java 中，一个字符（char）就是 2 个字节，占 4 个字节的字符，在 Java 里也是用两个 char 存储的，而 String 的各种操作，都是以 Java 的字符（char）为单位的，charAt 是取得第几个 char，subString 取的也是第几个到第几个 char 组成的子串，甚至 length 返回的都是 char 的个数。所以 UTF-16 在 Java 的世界里，就可以视为一个定长的编码

## 拼接字符串

**采用+运算符时**

1. 如果拼接的都是字符串常量，则在编译时编译器会将其直接优化为一个完整的字符串，效率比较高
2. 如果拼接的字符串中包含变量，则在编译时编译器采用 StringBuilder 对其进行优化，即自动创建 StringBuilder 实例并调用其 append()方法。引用的值在程序编译期是无法确定的，编译器无法对其进行优化

```java
String str1 = "str";
String str2 = "ing";
String str3 = "str" + "ing";//常量池中的对象
String str4 = str1 + str2; //在堆上创建的新的对象
String str5 = "string";//常量池中的对象
System.out.println(str3 == str4);//false
System.out.println(str3 == str5);//true
System.out.println(str4 == str5);//false
```

3. 字符串使用 final 关键字声明之后，可以让编译器当作常量来处理。被 final 关键字修饰之后的 String 会被编译器当作常量来处理，编译器在程序编译器就可以确定它的值，其效果就相当于访问常量

```java
final String str1 = "str";
final String str2 = "ing";
// 下面两个表达式其实是等价的
String c = "str" + "ing";// 常量池中的对象
String d = str1 + str2; // 常量池中的对象
System.out.println(c == d);// true
```

**采用 String 类的 concat 方法时**

1. concat 方法的拼接逻辑是：先创建一个足以容纳待拼接的两个字符串的字节数组，然后先后将两个字符串拼到这个数组里，最后将此数组转换为字符串
2. 在拼接大量字符串的时候，concat 方法的效率低于 StringBuilder。但是只拼接 2 个字符串时，concat 方法的效率要优于 StringBuilder

## String str = "i" 与 String str = new String("i")

不一样，String str = "i" 的方式，Java 虚拟机会将其分配到常量池中；String str = new String("i")则会分配到堆内存中

```java
public class StringTest{
    public static void main(String[] args){
        String a = "123";
        String b = "123";
        String c = new String("123");
        String d = new String("123");
        System.out.println(a == b);	//true
        System.out.println(a == c);	//false
        System.out.println(c == d);	//false
        System.out.println(c.equals(d));//true
    }
}
```

1. 在执行 String str1 = "abc" 的时候，JVM 会首先检查字符串常量池中是否已存在该字符串对象，如果已经存在，那么就不会再创建了，直接返回该字符串在字符串常量池中的内存地址；如果该字符串还不在字符串常量池中，那么就会在字符串常量池中创建该字符串对象然后再返回
2. String str3 = new String("abc")，则会创建一个新的对象，然后将新对象的地址值赋给 str3，虽然 str3 和 str1 的值相同但是地址值不同。当 JVM 遇到上述代码时，会先检索常量池中是否存在“abc”，如果不存在“abc”这个字符串，则会先在常量池中创建这个一个字符串。然后再执行 new 操作，会在堆内存中创建一个存储“abc”的 String 对象，对象的引用赋值给 str2。此过程创建了 2 个对象。当然，如果检索常量池时发现已经存在了对应的字符串，那么只会在堆内创建一个新的 String 对象，此过程只创建了 1 个对象。

使用 new 会创建 1 或 2 个字符串，会多创建一个对象出来，占用更多的内存，所以一般建议使用直接量的方式创建字符串

## 创建对象的个数

1. 字面量+字面量

```java
String s1 = "abc"+"def";
//创建了1个对象。编译期已经把常量拼为 "abcdef" 放到常量池
```

2. 字面量+对象+字面量

```java
String s1 = "abc";
String s2 = "abc" + s1 + "def";
//创建了3个对象。常量池2个：abc、def，堆中1个：abcabcdef
String s2 = "abc" + s1 + "def"; 
//创建了2个对象，"abc"已经在池中了，直接取出，创建了一个"def"的String对象放入池中，创建一个"abcabcdef"的String对象放于堆中（不是常量池）
```

3. new String("xx")+new String("xx")

```java
String s = new String("abc") + new String("abc");
//创建了4个对象。先在常量池创建一个"abc"对象，再在内存堆上创建一个"abc"对象，第二个new语句不在池中创建对象，只在内存堆上创建一个对象，两个字符串相加会在堆上创建一个对象
```

4. 字面量+new String("xx")

```java
String s = "abc"+ new String("def");
//创建了4个对象。先在常量池创建2个对象存储"abc"和"def"，new时再在内存堆上创建一个对象，两个字符串相加会在堆上创建一个对象
```

