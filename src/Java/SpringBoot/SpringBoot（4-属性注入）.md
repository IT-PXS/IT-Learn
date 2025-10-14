---
title: SpringBoot（4-属性注入）
tag:
  - SpringBoot
category: Java
description: Spring Boot 提供 @Value 和 @ConfigurationProperties 进行属性注入。@Value 适用于简单配置，支持 SpEL 表达式；@ConfigurationProperties 适合批量注入，支持类型安全绑定，推荐用于复杂配置管理。
date: 2025-03-20 12:42:19
---

## @Value

### 读取配置参数

1. 在 `application.properties` 文件设置属性

```properties
my.name=mydlq
my.age=18
```

2. 使用 @Value 读取配置文件

```java
@Component
public class ReadProperties {
    @Value("${my.name}")
    private String name;

    @Value("${my.age}")
    private Integer age;
}
```

3. 并且还可以设置一个默认值，从配置文件读取不到时使用默认值

```java
@Component
public class ReadProperties {
    //:表示当取不到配置文件的值时使用默认值
    @Value("${my.name:默认姓名}")
    private String name;

    @Value("${my.age:18}")
    private Integer age;
}
```

### 给参数设定值

使用@Value 注解给参数设定值，达到跟 "=" 号一样的赋值效果

```java
@Component
public class ReadProperties {
    
    @Value("#{'test value'}")
    private String value;
}
```

### 读取系统属性

```java
@Component
public class ReadProperties {

    @Value("#{systemProperties['os.name']}")
    private String systemPropertiesName;
}
```

### 读取 Bean 的属性

```java
@Data
public class User{
    private String name;
    
    private String age;
}
```

```java
@Component
public class ReadProperties {

    @Bean
    public User user(){
        User user = new User();
        user.setName("测试");
        user.setAge("18");
        return user;
    }

    @Value("#{user.name}")
    private String value;  
}
```

### 使用 SPEL 表达式

```java
@Component
public class ReadProperties {

    // 使用SpEL表达式生成随机数
    @Value("#{ T(java.lang.Math).random() * 100.0 }")
    private double random;
}
```

### 读取 Resource 资源文件

```java
@Component
public class ReadProperties {

    @Value("classpath:application.properties")
    private Resource resourceFile;

    public void test(){
        // 如果文件存在，就输出文件名称
        if(resourceFile.exists()){
            System.out.println(resourceFile.getFilename());
        }
    }
}
```

### 读取 List、Map

```properties
test.list=topic1,topic2,topic3
test.maps="{key1: 'value1', key2: 'value2'}"
```

```java
// 获取List
@Value("${test.list.ids:1,2,3}")
private List<String> testList;

// 获取数组
@Value("${test.list.ids:1,2,3}")
private String[] testList;

// list指定分隔符
@Value("#{'${test.list}'.split(',')}")
private List<String> list;

// 获取map
@Value("#{${test.maps}}")  
private Map<String,String> maps;
```

### 静态变量赋值

```java
// 错误例子，spring 不允许/不支持把值注入到静态变量中，会得到null
@Value("${ES.CLUSTER_NAME}")
private static String CLUSTER_NAME;
```

```java
private static String CLUSTER_NAME;

//可以利用非静态setter 方法注入静态变量
//@Value必须修饰在方法上，且set方法不能有static，这样就能获得值了
@Value("${ES.CLUSTER_NAME}")
public void setClusterName(String clusterName) {
    CLUSTER_NAME = clusterName;
}
```

## @ConfigurationProperties

### 读取 String 类型

1. 在 `application.properties` 文件设置属性

```properties
my.name=mydlq
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置

```java
@Configuration
//配置 prefix 来过滤对应前缀
@ConfigurationProperties(prefix = "my")
public class ConfigurationReadConfig {

    private String name;
    
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
}
```

### 读取 List 类型

1. 在 `application.properties` 文件设置属性

```properties
my.list[0]=a
my.list[1]=b
my.list[2]=c
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置

```java
@Configuration
@ConfigurationProperties(prefix = "my")
public class ConfigurationReadConfig {

    private List<String> list;

    public List<String> getList() {
        return list;
    }
    public void setList(List<String> list) {
        this.list = list;
    }
}
```

### 读取 Map 类型

1. 在 `application.properties` 文件设置属性

```properties
my.map.name=xiao-li
my.map.sex=man
my.map.age=20
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置

```java
@Configuration
@ConfigurationProperties(prefix = "my")
public class ConfigurationReadConfig {

    private Map<String, String> map;
    
    public Map<String, String> getMap() {
        return map;
    }
    public void setMap(Map<String, String> map) {
        this.map = map;
    }
}
```

### 读取 Time 类型

1. 在 `application.properties` 文件设置属性

```properties
my.time=20s
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置

```java
@Configuration
@ConfigurationProperties(prefix = "my")
public class ConfigurationReadConfig {

     /**
     * 设置以秒为单位
     */
    @DurationUnit(ChronoUnit.SECONDS)
    private Duration time;
    
    public Duration getTime() {
        return time;
    }
    public void setTime(Duration time) {
        this.time = time;
    }  
}
```

### 读取参数并进行 Valid 校验

1. 在 `application.properties` 文件设置属性

```properties
my.name=xiao-ming
my.age=20
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置

```java
@Validated  // 引入效验注解
@Configuration
@ConfigurationProperties(prefix = "my")
public class ConfigurationReadConfigAndValid {

