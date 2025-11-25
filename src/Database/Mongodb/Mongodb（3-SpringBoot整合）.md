---
title: Mongodb（3-SpringBoot整合）
tag: Mongodb
category: 数据库
description: Spring Boot通过Spring Data MongoDB简化MongoDB集成。只需添加依赖并配置连接信息，即可使用MongoTemplate执行数据库操作。通过定义Repository接口和@Document注解实体类，能轻松实现文档的CRUD与复杂查询，极大提升了开发效率。
date: 2025-11-17 22:38:34
---


## 依赖和配置

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

```yaml
spring:
  data:
    mongodb:
	  # 单机模式配置
      host: localhost
      port: 27017
      database: testdb
      username: admin
      password: 123456
      # 等同于上面配置
      # 副本集配置示例
      # uri: mongodb://admin:123456@localhost:27017/testdb
      
      # 连接池配置
      authentication-database: admin  # 认证数据库
      auto-index-creation: true      # 自动创建索引
      # 连接池配置
      connection-pool:
        max-size: 100                # 最大连接数
        min-size: 10                 # 最小连接数
        max-wait-time: 30000         # 最大等待时间(ms)
```

| 配置项              | 说明                     | 默认值    | 建议值                      |
| ------------------- | ------------------------ | --------- | --------------------------- |
| host                | MongoDB 服务器地址        | localhost | 根据环境配置                |
| port                | MongoDB 端口              | 27017     | -                           |
| database            | 默认数据库               | -         | 必填                        |
| auto-index-creation | 是否自动创建索引         | false     | 开发环境 true，生产环境 false |
| max-size            | 连接池最大连接数         | 100       | 根据并发量调整              |
| min-size            | 连接池最小连接数         | 0         | 10-20                       |
| max-wait-time       | 获取连接最大等待时间(ms) | 120000    | 30000-60000                 |

## 相关注解

1. @Document

修饰范围：用在类上 

作用：用来映射这个类的一个对象为 mongo 中一条文档数据。 

2. @Id

修饰范围：用在成员变量、方法上

作用：用来将成员变量的值映射为文档的_id 的值

3. @Field

修饰范围：用在成员变量、方法上 

作用：用来将成员变量及其值映射为文档中一个 key: value 对。 

4. @Transient

修饰范围：用在成员变量、方法上 

作用：用来指定此成员变量不参与文档的序列化

5. @Indexed

创建索引

## MongoRepository 操作

 ````java
@Document(collection = "users")  // 指定集合名称
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id  // 主键标识
    private String id;
    
    @Indexed(unique = true)  // 唯一索引
    private String username;
    
    @Field("pwd")  // 指定文档中字段名
    private String password;
    
    private Integer age;
    
    @Indexed  // 普通索引
    private Date createTime;
    
    private List<String> hobbies;  // 数组类型
    
    private Address address;  // 嵌套文档
}
 ````

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    private String city;
    
    private String street;
    
    private String zipCode;
}
```

Spring Data MongoDB 提供了 `MongoRepository` 接口，可以自动生成 CRUD 操作的方法。

```java
public interface UserRepository extends MongoRepository<User, String> {
    
    // 方法名派生查询
    List<User> findByAgeBetween(int min, int max);
    
    List<User> findByHobbiesIn(List<String> hobbies);
    
    // 使用@Query 注解
    @Query("{ 'age' : { $gt: ?0, $lt: ?1 } }")
    List<User> findUsersByAgeRange(int minAge, int maxAge);
    
    // 分页查询
    Page<User> findByAddressCity(String city, Pageable pageable);
    
    // 排序查询
    List<User> findByUsernameLike(String username, Sort sort);
}
```

```java
@SpringBootTest
public class RepositoryTest {
    @Autowired
    private UserRepository userRepository;
    
