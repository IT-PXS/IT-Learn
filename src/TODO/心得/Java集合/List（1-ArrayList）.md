---
title: List（1-ArrayList）
series: Java集合
tags:
  - Java集合
categories: 
  - Java集合
cover: /img/index/java.jpg
top_img: /img/index/java.jpg
published: true
abbrlink: 48844
date: 2024-12-09 22:38:34
description: ArrayList是Java集合框架中的动态数组实现，位于java.util包中。它提供可变大小的数组，支持随机访问和增删操作。相比数组，ArrayList自动扩容，使用更灵活，但线程不安全，需手动同步。适用于频繁读取或按索引操作的场景，但插入和删除中间元素效率较低。
---

## 属性和接口

1. RandomAccess 是一个标志接口，表明实现这个接口的 List 集合是支持快速随机访问的。在 ArrayList 中，我们即可以通过元素的序号快速获取元素对象，这就是快速随机访问
2. ArrayList 实现了 Cloneable 接口，即覆盖了函数 clone()，能被克隆
3. ArrayList 实现了 Serializable 接口，这意味着 ArrayList 支持序列化，能通过序列化去传输

```java
public class ArrayList<E> extends AbstractList<E> 
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable{
    // 默认初始容量大小
    private static final int DEFAULT_CAPACITY = 10;

    // 空数组（用于空实例）。
    private static final Object[] EMPTY_ELEMENTDATA = {};

    //用于默认大小空实例的共享空数组实例。
    //我们把它从 EMPTY_ELEMENTDATA 数组中区分出来，以知道在添加第一个元素时容量需要增加多少。
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    // 保存 ArrayList 数据的数组
    transient Object[] elementData;

    // ArrayList 所包含的元素个数
    private int size;

    // 要分配的最大数组大小
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
}
```

**RandomAccess 接口**

RandomAccess 接口中什么都没有定义，RandomAccess 接口不过是一个标识罢了，标识实现这个接口的类具有随机访问功能。在 binarySearch()方法中，它会判断传入的 list 是否 RandomAccess 的实例，如果是，调用 indexedBinarySearch()方法，如果不是，那么调用 iteratorBinarySearch()方法

```java
public static <T> int binarySearch(List<? extends Comparable<? super T>> list, T key) {
    if (list instanceof RandomAccess || list.size()<BINARYSEARCH_THRESHOLD)
        return Collections.indexedBinarySearch(list, key);
    else
        return Collections.iteratorBinarySearch(list, key);
}

private static <T> int indexedBinarySearch(List<? extends Comparable<? super T>> list, T key) {
    int low = 0;
    int high = list.size()-1;

    while (low <= high) {
        int mid = (low + high) >>> 1;
        Comparable<? super T> midVal = list.get(mid);
        int cmp = midVal.compareTo(key);

        if (cmp < 0)
            low = mid + 1;
        else if (cmp > 0)
            high = mid - 1;
        else
            return mid; // key found
    }
    return -(low + 1);  // key not found
}

private static <T> int iteratorBinarySearch(List<? extends Comparable<? super T>> list, T key){
    int low = 0;
    int high = list.size()-1;
    ListIterator<? extends Comparable<? super T>> i = list.listIterator();

    while (low <= high) {
        int mid = (low + high) >>> 1;
        Comparable<? super T> midVal = get(i, mid);
        int cmp = midVal.compareTo(key);

        if (cmp < 0)
            low = mid + 1;
        else if (cmp > 0)
            high = mid - 1;
        else
            return mid; // key found
    }
    return -(low + 1);  // key not found
}
```

**为何 LinkedList 却没实现这个接口？**

ArrayList 用 for 循环遍历比 iterator 迭代器遍历快，LinkedList 用 iterator 迭代器遍历比 for 循环遍历快。做项目时，应该考虑到 List 集合的不同子类采用不同的遍历方式，能够提高性能

## 构造方法

```java
/**
 * 默认构造函数，使用初始容量 10 构造一个空列表(无参数构造)
 */
public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}

/**
 * 带初始容量参数的构造函数。（用户自己指定容量）
 */
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {
        // 创建 initialCapacity 大小的数组
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {
        // 创建空数组
        this.elementData = EMPTY_ELEMENTDATA;
    } else {
        // 初始容量小于 0，抛出异常
        throw new IllegalArgumentException("Illegal Capacity: "+ initialCapacity);
    }
}

/**
 * 构造包含指定 collection 元素的列表，这些元素利用该集合的迭代器按顺序返回
 * 如果指定的集合为 null，throws NullPointerException。
 */
 public ArrayList(Collection<? extends E> c) {
    elementData = c.toArray();
    if ((size = elementData.length) != 0) {
        // c.toArray might (incorrectly) not return Object [] (see 6260652)
        if (elementData.getClass() != Object[].class)
            elementData = Arrays.copyOf(elementData, size, Object[].class);
    } else {
        this.elementData = EMPTY_ELEMENTDATA;
    }
}
```