    @NotNull(message = "姓名不能为空")
    private String name;
    @Max(value = 20L,message = "年龄不能超过 20 岁")
    private Integer age;
    
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
}
```

### 读取配置到新建 Bean 中

1. 在 `application.properties` 文件设置属性

```properties
user.name=mydlq
user.age=22
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置到新建的 Bean 对象中

```java
@Data
public class User {
    private String name;
    
    private Integer age;
}
```

```java
@Configuration
public class ConfigurationReadObject {

    @Bean("user")
    @ConfigurationProperties(prefix = "user")
    public User createUser(){
        return new User();
    }
}
```

### 从指定配置文件读取

使用 `@ConfigurationProperties` 注解是默认从 `application.properties` 或者 `application.yaml` 中读取配置，有时候我们需要将特定的配置放到单独的配置文件中，这时候需要 `@PropertySource` 与 `@ConfigurationProperties` 配置使用，使用 `@PropertySource` 注解指定要读取的文件，使用 `@ConfigurationProperties` 相关属性

1. 在 `test.txt` 文件设置属性

```java
my.name=mydlq
```

2. 使用 `@ConfigurationProperties` 注解读取对应配置

```java
@Configuration
@ConfigurationProperties(prefix = "my")
@PropertySource(encoding = "UTF-8", ignoreResourceNotFound = true, value = "classpath:test.txt")
public class ConfigurationReadConfig {

    private String name;

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
}
```

## Environment

1. 在 `application.properties` 文件设置属性

```properties
my.name=mydlq
```

2. 使用 `Environment` 读取配置

```java
@Component
public class EnvironmentReadConfig {

    private String name;

    @Autowired
    private Environment environment;

    public String readConfig(){
        name = environment.getProperty("my.name", "默认值");
    }
}
```

```java
@Service
// 该注解的作用是使 MyConfigurationProperties 这个类上标注的 @ConfigurationProperties 注解生效,并且会自动将这个类注入到 IOC 容器中
@EnableConfigurationProperties(MyConfigurationProperties.class)
public class HelloServiceImpl implements HelloService {
}
```

## PropertiesLoaderUtils

1. 在 application.properties 文件设置属性

```properties
my.name=mydlq
```

2. 使用 PropertiesLoaderUtils 读取配置

```java
public class PropertiesReadConfig {

    private String name;

    public void readConfig() {
        try {
            ClassPathResource resource = new ClassPathResource("application.properties");
            Properties properties = PropertiesLoaderUtils.loadProperties(resource);
            name = properties.getProperty("my.name", "默认值");
        } catch (IOException e) {
            log.error("", e);
        }
    }
}
```

**Properties**

1. setProperty(String  key, String  value)：调用 Hashtable 的方法 put
2. getProperty(String  key)：用指定的键在此属性列表中搜索属性
3. getProperty(String  key, String  defaultValue)：用指定的键在属性列表中搜索属性，没有则输出 defaultValue

```java
public static void main(String[] args) {
    Properties properties=new Properties();
    //与map使用方法相同
    properties.put("das","fsdf");
    properties.put("ds","czx");
    properties.put("czx","fds");
    Set<Object> objects = properties.keySet();
    for (Object key:objects){
        Object o = properties.get(key);
        System.out.println(key+" "+o);
    }
}
```

```java
public static void main(String[] args) {
    Properties properties=new Properties();
    properties.setProperty("fasf","cz");
    properties.setProperty("czx","vc");
    properties.setProperty("vxc","gfd");
    System.out.println(properties.getProperty("vxc"));
    System.out.println(properties);
    //把key值转换成set 的形式，遍历set
    Set<String> strings = properties.stringPropertyNames();
    for (String s:strings){
        String property = properties.getProperty(s);
        System.out.println(s+" "+property);
    }
}
```

4. load(InputStream  inStream)：从输入流中读取属性列表（键和元素对）
5. load(Reader  reader)：按简单的面向行的格式从输入字符流中读取属性列表（键和元素对）
6. loadFromXML(InputStream  in)：将指定输入流中由 XML 文档所表示的所有属性加载到此属性表中
7. store(OutputStream  out, String  comments)：以适合使用 load(InputStream) 方法加载到 Properties 表中的格式，将此 Properties 表中的属性列表（键和元素对）写入输出流
8. store(Writer  writer, String  comments)：以适合使用 load(Reader) 方法的格式，将此 Properties 表中的属性列表（键和元素对）写入输出字符
9. storeToXML(OutputStream  os, String  comment)：发出一个表示此表中包含的所有属性的 XML 文档
10. storeToXML(OutputStream  os, String  comment, String  encoding)：使用指定的编码发出一个表示此表中包含的所有属性的 XML 文档

```java
public static void main(String[] args) throws IOException {
    myStore();
    mtLoad();
}

// 读取文件内容
private static void mtLoad() throws IOException{
    Properties properties=new Properties();
    FileReader fileReader=new FileReader("1.txt");
    properties.load(fileReader);
    fileReader.close();
    System.out.println(properties);
}

// 将内容写到文件
private static void myStore() throws IOException{
    Properties properties=new Properties();
    properties.setProperty("das","cz");
    properties.setProperty("czx","vxc");
    properties.setProperty("cz","vcx");
    FileWriter fileWriter=new FileWriter("1.txt");
    properties.store(fileWriter,"test1");
    fileWriter.close();
}
```

