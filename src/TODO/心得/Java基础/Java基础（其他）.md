---
title: Java基础（其他）
series: Java基础
tags:
  - Java基础
categories:
  - Java基础
cover: /img/index/java2.jpg
top_img: /img/index/java2.jpg
description: Java是一种面向对象的编程语言，具有跨平台特性（JVM实现）。核心基础包括数据类型、变量、运算符、流程控制（if/for等）、数组及字符串处理。类与对象、封装、继承和多态是OOP的核心。异常处理（try-catch）、集合框架（List/Map）和IO流为常用功能。学习Java基础是掌握高级开发的基石，强调代码规范和可维护性。
published: true
abbrlink: 16634
date: 2025-01-29 22:57:31
---

## 编译与解释

1. 编译型：编译型语言会通过编译器将源代码一次性翻译成可被该平台执行的机器码。一般情况下，编译语言的执行速度比较快，开发效率比较低。常见的编译性语言有 C、C++、Go、Rust 等等。

2. 解释型：解释型语言会通过解释器一句一句的将代码解释（interpret）为机器代码后再执行。解释型语言开发效率比较快，执行速度比较慢。常见的解释性语言有 Python、JavaScript、PHP 等等。

为了改善解释语言的效率而发展出的 即时编译 技术，已经缩小了这两种语言间的差距。这种技术混合了编译语言与解释型语言的优点，它像编译语言一样，先把程序源代码编译成字节码。到执行期时，再将字节码直译，之后执行。Java 与 LLVM 是这种技术的代表产物。

**为什么说 Java 语言“编译与解释并存”？**

这是因为 Java 语言既具有编译型语言的特征，也具有解释型语言的特征。因为 Java 程序要经过先编译，后解释两个步骤，由 Java 编写的程序需要先经过编译步骤，生成字节码（`.class` 文件），这种字节码必须由 Java 解释器来解释执行。

## JDK 和 JRE、JVM

### 区别

1. JRE：Java 运行环境，提供了 Java 运行所需的环境，包含了 JVM、核心类库和其他支持运行 Java 程序的文件
2. JDK：Java 开发工具包，提供了 Java 的开发环境和运行环境。JDK 包含了 JRE，如果只运行 Java 程序，安装 JRE 即可，要编写 Java 程序需安装 JDK
3. JVM：Java 虚拟机，是整个 Java 实现跨平台的最核心的部分，能够运行以 Java 语言写作的软件程序。所有的 Java 程序会首先被编译为.class 的类文件，这种类文件可以在虚拟机上运行

JVM 并不是只有一种！只要满足 JVM 规范，每个公司、组织或者个人都可以开发自己的专属 JVM。也就是说我们平时接触到的 HotSpot VM 仅仅是是 JVM 规范的一种实现而已。

### 字节码

在 Java 中，JVM 可以理解的代码叫做字节码（即扩展名为.class 的文件），它不面向任何特定的处理器，只面向虚拟机。Java 语言通过字节码的方法，在一定程度上解决了传统解释型语言执行效率低的问题，同时又保留了解释型语言可移植的特点。所以，Java 程序运行时相对来说还是高效的（不过，和 C++，Rust，Go 等语言还是有一定差距的），而且，由于字节码并不针对一种特定的机器，因此，Java 程序无需重新编译便可在多种不同操作系统的计算机上运行

![](Java基础（其他）/1.png)

![](Java基础（其他）/2.png)

### JIT

.class-> 机器码，在这一步 JVM 类加载器首先加载字节码文件，然后通过解释器逐行解释执行，这种方式的执行速度会相对比较慢。而且，有些方法和代码块是经常需要被调用的（也就是所谓的热点代码），所以后面引进了 JIT（just-in-time compilation）编译器，而 JIT 属于运行时编译。当 JIT 编译器完成第一次编译后，其会将字节码对应的机器码保存下来，下次可以直接使用

![](Java基础（其他）/6.png)

