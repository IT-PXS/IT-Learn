# 1、camunda数据库结构综述
Camunda流程引擎的数据库架构由多个表组成。表名称都以ACT开头。第二部分是表的用例的两个字符标识。此用例也将与服务API大致匹配。

+ ACT_RE_*：RE代表存储库。带有此前缀的表包含“静态”信息，如流程定义和流程资源（图片、规则等）。
+ ACT_RU_*：RU代表运行时间。这些是包含流程实例、用户任务、变量、作业等运行时数据的运行时表。引擎仅在流程实例执行期间存储运行时数据，并在流程实例结束时删除记录。这使运行时表保持小而快。
+ ACT_ID_*：ID代表身份。这些表包含用户、组等标识信息。
+ ACT_HI_*：HI代表历史。这些表包含历史数据，如过去的流程实例、变量、任务等。
+ ACT_GE_*：通用数据，用于各种用例。

流程引擎的主表是流程定义、执行、任务、变量和事件订阅的实体。它们之间的关系如下面的UML模型所示。

![](https://cdn.nlark.com/yuque/0/2025/png/12836966/1764207595581-739005fc-0d4a-4aa9-86f3-d1cc227e300e.png)

## 流程定义（ACT_RE_PROCDEF）
ACT_RE_PROCDEF表包含所有已部署的流程定义。它包括版本详细信息、资源名称或挂起状态等信息。

## 流程执行（ACT_RU_EXECUTION）
ACT_RU_EXECUTION表包含所有当前执行。它包括流程定义、父执行、业务键、当前活动和有关执行状态的不同元数据等信息。

## 待办任务（ACT_RU_TASK）
ACT_RU_TASK表包含所有正在运行的流程实例的所有打开的任务。它包括相应的流程实例、执行以及元数据（如创建时间、受理人或截止日期）等信息。

## 流程变量（ACT_RU_VARIABLE）
ACT_RU_VARIABLE表包含所有当前设置的流程或任务变量。它包括变量的名称、类型和值，以及有关相应流程实例或任务的信息。

## 事件订阅（ACT_RU_EVENT_SUBSCR）
ACT_RU_EVENT_SUBSCR表包含所有当前存在的事件预订。它包括预期事件的类型、名称和配置，以及有关相应流程实例和执行的信息。

## 数据库版本日志（ACT_GE_SCHEMA_LOG）
ACT_GE_SCHEMA_LOG表包含数据库模式版本的历史记录。当对数据库模式进行更改时，会将新条目写入表中。创建数据库时，将添加初始条目。每个更新脚本都会添加一个新条目，其中包含ID、数据库更新到的版本以及更新的日期和时间（时间戳）。

要从模式日志中检索条目，可以使用schemaLogQuery-API:

List<SchemaLogEntry> entries = managementService.createSchemaLogQuery().list();

## 指标日志（ACT_RU_METER_LOG）
ACT_RU_METER_LOG表包含运行时指标的集合，这些指标有助于得出有关Camunda平台的使用情况、负载和性能的结论。度量以Java长范围中的数字形式报告，并计算特定事件的发生次数。有关如何收集指标的详细信息，请参阅指标用户指南：https://docs.camunda.org/manual/7.19/user-guide/process-engine/metrics/.

运行时指标默认配置。MetricsReporter的默认配置将每15分钟在ACT_RU_METER_LOG中为每个度量创建一行。

## 任务指标日志（ACT_RU_TASK_METER_LOG）
ACT_RU_TASK_METER_LOG表包含一组与任务相关的指标，这些指标有助于得出有关BPM平台的使用情况、负载和性能的结论。任务度量包含任务代理人的假名和固定长度值及其出现时间。有关如何收集任务指标的详细信息，请参阅指标用户指南.

每次将任务分配给任务接受者时，都会在ACT_RU_TASK_METER_LOG中创建一行。

# 2、camunda表结构-实体关系图
## 2.1、BPMN流程引擎
| **表名称**            | **表用途说明**                                               |
| :-------------------- | :----------------------------------------------------------- |
| ACT_GE_PROPERTY       | 流程引擎参数信息表                                           |
| ACT_GE_SCHEMA_LOG     | 数据库版本日志表                                             |
| ACT_RE_PROCDEF        | BPMN流程模型定义表                                           |
| ACT_RE_DEPLOYMENT     | BPMN流程模型部署表                                           |
| ACT_RE_CAMFORMDEF     | 流程表单定义表                                               |
| ACT_GE_BYTEARRAY      | 二进制数据存储表（BPMN模型、表单、脚本、决策表等流程引擎所需的二进制数据） |
| ACT_RU_TASK_METER_LOG | Task任务性能指标日志表                                       |
| ACT_RU_EXECUTION      | 流程引擎执行实例表                                           |
| ACT_RU_JOB            | 定时器作业运行表                                             |
| ACT_RU_JOBDEF         | 定时器作业定义表                                             |
| ACT_RU_VARLABLE       | 流程运行时变量表                                             |
| ACT_RU_EXT_TASK       | 外部任务待办表                                               |
| ACT_RU_INCIDENT       | 运行时异常记录表                                             |
| ACT_RU_AUTHORIZATION  | 资源授权权限表                                               |
| ACT_RU_FILTER         | 流程查询过滤器定义表                                         |
| ACT_RU_METER_LOG      | 流程指标日志记录表                                           |
| ACT_RU_TASK           | 待办任务表                                                   |
| ACT_RU_EVENT_SUBSCR   | 事件订阅表                                                   |
| ACT_RU_IDENTITYLINK   | 流程处理用户ID关联表                                         |
| ACT_RU_BATCH          | 流程批处理信息表                                             |


## 2.2、DMN决策引擎
| **表名称**              | **表用途说明**    |
| :---------------------- | :---------------- |
| ACT_RE_DECISION_DEF     | DMN决策定义表     |
| ACT_RE_DECISION_REQ_DEF | DMN决策需求定义表 |


## 2.3、CMMN案例引擎
| **表名称**              | **表用途说明**                               |
| :---------------------- | :------------------------------------------- |
| ACT_RE_CASE_DEF         | CMMN模型定义表                               |
| ACT_RU_CASE_EXECUTION   | CMMN实例执行信息表                           |
| ACT_RU_CASE_SENTRY_PART | CMMN案例实例中的哨兵条件配置和评估结果信息表 |
| ACT_RU_TASK             | 待办任务表，跟BPMN引擎复用一张表             |
| ACT_RU_VARLABLE         | 流程运行时变量表，跟BPMN引擎复用一张表       |


## 2.4、实例历史记录表
| **表名称**          | **表用途说明**               |
| :------------------ | :--------------------------- |
| ACT_HI_PROCINST     | 流程实例的历史记录表         |
| ACT_HI_ACTINST      | 活动实例的历史记录表         |
| ACT_HI_ATTACHMENT   | 流程附件的历史记录表         |
| ACT_HI_BATCH        | 批处理的历史记录表           |
| ACT_HI_COMMENT      | 流程审批意见的历史记录表     |
| ACT_HI_DETAIL       | 流程变量详情的历史记录表     |
| ACT_HI_EXT_TASK_LOG | 外部任务执行日志的历史记录表 |
| ACT_HI_IDENTITYLINK | 待办处理用户关系的历史记录表 |
| ACT_HI_INCIDENT     | 流程异常事件的历史记录表     |
| ACT_HI_JOB_log      | 定时作业的历史记录表         |
| ACT_HI_OP_log       | 操作日志的历史记录表         |
| ACT_HI_TASKINST     | 流程待办任务的历史记录表     |
| ACT_HI_VARINST      | 流程变量的历史记录表         |
| ACT_HI_DECINST      | DMN决策实例的历史记录表      |
| ACT_HI_DEC_IN       | DMN决策变量输入的历史记录表  |
| ACT_HI_DEC_OUT      | DMN决策变量输出的历史记录表  |
| ACT_HI_CASEINST     | CMMN实例的历史记录表         |
| ACT_HI_CASEACTINST  | CMMN活动实例的历史记录表     |


## 2.5、组织用户身份表
| **表名称**           | **表用途说明** |
| :------------------- | :------------- |
| ACT_ID_USER          | 用户信息表     |
| ACT_ID_GROUP         | 群组信息表     |
| ACT_ID_MEMBERSHIP    | 用户群组关系表 |
| ACT_ID_INFO          | 用户扩展信息表 |
| ACT_ID_TENANT        | 租户信息表     |
| ACT_ID_TENANT_MEMBER | 租户成员表     |

