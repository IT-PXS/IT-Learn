## 模块详解

1. xxl-job-admin：xxl-job 管理平台，访问地址为 localhost: 8080/xxl-job/admin，用户名为 admin，密码为 123456
2. xxl-job-core：核心依赖包，当 springboot 项目 xxl-job 只需要引用即可
3. xxl-job-executor-sample-frameless：java 整合 demo
4. xxl-job-executor-sample-springboot：springboot 整合 demo

## 调度中心配置

### 导入 sql 脚本

![](Xxl-Job（2-基本使用）/1.png)

1. xxl_job_lock：任务调度锁表；
2. xxl_job_group：执行器信息表，维护任务执行器信息；
3. xxl_job_info：调度扩展信息表： 用于保存 XXL-JOB 调度任务的扩展信息，如任务分组、任务名、机器地址、执行器、执行入参和报警邮件等等；
4. xxl_job_log：调度日志表： 用于保存 XXL-JOB 任务调度的历史信息，如调度结果、执行结果、调度入参、调度机器和执行器等等；
5. xxl_job_logglue：任务 GLUE 日志：用于保存 GLUE 更新历史，用于支持 GLUE 的版本回溯功能；
6. xxl_job_registry：执行器注册表，维护在线的执行器和调度中心机器地址信息；
7. xxl_job_user：系统用户表； 

### 修改配置信息

1. 修改 application.properties 的 mysql 和 mail 配置

![](Xxl-Job（2-基本使用）/2.png)

2. 修改 logback 的文件存储地址（要有读写权限）

![](Xxl-Job（2-基本使用）/3.png)

### 访问后台

调度中心访问地址：http://localhost: 8080/xxl-job-admin

1. 用户名：admin
2. 密码：123456

## SpringBoot 整合

### 添加执行器

| 属性名称 | 说明                                                         |
| :------- | :----------------------------------------------------------- |
| AppName  | 每个执行器集群的唯一标示，执行器会周期性以 AppName 为对象进行自动注册。可通过该配置自动发现注册成功的执行器，供任务调度时使用。 |
| 名称     | 执行器的名称，因为 AppName 限制为字母数字等组成，可读性不强，名称用于提高执行器的可读性。 |
| 排序     | 执行器的排序，系统中需要执行器的地方（如任务新增）将会按照该排序读取可用的执行器列表。 |
| 注册方式 | 调度中心获取执行器地址的方式。                               |
| 机器地址 | 注册方式为“手动录入”时有效，支持人工维护执行器的地址信息。   |

![](Xxl-Job（2-基本使用）/4.png) 

![](Xxl-Job（2-基本使用）/5.png)

### 添加 Bean 任务

```xml
<dependency>
    <groupId>com.xuxueli</groupId>
    <artifactId>xxl-job-core</artifactId>
    <version>2.3.0</version>
</dependency>
```

```yaml
xxl:
  job:
  	# 执行器通讯（选填）：非空时启用，与xxl-job-admin要一致
    accessToken:
    admin:
      # 调度中心地址（选填）：如调度中心集群部署存在多个地址则用逗号分隔。
      # 执行器将会使用该地址进行"执行器心跳注册"和"任务结果回调"，为空则关闭自动注册
      addresses: http://127.0.0.1:8080/xxl-job-admin
    executor:
      # 执行器（选填）：执行器心跳注册分组依据，为空则关闭自动注册
      appname: xxl-job-executor-sample
      # 默认为空表示自动获取，多网卡时可手动设置指定IP，该IP不会绑定Host仅作为通讯实用，
      # 地址信息用于 “执行器注册” 和“调度中心请求并触发任务”
      ip:
      # 执行器端口号（选填）：小于等于0则自动获取，默认端口为9999，单机部署多个执行器时，注意要配置不同执行器端口
      port: 9900
      # 执行器运行日志文件存储磁盘路径（选填）：需要对该路径拥有读写权限，为空则使用默认路径
      logpath: /var/log/hwariot/hwariot-mixing-station-data/xxl-job/jobhandler/
      # 执行器日志保存天数（选填）：值大于3时生效，启用执行器Log文件定期清理功能，否则不生效
      logretentiondays: -1
```

