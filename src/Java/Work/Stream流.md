---
title: Stream流
tag: 工作技巧
category: Java
description: Stream流是Java 8新特性，通过Stream流可以简化集合遍历，提高代码可读性，同时可以避免空指针异常。Java Stream流操作提供了一种声明式的方式来处理集合数据，通过流水线式的操作，Stream可以对数据进行过滤、映射、排序、聚合等处理，支持并行计算以提高性能。常见操作包括filter、map、reduce，能够简化代码，提高可读性和可维护性。
date: 2024-10-20 22:38:34
---


## Stream流创建

### 通过集合生成
```java
// List转Stream
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> stream1 = list.stream();
stream1.forEach(System.out::println);
System.out.println("=====================");

// Set转Stream
Set<String> set = new HashSet<>(Arrays.asList("a", "b", "c"));
Stream<String> stream2 = set.stream();
stream2.forEach(System.out::println);
System.out.println("=====================");

// Map转Stream
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.put("b", 2);
Stream<Map.Entry<String, Integer>> stream3 = map.entrySet().stream();
stream3.forEach(System.out::println);
System.out.println("=====================");
```

### 通过数组生成
```java
// 基本类型数组
int[] intArray = {1, 2, 3, 4, 5};
IntStream intStream = Arrays.stream(intArray);
// 该方法生成的流是数值流（IntStream）而不是 Stream，使用数值流可以避免计算过程中拆箱装箱，提高性能

// 对象数组
String[] stringArray = {"a", "b", "c"};
Stream<String> stringStream = Arrays.stream(stringArray);
```

### 通过值生成
```java
// 使用Stream.of()
Stream<Integer> stream1 = Stream.of(1, 2, 3, 4, 5);
Stream<String> stream2 = Stream.of("a", "b", "c");

// 创建空流
Stream<String> emptyStream = Stream.empty();
```

### 通过文件生成
```java
// 读取文件行
try (Stream<String> lines = Files.lines(Paths.get("data.txt"), Charset.defaultCharset())) {
    lines.forEach(System.out::println);
}
```

### 通过函数生成
```java
// 使用iterate生成无限流
// 第一个为初始值，第二个为进行的函数操作
Stream<Integer> evenNumbers = Stream.iterate(0, n -> n + 2).limit(10);

// 使用generate生成无限流
// generate 方法接受一个参数，方法参数类型为 Supplier
Stream<Double> randomNumbers = Stream.generate(Math::random).limit(5);
```

## 中间操作

中间操作返回一个新的Stream，可以链式调用。中间操作是延迟执行的，只有在终端操作时才会真正执行。


### filter - 条件筛选
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 筛选偶数
List<Integer> evenNumbers = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// 结果: [2, 4, 6, 8, 10]

// 筛选大于5的数
List<Integer> greaterThan5 = numbers.stream()
    .filter(n -> n > 5)
    .collect(Collectors.toList());
// 结果: [6, 7, 8, 9, 10]
```

### distinct - 去重
```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 4, 5);

List<Integer> uniqueNumbers = numbers.stream()
    .distinct()
    .collect(Collectors.toList());
// 结果: [1, 2, 3, 4, 5]
```

### limit - 限制数量
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> first5 = numbers.stream()
    .limit(5)
    .collect(Collectors.toList());
// 结果: [1, 2, 3, 4, 5]
```

### skip - 跳过元素
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

List<Integer> skipFirst3 = numbers.stream()
    .skip(3)
    .collect(Collectors.toList());
// 结果: [4, 5, 6, 7, 8, 9, 10]
```


### map - 元素转换

流映射就是将接受的元素映射成另外一个元素，通过 map 方法可以完成映射

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// 转换为大写
List<String> upperNames = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());
// 结果: ["ALICE", "BOB", "CHARLIE"]

// 获取字符串长度
List<Integer> nameLengths = names.stream()
    .map(String::length)
    .collect(Collectors.toList());
// 结果: [5, 3, 7]
```

**常用方法**

