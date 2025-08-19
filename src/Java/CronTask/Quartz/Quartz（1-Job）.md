---
title: Quartz（1-Job）
tag:
  - 定时任务
  - Quartz
category: Java
description: Quartz Job是Quartz框架中具体执行任务的定义单元，负责实现需要调度的逻辑。每次任务触发时，Job实例会被调用并执行相应操作。结合Trigger，Quartz Job可以灵活实现定时、周期性或一次性任务调度，广泛应用于企业应用自动化任务管理。
date: 2024-11-12 22:38:34
---

## 基本使用

```xml
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz</artifactId>
    <version>2.3.1</version>
</dependency>
```

```java
public class HelloJob implements Job {

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        //实际触发时间。例如，计划时间可能是 10:00:00，但如果调度程序太忙，实际触发时间可能是 10:00:03。
        Date fireTime = jobExecutionContext.getFireTime();
        System.out.println("fireTime:" + fireTime);
        //上次触发时间
        Date previousFireTime = jobExecutionContext.getPreviousFireTime();
        System.out.println("previousFireTime:" + previousFireTime);
        //下次触发时间
        Date nextFireTime = jobExecutionContext.getNextFireTime();
        System.out.println("nextFireTime:" + nextFireTime);
        //触发器触发的预定时间。
        Date scheduledFireTime = jobExecutionContext.getScheduledFireTime();
        System.out.println("scheduledFireTime:" + scheduledFireTime);

        JobDetail jobDetail = jobExecutionContext.getJobDetail();
        System.out.println("jobDataMap:" + JSON.toJSONString(jobDetail.getJobDataMap()));
        System.out.println("jobKey:" + JSON.toJSONString(jobDetail.getKey()));
        System.out.println("jobDescription:" + jobDetail.getDescription());
        System.out.println("==================================");
    }

    public static void main(String[] args) throws SchedulerException {
        //1.创建一个jobDetail的实例，将该实例与HelloJob Class绑定
        JobDetail jobDetail = JobBuilder
                .newJob(HelloJob.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("hello","group1")
                .withDescription("Quartz测试")
                .usingJobData("name", "小米")
                .usingJobData("age", 15)
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger", "group1")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(2) //每2秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        StdSchedulerFactory factory = new StdSchedulerFactory();
        Scheduler scheduler = factory.getScheduler();
        scheduler.start(); //启动
        scheduler.scheduleJob(jobDetail, trigger); // jobDetail和trigger加入调度
    }
}
```

## JobExecutionContext

当 Scheduler 调用一个 Job 就会将 JobExecutionContext 传递给 Job 的 execute()方法，Job 能通过 JobExecutionContext 对象访问到 Quartz 运行时候的环境和 Job 本身的明细数据

## JobDetail、JobBuilder

### 方法

1. storeDurably

JobDetails 信息持久化到数据库的时候有一个属性 storeDurably，如果设置为 true 则无论与其关联的 Trigger 是否存在其都会一直存在，否则只要相关联的 trigger 删除掉了其会自动删除掉

2. requestRecovery

请求恢复，也就是说当应用发生故障的时候，是否重新执行默认是 false。如果一个 job 是可恢复的，并且在其执行的时候，scheduler 发生硬关闭（hard shutdown)（比如运行的进程崩溃了，或者关机了），则当 scheduler 重新启动的时候，该 job 会被重新执行。此时，该 job 的 JobExecutionContext.isRecovering() 返回 true

3. usingJobData、setJobData

添加 Job 数据，每个 JobDetail 内都有一个 JobDataMap，包含了关联到这个 Job 的数据，在 Job 类中，可以通过 context 取出该数据，进行业务流程处理。

4. withIdentity

给 JobDetail 起一个 Id，方便后面检索

5. withDescription

用来对 job 进行描述，并没有什么实际作用

### JobKey

JobKey 是表明 Job 身份的一个对象，里面封装了 Job 的 name 和 group，TriggerKey 同理。当不指定 group 时，Quartz 会用默认的组名 DEFAULT

### JobDataMap

JobDetail 是任务的定义，而 Job 是任务的执行逻辑，每一个 JobDetail 都会有一个 JobDataMap，JobDataMap 本质就是一个 Map 的扩展类，可以存储一些任务信息

#### JobDataMap 获取任务信息