HotSpot 采用了惰性评估（Lazy Evaluation）的做法，根据二八定律，消耗大部分系统资源的只有那一小部分的代码（热点代码），而这也就是 JIT 所需要编译的部分。JVM 会根据代码每次被执行的情况收集信息并相应地做出一些优化，因此执行的次数越多，它的速度就越快。

JIT（Just-In-Time Compilation，即时编译） 是 Java 虚拟机（JVM）中的一项关键技术，其目的是提高 Java 程序的运行效率。JIT 编译器在程序运行时，将 Java 字节码（Bytecode）动态编译为本地机器码（Native Code），使代码能够直接在底层硬件上运行，而无需逐行解释，从而大幅提升性能。

**JIT 优化的特点**

1. 动态编译：JIT 编译发生在程序运行过程中，而不是预先编译。这使得 JVM 能根据运行时信息对代码进行优化。

2. 热点代码优化：JVM 使用“热点探测（HotSpot）”机制，识别运行频率较高的代码（即“热点代码”），并优先对其进行编译和优化。、

3. 高性能：通过将热点代码编译为机器码，以及对代码执行路径、内联、循环展开等进行优化，JIT 提高了运行效率。

4. 即时编译和解释执行并存：JVM 会先解释执行代码，随着热点代码的识别和编译，性能逐渐提升。

**JIT 编译的缺点**

1. 增加启动时间：由于 JIT 编译器在程序运行时编译代码，它可能导致应用程序的启动时间较长。
2. 影响应用性能：JIT 编译是需要进行热点代码检测、代码编译等动作的，这些都是要占用运行期的资源，所以，JIT 编译过程中也可能会影响应用性能。

**JIT 的主要优化手段**

- **方法内联**：将频繁调用的小方法直接插入调用方，减少方法调用的开销。
- **代码缓存**：将编译后的热点代码保存起来，避免重复编译。
- **循环展开**：优化循环执行，以减少循环条件判断和跳转的开销。
- **逃逸分析**：分析对象的作用范围，决定是否可以在栈上分配内存，而不是在堆上分配。

**热点检测**

描述：JIT 编译器通过监控程序运行时的行为，识别哪些代码被频繁执行（称为热点代码），这些代码往往是程序性能的核心部分。

实现：基于计数器或统计分析的方法，记录方法或循环的执行次数，当某些代码块累积执行次数超过阈值时，将其标记为热点代码并进行优化编译。

**编译优化**

描述：JIT 在将字节码编译为本地机器码时，会进行一系列优化来提升性能。

实现：包括指令优化（减少冗余指令）、循环展开（减少循环消耗）、常量折叠（预计算常量值）、死代码消除（移除无用代码）等多种优化技术。

**逃逸分析**

描述：分析程序中对象的作用范围，判断对象是否逃逸出方法或线程的作用域。

实现：

* 如果对象只在方法内部使用（未逃逸），则可以避免分配到堆内存。
* 如果对象未被线程共享（未线程逃逸），则不需要同步操作。
* 逃逸分析为后续的栈上分配、标量替换和锁消除提供基础支持。

**锁消除**

描述：在单线程环境下或对象未发生线程逃逸时，移除不必要的锁操作。

实现：通过逃逸分析判断同步代码块的锁对象是否只被当前线程访问，如果是，则将锁操作优化掉，从而提升性能。

**标量替换**

描述：将对象的字段分解为多个标量（如基本数据类型），避免创建对象。

实现：通过逃逸分析检测对象未逃逸，将其分解为成员变量的独立存储，直接在栈上分配而非堆上分配。

**栈上分配**

描述：将生命周期短且未逃逸的对象分配到栈而非堆中，从而减少 GC 压力。

实现：通过逃逸分析识别出局部对象，并将其内存分配在栈上，当方法执行完毕后内存自动释放。

**方法内联**

描述：将被调用的方法直接嵌入到调用处，减少方法调用的开销。

实现：

* JIT 编译器在热点代码中识别出小型或经常被调用的方法，将其直接展开到调用点。
* 方法内联不仅能减少方法调用的开销，还能为后续进一步优化（如常量折叠等）创造机会。

