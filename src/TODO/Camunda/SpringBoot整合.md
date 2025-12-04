### 依赖
```xml
<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-rest</artifactId>
</dependency>

<dependency>
  <groupId>org.camunda.bpm.springboot</groupId>
  <artifactId>camunda-bpm-spring-boot-starter-webapp</artifactId>
</dependency>

<dependency>
  <groupId>org.camunda.bpm</groupId>
  <artifactId>camunda-engine-plugin-spin</artifactId>
</dependency>

<dependency>
  <groupId>org.camunda.spin</groupId>
  <artifactId>camunda-spin-dataformat-all</artifactId>
</dependency>
```

### 动态增加会签
<font style="color:rgb(0, 0, 0);">1 设置审批1位并行</font>

<font style="color:rgb(0, 0, 0);">2 填写右边 Multi-instance 和 User assignment</font>

<font style="color:rgb(0, 0, 0);">3 发布流程</font> ![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764254907850-99b85457-0dd4-43c2-b945-d2e479abb934.png)

```java
@ApiOperation("启动实例")
@GetMapping("/start1")
public ResponseEntity start1(processDefinitionId,businessKey){
    //添加审批人
    Map<String,Object> map = new HashMap<>();
    //主管审批
    List<String> managerList = new ArrayList<>(4);
    managerList.add("admin");
    map.put("userList",managerList);

    //启动实例，添加业务key
    Execution execution = runtimeService.startProcessInstanceById(processDefinitionId,businessKey,map);
    return ResponseEntity.ok(execution.getProcessInstanceId());
}
```

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764256034993-11403763-cfb7-44ad-9202-52b211f1254f.png)

<font style="color:rgb(0, 0, 0);">2 新增一个会签</font>

<font style="color:rgb(0, 0, 0);">processInstanceId  在Camunda界面上看</font>

<font style="color:rgb(0, 0, 0);">activityId 这个需要在编辑器中查看审批1节点的activityId，</font>

```java
@ApiOperation("新增一个实例，并设定开始节点")
@GetMapping("/assignBefore")
public ResponseEntity assignBefore(processInstanceId,activityId,user){
    runtimeService.createProcessInstanceModification(processInstanceId)
            .startBeforeActivity(activityId)
            .setVariable("user",user)
            .execute();
    return ResponseEntity.ok("ok");
}
```

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764256092892-1d67a26e-a28d-4fd5-9225-ed9c79f165e7.png)

<font style="color:rgb(0, 0, 0);">或签</font>

<font style="color:rgb(0, 0, 0);">或签的区别，其实很简单</font>

<font style="color:rgb(0, 0, 0);">只是在Multi-instance中增加 ${nrOfCompletedInstances == 1} 代表1人审核通过，就通过。</font>

<font style="color:rgb(0, 0, 0);">nrOfCompletedInstances 是内置变量，无需声明。</font>

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764256108538-18590df7-4ede-4382-b6e0-e070add23079.png)

### <font style="color:rgb(79, 79, 79);">流程权限及创建人设置</font>
<font style="color:rgb(77, 77, 77);">IdentityService为鉴权相关服务，但是我们实际开发中，一般会用到我们自己的鉴权系统，所以可以使用camunda提供的api来设置，具体可以看IdentityServiceImpl这个类，其中也是使用了ThreadLocal来保存鉴权信息 ，代码在下面</font>

```java
private ThreadLocal<Authentication> currentAuthentication = new ThreadLocal<Authentication>();
```

```java
// Userutil是我们自己封装的用户工具类
identityService.setAuthenticatedUserId(UserUtil.getUserId().toString());
 
//获取
Authentication authentication = identityService.getCurrentAuthentication();
```

<font style="color:rgb(77, 77, 77);">他内置很多比如开启流程时候，会默认找当前登录的人，这个类DefaultHistoryEventProducer</font>

```java
// set super process instance id
ExecutionEntity superExecution = executionEntity.getSuperExecution();
if (superExecution != null) {
  evt.setSuperProcessInstanceId(superExecution.getProcessInstanceId());
}

//state
evt.setState(HistoricProcessInstance.STATE_ACTIVE);

// set start user Id
evt.setStartUserId(Context.getCommandContext().getAuthenticatedUserId());
```

### <font style="color:rgb(79, 79, 79);">多租户</font>
<font style="color:rgb(78, 161, 219) !important;">Camunda</font><font style="color:rgb(77, 77, 77);">提供以下方式隔离租户：所有租户的数据都存储在一个表中，通过存储在列中的租户标识符（tenant_id）提供隔离  
</font><font style="color:rgb(77, 77, 77);">Camunda提供了IdentityService用于租户、用户、组的数据隔离</font>

```java
identityService.saveTenant(); //创建租户
identityService.saveUser(); //创建用户
identityService.saveGroup(); //创建组
```

<font style="color:rgb(77, 77, 77);">查询和插入数据时需要传入tenantId，Camunda目前没有提供类似mp的拦截器</font>

```java
runtimeService.createEventSubscriptionQuery()
                .tenantIdIn("1")
                .activityId("Event_18iv48j")
                .singleResult();
```

### <font style="color:rgb(79, 79, 79);">历史数据存储级别</font>
<font style="color:rgb(77, 77, 77);">full：所有历史数据都会保存，包括变量的更新  
</font><font style="color:rgb(77, 77, 77);">audit（建议）：只有历史的流程实例、活动实例、表单数据会被保存  
</font><font style="color:rgb(77, 77, 77);">auto：默认audit  
</font><font style="color:rgb(77, 77, 77);">none：不存储历史数据</font>

### <font style="color:rgb(77, 77, 77);">异步任务</font>
<font style="color:rgb(77, 77, 77);">当一个流程中需要处理的任务很多且可并行处理时候，这时候就可以引入异步任务，以提高系统的吞吐量和可伸缩性，实现流程：</font>

1. <font style="color:rgb(77, 77, 77);">配置异步处理方式</font>

<font style="color:rgb(77, 77, 77);">使用异步服务任务时，需要在服务任务的配置中设置“asynchronousBefore” 和 “exclusive” 属性。其中，”asynchronousBefore”属性用于指定在服务任务执行之前是否启动异步处理，而 “exclusive” 属性用于控制任务的并发性。设置 “exclusive” 属性为 false时，可以允许多个任务并发执行。</font>

2. <font style="color:rgb(77, 77, 77);">配置异步处理器</font>

<font style="color:rgb(77, 77, 77);">异步任务执行完成后，需要通过异步处理器来处理任务的结果。在 Camunda中，异步处理器使用 Job Executor 来实现。Job Executor 是一个定时任务调度器，用于定时扫描任务队列，并执行异步任务。</font>

3. <font style="color:rgb(77, 77, 77);">配置任务重试机制</font>

<font style="color:rgb(77, 77, 77);">在异步任务执行过程中，可能会发生各种异常，例如网络故障、超时等。为了保证任务的可靠性和稳定性，通常需要配置任务重试机制。在Camunda 中，可以配置重试次数、重试间隔、重试策略等参数，以满足不同的业务需求。</font>

4. <font style="color:rgb(77, 77, 77);">配置异步任务监听器</font>

<font style="color:rgb(77, 77, 77);">在异步任务执行过程中，可能需要监听任务的执行状态，例如任务执行成功或者失败等。可以在任务节点上配置任务监听器，监听任务的执行状态，并进行相应的处理。</font>