    @Test
    public void testCRUD() {
        // 保存(插入或更新)
        User newUser = new User(null, "repoUser", "password", 30, new Date(), 
                              Arrays.asList("coding"), 
                              new Address("Shenzhen", "Tech Ave", "518000"));
        userRepository.save(newUser);
        
        // 查询
        Optional<User> found = userRepository.findById(newUser.getId());
        found.ifPresent(user -> System.out.println("Found: " + user.getUsername()));
        
        // 派生方法查询
        List<User> ageBetween = userRepository.findByAgeBetween(25, 35);
        ageBetween.forEach(u -> System.out.println("Age between: " + u.getUsername()));
        
        // 分页查询
        Page<User> page = userRepository.findByAddressCity(
            "Beijing", 
            PageRequest.of(0, 2, Sort.by("age").descending())
        );
        System.out.println("Total pages: " + page.getTotalPages());
        page.getContent().forEach(u -> System.out.println("Page user: " + u.getUsername()));
        
        // 删除
        userRepository.deleteById(newUser.getId());
    }
}
```

## MongoTemplate 操作

```java
@Data
@Accessors(chain = true)
public class User {
    //@Id //映射文档中的_id
    @MongoId
    private String id;
    
    @Field("username")
    private String name;
    
    private String sex;
    
    private Integer salary;
    
    private Integer age;
    
    @JsonFormat(pattern = "yyyy-MM-dd",timezone = "GMT+8")
    private Date birthday;
    
    private String remake;
    
    private Status status;
}
```

```java
@Data
@Accessors(chain = true)
public class Status {
    
    private Integer weight;
    
    private Integer height;
}
```

### 集合操作

```java
@SpringBootTest
public class Test01 {

    @Resource
    private MongoTemplate mongoTemplate;

    /**
     * 创建一个大小没有限制的集合（默认集合创建方式）
     */
    @Test
    public void createCollection() {
        String collectionName = "user01";
        mongoTemplate.createCollection(collectionName);
        String data = mongoTemplate.collectionExists(collectionName) ? "创建视图成功" : "创建视图失败";
        System.out.println(data);
    }

    /**
     * 创建固定大小集合
     */
    @Test
    public void createCollectionFixedSize() {
        String collectionName = "user02";
        long size = 1024L;
        long max = 5L;
        CollectionOptions collectionOptions = CollectionOptions.empty()
                //创建固定集合，固定集合是指有着固定大小的集合，当达到最大值时，它会自动覆盖最早的文档
                .capped()
                //固定集合指定一个最大值，以千字节计（KB），如果 capped 为 true，也需要该字段
                .size(size)
                //指定固定集合中包含文档的最大数据
                .maxDocuments(max);
        mongoTemplate.createCollection(collectionName, collectionOptions);
        String data = mongoTemplate.collectionExists(collectionName) ? "创建视图成功" : "创建视图失败";
        System.out.println(data);
    }

    /**
     * 创建验证文档数据的集合
     * 校验级别：
     * -off：关闭数据校验
     * -strict：（默认值）对所有的文档“插入”与“更新”操作有效
     * -moderate：仅对“插入”和满足校验规则的“文档”做“更新”操作有效，对已存在的不符合校验规则的“文档”无效
     * 执行策略：
     * -error：（默认值）文档必须满足校验规则，才能被写入
     * -warn：对于“文档”不符合校验规则的 MongoDB 允许写入，但会记录一条告警到 mongodb.log 中去，日志内容记录报错信息以及该“文档”的完整记录
     */
    @Test
    public void createCollectionValidation() {
        String collectionName = "user03";
        //设置验证条件，只允许岁数大于 20 的用户信息插入
        CriteriaDefinition criteria = Criteria.where("age").gt(20);
        //设置集合选项验证对象
        CollectionOptions collectionOptions = CollectionOptions.empty()
                .validator(Validator.criteria(criteria))
                //设置校验级别
                .strictValidation()
                //设置校验不通过后执行的动作
                .failOnValidationError();
        mongoTemplate.createCollection(collectionName, collectionOptions);
        String data = mongoTemplate.collectionExists(collectionName) ? "创建视图成功" : "创建视图失败";
        System.out.println(data);
    }

    /**
     * 检测集合是否存在
     */
    @Test
    public void collectionExists() {
        String collectionName = "user01";
        System.out.println(mongoTemplate.collectionExists(collectionName));
    }

    /**
     * 获取集合名称列表
     */
    @Test
    public void getCollectionNames() {
        System.out.println(mongoTemplate.getCollectionNames());
    }

    /**
     * 删除集合
     */
    @Test
    public void dropCollection() {
        String collectionName = "user01";
        mongoTemplate.getCollection(collectionName).drop();
        System.out.println(mongoTemplate.collectionExists(collectionName));
    }
}
```

### 添加文档

```java
@SpringBootTest
public class Test02 {
    