### AOT

JDK 9 引入了一种新的编译模式 AOT(Ahead of Time Compilation)。和 JIT 不同的是，这种编译模式会在程序被执行前就将其编译成机器码，属于静态编译（C、 C++，Rust，Go 等语言就是静态编译）。AOT 避免了 JIT 预热等各方面的开销，可以提高 Java 程序的启动速度，避免预热时间长。并且，AOT 还能减少内存占用和增强 Java 程序的安全性（AOT 编译后的代码不容易被反编译和修改），特别适合云原生场景。

1. AOT 的主要优势在于启动时间、内存占用和打包体积。
2. JIT 的主要优势在于具备更高的极限处理能力，可以降低请求的最大延迟。

**既然 AOT 这么多优点，那为什么不全部使用这种编译方式呢？**

我们前面也对比过 JIT 与 AOT，两者各有优点，只能说 AOT 更适合当下的云原生场景，对微服务架构的支持也比较友好。除此之外，AOT 编译无法支持 Java 的一些动态特性，如反射、动态代理、动态加载、JNI（Java Native Interface）等。然而，很多框架和库（如 Spring、CGLIB）都用到了这些特性。如果只使用 AOT 编译，那就没办法使用这些框架和库了，或者说需要针对性地去做适配和优化。举个例子，CGLIB 动态代理使用的是 ASM 技术，而这种技术大致原理是运行时直接在内存中生成并加载修改后的字节码文件也就是 `.class` 文件，如果全部使用 AOT 提前编译，也就不能使用 ASM 技术了。为了支持类似的动态特性，所以选择使用 JIT 即时编译器

**AOT 编译的特点**

1. 预先编译：Java 字节码在程序启动时或之前被编译为与目标平台相关的机器码，类似于 C/C++ 的编译方式。
2. 更短的启动时间：由于运行时无需解释或 JIT 编译，程序启动速度更快。
3. 可预测性：已生成的本地机器码在运行时性能稳定，不需要动态优化。
4. 跨平台性受限：AOT 编译生成的本地代码是与平台（操作系统、架构）相关的，失去了“Write Once, Run Anywhere”的特性

### JIT 编译和 AOT 编译的区别

| **特性**     | **JIT 编译**                           | **AOT 编译**                       |
| ------------ | -------------------------------------- | ---------------------------------- |
| **编译时机** | 程序运行时动态编译                     | 程序启动前提前编译                 |
| **性能表现** | 初次运行可能较慢，但长时间运行性能较高 | 启动速度快，运行性能较为稳定       |
| **优化能力** | 可动态优化，根据运行时信息调整代码     | 优化能力有限，无法根据实时情况调整 |
| **跨平台性** | 无需重新编译，依赖 JVM 解释            | 与平台强绑定，缺乏跨平台性         |
| **代码大小** | 保持字节码体积较小                     | 编译后生成的本地代码体积较大       |
| **适用场景** | 适合长时间运行的服务端应用或复杂任务   | 适合需要快速启动的轻量级应用       |

静态编译相比传统的 Java 动态编译（如 JIT 编译）具有以下几个主要优势：

1. 高效执行：静态编译生成的本地代码已经过优化，运行时无需解释执行或动态编译，能够直接高效地在硬件上运行。

2. 无需依赖 JVM：静态编译后的程序自包含必要的运行时支持，不再依赖完整的 JVM 环境，提供更轻量级的运行体验。

3. 快速启动：由于无需解释或等待 JIT 的“预热”，静态编译程序具有明显的冷启动优势，启动速度更快。

4. 降低边界开销：静态编译生成的代码也是本地代码，因此调用本地接口（如 JNI）时开销更低，提升了与底层系统交互的效率。

然而，静态编译也存在一定的局限性，主要体现在以下方面：