```java
public class HelloJob implements Job {

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        JobDetail jobDetail = jobExecutionContext.getJobDetail();
        JobDataMap jobDataMap = jobDetail.getJobDataMap();
        System.out.println("name:" + jobDataMap.getString("name"));
        System.out.println("age:" + jobDataMap.getInt("age"));
        System.out.println("jobKey:" + JSON.toJSONString(jobDetail.getKey()));
        System.out.println("jobDescription:" + jobDetail.getDescription());
        System.out.println("==================================");
    }

    public static void main(String[] args) throws SchedulerException {
        //1.创建一个jobDetail的实例，将该实例与HelloJob Class绑定
        JobDetail jobDetail = JobBuilder
                .newJob(HelloJob.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("hello","group1")
                .withDescription("Quartz测试")
                .usingJobData("name", "小米")
                .usingJobData("age", 15)
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger", "group1")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(2) //每2秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        StdSchedulerFactory factory = new StdSchedulerFactory();
        Scheduler scheduler = factory.getScheduler();
        scheduler.start(); //启动
        scheduler.scheduleJob(jobDetail, trigger); // jobDetail和trigger加入调度
    }
}
```

#### 实体类获取任务信息

```java
public class HelloJob3 implements Job {

    private String message;
    private Float floatJobValue;
    private Double doubleTriggerValue;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Float getFloatJobValue() {
        return floatJobValue;
    }

    public void setFloatJobValue(Float floatJobValue) {
        this.floatJobValue = floatJobValue;
    }

    public Double getDoubleTriggerValue() {
        return doubleTriggerValue;
    }

    public void setDoubleTriggerValue(Double doubleTriggerValue) {
        this.doubleTriggerValue = doubleTriggerValue;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        //打印当前的执行时间 例如 2017-11-22 00:00:00
        Date date = new Date();
        SimpleDateFormat sf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println("现在的时间是：" + sf.format(date));
        //打印jobDataMap定义的message的值
        System.out.println("jobDataMap定义的message的值 : " + message);
        //jobDataMap定义的floatJobValue的值
        System.out.println("jobDataMap定义的floatJobValue的值 : " + floatJobValue);   
		System.out.println("==================================");
    }

    public static void main(String[] args) throws SchedulerException {
        //1.创建一个jobDetail的实例，将该实例与HelloJob Class绑定
        JobDetail jobDetail = JobBuilder
                .newJob(HelloJob3.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("myJob", "group1") //定义name 和 group
                .usingJobData("message","hello myJob1") //加入属性到jobDataMap
                .usingJobData("FloatJobValue",8.88f) //加入属性到jobDataMap
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger", "group1")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(2) //每2秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        StdSchedulerFactory factory = new StdSchedulerFactory();
        Scheduler scheduler = factory.getScheduler();
        scheduler.start(); //启动
        scheduler.scheduleJob(jobDetail,trigger); // jobDetail和trigger加入调度
    }
}
```

## 注解使用

### @PersistJobDataAfterExecution

有状态的 Job 可以理解为多次 Job 调用期间可以持有一些状态信息，这些状态信息存储在 JobDataMap 中，而默认的无状态 Job 每次调用时都会创建一个新的 JobDataMap

注意：没有添加@PersistJobDataAfterExecution 注解，每次调用时都会创建一个新的 JobDataMap，不会累加；添加该注解后，多次调用期间可以持有一些状态信息

```java
@PersistJobDataAfterExecution
public class HelloJob4 implements Job {

    private Integer count;

    public void setCount(Integer count) {
        this.count = count;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        System.out.println(++count);
        jobExecutionContext.getJobDetail().getJobDataMap().put("count", count);
    }

    public static void main(String[] args) throws SchedulerException {
        //1.创建一个jobDetail的实例，将该实例与HelloJob Class绑定
        JobDetail jobDetail = JobBuilder
                .newJob(HelloJob4.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("myJob", "group1") //定义name 和 group
                .usingJobData("count",0) //加入属性到jobDataMap
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger", "group1")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(2) //每2秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        StdSchedulerFactory factory = new StdSchedulerFactory();
        Scheduler scheduler = factory.getScheduler();
        scheduler.start(); //启动
        scheduler.scheduleJob(jobDetail,trigger); // jobDetail和trigger加入调度
    }
}
```

### @DisallowConcurrentExecution

禁止并发执行多个相同定义的 JobDetail，这个注解是加在 Job 类上的，但意思并不是不能同时执行多个 Job，而是不能并发执行同一个 Job

例如：同一个 Job 实现类 DemoJob 的两个 JobDetail 实例 A 和 B，设置 A 的定时执行频率为每 1 分钟执行一次，A 的实际运行耗时为 3 分钟，B 的定时执行频率也是每 1 分钟执行一次，B 的实际运行耗时为 30 秒。假如在 07:00 分 00 秒时 A 和 B 同时第一次运行，则到 07:00 分 30 秒时 B 运行结束，此时 A 还在运行中，到 07:01 分 00 秒时 A 和 B 又该执行了，但是由于注解@DisallowConcurrentExecution 的缘故，此时 A 不会再次运行，A 只能在其上一次运行结束后才能再次被调用执行。但是 B 会正常运行（B 不受 A 的影响，注解@DisallowConcurrentExecution 是作用于 JobDetail 实例而不是 Job 实现类）

