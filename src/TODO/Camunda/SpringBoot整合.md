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

### 常见方法
1. RepositoryService

此服务提供用于管理和操作部署和流程定义的操作，使用camunda的第一要务

2. RuntimeService

运行相关，启动流程实例、删除、搜索等

3. TaskService

所有围绕任务相关的操作，如完成、分发、认领等

4. HistoryService

提供引擎搜集的历史数据服务

5. IdentityService

用户相关，实际中用不太到

### <font style="color:rgb(79, 79, 79);">流程相关API</font>
| <font style="color:rgb(15, 17, 21);">类名 (Class)</font> | <font style="color:rgb(15, 17, 21);">作用 (功能描述)</font> |
| --- | --- |
| <font style="color:rgb(15, 17, 21);">RepositoryService</font> | <font style="color:rgb(15, 17, 21);">操作流程定义</font> |
| <font style="color:rgb(15, 17, 21);">RuntimeService</font> | <font style="color:rgb(15, 17, 21);">操作流程实例</font> |
| <font style="color:rgb(15, 17, 21);">TaskService</font> | <font style="color:rgb(15, 17, 21);">操作任务</font> |
| <font style="color:rgb(15, 17, 21);">IdentityService</font> | <font style="color:rgb(15, 17, 21);">操作用户、租户或者组</font> |
| <font style="color:rgb(15, 17, 21);">HistoryService</font> | <font style="color:rgb(15, 17, 21);">查询历史表相关数据</font> |
| <font style="color:rgb(15, 17, 21);">AuthorizationService</font> | <font style="color:rgb(15, 17, 21);">授权相关服务</font> |
| <font style="color:rgb(15, 17, 21);">FormService</font> | <font style="color:rgb(15, 17, 21);">操作流程表单</font> |
| <font style="color:rgb(15, 17, 21);">ManagementService</font> | <font style="color:rgb(15, 17, 21);">执行cmd以及job相关服务</font> |
| <font style="color:rgb(15, 17, 21);">CaseService</font> | <font style="color:rgb(15, 17, 21);">CMMN（案例管理）相关操作</font> |
| <font style="color:rgb(15, 17, 21);">FilterService</font> | <font style="color:rgb(15, 17, 21);">过滤相关服务</font> |
| <font style="color:rgb(15, 17, 21);">ExternalTaskService</font> | <font style="color:rgb(15, 17, 21);">外部任务相关服务</font> |
| <font style="color:rgb(15, 17, 21);">DecisionService</font> | <font style="color:rgb(15, 17, 21);">DMN（决策引擎）相关服务</font> |


#### <font style="color:rgb(79, 79, 79);">创建流程</font>
<font style="color:rgb(77, 77, 77);">会同时创建第一个任务</font>

```java
ProcessInstance instance = runtimeService.startProcessInstanceByKey(processKey, params);
runtimeService.startProcessInstanceByKey("key");
```

#### <font style="color:rgb(79, 79, 79);">暂停流程</font>
<font style="color:rgb(77, 77, 77);">流程暂停后，再执行相关任务会报错，需要先重新激活任务</font>

```java
runtimeService.suspendProcessInstanceById(instance.getId());
```

#### <font style="color:rgb(79, 79, 79);">重新激活流程</font>
```java
runtimeService.activateProcessInstanceById(instance.getId());
```

#### <font style="color:rgb(79, 79, 79);">删除流程</font>
<font style="color:rgb(77, 77, 77);">会同时删除任务</font>

```java
runtimeService.deleteProcessInstance(instance.getId(), "手动删除");
```

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764391572686-fbc57d04-516b-4f62-94b9-d325f27ecad2.png)

<font style="color:rgb(77, 77, 77);">以上都可以在流程历史表 act_hi_procinst 里查询</font>

### <font style="color:rgb(79, 79, 79);">任务相关API</font>
<font style="color:rgb(77, 77, 77);">基于service的查询类，都可先构建一个 query，然后在附上查询条件，实例几个</font>

```java
List<ProcessDefinition> list = repositoryService.createProcessDefinitionQuery().list();
List<Task> list = taskService.createTaskQuery().taskAssignee("zhangsan").list();
List<ProcessInstance> instances = runtimeService.createProcessInstanceQuery().listPage(1, 10);
```

