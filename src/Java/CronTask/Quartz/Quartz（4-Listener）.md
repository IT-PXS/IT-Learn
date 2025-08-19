---
title: Quartz（4-Listener）
tag:
  - 定时任务
  - Quartz
category: Java
description: Quartz Listener是Quartz Scheduler中用于监听调度器事件的组件。它可以监控任务执行、触发器触发及调度器生命周期的变化。通过实现JobListener、TriggerListener或SchedulerListener接口，开发者能够捕获和处理关键事件，实现任务的精细控制、日志记录及错误处理，增强调度器的管理能力。
date: 2024-11-16 22:38:34
---

## ListenerManager

可以通过ListenerManager向scheduler中添加我们的监听器

```java
public interface ListenerManager {

    public void addJobListener(JobListener jobListener);

    public void addJobListener(JobListener jobListener, Matcher<JobKey> matcher);

    public void addJobListener(JobListener jobListener, Matcher<JobKey> ... matchers);

    public void addJobListener(JobListener jobListener, List<Matcher<JobKey>> matchers);

    public boolean addJobListenerMatcher(String listenerName, Matcher<JobKey> matcher);

    public boolean removeJobListenerMatcher(String listenerName, Matcher<JobKey> matcher);

    public boolean setJobListenerMatchers(String listenerName, List<Matcher<JobKey>> matchers);

    public List<Matcher<JobKey>> getJobListenerMatchers(String listenerName);

    public boolean removeJobListener(String name);

    public List<JobListener> getJobListeners();

    public JobListener getJobListener(String name);

    public void addTriggerListener(TriggerListener triggerListener);

    public void addTriggerListener(TriggerListener triggerListener, Matcher<TriggerKey> matcher);

    public void addTriggerListener(TriggerListener triggerListener, Matcher<TriggerKey> ... matchers);

    public void addTriggerListener(TriggerListener triggerListener, List<Matcher<TriggerKey>> matchers);

    public boolean addTriggerListenerMatcher(String listenerName, Matcher<TriggerKey> matcher);

    public boolean removeTriggerListenerMatcher(String listenerName, Matcher<TriggerKey> matcher);

    public boolean setTriggerListenerMatchers(String listenerName, List<Matcher<TriggerKey>> matchers);

    public List<Matcher<TriggerKey>> getTriggerListenerMatchers( String listenerName);

    public boolean removeTriggerListener(String name);

    public List<TriggerListener> getTriggerListeners();

    public TriggerListener getTriggerListener(String name);

    public void addSchedulerListener(SchedulerListener schedulerListener);

    public boolean removeSchedulerListener(SchedulerListener schedulerListener);

    public List<SchedulerListener> getSchedulerListeners();
}
```

## Matcher

### KeyMatcher

根据JobKey进行匹配，每个JobDetail都有一个对应的JobKey，里面存储了JobName和JobGroup来定位唯一的JobDetail

```java
//构造匹配pickNewsJob中的JobKey的keyMatcher。
KeyMatcher<JobKey> keyMatcher = KeyMatcher.keyEquals(pickNewsJob.getKey());
//通过这句完成我们监听器对pickNewsJob的唯一监听
scheduler.getListenerManager().addJobListener(myJobListener, keyMatcher);
```

### GroupMatcher

根据组名信息匹配

```java
GroupMatcher<JobKey> groupMatcher1 = GroupMatcher.jobGroupContains("group1");//包含特定字符串
GroupMatcher<JobKey> groupMatcher2 = GroupMatcher.groupEndsWith("oup1");//以特定字符串结尾
GroupMatcher<JobKey> groupMatcher3 = GroupMatcher.groupEquals("jgroup1");//以特定字符串完全匹配
GroupMatcher<JobKey> groupMatcher4 = GroupMatcher.groupStartsWith("jgou");//以特定字符串开头
```

### AndMatcher

对两个匹配器取交集

```java
KeyMatcher<JobKey> keyMatcher = KeyMatcher.keyEquals(pickNewsJob.getKey());
GroupMatcher<JobKey> groupMatcher = GroupMatcher.jobGroupContains("group1");
AndMatcher<JobKey> andMatcher = AndMatcher.and(keyMatcher, groupMatcher);//同时满足两个入参匹配
```

### OrMatcher

对两个匹配器取并集

