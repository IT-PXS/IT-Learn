---
title: SpringBoot（8-事务监听器）
tags:
  - SpringBoot
categories: Java
cover: /img/index/springboot.png
top_img: /img/index/springboot.png
description: SpringBoot 事务监听器利用 TransactionSynchronization 或 @TransactionalEventListener 监听事务状态，实现事务提交后执行异步任务、日志记录等操作。支持 AFTER_COMMIT、BEFORE_COMMIT、AFTER_ROLLBACK 等阶段，提高数据一致性和扩展性，适用于订单处理、积分结算等业务场景。
published: false
abbrlink: 51290
date: 2025-03-14 12:42:19
---

## 环境配置

注意：不要同时导入 mybatis 和 mybatis-plus 的依赖

```xml
<dependency>
  <groupId>com.baomidou</groupId>
  <artifactId>mybatis-plus-boot-starter</artifactId>
  <version>3.4.3.4</version>
</dependency>
```

application.yaml

```yaml
spring:
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://localhost:3306/mybatis_plus?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf-8
mybatis-plus:
	type-aliases-package: com.example.demo.entity 	# 配置包别名
  mapper-locations: classpath:mappers/*.xml 	# 映射文件的位置
  # mybatis-plus默认扫描的是类路径下的mapper目录，classpath*:/mapper/**/*.xml
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl 	# 配置文件
    map-underscore-to-camel-case: true 	# 开启驼峰命名
```

```java
@Repository//代表持久层
public interface UserMapper extends BaseMapper<User> {
}
```

```java
@MapperScan("com.mybatisplus01.mapper")
@SpringBootApplication
public class MybatisPlus01Application {
    public static void main(String[] args) {
        SpringApplication.run(MybatisPlus01Application.class, args);
    }
}
```

```java
@Autowired
private UserMapper userMapper;

@Test
void contextLoads() {
    List<User> users = userMapper.selectList(null);
    users.forEach(System.out::println);
}
```

### 主键生成
```java
public enum IdType {
    AUTO(0),		
    NONE(1),		
    INPUT(2),
    ASSIGN_ID(3),	
    ASSIGN_UUID(4);
}
```

1. AUTO：数据库 id 自增
2. NONE：未设置主键，等同于 INPUT
3. INPUT：用户手动输入，请求参数中带上 id，如果没有带上 id，那么数据库中的自增特性自动生效
4. ASSIGN_ID：雪花算法生成 id，只有当用户未输入时，采用雪花算法生成一个适用于分布式环境的全局唯一主键，类型可以是 String 和 Long，不能是 Integer，生成 19 位纯数字的主键
5. ASSIGN_UUID：只有当用户未输入时，生成一个 String 类型的主键，但不保证全局唯一

实体类字段上加@TableID(type = IdType.Auto)，数据库字段一定要自增

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    //自增, 插入会自动递增
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private Integer age;
    private String email;
}
```

```java
//插入
@Test
public void testInsert(){
    User user=new User();
    user.setAge(10);
    user.setEmail("456");
    //user.setId(new Long(3));
    user.setName("dasf");
    int insert = userMapper.insert(user);
    //自动生成 id, 不是递增的
    System.out.println(insert);
}

//更新
@Test
public void testUpdate(){
    User user=new User();
    user.setId(3L);
    user.setName("daf");
    int i = userMapper.updateById(user);
    System.out.println(i);
}
```

### 填充策略
```java
public enum FieldFill {
    //默认不处理
    DEFAULT,
    //插入时填充字段
    INSERT,
    //更新时填充字段
    UPDATE,
    //插入和更新时填充字段
    INSERT_UPDATE
}
```

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private Integer age;
    private String email;

    //插入填充
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    //插入和更新填充
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
```

```java
@Component
public class Handler implements MetaObjectHandler {
    //插入时的填充策略
    @Override
    public void insertFill(MetaObject metaObject) {
        this.setFieldValByName("createTime",new Date(),metaObject);
        this.setFieldValByName("updateTime",new Date(),metaObject);
    }

    //更新时的填充策略
    @Override
    public void updateFill(MetaObject metaObject) {
        this.setFieldValByName("updateTime",new Date(),metaObject);
    }
}
```

### 查询
#### 批量查询
```java
@Test
public void selectByBatchId(){
    List<User> users = userMapper.selectBatchIds(Arrays.asList(1, 3));
    users.forEach(System.out::println);
}

@Test
public void selectByBatchIds(){
    HashMap<String , Object> map = new HashMap<>();
    map.put("name","dasf");
    List<User> users = userMapper.selectByMap(map);
    users.forEach(System.out::println);
}
```