    @Resource
    private MongoTemplate mongoTemplate;

    /**
     * 插入一条文档数据，如果文档信息已经存在就抛出异常
     */
    @Test
    public void insert(){
        User user = new User()
                .setId("10")
                .setAge(22)
                .setSex("男")
                .setRemake("无")
                .setSalary(1500)
                .setName("zhangsan")
                .setBirthday(new Date())
                .setStatus(new Status().setHeight(180).setWeight(150));
        User newUser = mongoTemplate.insert(user, "user01");
        System.out.println(newUser);
    }

    /**
     * 插入多条文档数据，如果某条文档信息已经存在就抛出异常
     */
    @Test
    public void insertMany(){
        User user01 = new User()
                .setId("11")
                .setAge(22)
                .setSex("男")
                .setRemake("无")
                .setSalary(1500)
                .setName("shiyi")
                .setBirthday(new Date())
                .setStatus(new Status().setWeight(120).setHeight(562));
        User user02 = new User()
                .setId("12")
                .setAge(23)
                .setSex("男")
                .setRemake("无")
                .setSalary(5620)
                .setName("as")
                .setBirthday(new Date())
                .setStatus(new Status().setHeight(120).setWeight(560));
        List<User> userList=new ArrayList<>();
        userList.add(user01);
        userList.add(user02);
        Collection<User> newUserList = mongoTemplate.insert(userList, "user01");
        for (User user : newUserList) {
            System.out.println(user);
        }
    }

    /**
     * 存储一条用户信息，如果文档信息已经存在就执行更新
     */
    @Test
    public void save(){
        User user = new User()
                .setId("13")
                .setAge(23)
                .setSex("男")
                .setRemake("无")
                .setSalary(2800)
                .setName("kua")
                .setBirthday(new Date())
                .setStatus(new Status().setHeight(120).setWeight(300));
        User newUser = mongoTemplate.save(user, "user01");
        System.out.println(newUser);
    }
}
```

### 查询文档

```java
@SpringBootTest
public class Test03 {

    private static final String COLLECTION_NAME = "user01";
    @Resource
    private MongoTemplate mongoTemplate;

    /**
     * 查询集合中的全部文档数据
     */
    @Test
    public void findAll() {
        List<User> list = mongoTemplate.findAll(User.class, COLLECTION_NAME);
        // List <User> list = mongoTemplate.find(new Query(), User.class);
        for (User user : list) {
            System.out.println(user);
        }
    }

    /**
     * 根据文档 id 查询集合中文档数据
     */
    @Test
    public void findById() {
        User user = mongoTemplate.findById(11, User.class, COLLECTION_NAME);
        System.out.println(user);
        // 查询单个文档
        // User user = mongoTemplate.findOne(new Query(), User.class);
    }

    /**
     * 根据条件查询集合中符合条件的文档，只取第一条数据
     */
    @Test
    public void findOne() {
        Criteria criteria = Criteria.where("age").is(22);
        Query query = new Query(criteria);
        User user = mongoTemplate.findOne(query, User.class, COLLECTION_NAME);
        System.out.println(user);
    }

    /**
     * 根据条件查询集合中符合条件的文档，获取其文档列表
     */
    @Test
    public void findByCondition(){
        Criteria criteria = Criteria.where("sex").is("男");
        Query query = new Query(criteria);
        List<User> userList = mongoTemplate.find(query, User.class, COLLECTION_NAME);
        for (User user : userList) {
            System.out.println(user);
        }
    }

    /**
     * 根据条件查询集合中符合条件的文档，获取其文档列表并排序
     */
    @Test
    public void findByConditionAndSort(){
        Criteria criteria = Criteria.where("sex").is("男");
        Query query = new Query(criteria).with(Sort.by("age"));
        List<User> userList = mongoTemplate.find(query, User.class, COLLECTION_NAME);
        for (User user : userList) {
            System.out.println(user);
        }
    }

    /**
     * 根据单个条件查询集合中的文档数据，并按指定字段进行排序与限制指定数目
     */
    @Test
    public void findByConditionAndSortLimit(){
        Criteria criteria = Criteria.where("sex").is("男");
        Query query = new Query(criteria).with(Sort.by("age")).limit(2);
        List<User> userList = mongoTemplate.find(query, User.class, COLLECTION_NAME);
        for (User user : userList) {
            System.out.println(user);
        }
    }

