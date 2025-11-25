---
title: MySQL（3-事务和日志）
tags: MySQL
categories: 数据库
cover: /img/index/mysql.png
top_img: /img/index/mysql.png
published: false
abbrlink: 63240
date: 2024-11-22 22:38:34
description:
---

## MyBatis

### Mybatis 与 Hibernate

#### 区别

1. 映射关系

- MyBatis 是一个半自动映射的框架，配置 Java 对象与 sql 语句执行结果的对应关系，多表关联关系配置简单
- Hibernate 是一个全表映射的框架，配置 Java 对象与数据库表的对应关系，多表关联关系配置复杂

2. SQL 优化和移植性

- Hibernate 对 SQL 语句封装，提供了日志、缓存、级联（级联比 MyBatis 强大）等特性，此外还提供 HQL（Hibernate Query Language）操作数据库，数据库无关性支持好，但会多消耗性能。如果项目需要支持多种数据库，代码开发量少，但 SQL 语句优化困难。
- MyBatis 需要手动编写 SQL，支持动态 SQL、处理列表、动态生成表名、支持存储过程。开发工作量相对大些。直接使用 SQL 语句操作数据库，不支持数据库无关性，但 sql 语句优化容易。

3. 适用场景

- Hibernate 是标准的 ORM 框架，SQL 编写量较少，但不够灵活，适合于需求相对稳定，中小型的软件项目，比如：办公自动化系统
- MyBatis 是半 ORM 框架，需要编写较多 SQL，但是比较灵活，适合于需求变化频繁，快速迭代的项目，比如：电商网站

#### 半自动和全自动 ORM 框架

在持久层框架出现以前我们都使用 JDBC 对数据库进行操作

1. 加载驱动程序
2. 获取数据库连接
3. 创建 Statement/PerparedStatement 对象
4. 操作数据库
5. 关闭连接

```java
public static void main(String[] args) {
    Connection connection = null;
    PreparedStatement preparedStatement = null;
    ResultSet resultSet = null;

    try {
        //1、加载数据库驱动
        Class.forName("com.mysql.jdbc.Driver");
        //2、通过驱动管理类获取数据库链接
        connection =  DriverManager.getConnection("jdbc:mysql://localhost:3306/mybatis", "root", "root");
        //3、定义 sql 语句 ?表示占位符
        String sql = "select * from user where username = ?";
        //4、获取预处理 statement
        preparedStatement = connection.prepareStatement(sql);
        //5、设置参数，第一个参数为 sql 语句中参数的序号（从 1 开始），第二个参数为设置的参数值
        preparedStatement.setString(1, "王五");
        //6、向数据库发出 sql 执行查询，查询出结果集
        resultSet =  preparedStatement.executeQuery();
        //7、遍历查询结果集
        while(resultSet.next()){
            System.out.println(resultSet.getString("id")+"  "+resultSet.getString("username"));
        }
    } catch (Exception e) {
        e.printStackTrace();
    }finally{
        //8、释放资源
        if(resultSet!=null){
            try {
                resultSet.close();//释放结果集
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if(preparedStatement!=null){
            try {
                preparedStatement.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if(connection!=null){
            try {
                connection.close();//关闭数据库连接
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

**Mybatis 实现机制**

1. 读取 Mybatis 的全局配置文件 mybatis-config.xml
2. 创建 SqlSessionFactory 会话工厂
3. 创建 SqlSession 会话
4. 执行查询操作

mybatis-config.xml 文件中包括一系列配置信息，其中包括标签 <mapper>，此标签配置了映射节点，映射节点内部定义了 SQL 语句，Mybatis 将 SQL 的定义工作独立出来，让用户自定义，而 SQL 的解析、执行等工作交由 Mybatis 处理执行

**Hibenate 实现机制**

1. 构建 Configuration 实例，初始化该实例中的变量
2. 加载 hibenate.cfg.xml 文件到内存
3. 通过 hibenate.cfg.xml 文件中的 mapping 节点配置并加载 xxx.hbm.xml 文件至内存
4. 利用 Configuration 实例构建 SessionFactory 实例
5. 由 SessionFactory 实例构建 session 实例
6. 执行查询操作

#### 总结
1. 传统的 jdbc 是手工的，需要程序员加载驱动、建立连接、创建 Statement 对象、定义 SQL 语句、处理返回结果、关闭连接等操作
2. Hibernate 是自动化的，内部封装了 JDBC，连 SQL 语句都封装了，理念是即使开发人员不懂 SQL 语言也可以进行开发工作，向应用程序提供调用接口，直接调用即可
3. Mybatis 是半自动化的，是介于 jdbc 和 Hibernate 之间的持久层框架，也是对 jdbc 进行了封装，不过将 SQL 的定义工作独立了出来交给用户实现，负责完成剩下的 SQL 解析、处理等工作

### #{}和${}

#### 区别

1. #{}是预编译处理，表示一个占位符号，相当于 jdbc 中的?符号，在处理#{}时，会将 sql 中的#{}替换成?号，调用 PreparedStatement 的 set 方法来赋值；${}是字符串替换，是拼接符，Mybatis在处理${}的时候就是把${}替换成变量的值，调用 Statement 来赋值

```sql
-- 如：select * from user where name = #{userName}；设 userName = yuze
-- 看日志我们可以看到解析时将#{userName}替换成了 ？，然后再把 yuze 放进去，外面加上单引号
select * from user where name = ?;