```java
OrMatcher<JobKey> orMatcher = OrMatcher.or(keyMatcher, groupMatcher);//满足任意一个即可
```

### EverythingMatcher

局部全局匹配

```java
EverythingMatcher.allJobs();//对全部JobListener匹配
EverythingMatcher.allTriggers();//对全部TriggerListener匹配
```

## JobListener

### 方法

```java
public interface JobListener {
    //用于获取该JobListener的名称
    public String getName();
    
    //Scheduler在JobDetail将要被执行时调用这个方法
    public void jobToBeExecuted(JobExecutionContext context);
    
    //Scheduler在JobDetail即将被执行，但又被TriggerListener否决时会调用该方法
    public void jobExecutionVetoed(JobExecutionContext context);
    
    //Scheduler在JobDetail被执行之后调用这个方法
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException);
}
```

### 基本使用

```java
public class Job1 implements Job {

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        // 输出当前时间
        Date date = new Date();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String dateString = dateFormat.format(date);
        // 工作内容
        System.out.println("正在进行数据库的备份工作，备份数据库的时间是：" +dateString);
    }
}
```

```java
public class JobListener1 implements JobListener {

    @Override
    public String getName() {
        System.out.println("================================");
        String name = this.getClass().getSimpleName();
        System.out.println("监听器的名称是：" +name);
        return name;
    }

    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        String name = context.getJobDetail().getKey().getName();
        System.out.println("Job的名称是：" +name + "，Scheduler在JobDetail被执行之前调用这个方法");
    }

    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        String name = context.getJobDetail().getKey().getName();
        System.out.println("Job的名称是：" +name + "，Scheduler在JobDetail即将被执行，但又被TriggerListener否决时会调用该方法");
    }

    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
        String name = context.getJobDetail().getKey().getName();
        System.out.println("Job的名称是：" +name + "，Scheduler在JobDetail被执行之后调用这个方法");
    }
}
```

```java
public class Test1 {

    public static void main(String[] args) throws Exception {
        // 1、调度器（Scheduler），从工厂中获取调度的实例（默认：实例化new StdSchedulerFactory();）
        Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();

        // 2、任务实例（JobDetail）定义一个任务调度实例，将该实例与HelloJobSimpleTrigger绑定，任务类需要实现Job接口
        JobDetail jobDetail = JobBuilder.newJob(Job1.class) // 加载任务类，与HelloJob完成绑定，要求HelloJob实现Job接口
                .withIdentity("job1", "group1") // 参数1：任务的名称（唯一实例）；参数2：任务组的名称
                .build();

        // 3、触发器（Trigger）定义触发器，马上执行，然后每5秒重复执行一次
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("trigger1", "group1") // 参数1：触发器的名称（唯一实例）；参数2：触发器组的名称
                .startNow()
                .withSchedule(SimpleScheduleBuilder.repeatSecondlyForever(5)
                        .withRepeatCount(2))  // 每5秒执行一次，连续执行3次后停止，默认是0
                .build();
        // 4、让调度器关联任务和触发器，保证按照触发器定义的调整执行任务
        scheduler.scheduleJob(jobDetail, trigger);

        // 创建并注册一个局部的Job Listener，表示指定的任务Job
        scheduler.getListenerManager().addJobListener(new JobListener1(), KeyMatcher.keyEquals(JobKey.jobKey("job1", "group1")));

        // 5、启动
        scheduler.start();
    }
}
```

```java
// 执行结果：
================================
监听器的名称是：Listener1
================================
监听器的名称是：Listener1
================================
监听器的名称是：Listener1
================================
监听器的名称是：Listener1
================================
监听器的名称是：Listener1
Job的名称是：job1，Scheduler在JobDetail被执行之前调用这个方法
正在进行数据库的备份工作，备份数据库的时间是：2024-11-16 13:20:11
================================
监听器的名称是：Listener1
Job的名称是：job1，Scheduler在JobDetail被执行之后调用这个方法
================================
监听器的名称是：Listener1
Job的名称是：job1，Scheduler在JobDetail被执行之前调用这个方法
正在进行数据库的备份工作，备份数据库的时间是：2024-11-16 13:20:16
================================
监听器的名称是：Listener1
Job的名称是：job1，Scheduler在JobDetail被执行之后调用这个方法
================================
监听器的名称是：Listener1
Job的名称是：job1，Scheduler在JobDetail被执行之前调用这个方法
正在进行数据库的备份工作，备份数据库的时间是：2024-11-16 13:20:21
================================
监听器的名称是：Listener1
Job的名称是：job1，Scheduler在JobDetail被执行之后调用这个方法
```