#### <font style="color:rgb(79, 79, 79);">查询历史任务</font>
```java
List<HistoricProcessInstance> list = historyService.createHistoricProcessInstanceQuery().list();
```

#### <font style="color:rgb(79, 79, 79);">查询当前任务/分页</font>
```java
List<Task> list = taskService.createTaskQuery().orderByTaskCreateTime().desc().list();
```

#### <font style="color:rgb(79, 79, 79);">任务回退</font>
<font style="color:rgb(77, 77, 77);">大体思路是拿到当前的任务，及当前任务的上一个历史任务，然后重启</font>

```java
Task activeTask = taskService.createTaskQuery()
                .taskId(taskId)
                .active()
                .singleResult();
List<HistoricTaskInstance> historicTaskInstance = historyService.createHistoricTaskInstanceQuery()
        .processInstanceId(instanceId)
        .orderByHistoricActivityInstanceStartTime()
        .desc()
        .list();

List<HistoricTaskInstance> historicTaskInstances = historicTaskInstance.stream().filter(v -> !v.getTaskDefinitionKey().equals(activeTask.getTaskDefinitionKey())).toList();

Assert.notEmpty(historicTaskInstances, "当前已是初始任务！");
HistoricTaskInstance curr = historicTaskInstances.get(0);

runtimeService.createProcessInstanceModification(instanceId)
        .cancelAllForActivity(activeTask.getTaskDefinitionKey())
        .setAnnotation("重新执行")
        .startBeforeActivity(curr.getTaskDefinitionKey())
        .execute();
```

#### <font style="color:rgb(79, 79, 79);">任务执行人及发起人设置</font>
```java
//根据任务id设置执行人
taskService.setAssignee(task.getId(), UserUtil.getUserId().toString());
```

#### <font style="color:rgb(77, 77, 77);">同意审批</font>
```java
Task task = taskService.createTaskQuery().singleResult();
String comment = "同意";
taskService.createComment(task.getId(), task.getProcessInstanceId(), comment);
taskService.complete(task.getId());
```

#### <font style="color:rgb(77, 77, 77);">退回审批任务</font>
<font style="color:rgb(77, 77, 77);">从当前审批任务，退回到已审批的一个或多个任务节点。退回后，已审批节点重新生成审批任务</font>

```java
runtimeService.createProcessInstanceModification(instanceId)
              .cancelAllForActivity(activeTask.getTaskDefinitionKey())
              .setAnnotation("重新执行")
              .startBeforeActivity(curr.getTaskDefinitionKey())
              .execute();
```

### <font style="color:rgb(79, 79, 79);">流程变量</font>
<font style="color:rgb(77, 77, 77);">包括流程中产生的变量信息，包括控制流程流转的变量，网关、业务表单中填写的流程需要用到的变量等</font>

#### <font style="color:rgb(79, 79, 79);">流程变量变量传递</font>
<font style="color:rgb(77, 77, 77);">变量最终会存在 act_ru_variable 这个表里面</font>

<font style="color:rgb(77, 77, 77);">在绘制流程图的时候，如果是用户任务（userService） 可以设置变量，比如执行人，</font>

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764392340760-f6016d52-766c-4c0d-bb75-4c7552ade9f7.png)

<font style="color:rgb(77, 77, 77);">写法有这么几种方式</font>

1. <font style="color:rgb(77, 77, 77);">写死，就比如 zhangsan</font>
2. <font style="color:rgb(77, 77, 77);">表达式，比如上面写的 ${user}，这种需要传入参数，其实就是启动参数的时候传入，传入参数，可选值为一个Map<String, Object>，之后的流程可查看次参数，上面写的是 user， 所以map里面的key需要带着user，不然会报错。</font>

<font style="color:rgb(77, 77, 77);">关于扩展变量，可在流程图绘制这么设定，传递方式还是一样，</font>

<font style="color:rgb(77, 77, 77);">流程图里面在下面写：</font>

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764392360952-8b83fe4f-fdf4-4a3e-9f8e-ced0cdd076d2.png)