    /**
     * 根据单个条件查询集合中的文档数据，并按指定字段进行排序与跳过指定数目
     */
    @Test
    public void findByConditionAndSortSkip(){
        Criteria criteria = Criteria.where("sex").is("男");
        Query query = new Query(criteria).with(Sort.by("age")).skip(2);
        List<User> userList = mongoTemplate.find(query, User.class, COLLECTION_NAME);
        for (User user : userList) {
            System.out.println(user);
        }
    }

    /**
     * 查询存在指定字段名称的文档数据
     */
    @Test
    public void findByExistsField(){
        Criteria criteria = Criteria.where("sex").exists(true);
        Query query = new Query(criteria);
        List<User> userList = mongoTemplate.find(query, User.class, COLLECTION_NAME);
        for (User user : userList) {
            System.out.println(user);
        }
    }

    /**
     * 根据 and 关联多个查询条件，查询集合中的文档数据
     */
    @Test
    public void findByAndCondition(){
        Criteria criteria1 = Criteria.where("sex").is("男");
        Criteria criteria2 = Criteria.where("age").is(22);
        Criteria criteria = new Criteria().andOperator(criteria1, criteria2);
        Query query = new Query(criteria);
        List<User> userList = mongoTemplate.find(query, User.class, COLLECTION_NAME);
        for (User user : userList) {
            System.out.println(user);
        }
    }
}
```

```java
/**
 * 通过 Json 查询
 */
@Test
public void jsonTest(){
    // 查询 name 为张三
    String json="{name:'张三'}";
    // 查询工资大于 5000
    String json2="{salary:{$gt:5000}}";
    // 查询年龄大于 25 或者工资小于 7000
    String json3="{$or:[{age:{$gt:25}},{salary:{$lt:7000}}]}";
    Query query=new BasicQuery(json3);
    // 按工资降序排序
    query.with(Sort.by(Sort.Order.desc("salary")));

    List<Employee> list = mongoTemplate.find(query, Employee.class);
    list.forEach(System.out::println);
}

/**
 * 模糊查询
 */
@Test
public void findLikeUserList(){
    // name like test
    String name = "est";
    String regex = String.format("%s%s%s", "^.*", name, ".*$");
    /*
    1、在使用Pattern.compile函数时，可以加入控制正则表达式的匹配行为的参数：
        Pattern Pattern.compile(String regex, int flag)
    2、regex设置匹配规则
    3、Pattern.CASE_INSENSITIVE,这个标志能让表达式忽略大小写进行匹配。
    */
    Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
    Query query = new Query(Criteria.where("name").regex(pattern));
    List<User> users = mongoTemplate.find(query, User.class);
    System.out.println(users);
}
```

### 更新文档

```java
@SpringBootTest
public class Test04 {

    private static final String COLLECTION_NAME = "user01";

    @Resource
    private MongoTemplate mongoTemplate;

    /**
     * 更新集合中匹配查询到的第一条文档数据，如果没有找到就创建并插入一个新文档
     */
    @Test
    public void update() {
        Criteria criteria = Criteria.where("age").is(30);
        Query query = new Query(criteria);
        Update update = new Update().set("age", 25).set("name", "hello");
        UpdateResult result = mongoTemplate.upsert(query, update, User.class, COLLECTION_NAME);
        System.out.println(result);
    }

    /**
     * 更新集合中匹配查询到的文档数据集合中的第一条数据
     */
    @Test
    public void updateFirst(){
        Criteria criteria = Criteria.where("name").is("hello");
        Query query = new Query(criteria).with(Sort.by("age").ascending());
        Update update = new Update().set("age", 12).set("name", "hi");
        UpdateResult result = mongoTemplate.updateFirst(query, update, User.class, COLLECTION_NAME);
        System.out.println(result);
    }

    /**
     * 更新匹配查询到的文档数据集合中中的所有数据
     */
    @Test
    public void updateMany(){
        Criteria criteria = Criteria.where("age").gt(28);
        Query query = new Query(criteria);
        Update update = new Update().set("age", 29);
        UpdateResult result = mongoTemplate.updateMulti(query, update, User.class, COLLECTION_NAME);
        System.out.println(result);
    }
}
```

### 删除文档

```java
@SpringBootTest
public class Test05 {