## TriggerListener

### 方法

```java
public interface TriggerListener {
    //用于获取触发器的名称
    public String getName();
    
    //当与监听器关联的Trigger被触发，Job上的Execute()方法将被执行时，Scheduler就调用该方法
    public void triggerFired(Trigger trigger, JobExecutionContext context);
    
    //在Trigger触发后，Job将要执行时由Scheduler调用这个方法。TriggerListener给了一个选择去否决Job的执行。
    //假如这个方法返回true，这个Job将不会为此次Trigger触发而得到执行。
    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context);
    
    //Scheduler调用这个方法是在Trigger错过触发时。你应该关注此方法中持续时间长的逻辑：
    //在出现许多错过触发的Trigger时，长逻辑会导致骨牌效应。你应当保持这个方法尽量的小。
    public void triggerMisfired(Trigger trigger);
    
    //Trigger被触发并且完成了Job的执行时，Scheduler调用这个方法。
    public void triggerComplete(Trigger trigger, JobExecutionContext context, CompletedExecutionInstruction triggerInstructionCode);
}
```

### 基本使用

```java
public class TriggerListener1 implements TriggerListener {

    @Override
    public String getName() {
        System.out.println("=========================");
        String name = this.getClass().getSimpleName();
        System.out.println("触发器的名称是：" +name);
        return name;
    }

    @Override
    public void triggerFired(Trigger trigger, JobExecutionContext context) {
        String name = this.getClass().getSimpleName();
        System.out.println(name +"被触发");
    }

    @Override
    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context) {
        String name = this.getClass().getSimpleName();
        // TriggerListener给了一个选择去否决Job的执行。假如这个方法返回true，这个Job将不会为此次Trigger触发而得到执行。
        System.out.println(name +"否决没有被触发");
        // true:表示不会执行Job的方法
        return false;
    }

    @Override
    public void triggerMisfired(Trigger trigger) {
        String name = this.getClass().getSimpleName();
        // Scheduler调用这个方法是在Trigger错过触发时
        System.out.println(name +"错过触发");
    }

    @Override
    public void triggerComplete(Trigger trigger, JobExecutionContext context,
                                Trigger.CompletedExecutionInstruction triggerInstructionCode) {
        String name = this.getClass().getSimpleName();
        // Trigger被触发并且完成了Job的执行时，Scheduler调用这个方法。
        System.out.println(name +"完成之后触发");
    }
}
```

```java
public class Test2 {

    public static void main(String[] args) throws Exception {
        // 1、调度器（Scheduler），从工厂中获取调度的实例（默认：实例化new StdSchedulerFactory();）
        Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();

        // 2、任务实例（JobDetail）定义一个任务调度实例，将该实例与HelloJobSimpleTrigger绑定，任务类需要实现Job接口
        JobDetail jobDetail = JobBuilder.newJob(Job1.class) // 加载任务类，与HelloJob完成绑定，要求HelloJob实现Job接口
                .withIdentity("job1", "group1") // 参数1：任务的名称（唯一实例）；参数2：任务组的名称
                .build();

        // 3、触发器（Trigger）定义触发器，马上执行，然后每5秒重复执行一次
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("trigger1", "group1") // 参数1：触发器的名称（唯一实例）；参数2：触发器组的名称
                .startNow()
                .withSchedule(SimpleScheduleBuilder.repeatSecondlyForever(5)
                        .withRepeatCount(2))  // 每5秒执行一次，连续执行3次后停止，默认是0
                .build();
        // 4、让调度器关联任务和触发器，保证按照触发器定义的调整执行任务
        scheduler.scheduleJob(jobDetail, trigger);

        // 创建并注册一个局部的Job Listener，表示指定的任务Job
//        scheduler.getListenerManager().addJobListener(new JobListener1(), KeyMatcher.keyEquals(JobKey.jobKey("job1", "group1")));
        scheduler.getListenerManager().addTriggerListener(new TriggerListener1(), KeyMatcher.keyEquals(TriggerKey.triggerKey("trigger1", "group1")));

        // 5、启动
        scheduler.start();
    }
}
```