1. 封闭性要求：静态编译依赖“封闭性假设”，即所有运行时需要的内容必须在编译时确定。这对 Java 的动态特性提出了挑战。
2. 动态特性适配复杂：Java 的反射、动态代理、动态类加载、序列化以及 JNI 等特性无法在编译阶段完全确定，因此需要额外的适配工作，这增加了静态编译的复杂性和限制了其适用性。

## 引用和对象

1.  `new Hero();`：代表创建了一个 Hero 对象，但是也仅仅是创建了一个对象，没有办法访问它。
2.  `Hero h = new Hero();`：为了访问这个对象，会使用引用来代表这个对象，h 这个变量是 Hero 类型，又叫做引用。= 指的是 h 这个引用代表右侧创建的对象，在面向对象里，又叫做“指向”
3.  一个对象引用可以指向 0 个或 1 个对象；一个对象可以有 n 个引用指向它 
4.  对象相等一般比较的是内存中存放的内容是否相等 
5.  引用相等一般比较的是他们指向的内存地址是否相等 

### 创建对象的方法

1. 使用 new 关键字
2. 使用 Class 类的 newInstance 方法，该方法调用无参的构造器创建对象（反射）：Class.forName.newInstance()
3. 使用 clone()方法
4. 反序列化，例如：调用 ObjectInputStream 类的 readObject()方法

### 值传递和引用传递

1. 值传递是对基本型变量而言的，传递的是该变量的一个副本，改变副本不影响原变量
2. 引用传递一般是对于对象型变量而言的，传递的是该对象地址的一个副本，并不是原对象本身，在方法中对其值进行改变的时候，他的地址没有变，值也就跟着改变了，对引用对象进行操作会同时改变原对象

注意：Java 内的传递都是值传递

### 使用案例

1. 传递基本类型参数

```java
public static void main(String[] args) {
    int num1 = 10;
    int num2 = 20;
    swap(num1, num2);
    System.out.println("num1 = " + num1);
    System.out.println("num2 = " + num2);
}

public static void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
    System.out.println("a = " + a);
    System.out.println("b = " + b);
}
```

![](Java基础（其他）/3.png)

a、b 相当于 num1、num2 的副本，副本的内容无论怎么修改，都不会影响到原件本身

2. 传递引用类型参数

```java
public static void main(String[] args) {
    int[] arr = { 1, 2, 3, 4, 5 };
    System.out.println(arr[0]);
    change(arr);
    System.out.println(arr[0]);
}

public static void change(int[] array) {
    // 将数组的第一个元素变为0
    array[0] = 0;
}
```

![](Java基础（其他）/4.png)

3. 传递引用类型参数

```java
public class Person {
    private String name;
    // 省略构造函数、Getter&Setter方法
}

public static void main(String[] args) {
    Person xiaoZhang = new Person("小张");
    Person xiaoLi = new Person("小李");
    swap(xiaoZhang, xiaoLi);
    System.out.println("xiaoZhang:" + xiaoZhang.getName());
    System.out.println("xiaoLi:" + xiaoLi.getName());
}

public static void swap(Person person1, Person person2) {
    Person temp = person1;
    person1 = person2;
    person2 = temp;
    System.out.println("person1:" + person1.getName());
    System.out.println("person2:" + person2.getName());
}
```

![](Java基础（其他）/5.png)

swap 方法的参数 person1 和 person2 只是拷贝的实参 xiaoZhang 和 xiaoLi 的地址。因此，person1 和 person2 的互换只是拷贝的两个地址互换罢了，并不会影响到实参 xiaoZhang 和 xiaoLi

## 克隆

### 为什么要克隆？

克隆的对象可能包含一些已经修改过的属性，而 new 出来的对象的属性都还是初始化时候的值，所以当需要一个新的对象来保存当前对象的“状态”就靠 clone 方法了，那么把这个对象的临时属性一个一个赋值给我新 new 的对象不也行吗？可以，但是操作麻烦，且 clone 是一个 native 方法，在底层实现的，效率快

### 如何实现对象的克隆？

1. 实现 Cloneable 接口（为标记接口），重写 Object 类中的 clone()方法（浅克隆）
2. 实现 Serializable 接口，通过对象的序列化和反序列化实现克隆（深克隆）