#### 分页查询
##### 分页插件
```java
@MapperScan("com.mybatisplus01.mapper")
@EnableTransactionManagement//自动管理事务
@Configuration
public class MybatisPlusConfig {
    // 旧版
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        // 设置请求的页面大于最大页后操作， true 调回到首页，false 继续请求  默认 false
        // paginationInterceptor.setOverflow(false);
        // 设置最大单页限制数量，默认 500 条，-1 不受限制
        // paginationInterceptor.setLimit(500);
        // 开启 count 的 join 优化, 只针对部分 left join
        paginationInterceptor.setCountSqlParser(new JsqlParserCountOptimize(true));
        return paginationInterceptor;
    }
    
    // 最新版
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.H2));
        return interceptor;
    }
}
```

##### 使用 Wrapper 分页
```java
@Test
public void testPage(){
    //参数一：当前页
    //参数二：页面大小
    Page<User> page = new Page<>(1,5);
    userMapper.selectPage(page,null);
    page.getRecords().forEach(System.out::println);
}
```

##### 自定义分页
```java
public interface UserMapper {//可以继承或者不继承 BaseMapper
    /**
     * @param page 分页对象, xml 中可以从里面进行取值, 传递参数 Page 即自动分页, 必须放在第一位(你可以继承 Page 实现自己的分页对象)
     * @param state 状态
     * @return 分页对象
     */
    IPage<User> selectPageVo(Page<?> page, Integer state);
}
```

```java
<select id="selectPageVo" resultType="com.baomidou.cloud.entity.UserVo">
    SELECT id,name FROM user WHERE state=#{state}
</select>
```

```java
public IPage<User> selectUserPage(Page<User> page, Integer state) {
    // 不进行 count sql 优化，解决 MP 无法自动优化 SQL 问题，这时候你需要自己查询 count 部分
    // page.setOptimizeCountSql(false);
    // 当 total 为小于 0 或者设置 setSearchCount(false) 分页插件不会进行 count 查询
    // 要点!! 分页返回的对象与传入的对象是同一个
    return userMapper.selectPageVo(page, state);
}
```

注意：

1. 如果返回类型是 IPage，则入参的 IPage 不能为 null，因为返回的 IPage == 入参的 IPage
2. 如果返回类型是 List，则入参的 IPage 可以为 null（为 null 则不分页），但需要你手动入参的 IPage.setRecords(返回的 List)
3. 如果 xml 需要从 page 里取值，需要 page.属性获取

### 删除
#### 批量删除
```java
@Test
public void testDeleteById(){
    userMapper.deleteById(3);
}

@Test
public void testDeleteBatch(){
    userMapper.deleteBatchIds(Arrays.asList(1456973491516600326L,1456973491516600327L));
}

@Test
public void testDeleteMap(){
    HashMap<String, Object> map = new HashMap<>();
    map.put("name","dasf");
    userMapper.deleteByMap(map);
}
```

#### 逻辑删除（类似放在回收站）
方法一：

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private Integer age;
    private String email;

    @TableLogic//逻辑删除
    private Integer deleteValue;

    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
```

```yaml
spring:
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://localhost:3306/mybatis_plus?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf-8
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl #配置文件
    map-underscore-to-camel-case: true #开启驼峰命名
  global-config:
    db-config:
      logic-delete-value: 1 # 逻辑已删除值(默认为 1)
      logic-not-delete-value: 0 # 逻辑未删除值(默认为 0)
```

方法二：

```yaml
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: flag  
      # 全局逻辑删除的实体字段名(since 3.3.0,配置后可以忽略不配置步骤2)
      logic-delete-value: 1 # 逻辑已删除值(默认为 1)
      logic-not-delete-value: 0 # 逻辑未删除值(默认为 0)