```java
// 执行结果：
=========================
触发器的名称是：TriggerListener1
=========================
触发器的名称是：TriggerListener1
=========================
触发器的名称是：TriggerListener1
=========================
触发器的名称是：TriggerListener1
=========================
触发器的名称是：TriggerListener1
TriggerListener1被触发
TriggerListener1否决没有被触发
正在进行数据库的备份工作，备份数据库的时间是：2024-11-16 13:34:59
=========================
触发器的名称是：TriggerListener1
TriggerListener1完成之后触发
=========================
触发器的名称是：TriggerListener1
TriggerListener1被触发
TriggerListener1否决没有被触发
正在进行数据库的备份工作，备份数据库的时间是：2024-11-16 13:35:04
=========================
触发器的名称是：TriggerListener1
TriggerListener1完成之后触发
=========================
触发器的名称是：TriggerListener1
TriggerListener1被触发
TriggerListener1否决没有被触发
正在进行数据库的备份工作，备份数据库的时间是：2024-11-16 13:35:09
=========================
触发器的名称是：TriggerListener1
TriggerListener1完成之后触发
```

**注意**

Job和Trigger监听器的调用顺序：

1. 成功时：triggerFired=>vetoJobExecution=>jobToBeExecuted=>jobWasExecuted=>triggerComplete
2. 失败时：triggerFired=>vetoJobExecution=>jobExecutionVetoed

## SchedulerListener

### 方法

```java
public interface SchedulerListener {
    //用于部署JobDetail时调用
    public void jobScheduled(Trigger trigger);
    
    //用于卸载JobDetail时调用。
    public void jobUnscheduled(TriggerKey triggerKey);
    
    //当一个Trigger来到了再也不会触发的状态时调用这个方法。除非这个Job已设置成了持久性，否则它就会从Scheduler中移除
    public void triggerFinalized(Trigger trigger);
    
    //Scheduler调用这个方法是发生在一个Trigger或Trigger组被暂停时。假如是Trigger组的话，triggerName参数将为null
    public void triggersPaused(String triggerGroup);
    
    //Scheduler调用这个方法是发生在一个Trigger或Trigger组从暂停中恢复时。假如是Trigger组的话，triggerName参数将为null
    public void triggersResumed(String triggerGroup);
    
    //当一个或一组JobDetail暂停时调用这个方法
    public void jobsPaused(String jobGroup);
    
    //当一个或一组Job从暂停上恢复时调用这个方法。假如是一个Job组，jobName将为null
    public void jobsResumed(String jobGroup);
    
    //在Scheduler的正常运行期间产生一个严重错误时调用这个方法
    public void schedulerError(String msg, SchedulerException cause);
    
    //当Scheduler开启时，调用该方法
    public void schedulerStarted();
    
    //当Scheduler处于StandBy模式时，调用该方法
    public void schedulerInStandbyMode();
    
    //当Scheduler停止时，调用该方法
    public void schedulerShutdown();
    
    //当Scheduler中的数据被清除时，调用该方法
    public void schedulingDataCleared();
}
```

### 基本使用