注意：如果你使用了@PersistJobDataAfterExecution 注解，则强烈建议你同时使用@DisallowConcurrentExecution 注解，因为当同一个 job（JobDetail）的两个实例被并发执行时，由于竞争，JobDataMap 中存储的数据很可能是不确定的。

**使用同一个Job对象**

```java
@DisallowConcurrentExecution
public class HelloJob5 implements Job {

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        Date date = new Date();
        SimpleDateFormat sf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println("现在的时间是：" + sf.format(date));
        JobKey key = jobExecutionContext.getJobDetail().getKey();
        //打印jobDetail 的name
        System.out.println("jobDetail 的name ： " + key.getName());
        //打印jobDetail 的group
        System.out.println("jobDetail 的group ： " + key.getGroup());
        System.out.println("==============================");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public static void main(String[] args) throws SchedulerException {
        //1.创建一个jobDetail的实例，将该实例与HelloJob Class绑定
        JobDetail jobDetail1 = JobBuilder
                .newJob(HelloJob5.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("group1", "group1") //定义name 和 group
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger1 = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger1", "group1")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(2) //每2秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        StdSchedulerFactory factory = new StdSchedulerFactory();
        Scheduler scheduler = factory.getScheduler();
        scheduler.start(); //启动
        scheduler.scheduleJob(jobDetail1, trigger1); // jobDetail和trigger加入调度
    }
}
```

1. 使用@DisallowConcurrentExecution前

```java
// 运行结果：
现在的时间是：2024-11-12 00:59:49
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
现在的时间是：2024-11-12 00:59:52
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
现在的时间是：2024-11-12 00:59:55
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
```

2. 使用@DisallowConcurrentExecution后

```java
// 运行结果：
现在的时间是：2024-11-12 01:00:48
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
现在的时间是：2024-11-12 01:00:50
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
现在的时间是：2024-11-12 01:00:52
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
```

**创建两个 Job 对象**

```java
@DisallowConcurrentExecution
public class HelloJob5 implements Job {

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        Date date = new Date();
        SimpleDateFormat sf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println("现在的时间是：" + sf.format(date));
        JobKey key = jobExecutionContext.getJobDetail().getKey();
        //打印jobDetail 的name
        System.out.println("jobDetail 的name ： " + key.getName());  
        //打印jobDetail 的group
        System.out.println("jobDetail 的group ： " + key.getGroup());    
        System.out.println("==============================");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public static void main(String[] args) throws SchedulerException {
        //1.创建一个jobDetail的实例，将该实例与HelloJob Class绑定
        JobDetail jobDetail1 = JobBuilder
                .newJob(HelloJob5.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("group1", "group1") //定义name 和 group
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger1 = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger1", "group1")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(2) //每2秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        StdSchedulerFactory factory = new StdSchedulerFactory();
        Scheduler scheduler = factory.getScheduler();
        scheduler.start(); //启动
        scheduler.scheduleJob(jobDetail1, trigger1); // jobDetail和trigger加入调度

        JobDetail jobDetail2 = JobBuilder
                .newJob(HelloJob5.class) //定义Job类为HelloJob类，真正的执行逻辑所在
                .withIdentity("group2", "group2") //定义name 和 group
                .build();

        //2.创建一个Trigger触发器的实例，定义该job立即执行，并且每2秒执行一次，一直执行
        SimpleTrigger trigger2 = TriggerBuilder.newTrigger()
                .withIdentity("myTrigger2", "group2")
                .startNow() //立即生效
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(3) //每3秒执行一次
                        .repeatForever()) //一直执行
                .build();
        //3.创建schedule实例
        Scheduler scheduler2 = factory.getScheduler();
        scheduler2.start(); //启动
        scheduler2.scheduleJob(jobDetail2, trigger2); // jobDetail和trigger加入调度
    }
}
```

```java
// 运行结果
现在的时间是：2024-11-12 01:08:37
现在的时间是：2024-11-12 01:08:37
jobDetail 的name ： group2
jobDetail 的name ： group1
jobDetail 的group ： group1
jobDetail 的group ： group2
==============================
==============================
现在的时间是：2024-11-12 01:08:40
jobDetail 的name ： group2
jobDetail 的group ： group2
==============================
现在的时间是：2024-11-12 01:08:40
jobDetail 的name ： group1
jobDetail 的group ： group1
==============================
```