-- 如：select * from user where name = ${userName}；设 userName = yuze
-- 看日志可以发现就是直接把值拼接上去了
select * from user where name = yuze;
```

2. 使用#{}可以有效地防止 SQL 注入，提高系统安全性
3. #{}的变量替换是在 DBMS 中，变量替换后，#{}对应的变量自动加上单引号
4. ${}的变量替换是在DBMS外，变量替换后，${}对应的变量不会加上单引号

注意：动态传表名时需要使用${}，不能使用#{}

#### SQL 注入
`SELECT * FROM user WHERE name = '${name}' AND password = '${password}'`

可以让一个 user 对象的 password 属性为 `'' OR '1' = '1'`，最终的 SQL 就变成了

`SELECT * FROM user WHERE name = 'yogurt' AND password = '' OR '1' = '1'`，因为 `OR '1' = '1'` 恒成立，这样攻击者在不需要知道用户名和密码的情况下，也能够完成登录验证

#### SQL 预编译
指的是数据库驱动在发送 SQL 语句和参数给 DBMS 之前对 SQL 语句进行编译，这样 DBMS 执行 SQL 时，就不需要重新编译

**为什么需要预编译？**

JDBC 中使用对象 PreparedStatement 来抽象预编译语句，使用预编译。预编译阶段可以优化 SQL 的执行，预编译之后的 SQL 多数情况下可以直接执行，DBMS 不需要再次编译，越复杂的 SQL，编译的复杂度将越大，预编译阶段可以合并多次操作为一个操作。同时预编译语句对象可以重复利用，把一个 SQL 预编译后产生的 PreparedStatement 对象缓存下来，下次对于同一个 SQL，可以直接使用这个缓存的 PreparedStatement 对象。Mybatis 情况下，将对所有的 SQL 进行预编译，同时防止 SQL 注入

#### 模糊查询语句编写

1.  `'%${question}%'` ：可能引起 SQL 注入（不推荐）
2.  `"%"#{question}"%"` ：因为 `#{…}` 解析成 sql 语句时候，会在变量外侧自动加单引号 ''，所以这里 % 需要使用双引号 " "，不能使用单引号 '' ，不然会查不到任何结果。
3. `CONCAT('%',#{question},'%')`： 使用 CONCAT()函数，（推荐）
4. 使用 bind 标签（不推荐）

### 分页方式

**分类**

1. 数组分页
2. SQL 分页
3. 拦截器分页
4. RowBounds 分页

**逻辑分页和物理分页**

1. 逻辑分页：一次性把所有数据查出来再通过业务逻辑按需把它截取
2. 物理分页：通过 SQL 中 limit 来进行分页

**区别**

1. 数据库方面：逻辑分页是将全部数据查出来再进行的分页，只需访问一次数据库；物理分页是手写 SQL 语句，每一次分页都需要访问数据库
2. 服务器方面：逻辑分页一次性将所有的数据读取至内存中，占用了较大的内存空间；物理分页每次只读取所需的数据，占用内存比较小
3. 实时性：逻辑分页一次性将数据全部查询出来，如果数据库中的数据发生了改变，逻辑分页就不能够获取最新数据，可能导致脏数据的出现