```java
public class SchedulerListener1 implements SchedulerListener {

    @Override
    public void jobScheduled(Trigger trigger) {
        String name = trigger.getKey().getName();
        // 用于部署JobDetail时调用
        System.out.println(name +" 完成部署");
    }

    @Override
    public void jobUnscheduled(TriggerKey triggerKey) {
        String name = triggerKey.getName();
        // 用于卸载JobDetail时调用
        System.out.println(name +" 完成卸载");
    }

    @Override
    public void triggerFinalized(Trigger trigger) {
        String name = trigger.getKey().getName();
        // 当一个Trigger来到了再也不会触发的状态时调用这个方法。除非这个Job已设置成了持久性，否则它就会从Scheduler中移除。
        System.out.println(name +" 触发器被移除");
    }

    @Override
    public void triggerPaused(TriggerKey triggerKey) {
        String name = triggerKey.getName();
        // Scheduler调用这个方法是发生在一个Trigger或Trigger组被暂停时。假如是Trigger组的话，triggerName参数将为null。
        System.out.println(name +" 正在被暂停");
    }

    @Override
    public void triggersPaused(String triggerGroup) {
        // Scheduler调用这个方法是发生在一个Trigger或Trigger组被暂停时。假如是Trigger组的话，triggerName参数将为null。
        System.out.println("触发器组" +triggerGroup +" 正在被暂停");
    }

    @Override
    public void triggerResumed(TriggerKey triggerKey) {
        // Scheduler调用这个方法是发生在一个Trigger或Trigger组从暂停中恢复时。假如是Trigger组的话，triggerName参数将为null。参数将为null。
        String name = triggerKey.getName();
        System.out.println(name +" 正在从暂停中恢复");
    }

    @Override
    public void triggersResumed(String triggerGroup) {
        // Scheduler调用这个方法是发生在一个Trigger或Trigger组从暂停中恢复时。假如是Trigger组的话，triggerName参数将为null。参数将为null。
        System.out.println("触发器组" +triggerGroup +" 正在从暂停中恢复");
    }

    @Override
    public void jobAdded(JobDetail jobDetail) {
        System.out.println(jobDetail.getKey() +" 添加工作任务");
    }

    @Override
    public void jobDeleted(JobKey jobKey) {
        System.out.println(jobKey +" 删除工作任务");
    }

    @Override
    public void jobPaused(JobKey jobKey) {
        System.out.println(jobKey +" 工作任务正在被暂停");
    }

    @Override
    public void jobsPaused(String jobGroup) {
        System.out.println("工作组" +jobGroup +" 正在被暂停");
    }

    @Override
    public void jobResumed(JobKey jobKey) {
        System.out.println(jobKey +" 正在从暂停中恢复");
    }

    @Override
    public void jobsResumed(String jobGroup) {
        System.out.println("工作组" +jobGroup +" 正在从暂停中恢复");
    }

    @Override
    public void schedulerError(String msg, SchedulerException cause) {
        // 在Scheduler的正常运行期间产生一个严重错误时调用这个方法。
        System.out.println("产生严重错误的时候调用" +msg +"    " +cause.getUnderlyingException());
    }

    @Override
    public void schedulerInStandbyMode() {
        // 当Scheduler处于StandBy模式时，调用该方法。
        System.out.println("调度器被挂起模式的时候调用");
    }

    @Override
    public void schedulerStarted() {
        System.out.println("调度器开启的时候调用");
    }

    @Override
    public void schedulerStarting() {
        System.out.println("调度器正在开启的时候调用");
    }

    @Override
    public void schedulerShutdown() {
        System.out.println("调度器关闭的时候调用");
    }

    @Override
    public void schedulerShuttingdown() {
        System.out.println("调度器正在关闭的时候调用");
    }

    @Override
    public void schedulingDataCleared() {
        System.out.println("调度器数据被清除的时候调用");
    }
}
```

```java
public class Test3 {

    public static void main(String[] args) throws Exception {
        // 1、调度器（Scheduler），从工厂中获取调度的实例（默认：实例化new StdSchedulerFactory();）
        Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();

        // 2、任务实例（JobDetail）定义一个任务调度实例，将该实例与HelloJobSimpleTrigger绑定，任务类需要实现Job接口
        JobDetail jobDetail = JobBuilder.newJob(Job1.class) // 加载任务类，与HelloJob完成绑定，要求HelloJob实现Job接口
                .withIdentity("job1", "group1") // 参数1：任务的名称（唯一实例）；参数2：任务组的名称
                .build();

        // 3、触发器（Trigger）定义触发器，马上执行，然后每5秒重复执行一次
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("trigger1", "group1") // 参数1：触发器的名称（唯一实例）；参数2：触发器组的名称
                .startNow()
                .withSchedule(SimpleScheduleBuilder.repeatSecondlyForever(5)
                        .withRepeatCount(2))  // 每5秒执行一次，连续执行3次后停止，默认是0
                .build();
        // 4、让调度器关联任务和触发器，保证按照触发器定义的调整执行任务
        scheduler.scheduleJob(jobDetail, trigger);

        // 创建并注册一个局部的Job Listener，表示指定的任务Job
        //scheduler.getListenerManager().addJobListener(new JobListener1(), KeyMatcher.keyEquals(JobKey.jobKey("job1", "group1")));
        //scheduler.getListenerManager().addTriggerListener(new TriggerListener1(), KeyMatcher.keyEquals(TriggerKey.triggerKey("trigger1", "group1")));
        scheduler.getListenerManager().addSchedulerListener(new SchedulerListener1());

        // 5、启动
        scheduler.start();
    }
}
```