    private static final String COLLECTION_NAME = "user01";

    @Resource
    private MongoTemplate mongoTemplate;

    /**
     * 删除集合中符合条件的一个或多个文档
     */
    @Test
    public void remove() {
        Criteria criteria = Criteria.where("age").is(22).and("sex").is("男");
        Query query = new Query(criteria);
        DeleteResult result = mongoTemplate.remove(query, COLLECTION_NAME);
        System.out.println(result);
    }

    /**
     * 删除符合条件的单个文档，并返回删除的文档
     */
    @Test
    public void findAndRemove(){
        Criteria criteria = Criteria.where("name").is("hello");
        Query query = new Query(criteria);
        User user = mongoTemplate.findAndRemove(query, User.class, COLLECTION_NAME);
        System.out.println(user);
    }

    /**
     * 删除符合条件的全部文档，并返回删除的文档
     */
    @Test
    public void findAllAndRemove(){
        Criteria criteria = Criteria.where("age").is(23);
        Query query = new Query(criteria);
        List<User> list = mongoTemplate.findAllAndRemove(query, User.class);
        for (User user : list) {
            System.out.println(user);
        }
    }
}
```

### 聚合查询

| 支持的操作 | java 接口           | 说明                               |
| ---------- | ------------------- | ---------------------------------- |
| $project   | Aggregation.project | 修改输入文档的结构                 |
| $match     | Aggregation.match   | 用于过滤数据                       |
| $limit     | Aggregation.limit   | 用来限制聚合管道返回的文档数       |
| $skip      | Aggregation.skip    | 用来在聚合管道操作中跳过指定的文档 |
| $unwind    | Aggregation.unwind  | 将文档的某一个数组类型拆分为多条   |
| $group     | Aggregation.group   | 将聚合中的文档分组，可用于统计结果 |
| $sort      | Aggregation.sort    | 输入文档排序后输出                 |
| $geoNear   | Aggregation.geoNear | 输出接近某一地理位置的有序文档     |

基于聚合操作 Aggregation.group，mongodb 提供可选的表达式

| 聚合表达式 | java 接口                                             | 说明                                         |
| ---------- | ---------------------------------------------------- | -------------------------------------------- |
| $sum       | Aggregation.group().sum(" field ").as(" sum ")           | 求和                                         |
| $avg       | Aggregation.group().avg(" field ").as(" avg ")           | 求平均                                       |
| $min       | Aggregation.group().min(" field ").as(" min ")           | 获取聚合所有文档对应值的最小值               |
| $max       | Aggregation.group().max(" field ").as(" max ")           | 获取聚合所有文档对应值的最大值               |
| $push      | Aggregation.group().push(" field ").as(" push ")         | 在结果文档中插入值到一个数组中               |
| $addToSet  | Aggregation.group().addToSet(" field ").as(" addToSet ") | 在结果文档中插入值到一个数组中，但不创建副本 |
| $first     | Aggregation.group().first(" field ").as(" first ")       | 根据资源文档的排序获取第一个文档数据         |
| $last      | Aggregation.group().last(" field ").as(" last ")         | 根据资源文档的排序获取最后一个文档数据       |

```java
@Document("zips")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Zips {
    @Id //映射文档中的_id
    private String id;
    
    @Field
    private String city;
    
    @Field
    private Double[] loc;
    
    @Field
    private Integer pop;
    
    @Field
    private String state;
}
```

```java
/*
返回人口超过 1000 万的州
db.zips.aggregate( [
	{ 
        $group: { 
            _id: "$state ", 
            totalPop: { 
                $sum: "$ pop " 
            } 
        } 
    },
	{ 
        $match: { 
            totalPop: { 
                $gt: 10*1000*1000 
            } 
        } 
    }
] )
*/