### 延迟加载
1. Mybatis 仅支持 association 关联对象和 collection 关联集合对象的延迟加载，association 指的是一对一，collection 指的是一对多查询。在 Mybatis 配置文件中，可以配置是否启动延迟加载 lazyLoadingEnabled = true|false
2. 原理：使用 CGLIB 创建目标对象的代理对象，当调用目标方法时，进入拦截器方法，比如调用 A.getB().getName()，拦截器 invoke()方法发现 A.getB()是 null 值，那么就会单独发送事先保存好的查询关联 B 对象的 sql，把 B 查询上来，然后调用 A.setB(b)，于是 a 的对象 b 属性就有值了，接着完成 A.getB().getName()方法的调用

![](MyBatis和SpringMVC/1.png)

### 执行器
1. SimpleExcutor：每执行一次 update 或 select，就开启一个 Statement 对象，用完立刻关闭 Statement 对象
2. ReuseExecutor：执行 update 或 select，以 SQL 作为 key 查找 Statement 对象，存在就使用，不存在就创建，用完后，不关闭 Statement 对象，而是放置于 Map 内，供下一次使用。
3. BatchExecutor：执行 update（没有 select，JDBC 批处理不支持 select），将所有 SQL 都添加到批处理中（addBatch()），等待统一执行（executeBatch()），它缓存了多个 Statement 对象，每个 Statement 对象都是 addBatch()完毕后，等待逐一执行 executeBatch()批处理

### 关联查询
```xml
<mapper namespace="com.lcb.mapping.userMapper">  
    <!--association  一对一关联查询 -->  
    <select id="getClass" parameterType="int" resultMap="ClassesResultMap">  
        select * from class c,teacher t where c.teacher_id=t.t_id and c.c_id=#{id}  
    </select>  
 
    <resultMap type="com.lcb.user.Classes" id="ClassesResultMap">  
        <!-- 实体类的字段名和数据表的字段名映射 -->  
        <id property="id" column="c_id"/>  
        <result property="name" column="c_name"/>  
        <association property="teacher" javaType="com.lcb.user.Teacher">  
            <id property="id" column="t_id"/>  
            <result property="name" column="t_name"/>  
        </association>  
    </resultMap>  
 
 
    <!--collection  一对多关联查询 -->  
    <select id="getClass2" parameterType="int" resultMap="ClassesResultMap2">  
        select * from class c,teacher t,student s where c.teacher_id=t.t_id and c.c_id=s.class_id and c.c_id=#{id}  
    </select>  
 
    <resultMap type="com.lcb.user.Classes" id="ClassesResultMap2">  
        <id property="id" column="c_id"/>  
        <result property="name" column="c_name"/>  
        <association property="teacher" javaType="com.lcb.user.Teacher">  
            <id property="id" column="t_id"/>  
            <result property="name" column="t_name"/>  
        </association>  
 
        <collection property="student" ofType="com.lcb.user.Student">  
            <id property="id" column="s_id"/>  
            <result property="name" column="s_name"/>  
        </collection>  
    </resultMap>  
</mapper> 
```

### 一级、二级缓存

1. 一级缓存：基于 PerpetualCache 的 HashMap 本地缓存，其存储作用域为 SqlSession，各个 SqlSession 之间的缓存相互隔离，当 Session flush 或 close 之后，该 SqlSession 中的所有 Cache 就将清空，MyBatis 默认打开一级缓存。

![](MyBatis和SpringMVC/5.png)

2. 二级缓存与一级缓存其机制相同，默认也是采用 PerpetualCache，HashMap 存储，不同之处在于其存储作用域为 Mapper（Namespace），可以在多个 SqlSession 之间共享，并且可自定义存储源，如 Ehcache。默认不打开二级缓存，要开启二级缓存，使用二级缓存属性类需要实现 Serializable 序列化接口（可用来保存对象的状态），可在它的映射文件中配置。

![](MyBatis和SpringMVC/6.png)

### 生命周期

1. SqlSessionFactoryBuilder