### 深克隆和浅克隆

1. 浅克隆：被复制对象的所有变量都含有与原来的对象相同的值，而所有的对其他对象的引用仍然指向原来的对象

```java
public class Student{
    private Integer id;
    private String name;

    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }

    public Student(Integer id, String name) {
        this.id = id;
        this.name = name;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

```java
public class Person implements Cloneable {
    private Integer id;
    private String name;
    private Student student;

    @Override
    public String toString() {
        return "Person{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", student=" + student +
                '}';
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Person(Integer id, String name, Student student) {
        this.id = id;
        this.name = name;
        this.student = student;
    }

    @Override
    protected Person clone() throws CloneNotSupportedException {
        return (Person) super.clone();
    }


    public static void main(String[] args) throws CloneNotSupportedException {
        Student stu = new Student(1, "stu");
        Person per1 = new Person(1, "per", stu);
        Person per2 = per1.clone();
        System.out.println(per1);
        System.out.println(per2);
        System.out.println(per1.getStudent().getClass()==per2.getStudent().getClass());

        per1.setName("person");
        Student stu2 = per1.getStudent();
        stu2.setName("stu2");
        System.out.println(per1);
        System.out.println(per2);
        System.out.println(per1.getStudent().getClass()==per2.getStudent().getClass());
    }
}

/*
结果为：
Person{id=1, name='per', student=Student{id=1, name='stu'}}
Person{id=1, name='per', student=Student{id=1, name='stu'}}
true
Person{id=1, name='person', student=Student{id=1, name='stu2'}}
Person{id=1, name='per', student=Student{id=1, name='stu2'}}
true
*/
```

注意：克隆后的值变量会开辟新的内存地址，克隆对象修改值不会影响原来对象。引用类型只会存在一份内存地址，执行 Object 的 clone 方法拷贝的也是引用的复制（这部分的内存空间不一样），但是引用指向的内存空间是一样的，原对象修改变量或者浅拷贝修改引用变量都会引起双方的变化

2. 深克隆：拷贝对象和原始对象的引用类型引用不同对象。深拷贝是将对象及值复制过来，两个对象修改其中任意的值另一个值不会改变

```java
public class Student implements Cloneable {
    private String name;
    private int age;
    public Student(String name, int age){
        this.name = name;
        this.age = age;
    }