@Test
public void test() {
    //$group操作-->$ group: { _id: "$state", totalPop: { $ sum: "$pop " } }
    GroupOperation groupOperation=
            Aggregation.group("state").sum("pop").as("totalPop");

    //$match操作-->$ match: { totalPop: { $gt: 10*1000*1000 } }
    MatchOperation matchOperation=
            Aggregation.match(Criteria.where("totalPop").gte(10*1000*1000));

    //按顺序组合每一个聚合步骤
    TypedAggregation<Zips> typedAggregation=
            Aggregation.newAggregation(Zips.class,groupOperation,matchOperation);

    //执行聚合操作, 如果不使用 Map，也可以使用自定义的实体类来接收数据
    AggregationResults<Map> aggregationResults =
            mongoTemplate.aggregate(typedAggregation, Map.class);

    // 取出最终结果
    List<Map> mappedResults = aggregationResults.getMappedResults();
    for(Map map:mappedResults){
        System.out.println(map);
    }
}
```

```java
/*
返回各州平均城市人口
db.zips.aggregate( [
	{ 
        $group: { 
            _id: { 
                state: "$state ", 
                city: "$city " 
            }, 
            cityPop: { 
                $sum: "$ pop " 
            }
		} 
	},
	{ 
        $group: { 
            _id: "$_id.state ", 
            avgCityPop: { 
                $avg: "$ cityPop " 
            } 
        } 
    },
	{ 
        $sort: {
            avgCityPop:-1
        }
    }
] )
*/

@Test
public void test2() {
    //$group
    GroupOperation groupOperation =
            Aggregation.group("state","city").sum("pop").as("cityPop");
    //$group
    GroupOperation groupOperation2 =
            Aggregation.group("_id.state").avg("cityPop").as("avgCityPop");
    //$sort
    SortOperation sortOperation =
            Aggregation.sort(Sort.Direction.DESC,"avgCityPop");
    // 按顺序组合每一个聚合步骤
    TypedAggregation<Zips> typedAggregation =
            Aggregation.newAggregation(Zips.class,
                    groupOperation, groupOperation2,sortOperation);
    //执行聚合操作, 如果不使用 Map，也可以使用自定义的实体类来接收数据
    AggregationResults<Map> aggregationResults =
            mongoTemplate.aggregate(typedAggregation, Map.class);
    // 取出最终结果
    List<Map> mappedResults = aggregationResults.getMappedResults();
    for(Map map:mappedResults){
        System.out.println(map);
    }
}
```

```java
/*
按州返回最大和最小的城市
db.zips.aggregate( [
    { 
        $group: {
    		_id: { 
                state: "$state ", 
                city: "$city " 
            },
            pop: { 
                $sum: "$ pop " 
            }
    	}
    },
	{ 
        $sort: { 
            pop: 1 
        } 
    },
    { 
        $group: {
            _id : "$_id.state ",
            biggestCity: { 
                $last: "$_id.city " 
            },
            biggestPop: { 
                $last: "$ pop " 
            },
            smallestCity: { 
                $first: "$_id.city " 
            },
            smallestPop: { 
                $first: "$ pop " 
            }
        }
    },
    { 
        $project: { 
            _id: 0,
        	state: "$_id ",
        	biggestCity: { 
                name: "$biggestCity ", 
                pop: "$biggestPop " 
            },
        	smallestCity: { 
                name: "$smallestCity ", 
                pop: "$smallestPop " 
            }
        }
    },
	{ 
        $sort: { 
            state: 1 
        } 
    }
] )
*/

@Test
public void test3(){
    //$group
    GroupOperation groupOperation = Aggregation
            .group("state","city").sum("pop").as("pop");
    //$sort
    SortOperation sortOperation = Aggregation
            .sort(Sort.Direction.ASC,"pop");
    //$group
    GroupOperation groupOperation2 = Aggregation
            .group("_id.state")
            .last("_id.city").as("biggestCity")
            .last("pop").as("biggestPop")
            .first("_id.city").as("smallestCity")
            .first("pop").as("smallestPop");
    //$project
    ProjectionOperation projectionOperation = Aggregation
            .project("state","biggestCity","smallestCity")
            .and("_id").as("state")
            .andExpression(
                    "{ name: "$biggestCity", pop: "$biggestPop" }")
            .as("biggestCity")
            .andExpression(
                    "{ name: "$smallestCity", pop: "$smallestPop" }"
            ).as("smallestCity")
            .andExclude("_id");
    //$sort
    SortOperation sortOperation2 = Aggregation
            .sort(Sort.Direction.ASC,"state");
    // 按顺序组合每一个聚合步骤
    TypedAggregation<Zips> typedAggregation = Aggregation.newAggregation(
            Zips.class, groupOperation, sortOperation, groupOperation2,
            projectionOperation,sortOperation2);
    //执行聚合操作, 如果不使用 Map，也可以使用自定义的实体类来接收数据
    AggregationResults<Map> aggregationResults = mongoTemplate
            .aggregate(typedAggregation, Map.class);
    // 取出最终结果
    List<Map> mappedResults = aggregationResults.getMappedResults();
    for(Map map:mappedResults){
        System.out.println(map);
    }
}
```

### 索引操作

```java
// 1. 创建索引
@SpringBootTest
public class IndexTest {
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Test
    public void createIndexes() {
        // 单字段索引
        mongoTemplate.indexOps(User.class).ensureIndex(
            new Index().on("username", Sort.Direction.ASC).unique()
        );
        
        // 复合索引
        mongoTemplate.indexOps(User.class).ensureIndex(
            new Index().on("age", Sort.Direction.ASC)
                      .on("createTime", Sort.Direction.DESC)
                      .named("age_createTime_idx")
        );
        
        // 文本索引
        mongoTemplate.indexOps(BlogPost.class).ensureIndex(
            new Index().on("title", Sort.Direction.ASC)
                      .on("content", Sort.Direction.ASC)
                      .named("text_idx")
        );
    }
    