1. 当 ArrayList 的容量为 0 时，此时添加元素的话，需要扩容，三种构造方法创建的 ArrayList 在扩容时略有不同

+ 无参构造，创建 ArrayList 后容量为 0，添加第一个元素后，容量变为 10，此后若需要扩容，则正常扩容
+ 传容量构造，当参数为 0 时，创建 ArrayList 后容量为 0，添加第一个元素后，容量为 1，此时 ArrayList 是满的，下次添加元素时需正常扩容
+ 传列表构造，当列表为空时，创建 ArrayList 后容量为 0，添加第一个元素后，容量为 1，此时 ArrayList 是满的，下次添加元素时需正常扩容

2. 当 ArrayList 的容量大于 0，并且 ArrayList 是满的，此时添加元素的话，进行正常扩容，每次扩容到原来的 1.5 倍

## 扩容机制

```java
// 扩容的入口方法
private void ensureCapacityInternal(int minCapacity) {
    ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}

// 计算最小容量
private static int calculateCapacity(Object[] elementData, int minCapacity) {
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
         // 获取默认的容量和传入参数的较大值
        return Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    return minCapacity;
}

// 判断是否需要扩容
private void ensureExplicitCapacity(int minCapacity) {
    modCount++;
    if (minCapacity - elementData.length > 0)
        // 调用 grow 方法进行扩容，调用此方法代表已经开始扩容了
        grow(minCapacity);
}

// 扩容的核心方法
private void grow(int minCapacity) {
    // oldCapacity 为旧容量，newCapacity 为新容量
    int oldCapacity = elementData.length;
    // 将 oldCapacity 右移一位，其效果相当于 oldCapacity /2，
    // 位运算的速度远远快于整除运算，整句运算式的结果就是将新容量更新为旧容量的 1.5 倍，
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    
    // 检查新容量是否大于最小需要容量，若小于最小需要容量，那么就把最小需要容量当作数组的新容量，
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    
    // 如果新容量大于 MAX_ARRAY_SIZE, 进入(执行) `hugeCapacity()` 方法来比较 minCapacity 和 MAX_ARRAY_SIZE，
    // 如果 minCapacity 大于最大容量，则新容量则为 `Integer.MAX_VALUE`，
    // 否则，新容量大小则为 MAX_ARRAY_SIZE 即为 `Integer.MAX_VALUE - 8`。
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // 扩容
    elementData = Arrays.copyOf(elementData, newCapacity);
}

private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
    // 如果最小容量超过 MAX_ARRAY_SIZE，则将数组容量扩容至 Integer.MAX_VALUE
    return (minCapacity > MAX_ARRAY_SIZE) ? Integer.MAX_VALUE :MAX_ARRAY_SIZE;
}
```

在 ArrayList 中，当空间用完，其会按照原数组空间的 1.5 倍进行扩容

1. 判断当前是否为空数组（即无参构造），如果是则比较 ArrayList 默认初始化的容量和传入参数大小，获取较大值（即扩容后的最小容量值）
2. 判断最小容量值是否比原数组的元素个数大，是则进行扩容
3. 使用位运算将原数组进行 1.5 倍扩容，然后判断扩容后的数量是否比最小容量值要小，是则将新数组的元素个数大小设置为最小容量值
4. 如果新容量大于 Integer.MAX_VALUE - 8，则设置为 Integer.MAX_VALUE，否则为 Integer.MAX_VALUE - 8

**为什么是 Integer.MAX_VALUE - 8？**

这是因为在 ArrayList 的内部实现中，预留了 8 个字节的额外空间，用于存储一些特殊的头部信息，以避免某些类型的内存溢出错误

在 Java 中，数组对象的存储结构包含对象头（Header）信息，用于存储元数据（如类型、长度等）。不同 JVM 实现的对象头大小可能不同，尤其是 64 位 JVM 可能占用更多空间。通过预留 8 个元素的余量（Integer.MAX_VALUE - 8），确保即使 JVM 需要额外的元数据存储，也不会导致数组长度溢出或分配失败。

## 插入