1. mapToDouble
2. mapToInt
3. mapToLong

**使用案例**

1. 当出现相同的 key 时，解决方法：取前面 value 的值，或者取后面放入的 value 值，则覆盖先前的 value 值

```java
Map<Long, String> map = userList.stream()
        .collect(Collectors.toMap(User::getId, User::getUsername, (v1, v2) -> v1));
Map<Long, String> map = userList.stream()
        .collect(Collectors.toMap(User::getId, User::getUsername, (v1, v2) -> v2));
```

2. 对相同 key 值的数据进行合并

```java
// 处理 itemList 合并相同物料累加数量
Map<Long, Integer> map = itemList.stream().collect(Collectors.toMap(StocksComponentsItem::getStocksId, StocksComponentsItem::getCount, (e1, e2) -> e1 + e2));       
```

3. 获取 TreeMap，根据 key 值进行排序

```java
Map<Long, String> treeMap = new HashMap<>();
TreeMap<Long, String> map = treeMap.entrySet().stream()
.collect(Collectors.toMap(entry -> entry.getKey(), entry -> entry.getValue(), 
                          (v1, v2) -> v1, TreeMap::new));
```

### flatMap - 扁平化映射

扁平化映射，将多个 stream 连接成一个 stream，这个操作是针对类似多维数组的，比如集合里面包含集合，相当于降维作用

```java
// 处理嵌套集合
List<List<String>> nestedList = Arrays.asList(
    Arrays.asList("a", "b"),
    Arrays.asList("c", "d"),
    Arrays.asList("e", "f")
);

List<String> flattened = nestedList.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList());
// 结果: ["a", "b", "c", "d", "e", "f"]
```

```java
// 实际应用：获取所有学生的姓名
@Data
public class Class {
    private String className;
    private List<Student> students;
}

List<Class> classes = getClasses();
List<String> allStudentNames = classes.stream()
    .map(Class::getStudents)
    .flatMap(Collection::stream)
    .map(Student::getName)
    .collect(Collectors.toList());
```


### sorted - 排序
```java
List<String> names = Arrays.asList("charlie", "alice", "bob");

// 自然排序
List<String> sortedNames = names.stream()
    .sorted()
    .collect(Collectors.toList());
// 结果: ["alice", "bob", "charlie"]

// 自定义排序（按长度）
List<String> sortedByLength = names.stream()
    .sorted(Comparator.comparing(String::length))
    .collect(Collectors.toList());
// 结果: ["bob", "alice", "charlie"]

// 多条件排序
List<Student> students = getStudents();
List<Student> sortedStudents = students.stream()
    .sorted(Comparator.comparing(Student::getAge)
        .thenComparing(Student::getName))
    .collect(Collectors.toList());
```

1. sorted()：自然排序，流中元素需实现 Comparable 接口

```java
List<String> list = Arrays.asList("aa", "ff", "dd");
//String 类自身已实现 Compareable 接口
list.stream().sorted().forEach(System.out::println);// aa dd ff
```

2. sorted(Comparator com)：定制排序，自定义 Comparator 排序器

```java
Student s1 = new Student("aa", 10);
Student s2 = new Student("bb", 20);
Student s3 = new Student("aa", 30);
Student s4 = new Student("dd", 40);
List<Student> studentList = Arrays.asList(s1, s2, s3, s4);
  
//自定义排序：先按姓名升序，姓名相同则按年龄升序
studentList.stream().sorted(
    (o1, o2) -> {
        if (o1.getName().equals(o2.getName())) {
        	return o1.getAge() - o2.getAge();
        } else {
        	return o1.getName().compareTo(o2.getName());
        }
	}
).forEach(System.out::println);　
```

### peek - 调试操作
```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

List<String> result = names.stream()
    .peek(System.out::println)  // 打印每个元素
    .map(String::toUpperCase)
    .peek(System.out::println)  // 打印转换后的元素
    .collect(Collectors.toList());
```

### concat - 合并操作