一旦创建了 SqlSessionFactory，就不再需要它了。 因此 SqlSessionFactoryBuilder 实例的生命周期只存在于方法的内部。

2. SqlSessionFactory

SqlSessionFactory 是用来创建 SqlSession 的，相当于一个数据库连接池，每次创建 SqlSessionFactory 都会使用数据库资源，多次创建和销毁是对资源的浪费。所以 SqlSessionFactory 是应用级的生命周期，而且应该是单例的。

3. SqlSession

SqlSession 相当于 JDBC 中的 Connection，SqlSession 的实例不是线程安全的，因此是不能被共享的，所以它的最佳的生命周期是一次请求或一个方法。

4. Mapper

映射器是一些绑定映射语句的接口。映射器接口的实例是从 SqlSession 中获得的，它的生命周期在 sqlsession 事务方法之内，一般会控制在方法级。

![](MyBatis和SpringMVC/7.png)

## SpringMVC

### 核心组件
1. 前端控制器 DispatcherServlet：SpringMVC 的入口函数，接收请求，响应结果
2. 处理器映射器 HandlerMapping：根据请求的 url 查找 Handler，HandlerMapping 负责根据用户请求找到 Handler
3. 处理器适配器 HandlerAdapter：按照特定规则（HandlerAdapter 要求的规则）去执行 Handler
4. 处理器 Handler：处理器，完成具体的业务逻辑，相当于 Servlet 或 Action
5. ModelAndView：装载了模型数据和视图信息，作为 Handler 的处理结果，返回给 DispatcherServlet
6. 视图解析器 ViewResolver：进行视图解析，根据逻辑视图名解析成真正的视图
7. 视图 View：View 是一个接口，实现类支持不同的 View 类型（jsp、freemarker...）

### 工作原理
![](MyBatis和SpringMVC/2.png)

1. 浏览器提交请求到前端控制器 DispatcherServlet
2. 前端控制器收到请求后，将请求转给处理器映射器 HandlerMapping
3. HandlerMapping 会根据请求，找到处理该请求的处理器 Handler，将其封装为处理器执行链返回给前端控制器，执行链包含一个处理器对象和一或多个拦截器
4. DispatcherServlet 根据处理器执行链的处理器，能够找到其对应的处理器适配器 HandlerAdapter
5. HandlerAdapter 调用相应的处理器 Handler，让 Controller 方法执行
+ HttpMessageConverter：将请求消息（如：JSON、XML 等数据）转换成一个对象，将对象转换为指定的响应消息
+ 数据转换：对请求消息进行数据转换。如：String 转换为 Integer、Double 等
+ 数据格式化：对请求消息进行数据格式化。如：将字符串转换成格式化数字或格式化日期等
+ 数据验证：验证数据的有效性（长度、格式等），验证结果存储到 BindingResult 或 Error 中
6. Controller 处理完后返回 ModelAndView 给 HandlerAdapter
7. HandlerAdapter 将 ModelAndView 返回给前端控制器
8. DispatcherServlet 调用视图解析器 ViewResolver 处理 ModelAndView
9. 将逻辑视图解析后返回视图对象 View
10. DispatcherServlet 对 View 进行渲染视图
11. 将页面响应给浏览器

### 解决 POST、GET 请求中文乱码问题
1. POST：在 web.xml 中配置一个 CharacterEncodingFilter 过滤器，设置为 utf-8