```

### 条件构造器
#### wrapper
1. Wrapper：条件构造抽象类，最顶端父类
2. AbstractWrapper：用于查询条件封装，生成 SQL 的 where 条件
3. QueryWrapper：Entity 对象封装操作类，不是用 lambda 语法
4. UpdateWrapper：Update 条件封装，用于 Entity 对象更新操作
5. AbstractLambdaWrapper：Lambda 语法使用 Wrapper 统一处理解析 lambda 获取 column
6. LambdaQueryWrapper：用于 Lambda 语法使用的查询 Wrapper
7. LambdaUpdateWrapper：Lambda 更新封装 Wrapper

#### 条件
1. allEq：全部 eq（或个别 isNull）
2. eq：等于 =
3. ne：不等于 <>
4. gt：大于 >
5. ge：大于等于 >=
6. lt：小于 <
7. le：小于等于 <=
8. between：<font style="color:rgb(44, 62, 80);"> BETWEEN 值 1 AND 值 2 </font>
9. notBetween：<font style="color:rgb(44, 62, 80);"> NOT BETWEEN 值 1 AND 值 2 </font>
10. like：<font style="color:rgb(44, 62, 80);"> LIKE '%值%'</font>
11. notLike：<font style="color:rgb(44, 62, 80);"> NOT LIKE '%值%'</font>
12. likeLeft：<font style="color:rgb(44, 62, 80);"> LIKE '%值'</font>
13. likeRight：<font style="color:rgb(44, 62, 80);"> LIKE '值%'</font>
14. isNull：<font style="color:rgb(44, 62, 80);"> 字段 IS NULL </font>
15. isNotNull：<font style="color:rgb(44, 62, 80);"> 字段 IS NOT NULL </font>
16. in：<font style="color:rgb(44, 62, 80);"> 字段 IN (value.get(0), value.get(1), ...)</font>
17. notIn：<font style="color:rgb(44, 62, 80);"> 字段 NOT IN (value.get(0), value.get(1), ...)</font>
18. inSql：<font style="color:rgb(44, 62, 80);"> 字段 IN ( sql 语句 )</font>
19. notInSql：<font style="color:rgb(44, 62, 80);"> 字段 NOT IN ( sql 语句 )</font>
20. groupBy：<font style="color:rgb(44, 62, 80);"> 分组：GROUP BY 字段, ...</font>
21. orderByAsc：<font style="color:rgb(44, 62, 80);"> 排序：ORDER BY 字段, ... ASC </font>
22. orderByDesc：<font style="color:rgb(44, 62, 80);"> 排序：ORDER BY 字段, ... DESC </font>
23. orderBy：<font style="color:rgb(44, 62, 80);"> 排序：ORDER BY 字段, ...</font>
24. having：<font style="color:rgb(44, 62, 80);"> HAVING ( sql 语句 )</font>
25. func：<font style="color:rgb(44, 62, 80);"> func 方法(主要方便在出现 if...else 下调用不同方法能不断链)</font>
26. or：<font style="color:rgb(44, 62, 80);"> 拼接 OR，OR 嵌套 </font>
27. and：<font style="color:rgb(44, 62, 80);"> AND 嵌套 </font>
28. nested：<font style="color:rgb(44, 62, 80);"> 正常嵌套 不带 AND 或者 OR </font>
29. apply：<font style="color:rgb(44, 62, 80);"> 拼接 sql </font>
30. last：<font style="color:rgb(44, 62, 80);"> 无视优化规则直接拼接到 sql 的最后 </font>
31. exist：<font style="color:rgb(44, 62, 80);"> 拼接 EXISTS ( sql 语句 )</font>
32. notExists：<font style="color:rgb(44, 62, 80);"> 拼接 NOT EXISTS ( sql 语句 )</font>

#### 使用
1. LambdaUpdateWrapper
2. Wrappers.<实体> lambdaUpdate()
3. queryWrapper
4. lambdaQueryWrapper
5. Wrappers.<实体> lambdaQuery()

```java
QueryWrapper<DomainTb> wrapper = new QueryWrapper<>();
wrapper.eq("domain_id",domainId);
list(wrapper);

LambdaQueryWrapper<DomainTb> wrapper = Wrappers.lambdaQuery();
wrapper.eq(DomainTb::getDomainId,domainId);
list(wrapper);

LambdaQueryWrapper<BannerItem> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(BannerItem::getBannerId, id);
List<BannerItem> bannerItems = bannerItemMapper.selectList(wrapper);
```

### 代码生成器
```xml
<dependency>
  <groupId>com.baomidou</groupId>
  <artifactId>mybatis-plus-generator</artifactId>
  <version>3.4.1</version>
</dependency>
<!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-starter-freemarker -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
    <version>2.5.6</version>
</dependency>
```

```java
package com.springboot;