```java
@Configuration
public class XxlJobConfig {
    private Logger logger = LoggerFactory.getLogger(XxlJobConfig.class);

    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;

    @Value("${xxl.job.accessToken}")
    private String accessToken;

    @Value("${xxl.job.executor.appname}")
    private String appname;

    @Value("${xxl.job.executor.address}")
    private String address;

    @Value("${xxl.job.executor.ip}")
    private String ip;

    @Value("${xxl.job.executor.port}")
    private int port;

    @Value("${xxl.job.executor.logpath}")
    private String logPath;

    @Value("${xxl.job.executor.logretentiondays}")
    private int logRetentionDays;


    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        logger.info(">>>>>>>>>>> xxl-job config init.");
        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);
        xxlJobSpringExecutor.setAppname(appname);
        xxlJobSpringExecutor.setAddress(address);
        if (StringUtils.isBlank(ip)) {
            ip = inetUtils.findFirstNonLoopbackHostInfo().getIpAddress();
        }
        xxlJobSpringExecutor.setIp(ip);
        xxlJobSpringExecutor.setPort(port);
        xxlJobSpringExecutor.setAccessToken(accessToken);
        xxlJobSpringExecutor.setLogPath(logPath);
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);

        return xxlJobSpringExecutor;
    }
}
/**
 * 针对多网卡、容器内部署等情况，可借助 "spring-cloud-commons" 提供的 "InetUtils" 组件灵活定制注册 IP；
 *      1、引入依赖：
 *          <dependency>
 *             <groupId> org.springframework.cloud </groupId>
 *             <artifactId> spring-cloud-commons </artifactId>
 *             <version>${version}</version >
 *         </dependency>
 *
 *      2、配置文件，或者容器启动变量，指定默认 IP
 *          spring.cloud.inetutils.preferred-networks: 'xxx.xxx.xxx.'
 *
 *      3、获取 IP
 *          String ip_ = inetUtils.findFirstNonLoopbackHostInfo().getIpAddress();
 */
```

```java
/**
 * xxl-job 开发示例
 * 开发步骤：
 * 1、任务开发：在 Spring Bean 实例中，开发 Job 方法；
 * 2、注解配置：为 Job 方法添加注解 "@XxlJob(value =" 自定义 jobhandler 名称 ", init = " JobHandler 初始化方法 ", destroy = " JobHandler 销毁方法 ")"，注解 value 值对应的是调度中心新建任务的 JobHandler 属性的值。
 * 3、执行日志：需要通过 "XxlJobHelper.log" 打印执行日志；
 * 4、任务结果：默认任务结果为 "成功" 状态，不需要主动设置；如有诉求，比如设置任务结果为失败，可以通过 "XxlJobHelper.handleFail/handleSuccess" 自主设置任务结果；
 */
@Component
@Slf4j
public class TestHandler {

    @XxlJob(value = "TestHandler")
    public boolean demoJobHandler(){
        log.info("定时任务开始 job start");
        long startTime  = System.currentTimeMillis();
        System.out.println("hello world");
        long endTime  = System.currentTimeMillis();
        log.info("定时任务开始 job end, cost: {} ms"+(endTime - startTime));
        return XxlJobHelper.handleSuccess();
    }
}
```

![](D:\blog\vuepress-theme-hope\src\TODO\Xxl Job\Xxl-Job（2-基本使用）\9.png)

注意：

1. 在 xxl-job 中，获取 IP 是通过 ipUtils 类中的 getIp()获取的：首先获取的是 localhost，如果在本地没取到 IP，那么就会去获取所有网卡接口，依次遍历（localAddrs [] 总是获取的第一个，如果当前网卡存在 2 个，第一个 eth0 状态不可用，第二个 eth1 状态可用，那么他总是会取到不可用 IP，导致服务出现问题）
2. InetUtils 中的 findFirstNonLoopbackAddress()是先去获取了网卡接口，再遍历并且依次判断当前地址是否是开启的，然后判断了当前网卡接口是不是被配置了可忽略，然后获取到地址之后 address instanceof Inet4Address && ! address.isLoopbackAddress() && ! this.ignoreAddress(address)，如果符合条件赋值给 result，后续判断如果 result 不为 null，则直接返回，如果为空，再去 InetAddress.getLocalHost()