    // 2. 查看索引
    @Test
    public void listIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps(User.class);
        indexOps.getIndexInfo().forEach(index -> {
            System.out.println("Index: " + index.getName());
            System.out.println("Keys: " + index.getIndexKeys());
            System.out.println("Options: " + index.getIndexOptions());
        });
    }
}
```

## 事务配置

### 配置事务支持

```java
@Configuration
public class MongoConfig {
    
    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}
```

事务配置注意事项：

1. MongoDB 事务需要复制集或分片集群

2. 事务默认超时时间为 60 秒，可通过 `@Transactional(timeout=30)` 调整

3. 跨多个集合的事务操作需要相同的会话

### 编程式事务

```java
@Service
public class UserService {
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private MongoTransactionManager transactionManager;
    
    public void transferPoints(String fromUserId, String toUserId, int points) {
        // 获取事务定义
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setReadOnly(false);
        def.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
        
        // 开启事务
        TransactionStatus status = transactionManager.getTransaction(def);
        
        try {
            // 扣减源用户积分
            Query fromQuery = new Query(Criteria.where("id").is(fromUserId));
            Update fromUpdate = new Update().inc("points", -points);
            mongoTemplate.updateFirst(fromQuery, fromUpdate, User.class);
            
            // 增加目标用户积分
            Query toQuery = new Query(Criteria.where("id").is(toUserId));
            Update toUpdate = new Update().inc("points", points);
            mongoTemplate.updateFirst(toQuery, toUpdate, User.class);
            
            // 提交事务
            transactionManager.commit(status);
        } catch (Exception e) {
            // 回滚事务
            transactionManager.rollback(status);
            throw new RuntimeException("Transfer failed", e);
        }
    }
}
```

### 声明式事务

```java
@Service
public class OrderService {
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Transactional
    public void placeOrder(Order order) {
        // 1. 保存订单
        mongoTemplate.insert(order);
        
        // 2. 更新用户订单计数
        Query query = new Query(Criteria.where("id").is(order.getUserId()));
        Update update = new Update().inc("orderCount", 1);
        mongoTemplate.updateFirst(query, update, User.class);
        
        // 3. 更新库存
        order.getItems().forEach(item -> {
            Query stockQuery = new Query(
                Criteria.where("productId").is(item.getProductId())
            );
            Update stockUpdate = new Update().inc("quantity", -item.getQuantity());
            mongoTemplate.updateFirst(stockQuery, stockUpdate, Inventory.class);
        });
    }
}
```

## 读写分离

配置副本集读写分离：

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://user:pass@primary:27017,secondary1:27017,secondary2:27017/db?replicaSet=rs0&readPreference=secondaryPreferred
```

读偏好(Read Preference)选项：

| 选项               | 说明                           | 适用场景             |
| ------------------ | ------------------------------ | -------------------- |
| primary            | 只从主节点读(默认)             | 强一致性要求         |
| primaryPreferred   | 优先主节点，不可用时从从节点读 | 多数情况可用         |
| secondary          | 只从从节点读                   | 报表查询等非实时需求 |
| secondaryPreferred | 优先从节点，不可用时从主节点读 | 读写分离场景         |
| nearest            | 从网络延迟最低的节点读         | 地理分布式应用       |