import com.baomidou.mybatisplus.core.exceptions.MybatisPlusException;
import com.baomidou.mybatisplus.core.toolkit.StringPool;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.InjectionConfig;
import com.baomidou.mybatisplus.generator.config.*;
import com.baomidou.mybatisplus.generator.config.po.TableInfo;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.baomidou.mybatisplus.generator.engine.FreemarkerTemplateEngine;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class CodeGenerator {

    /**
     * <p>
     * 读取控制台内容
     * </p>
     */
    public static String scanner(String tip) {
        Scanner scanner = new Scanner(System.in);
        StringBuilder help = new StringBuilder();
        help.append("请输入" + tip + "：");
        System.out.println(help.toString());
        if (scanner.hasNext()) {
            String ipt = scanner.next();
            if (StringUtils.isNotBlank(ipt)) {
                return ipt;
            }
        }
        throw new MybatisPlusException("请输入正确的" + tip + "！");
    }

    public static void main(String[] args) {
        // 代码生成器
        AutoGenerator mpg = new AutoGenerator();

        // 全局配置
        GlobalConfig gc = new GlobalConfig();
        String projectPath = System.getProperty("user.dir");
        gc.setOutputDir(projectPath + "/springboot/src/main/java");
        gc.setAuthor("jobob");
        gc.setFileOverride(false);//是否覆盖
        gc.setServiceName("%sService");//去 Serivce 的 I 前缀
        gc.setOpen(false);
        //gc.setSwagger2(true); //实体属性 Swagger2 注解
        mpg.setGlobalConfig(gc);

        // 数据源配置
        DataSourceConfig dsc = new DataSourceConfig();
        dsc.setUrl("jdbc:mysql://localhost:3306/vueblog?useUnicode=true&useSSL=false&characterEncoding=utf8&serverTimezone=Asia/Shanghai");
        dsc.setDriverName("com.mysql.cj.jdbc.Driver");
        dsc.setUsername("root");
        dsc.setPassword("84504137");
        mpg.setDataSource(dsc);

        // 包配置
        PackageConfig pc = new PackageConfig();
        //pc.setModuleName(scanner("模块名"));
        pc.setParent("com.springboot");
        mpg.setPackageInfo(pc);

        // 自定义配置
        InjectionConfig cfg = new InjectionConfig() {
            @Override
            public void initMap() {
                // to do nothing
            }
        };

        // 如果模板引擎是 freemarker
        String templatePath = "/templates/mapper.xml.ftl";
        // 如果模板引擎是 velocity
        // String templatePath = "/templates/mapper.xml.vm";

        // 自定义输出配置
        List<FileOutConfig> focList = new ArrayList<>();
        // 自定义配置会被优先输出
        focList.add(new FileOutConfig(templatePath) {
            @Override
            public String outputFile(TableInfo tableInfo) {
                // 自定义输出文件名 ， 如果你 Entity 设置了前后缀、此处注意 xml 的名称会跟着发生变化！！
                return projectPath + "/src/main/resources/mapper/" + pc.getModuleName()
                        + "/" + tableInfo.getEntityName() + "Mapper" + StringPool.DOT_XML;
            }
        });
        /*
        cfg.setFileCreate(new IFileCreate() {
            @Override
            public boolean isCreate(ConfigBuilder configBuilder, FileType fileType, String filePath) {
                // 判断自定义文件夹是否需要创建
                checkDir("调用默认方法创建的目录，自定义目录用");
                if (fileType == FileType.MAPPER) {
                    // 已经生成 mapper 文件判断存在，不想重新生成返回 false
                    return ! new File(filePath).exists();
                }
                // 允许生成模板文件
                return true;
            }
        });
        */
        cfg.setFileOutConfigList(focList);
        mpg.setCfg(cfg);

        // 配置模板
        TemplateConfig templateConfig = new TemplateConfig();

        // 配置自定义输出模板
        //指定自定义模板路径，注意不要带上.ftl/.vm, 会根据使用的模板引擎自动识别
        // templateConfig.setEntity("templates/entity2.java");
        // templateConfig.setService();
        // templateConfig.setController();
        templateConfig.setXml(null);
        mpg.setTemplate(templateConfig);

        // 策略配置
        StrategyConfig strategy = new StrategyConfig();
        strategy.setNaming(NamingStrategy.underline_to_camel);
        strategy.setColumnNaming(NamingStrategy.underline_to_camel);
        //strategy.setSuperEntityClass("你自己的父类实体, 没有就不用设置!");
        strategy.setEntityLombokModel(true);
        strategy.setRestControllerStyle(true);
        // 公共父类
        //strategy.setSuperControllerClass("你自己的父类控制器, 没有就不用设置!");
        // 写于父类中的公共字段
        //strategy.setSuperEntityColumns("id");
        strategy.setInclude(scanner("表名，多个英文逗号分割").split(","));
        strategy.setControllerMappingHyphenStyle(true);
        strategy.setTablePrefix("m_");//去除数据库前缀
        mpg.setStrategy(strategy);
        mpg.setTemplateEngine(new FreemarkerTemplateEngine());
        mpg.execute();
    }
}
```

### 常用标签
#### if
通过判断参数值来决定是否使用某个查询条件、判断是否更新某一个字段、判断是否查询某个字段的值

```xml
<if test="name != null and name != ''">
         and NAME = #{name}
