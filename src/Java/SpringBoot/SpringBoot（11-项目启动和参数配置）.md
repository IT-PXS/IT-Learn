---
title: SpringBoot（11-项目启动和参数配置）
tag:
  - SpringBoot
category: Java
description: 详细介绍SpringBoot项目的启动方式和参数配置方法，包括-D虚拟机参数、--命令行参数的使用，以及java -jar、nohup等不同启动方式的对比和实际应用场景
date: 2025-06-21 12:42:19
---


## 启动命令行参数

### -D参数

`-D` 要放到 `-jar` 前面，否则参数无效。以运行 jar 包为例，写法为：`-DpropName = propValue`

```shell
# 参数写法为：-Dproperty=value
java -Dserver.port=1234 -jar app.jar
```

**注意：** 如果属性值包含空格或特殊字符，需要使用双引号将值括起来

```shell
java -DmyProperty="some value with spaces" MyApplication
```

1. 在 `IDEA` 中通过虚拟机选项这里传递

![](SpringBoot（11-项目启动和参数配置）/1.png)

2. 代码中可以通过系统属性 `System.getProperties()` 获取

```java
public static void main(String[] args) {
    SpringApplication.run(App.class, args);
 
    // 1234
    System.out.println(System.getProperty("server.port"));
    System.out.println("*****启动成功*****");
}
```

### --参数

`--` 参数不能放到 `-jar` 前面，否则会报错。从 `main` 方法的参数传入，`SpringBoot` 会对这种参数进行自动解析，写法为：`--key = value`

```shell
java -jar app.jar --server.port=4321
```

1. 在 `IDEA` 中这么传递

![](SpringBoot（11-项目启动和参数配置）/2.png)

2. 代码中是通过 `main` 函数参数 `String [] args` 传入

通过 `SpringApplication.run(App.class, args)` 传入 `SpringBoot` 进行解析的

可以通过实现 `EnvironmentAware` 接口注入环境对象，可以读取命令行参数

```java
@SpringBootApplication
public class App implements EnvironmentAware {
 
    static Environment environment;
 
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
 
        // 1234
        System.out.println(System.getProperty("server.port"));
        // 4321  同名的命令行参数覆盖虚拟机参数
        System.out.println(environment.getProperty("server.port"));
        System.out.println(environment.getProperty("user.dir"));
        System.out.println("*****启动成功*****");
    }

    // 注入环境对象
    @Override
    public void setEnvironment(Environment environment) {
        App.environment = environment;
    }
}
```

### 注意

**命令行参数与虚拟机参数同名的，以命令行参数优先**


## 项目启动

1. `java -jar demo.jar`

用这种方法启动后，不能继续执行其它命令了，如果想要继续执行其它命令，需要退出当前命令运行窗口，会打断 `jar` 的运行，打断一般用 `Ctrl+C`

2. `java -jar demo.jar &`

第 2 种在第 1 种方式的基础上在命令的结尾增加了 `&`，`&` 表达的意思是在后台运行。

这种方式可以避免打断后程序停止运行的问题，但是如果关闭当前窗口后程序会停止运行。

3. `nohup java -jar demo.jar &`

第 3 种在第 2 种方式的基础上，在命令的最前面增加了 `nohup`。

`nohup` 是不挂断运行命令，当账户退出或终端关闭时，程序仍然运行。

加了 `nohup` 后，即使关掉命令窗口，后台程序 `demo.jar` 也会一直执行

4. `nohup java -jar demo.jar > 1.txt &`

第 4 种在第 3 种的基础上，在后面增加了 `> 1.txt`，意思是将 `nohup java -jar demo.jar` 的运行内容重定向输出到 `1.txt` 文件中，即输出内容不打印到当前窗口上，而是输出到 `1.txt` 文件中。

第 3 种没有加 `> 1.txt`，它的输出重定向到 `nohup.out` 文件中，`nohup.out` 也就是 `nohup` 命令的默认输出文件，文件位于 `$HOME/nohup.out` 文件中，比如用 `root` 执行，就会输出到 `/root/nohup.out`。

5. `nohup java -jar demo.jar >/dev/null 2>&1 &`

`>/dev/null 2>&1 &` 代表重定向到哪里，例如：`echo "123" > /home/123.txt`

- `/dev/null` 代表空设备文件
- `2>` 表示 `stderr` 标准错误
- `&` 表示等同于的意思，`2>&1`，表示 `2` 的输出重定向等同于 `1`
- `1` 表示 `stdout` 标准输出，系统默认值是 `1`，所以 `">/dev/null"` 等同于 `"1>/dev/null"`
- 最后一个 `&` 表示在后台运行。

```text
0 标准输入（一般是键盘）
1 标准输出（一般是显示屏，是用户终端控制台）
2 标准错误（错误信息输出）
/dev/null：首先表示标准输出重定向到空设备文件，也就是不输出任何信息到终端，说白了就是不显示任何信息。
一般项目中定义中输出运行日志到指定地址，这样的话，就不需要再单独输出nohup.out文件，这种情况可以考虑使用这种
```