```java
// 在元素序列尾部插入
public boolean add(E e) {
    // 1. 检测是否需要扩容
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    // 2. 将新元素插入序列尾部
    elementData[size++] = e;
    return true;
}

// 在元素序列 index 位置处插入
public void add(int index, E element) {
    rangeCheckForAdd(index);
    // 1. 检测是否需要扩容
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    // 2. 将 index 及其之后的所有元素都向后移一位
    System.arraycopy(elementData, index, elementData, index + 1, size - index);
    // 3. 将新元素插入至 index 处
    elementData[index] = element;
    size++;
}

private void rangeCheckForAdd(int index) {
    if (index > size || index < 0)
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}
```

在尾部插入，只需 2 个步骤：

1. 检测数组是否有足够的空间插入
2. 将新元素插入至序列尾部

在元素序列指定位置（假设该位置合理）插入，需要 3 个步骤：

1. 检测数组是否有足够的空间
2. 将 index 及其之后的所有元素向后一位
3. 将新元素插入至 index 处

## 删除

```java
// 删除指定位置的元素
public E remove(int index) {
    rangeCheck(index);
    modCount++;
    // 返回被删除的元素值
    E oldValue = elementData(index);

    int numMoved = size - index - 1;
    if (numMoved > 0)
        // 将 index + 1 及之后的元素向前移动一位，覆盖被删除值
        System.arraycopy(elementData, index+1, elementData, index, numMoved);
    // 将最后一个元素置空，并将 size 值减 1                
    elementData[--size] = null; // clear to let GC do its work
    return oldValue;
}

E elementData(int index) {
    return (E) elementData[index];
}

// 删除指定元素，若元素重复，则只删除下标最小的元素
public boolean remove(Object o) {
    if (o == null) {
        for (int index = 0; index < size; index++)
            if (elementData[index] == null) {
                fastRemove(index);
                return true;
            }
    } else {
        // 遍历数组，查找要删除元素的位置
        for (int index = 0; index < size; index++)
            if (o.equals(elementData[index])) {
                fastRemove(index);
                return true;
            }
    }
    return false;
}

// 快速删除，不做边界检查，也不返回删除的元素值
private void fastRemove(int index) {
    modCount++;
    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index, numMoved);
    elementData[--size] = null; // clear to let GC do its work
}
```

删除一个元素步骤：

1. 获取指定位置 index 处的元素值
2. 将 index+1 及之后的元素向前移动一位
3. 将最后一个元素置空，并将 size 值减 1
4. 返回被删除值，完成删除操作

### 使用注意

遍历集合删除时，不要在 foreach 循环里进行元素的 remove/add 操作，remove 元素请使用 Iterator 方法，如果是并发操作，需要对 Iterator 对象加锁

```java
private static List<String> list = new ArrayList<>(5);
static {
   list.add("add");
   list.add("delete");
   list.add("delete");
   list.add("update");
   list.add("query");
}
```

### fori 删除

```java
//顺序删除（会漏删）
@Test
public void foriDelete(){
    for (int i = 0; i < list.size(); i++) {
        if ("delete".equals(list.get(i))){
            list.remove(i);
        }
    }
    System.out.println("顺序删除之后的结果为-->"+list.toString());
    //顺序删除之后的结果为--> [add, delete, update, query]
}

//倒序删除
@Test
public void foriDelete(){
    for (int i = list.size() - 1; i >= 0; i--) {
        if ("delete".equals(list.get(i))){
            list.remove(i);
        }
    }
    System.out.println("倒序删除之后的结果为-->"+list.toString());
    //倒序删除之后的结果为--> [add, update, query]
}
```

ArrayList 在进行遍历的时候，如果删除某个元素，则后续的元素需要整体往前移动，当循环到 i = 1 的时候，找到了第 1 个 delete 字符串，然后删除，第 2 个 delete 以及之后的字符串会向前移动，这个时候第 2 个 delete 就在原数组的 1 位置了。当循环到 i = 2 的时候，正好把原来位置的 delete 给略过去了，导致漏删

### foreach 删除

删除一个元素后停止遍历可正常，多个元素删除有 CME 问题

```java
@Test
public void foreachDelete() {
    for (String s : list) {
        if (s.equals("delete")) {
            list.remove(s);
        }
    }
    System.out.println("foreach删除之后的结果为-->"+list.toString());
    //删除出错：java.util.ConcurrentModificationException
}
```

foreach 的原理其实是编译器会将其编译为迭代器 Iterator 的形式进行遍历，以下是对.class 文件反编译之后的代码。与真正的使用迭代器遍历的方式有点不同，删除的时候不是使用迭代器的 remove 方法，而是用的 ArrayList 的 remove 方法。