```java
//创建一个集合，存储多个字符串元素 
ArrayList<String> list = new ArrayList<String>();
list.add("心如音");
list.add("流老蛋");
list.add("王值");
list.add("李尔");
list.add("张新敏");
list.add("张天坤");

//需求 1：取前 4 个数据组成一个流 
Stream<String> s1 = list.stream().limit(4);
//需求 2：跳过 2 个数据组成一个流 
Stream<String> s2 = list.stream().skip(2);
//需求 3：合并需求 1 和需求 2 得到的流，并把结果在控制台输出 
Stream.concat(s1,s2).forEach(System.out::println); 
//需求 4：合并需求 1 和需求 2 得到的流，并把结果在控制台输出，要求字符串元素不能重复 
Stream.concat(s1,s2).distinct().forEach(System.out::println);
```


## 终端操作

终端操作会触发Stream的执行，返回非Stream类型的结果。


### anyMatch - 是否存在满足条件的元素
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

boolean hasEven = numbers.stream().anyMatch(n -> n % 2 == 0);
// 结果: true

boolean hasNegative = numbers.stream().anyMatch(n -> n < 0);
// 结果: false
```

### allMatch - 是否所有元素都满足条件
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

boolean allPositive = numbers.stream().allMatch(n -> n > 0);
// 结果: true

boolean allEven = numbers.stream().allMatch(n -> n % 2 == 0);
// 结果: false
```

### noneMatch - 是否没有元素满足条件
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

boolean noneNegative = numbers.stream().noneMatch(n -> n < 0);
// 结果: true

boolean noneEven = numbers.stream().noneMatch(n -> n % 2 == 0);
// 结果: false
```

### findFirst - 查找第一个元素
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Optional<Integer> firstEven = numbers.stream()
    .filter(n -> n % 2 == 0)
    .findFirst();
// 结果: Optional[2]
```

### findAny - 查找任意一个元素
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Optional<Integer> anyEven = numbers.stream()
    .filter(n -> n % 2 == 0)
    .findAny();
// 结果: Optional[2] (在并行流中可能返回不同的偶数)
```


### count - 计数
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

long evenCount = numbers.stream()
    .filter(n -> n % 2 == 0)
    .count();
// 结果: 5
```

### max/min - 最大值/最小值
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

Optional<Integer> max = numbers.stream().max(Integer::compareTo);
// 结果: Optional[5]

Optional<Integer> min = numbers.stream().min(Integer::compareTo);
// 结果: Optional[1]

// 对象的最大最小值
List<Student> students = getStudents();
Optional<Student> oldestStudent = students.stream()
    .max(Comparator.comparing(Student::getAge));
```

### 求不同值

1. summingInt：求和
2. sum：求和
3. averagingInt：求平均值
4. summarizingInt：同时求总和、平均值、最大值、最小值

```java
int sum = menu.stream().collect(Collectors.summingInt(Dish::getCalories));
int sum = menu.stream().map(Dish::getCalories).reduce(0, Integer::sum);
int sum = menu.stream().mapToInt(Dish::getCalories).sum();

double average = menu.stream().collect(Collectors.averagingInt(Dish::getCalories));

IntSummaryStatistics intSummaryStatistics = menu.stream().collect(Collectors.summarizingInt(Dish::getCalories));
double average = intSummaryStatistics.getAverage();  //获取平均值
int min = intSummaryStatistics.getMin();  //获取最小值
int max = intSummaryStatistics.getMax();  //获取最大值
long sum = intSummaryStatistics.getSum();  //获取总和
```


### reduce - 归约
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 求和
Integer sum = numbers.stream().reduce(0, Integer::sum);
// 结果: 15

// 求积
Integer product = numbers.stream().reduce(1, (a, b) -> a * b);
// 结果: 120

// 字符串拼接
List<String> words = Arrays.asList("Hello", "World", "Java");
String result = words.stream().reduce("", String::concat);
// 结果: "HelloWorldJava"

// 不使用初始值的归约
Optional<Integer> sumOptional = numbers.stream().reduce(Integer::sum);
// 结果: Optional[15]
```