### 添加 GLUE （Java）任务

![](D:\blog\vuepress-theme-hope\src\TODO\Xxl Job\Xxl-Job（2-基本使用）\10.png)

![](D:\blog\vuepress-theme-hope\src\TODO\Xxl Job\Xxl-Job（2-基本使用）\11.png)

![](D:\blog\vuepress-theme-hope\src\TODO\Xxl Job\Xxl-Job（2-基本使用）\12.png)

![](D:\blog\vuepress-theme-hope\src\TODO\Xxl Job\Xxl-Job（2-基本使用）\13.png)

## 分片广播任务

![](D:\blog\vuepress-theme-hope\src\TODO\Xxl Job\Xxl-Job（2-基本使用）\14.png)

定时任务逻辑里，根据获取到的分片参数、执行任务节点数量，决策当前节点是否需要执行，分片查询数据并处理：

1. 如果 分片序号 > (执行任务节点数量 - 1)，则当前节点不执行任务，直接返回；
2. 否则，取 分片序号 和 执行任务节点数量 作为分片参数，查询数据并处理。

```java
@XxlJob("demoJobHandler")
public void execute() {
    String param = XxlJobHelper.getJobParam();
    if (StringUtils.isBlank(param)) {
        XxlJobHelper.log("任务参数为空");
        XxlJobHelper.handleFail();
        return;
    }

    // 执行任务节点数量
    int executeNodeNum = Integer.valueOf(param);
    // 分片序号
    int shardIndex = XxlJobHelper.getShardIndex();
    // 分片总数
    int shardTotal = XxlJobHelper.getShardTotal();
    if (executeNodeNum <= 0 || executeNodeNum > shardTotal) {
        XxlJobHelper.log("执行任务节点数量取值范围[1,节点总数]");
        XxlJobHelper.handleFail();
        return;
    }

    if (shardIndex > (executeNodeNum - 1)) {
        XxlJobHelper.log("当前分片 {} 无需执行", shardIndex);
        XxlJobHelper.handleSuccess();
        return;
    }
    // 业务逻辑处理
    // ......
    XxlJobHelper.handleSuccess();
}
```

## 自动创建任务

通过调用 xxl-job 提供的接口可以自动创建任务

注意：这些接口都是后台使用的，必须登录才行，否则会被拦截器拦截。通过@PermissionLimit(limit = false)注解可以跳过登录验证

```java
/*------------------自定义方法----------------------  */
@RequestMapping("/addJob")
@ResponseBody
@PermissionLimit(limit = false)
public ReturnT<String> addJobInfo(@RequestBody XxlJobInfo jobInfo) {
    return xxlJobService.add(jobInfo);
}

@RequestMapping("/updateJob")
@ResponseBody
@PermissionLimit(limit = false)
public ReturnT<String> updateJobCron(@RequestBody XxlJobInfo jobInfo) {
    return xxlJobService.updateCron(jobInfo);
}

@RequestMapping("/removeJob")
@ResponseBody
@PermissionLimit(limit = false)
public ReturnT<String> removeJob(@RequestBody XxlJobInfo jobInfo) {
    return xxlJobService.remove(jobInfo.getId());
}

@RequestMapping("/pauseJob")
@ResponseBody
@PermissionLimit(limit = false)
public ReturnT<String> pauseJob(@RequestBody XxlJobInfo jobInfo) {
    return xxlJobService.stop(jobInfo.getId());
}

@RequestMapping("/startJob")
@ResponseBody
@PermissionLimit(limit = false)
public ReturnT<String> startJob(@RequestBody XxlJobInfo jobInfo) {
    return xxlJobService.start(jobInfo.getId());
}

@RequestMapping("/addAndStart")
@ResponseBody
@PermissionLimit(limit = false)
public ReturnT<String> addAndStart(@RequestBody XxlJobInfo jobInfo) {
    ReturnT<String> result = xxlJobService.add(jobInfo);
    int id = Integer.valueOf(result.getContent());
    xxlJobService.start(id);
    return result;
}
```