```xml
<filter>
  <filter-name>CharacterEncodingFilter</filter-name>
  <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
  <init-param>
    <param-name>encoding</param-name>
    <param-value>utf-8</param-value>
  </init-param>
</filter>
<filter-mapping>
  <filter-name>CharacterEncodingFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

2. GET：

* 修改 tomcat 配置文件添加编码与工程编码一致

```tex
<Connector URIEncoding = "utf-8" connectionTimeout = "20000" port = "8080" protocol = "HTTP/1.1" redirectPort = "8443"/>
```

* 对参数进行重新编码

```java
String username = new String(request.getParamter("userName").getBytes("ISO8859-1"), "utf-8")
```

ISO8859-1 是 tomcat 默认编码，需要将 tomcat 编码后的内容按 utf-8 编码

### 怎么去做请求拦截？
1. 如果是对 Controller 进行拦截，则可以使用 Spring MVC 的拦截器
2. 如果是对所有的请求（如访问静态资源的请求）进行拦截，则可以使用 Filter
3. 如果是对除了 Controller 之外的其他 Bean 的请求进行拦截，则可以使用 Spring AOP

因为 Filter 是作用在 Servlet 前，Interceptor 执行在 controller 前，所以正确的执行流程是：Filter 前处理-> Interceptor 前处理-> controller-> Interceptor 后处理-> Filter 后处理

### 过滤器和拦截器的区别
1. 实现原理不同：过滤器是基于函数回调的；拦截器是基于 Java 的反射机制（动态代理）实现的
2. 使用范围不同：过滤器的使用要依赖于 Tomcat 等容器，导致它只能在 web 程序中使用；拦截器是一个 Spring 组件，由 Spring 容器管理，并不依赖 Tomcat，所以可以单独使用，不仅能在 web 程序中使用
3. 触发时机不同：Filter 处理中-> Interceptor 前置-> 我是 controller -> Interceptor 处理中-> Interceptor 处理后

![](MyBatis和SpringMVC/3.png)

4. 拦截的请求范围不同：过滤器几乎可以对所有进入容器的请求起作用；而拦截器只会对 Controller 中请求或访问 static 目录下的资源请求起作用

过滤器 Filter 执行了两次，拦截器 Interceptor 只执行了一次

![](MyBatis和SpringMVC/4.png)

5. 执行时间点不同：过滤器是一个执行时间点；拦截器是三个执行时间点

过滤器的触发时机是容器后、servlet 之前，所以过滤器的 doFilter 的入参是 ServletRequest，而不是 HttpServletRequest，因为过滤器在 HttpServlet 之前。doFilter 作用是将请求转发给过滤器链下一个对象 Filter，如果没有 Filter 就是你请求的资源

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
    System.out.println("before...");
    chain.doFilter(request, response);
    System.out.println("after...");
}
```

```java
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    System.out.println("preHandle");
    return true;
}

@Override
public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
    System.out.println("postHandle");
}

@Override
public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
    System.out.println("afterCompletion");
}
```

应用场景：

1. 拦截器：权限控制、日志打印、参数校验
2. 过滤器：跨域问题解决、编码转换

### 监听器
监听器：一个类实现某个监听器接口，然后实现接口对应的方法，达到监听具体事项的动作

监听器接口分为：ServletContext、HttpSession、ServletRequest

**ServletContext**

1. ServletContextListener 监听 ServletContext 对象
2. ServletContextAttributeListener 监听对 ServletContext 属性的操作

**HttpSession**

1. HttpSessionListener 监听 Session 对象
2. HttpSessionAttributeListener 监听 Session 的属性操作

**ServletRequest**

1. ServletRequestListener 监听 Request 对象
2. ServletRequestAttributeListener 监听 Request 中的属性操作

**使用案例**

Spring 中监听器的使用分为：注册 Application 监听器和发布 Application 事件

1. 自定义事件

```java
/**
 * 自定义事件
 */
@Data
public class MyEvent extends ApplicationEvent {
    private User user;

    public MyEvent(Object source, User user) {
        super(source);
        this.user = user;
    }
}
```

2. 自定义监听器

```java
/**
 * 自定义监听器，监听 MyEvent 事件
 */
@Component
public class MyEventListener implements ApplicationListener<MyEvent> {
    @Override
    public void onApplicationEvent(MyEvent myEvent) {
        // 把事件中的信息获取到
        User user = myEvent.getUser();
        // 处理事件，实际项目中可以通知别的微服务或者处理其他逻辑等
        System.out.println("用户名：" + user.getUsername());
        System.out.println("密码：" + user.getPassword());
    }
}
```

3. 注册监听器，发布自定义事件

```java
@Service
public class UserService {
    @Resource
    private ApplicationContext applicationContext;

    /**
     * 发布事件
     * @return
     */
    public User getUser2() {
        User user = new User(1L, "倪升武", "123456");
        // 发布事件
        MyEvent event = new MyEvent(this, user);
        applicationContext.publishEvent(event);
        return user;
    }
}
```