### collect - 收集到集合
```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// 收集到List
List<String> nameList = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// 收集到Set
Set<String> nameSet = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toSet());

// 收集到特定集合
TreeSet<String> nameTreeSet = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toCollection(TreeSet::new));
```

### toMap - 收集到Map
```java
List<Student> students = getStudents();

// 基本映射
Map<String, Integer> nameToAge = students.stream()
    .collect(Collectors.toMap(Student::getName, Student::getAge));

// 处理重复key
Map<String, Integer> nameToAgeWithMerge = students.stream()
    .collect(Collectors.toMap(
        Student::getName,
        Student::getAge,
        (existing, replacement) -> existing  // 保留第一个
    ));

// 收集到特定Map类型
TreeMap<String, Integer> nameToAgeTreeMap = students.stream()
    .collect(Collectors.toMap(
        Student::getName,
        Student::getAge,
        (existing, replacement) -> existing,
        TreeMap::new
    ));
```

### groupingBy - 分组
```java
List<Student> students = getStudents();

// 按年龄分组
Map<Integer, List<Student>> studentsByAge = students.stream()
    .collect(Collectors.groupingBy(Student::getAge));

// 按年龄分组，只保留姓名
Map<Integer, List<String>> namesByAge = students.stream()
    .collect(Collectors.groupingBy(
        Student::getAge,
        Collectors.mapping(Student::getName, Collectors.toList())
    ));

// 多级分组
Map<String, Map<Integer, List<Student>>> studentsByGenderAndAge = students.stream()
    .collect(Collectors.groupingBy(
        Student::getGender,
        Collectors.groupingBy(Student::getAge)
    ));
```

### partitioningBy - 分区
```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 按奇偶分区
Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// 结果: {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}
```

### joining - 字符串拼接
```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// 简单拼接
String result1 = names.stream().collect(Collectors.joining());
// 结果: "alicebobcharlie"

// 带分隔符拼接
String result2 = names.stream().collect(Collectors.joining(", "));
// 结果: "alice, bob, charlie"

// 带前缀和后缀
String result3 = names.stream().collect(Collectors.joining(", ", "[", "]"));
// 结果: "[alice, bob, charlie]"
```

### mapping - 获取属性映射集合

对分组之后的对象集合转换为对象的某个属性的集合

```java
public static void main(String[] args) {
    List<Person> personList = new ArrayList<>();
    // 四个参与测试的小伙伴
    Person tom = new Person("tom", "男", 11);
    Person amy = new Person("amy", "女", 13);
    Person ali = new Person("ali", "男", 12);
    Person daming = new Person("daming", "男", 13);
    personList.add(tom);
    personList.add(amy);
    personList.add(ali);
    personList.add(daming);
    // 对小伙伴按照性别 age 进行分组
    Map<String, Set<String>> resultMap = personList.stream().collect(Collectors.groupingBy(Person::getSex, Collectors.mapping(Person::getName, Collectors.toSet())));
    System.out.println(resultMap.toString());
}
```

### collectingAndThen - 归纳处理

```java
// 按, 拼接成字符串后全部转为大写
String collect = Stream.of("ma", "zhi", "chu")
        .collect(Collectors.collectingAndThen(Collectors.joining(","),String::toUpperCase));
System.out.println(collect);
```


### forEach - 遍历
```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// 顺序遍历
names.stream().forEach(System.out::println);

// 并行遍历（顺序不确定）
names.parallelStream().forEach(System.out::println);
```

### toArray - 转换为数组
```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

String[] nameArray = names.stream().toArray(String[]::new);
```

## 并行流

Stream支持并行处理，可以充分利用多核CPU的优势。

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 创建并行流
Stream<Integer> parallelStream = numbers.parallelStream();

// 并行处理
long sum = numbers.parallelStream()
    .filter(n -> n % 2 == 0)
    .mapToLong(Integer::longValue)
    .sum();

// 注意：并行流中的操作应该是无状态的
```