```java
ProcessInstance instance = runtimeService.startProcessInstanceByKey(key, new HashMap<>());
```

#### <font style="color:rgb(79, 79, 79);">变量设置</font>
```java
runtimeService.setVariable(instance.getId(), Constants.PATIENT_ID, relatedId);

// 设置表单属性
ProcessInstance instance = runtimeService.startProcessInstanceByKey(key, new HashMap<>());
runtimeService.setVariable(instance.getId(), "key", "value");
```

#### <font style="color:rgb(79, 79, 79);">变量查询</font>
```java
 Object variable = runtimeService.getVariable(instance.getId(), Constants.GENERAL_ID);
```

#### <font style="color:rgb(79, 79, 79);">历史变量查询</font>
```java
HistoricVariableInstance variableInstance = historyService.createHistoricVariableInstanceQuery().processInstanceId(bo.getId().toString()).
            variableName(Constants.PATIENT_ID).singleResult();
//变量值
variableInstance.getValue();
//变量名称
variableInstance.getName();
```



### 创建流程图回调
<font style="color:rgb(0, 0, 0);">这里我们使用2种回调，来触发</font>

<font style="color:rgb(0, 0, 0);">1 审批：EventListener</font>

<font style="color:rgb(0, 0, 0);">2 审核:  JavaDelegate</font>

```yaml
camunda.bpm:
  #开启监听
  eventing:
    execution: true
    history: true
    task: true
```

<font style="color:rgb(0, 0, 0);">一个监听事件，有多种状态，</font>

<font style="color:rgb(51, 51, 51);">create  
</font><font style="color:rgb(51, 51, 51);">assigment  
</font><font style="color:rgb(51, 51, 51);">complete  
</font><font style="color:rgb(51, 51, 51);">delete  
</font><font style="color:rgb(51, 51, 51);">start  
</font><font style="color:rgb(51, 51, 51);">end</font>

<font style="color:rgb(0, 0, 0);">这里我们使用  delegateTask.eventName=='create'  ，</font>

<font style="color:rgb(0, 0, 0);">并且delegateTask.name=='审批'  就回调该方法。</font>

```java
@Component
public class AuditListener {
     //使用#delegateTask.taskDefinitionKey=='Activity_053ns1t' 更靠谱，taskDefinitionKey就是审批节点的ID
    @EventListener(condition = "#delegateTask.eventName=='create' && #delegateTask.name=='审批'")
    public void notity(DelegateTask delegateTask){
        System.out.println("审核流程 - USER TASK - "+delegateTask.getEventName());
        Object assignee=delegateTask.getAssignee();
        System.out.println("审批人："+ assignee);
        Object approve=delegateTask.getVariable("approve");
        System.out.println("审批结果："+ approve);
        System.out.println("===========================");
    }
}
```

<font style="color:rgb(0, 0, 0);">在审核节点，我们填写如下</font>

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764253961998-cb1cc3d1-787b-4112-b614-dd3c60f33bb3.png)

```java
public class AuditDelegate implements JavaDelegate {
    @Override
    public void execute(DelegateExecution execution) throws Exception {
        System.out.println("审核流程 - SERVICE TASK - 回调");
        Object approved=execution.getVariable("approve");
        System.out.println("审批结果："+ approved);
        Object amount=execution.getVariable("amount");
        System.out.println("审批金额："+ amount);
        System.out.println("===========================");
    }
}
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

### 代码实现流程图
```java
@ApiOperation("动态生成流程图")
@GetMapping("/generateBPMN")
public void autoGenerateBPMN() throws IOException {
    BpmnModelInstance instance= Bpmn.createProcess()
            .startEvent()
            .userTask()
            .id("question")
            .exclusiveGateway()
            .name("Everything fine?")
            .condition("yes","#{fine}")
            .serviceTask()
            .userTask()
            .endEvent()
            .moveToLastGateway()
            .condition("no","#{!fine}")
            .userTask()
            .connectTo("question")
            .done();
    Bpmn.validateModel(instance);
    File file =File.createTempFile("bpmn-model-api-",".bpmn");
    Bpmn.writeModelToFile(file,instance);
}
```

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764256763208-0857bb63-523e-40e2-ae26-bce61236e2c6.png)

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