</if>
```

#### foreach
1. collection：collection 属性的值分别有 list、array、map 三种
2. item：表示在迭代过程中每一个元素的别名
3. index：表示在迭代过程中每次迭代到的位置（下标）
4. open：前缀
5. close：后缀
6. separator：分隔符，表示迭代时每个元素之间以什么分隔

```xml
<!-- in查询所有，不分页 -->
<select id="selectIn" resultMap="BaseResultMap">
  select name,hobby 
  from student where id in
  <foreach item="item" index="index" collection="list" open="(" separator="," close=")">
    #{item}
  </foreach>
</select>
```

#### where
```xml
<select id="getStudentListWhere" parameterType="Object" resultMap="BaseResultMap">     
    SELECT * from STUDENT      
        WHERE      
        <if test="name!=null and name!='' ">     
            NAME LIKE CONCAT(CONCAT('%', #{name}),'%')      
        </if>     
        <if test="hobby!= null and hobby!= '' ">     
            AND hobby = #{hobby}      
        </if>     
</select> 
```

当 name 值为 null 时，查询语句会出现“where and”的情况，where 标签会知道如果它包含的标签中有返回值的话，就会插入一个 where，如果标签返回的内容是以 and 或 or 开头的，则他会剔除掉

```xml
<select id="getStudentListWhere" parameterType="Object" resultMap="BaseResultMap">     
    SELECT * from STUDENT      
       <where>   
         <if test="name!=null and name!='' ">     
            NAME LIKE CONCAT(CONCAT('%', #{name}),'%')      
         </if>     
         <if test="hobby!= null and hobby!= '' ">     
            AND hobby = #{hobby}      
         </if>  
       </where>        
</select>    
```

#### choose
按顺序判断 when 中的条件是否成立，如果有一个成立，则 choose 结束

```xml
<select id="getStudentListChoose" parameterType="Student" resultMap="BaseResultMap">     
    SELECT * from STUDENT WHERE 1=1    
    <where>     
        <choose>     
            <when test="Name!=null and student!='' ">     
                   AND name LIKE CONCAT(CONCAT('%', #{student}),'%')      
            </when>     
            <when test="hobby!= null and hobby!= '' ">     
                    AND hobby = #{hobby}      
            </when>                   
            <otherwise>     
                    AND AGE = 15  
            </otherwise>     
        </choose>     
    </where>     
</select>  
```

#### set
使用 set+if 标签修改后，如果某项为 null 则不进行更新，而是保持数据库原值

```xml
<update id="updateStudent" parameterType="Object">     
    UPDATE STUDENT      
    <set>     
        <if test="name!=null and name!='' ">     
            NAME = #{name},      
        </if>     
        <if test="hobby!=null and hobby!='' ">     
            MAJOR = #{major},      
        </if> 
        <if test="hobby!=null and hobby!='' ">     
            HOBBY = #{hobby}    
        </if>     
    </set>     
    WHERE ID = #{id};      
</update>
```

### 常见 SQL 注入方式
#### like
```xml
//风险代码
<select id="getUserbyId" parameterType="map" resultType="model.Student">    
  select * from Studentinfo where name like '%${name}%'
</select>
```

修复方案：

1. #{}预编译参数
2. concat 拼接 like 参数

#### order by
```xml
//风险代码
<select id="getUserbyId" resultType="model.Student">    
  select * from Studentinfo order by ${ordername}
</select>
```

注意：分页是通过字符串拼接的方式，所以会出现 SQL 注入的风险

修复方案：

1. 白名单机制
2. 校验字段信息

#### limit
注入前提：

1. 没有 order by 语句
2. start、pageSize 支持 String 类型

```xml
//风险代码
SELECT field FROM table WHERE id > 0  LIMIT ${start},${pageSize};

//注入代码
SELECT field FROM table WHERE id > 0  LIMIT ${start},${pageSize} union all select fields from table_name;
```

修复方案：

1. 增加 order by
2. 限制允许 Int 类型

#### in
```xml
//风险代码:
Select * from news where id in (${id})

//修复方案:
id in<foreach collection="ids" item="item" open="("separator="," close=")">#{item} </foreach>
```

### 注解
#### @MapKey
用在返回值为 Map 的方法上的注解，能够将存放对象的 List 转换为 key 值为对象的某一属性的 Map

```java
@MapKey("id")
Map<String,UserInfoEntity> selectUser();

    
<select id="selectUser" resultMap="userInfo">
        select * from user_info
</select>
<resultMap id="userInfo" type="com.make.study.entity.UserInfoEntity">
    ......
</resultMap>
```

![](Mybatis Plus/1.png)