产生异常的原因：ArrayList 本身不是线程安全的，在使用迭代器遍历查询的时候，会有一个检查机制，来确保一个线程在遍历的时候，其他线程不会删除该集合中的元素

```java
@Test
public void foreachDelete() {
    Iterator var1 = list.iterator();
    while(var1.hasNext()) {
        String s = (String)var1.next();
        if (s.equals("delete")) {
            list.remove(s);
        }
    }
}
```

```java
private class Itr implements Iterator<E> {
    int cursor;       // index of next element to return
    int lastRet = -1; // index of last element returned; -1 if no such
    int expectedModCount = modCount;

    public boolean hasNext() {
        return cursor != size;
    }

    @SuppressWarnings("unchecked")
    public E next() {
        // 并发修改检测，检测不通过则抛出异常
        checkForComodification();
        int i = cursor;
        if (i >= size)
            throw new NoSuchElementException();
        Object[] elementData = ArrayList.this.elementData;
        if (i >= elementData.length)
            throw new ConcurrentModificationException();
        cursor = i + 1;
        return (E) elementData[lastRet = i];
    }
    
    /**确保 List 在同一时刻不会有多个线程进行删除**/
    final void checkForComodification() {
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
    }
}
```

使用 foreach 方式删除元素的时候，调用 ArrayList 的 remove 方法如下：

当在第一次找到 delete 字符串，并进行删除的时候，会对 modCount++。如果没有停止该遍历，则在下次循环的时候，会校验 modCount 与 expectedModCount 是否相等。若不等，则抛出并发修改异常。foreach 循环删除元素是可以的，但是只能删除一个元素，并立即停止遍历，在 remove 下加上 break 即可

### iterator 删除

```java
@Test
public void iteratorDelete(){
    Iterator<String> it = list.iterator();
    while(it.hasNext()){
        String x = it.next();
        if(x.equals("delete")){
            it.remove();
        }
    }
    System.out.println("iterator删除之后的结果为-->"+list.toString());
    //iterator 删除之后的结果为--> [add, update, query]
}
```

可正常删除，ArrayList 在使用迭代器 Iterator 进行删除的时候，逻辑如下：在进行删除的时候，会将 modCount 赋值给 expectedModCount，所以不会导致两者不相等，只要不是数组越界，就不会报出 ConcurrentModificationException 了

```java
public void remove() {
    if (lastRet < 0)
        throw new IllegalStateException();
    checkForComodification();

    try {
        ArrayList.this.remove(lastRet);
        cursor = lastRet;
        lastRet = -1;
        expectedModCount = modCount;
    } catch (IndexOutOfBoundsException ex) {
        throw new ConcurrentModificationException();
    }
}
```

## 其他

### trimToSize

底层的 Object 数组是有一个最大容量的，假如容量为 10，但是只存放了 3 个元素，调用 trimToSize 就会将数组压缩为一个容量为 3 的新数组。

```java
// 将数组容量缩小至元素数量
public void trimToSize() {
    modCount++;
    if (size < elementData.length) {
        elementData = (size == 0) ? EMPTY_ELEMENTDATA : Arrays.copyOf(elementData, size);
    }
}
```

### ensureCapacity

```java
/**
* 如有必要，增加此 ArrayList 实例的容量，以确保它至少可以容纳由 minimum capacity 参数指定的元素数。
* @param   minCapacity   所需的最小容量
*/
public void ensureCapacity(int minCapacity) {
    int minExpand = (elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) ? 0 : DEFAULT_CAPACITY;

    if (minCapacity > minExpand) {
        ensureExplicitCapacity(minCapacity);
    }
}
```

最好在 add 大量元素之前用 ensureCapacity 方法，以减少扩容机制增量重新分配的次数

```java
public class EnsureCapacityTest {
    
    public static void main(String[] args) {
        ArrayList<Object> list = new ArrayList<Object>();
        final int N = 10000000;
        long startTime = System.currentTimeMillis();
        //list.ensureCapacity(N);
        for (int i = 0; i < N; i++) {
            list.add(i);
        }
        long endTime = System.currentTimeMillis();
        System.out.println("使用ensureCapacity方法前："+(endTime - startTime));
        //System.out.println("使用 ensureCapacity 方法后："+(endTime1 - startTime1));
    }
}

// 执行结果：
// 使用 ensureCapacity 方法前：2158
// 使用 ensureCapacity 方法后：1773
```