    @Override
    protected Object clone()  {
        try {
            return super.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
            return null;
        }
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

```java
public class Teacher implements Cloneable{
    private String name;
    private int age;
    private Student student;

    public Teacher(String name, int age, Student student){
        this.name = name;
        this.age = age;
        this.student = student;
    }
    // 覆盖
    @Override
    public Object clone() {
        Teacher t = null;
        try {
            t = (Teacher) super.clone();
            t.student = (Student)student.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return t;
    }
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }
}
```

```java
public class test {
    public static void main(String[] args) {
        Student s = new Student("学生1", 11);
        Teacher origin = new Teacher("老师原对象", 23, s);
        System.out.println("克隆前的学生姓名：" + origin.getStudent().getName());
        Teacher clone = (Teacher) origin.clone();
        // 更改克隆后的学生信息 更改了姓名
        clone.getStudent().setName("我是克隆对象更改后的学生2");
        System.out.println("克隆后的学生姓名：" + clone.getStudent().getName());
    }
}

/*
结果：
克隆前的学生姓名：学生1
克隆后的学生姓名：我是克隆对象更改后的学生2
*/
```

## 移位运算符

1. `<<` ：左移运算符，向左移若干位，高位丢弃，低位补零。`x << n` 相当于 x 乘以 2 的 n 次方(不溢出的情况下)。
2. `>>` ：带符号右移，向右移若干位，高位补符号位，低位丢弃。正数高位补 0，负数高位补 1。`x >> n` 相当于 x 除以 2 的 n 次方。
3. `>>>` ：无符号右移，忽略符号位，空位都以 0 补齐。

## switch 语句

在 switch(expr)中，expr 只能是一个整数表达式或者枚举常量。而整数表达式可以是 int 基本数据类型或者是 Integer 包装类型，由于 byte、short、char 都可以隐式转换为 int，而 long 和 String 类型都不符合 switch 的语法规定，并且不能被隐式地转换为 int 类型，所以它们都不能作用于 switch 语句中。JDK1.7 版本后 switch 就可以作用在 String 上了

## short s1 = 1; s1 = s1+1; 

1. 对于 short s1 = 1; s1 = s1+1; 来说，在 s1+1 运算时会自动提升表达式的类型为 int，那么将 int 型值赋给 short 型变量，s1 会出现类型转换错误，应改为：s1 =(short)(s1+1)
2. 对于 short s1 = 1; s1+= 1; 来说，+= 是 Java 语言规定的运算符，Java 编译器会对它进行特殊处理，因此可以正确编译

**注意：(x+= i)不等于(x = x+i)**

1. 第一个表达式使用的是复合赋值操作符，复合赋值表达式自动地将所执行计算的结果转型为其左侧变量的类型，
2. 如果结果的类型与该变量的类型相同，那么这个转型不会造成任何影响。
3. 如果结果的类型比该变量的类型要宽，那么复合赋值操作符将悄悄地执行一个窄化原生类型转换

## final、finally 和 finalize 的区别

1. final 用于声明属性、方法和类，分别表示属性不可变、方法不可覆盖、类不可继承
2. finally 作为异常处理的一部分，只能在 try/catch 语句中使用，finally 附带一个语句块用来表示这个语句最终一定被执行，经常被用在需要释放资源的情况下
3. finalize 是 Object 类的一个方法，在垃圾收集器执行的时候会调用被回收对象的 finalize()方法。当垃圾收集器准备好释放对象占用空间时，首先会调用 finalize()方法，并在下一次垃圾回收动作发生时真正回收对象占用的内存

## BigDecimal

### 为什么会出现 4.0-3.6 = 0.4000001 这种现象？

2 进制的小数无法精确的表示 10 进制小数，计算机在计算 10 进制小数的过程中要先转换为 2 进制进行计算，这个过程中出现了误差

```java
float a = 2.0f - 1.9f;
float b = 1.8f - 1.7f;
System.out.println(a);// 0.100000024
System.out.println(b);// 0.099999905
System.out.println(a == b);// false
```

### 使用 BigDecimal 解决精度丢失

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
BigDecimal c = new BigDecimal("0.8");

BigDecimal x = a.subtract(b);
BigDecimal y = b.subtract(c);

System.out.println(x); /* 0.1 */
System.out.println(y); /* 0.1 */
System.out.println(Objects.equals(x, y)); /* true */
```

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
System.out.println(a.add(b));// 1.9
System.out.println(a.subtract(b));// 0.1
System.out.println(a.multiply(b));// 0.90
System.out.println(a.divide(b));// 无法除尽，抛出 ArithmeticException 异常
System.out.println(a.divide(b, 2, RoundingMode.HALF_UP));// 1.11
```

```java
public enum RoundingMode {
   // 2.5 -> 3 , 1.6 -> 2
   // -1.6 -> -2 , -2.5 -> -3
             UP(BigDecimal.ROUND_UP),
   // 2.5 -> 2 , 1.6 -> 1
   // -1.6 -> -1 , -2.5 -> -2
             DOWN(BigDecimal.ROUND_DOWN),
             // 2.5 -> 3 , 1.6 -> 2
   // -1.6 -> -1 , -2.5 -> -2
             CEILING(BigDecimal.ROUND_CEILING),
             // 2.5 -> 2 , 1.6 -> 1
   // -1.6 -> -2 , -2.5 -> -3
             FLOOR(BigDecimal.ROUND_FLOOR),
       // 2.5 -> 3 , 1.6 -> 2
   // -1.6 -> -2 , -2.5 -> -3
             HALF_UP(BigDecimal.ROUND_HALF_UP),
   //......
}
```
