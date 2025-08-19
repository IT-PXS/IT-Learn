---
title: 定时任务工具类（Cron Util）
tag: 定时任务
category: Java
description: 定时任务工具类Cron Utils是一个用于处理和管理Cron表达式的Java库，支持解析、验证和生成Cron表达式。它简化了复杂的时间调度配置，使得开发者能够轻松创建和管理定时任务，适用于各种计划任务场景，提升任务调度的灵活性与可靠性。
date: 2024-11-19 22:38:34
---

## 依赖

cron-utils 的 github 地址：https://github.com/jmrozanec/cron-utils

```xml
<dependency>
    <groupId>com.cronutils</groupId>
    <artifactId>cron-utils</artifactId>
    <version>9.2.1</version>
</dependency>
```

## 基本使用

### 定义 cron 表达式的支持范围

```java
// 创建 cron 定义，自定义 cron 表达式支持的范围
CronDefinition cronDefinition =
    CronDefinitionBuilder.defineCron()
        .withSeconds().and()
        .withMinutes().and()
        .withHours().and()
        .withDayOfMonth()
            .supportsHash().supportsL().supportsW().and()
        .withMonth().and()
        .withDayOfWeek()
            .withIntMapping(7, 0) 
            .supportsHash().supportsL().supportsW().and()
        .withYear().optional().and()
        .instance();

// 传入要生成的 cron 表达式类型获取 cron 定义
cronDefinition = CronDefinitionBuilder.instanceDefinitionFor(CronType.QUARTZ);
```

支持定时任务的类型：

1. CRON4J
2. QUARTZ
3. UNIX
4. SPRING
5. SPRING53

### 生成 cron 表达式

```java
import static com.cronutils.model.field.expression.FieldExpressionFactory.*;

Cron cron = CronBuilder.cron(CronDefinitionBuilder.instanceDefinitionFor(CronType.QUARTZ))
    .withYear(always())
    .withDoM(between(SpecialChar.L, 3))
    .withMonth(always())
    .withDoW(questionMark())
    .withHour(always())
    .withMinute(always())
    .withSecond(on(0))
    .instance();

String cronAsString = cron.asString(); // 0 * * L-3 * ? *
```

各方法对应 cron 表达式关系：

1. always：表示*
2. questionMark：表示?
3. on：表示具体值
4. between：表示-，例如，between(0,5)表示 0-5
5. and：表示,，例如，and(on(1), on(5))表示 0,5
6. every：表示/，例如，every(on(2),3)表示 2/3

### 获取 cron 表达式描述

```java
public class Test {

    public static void main(String[] args) {
        // 创建 cron 描述器
        CronDescriptor descriptor = CronDescriptor.instance();
        // 创建 cron 定义
        CronDefinition cronDefinition = CronDefinitionBuilder.instanceDefinitionFor(QUARTZ);
        // 创建 cron 解析器
        CronParser cronParser = new CronParser(cronDefinition);
        String describe = descriptor.describe(cronParser.parse("0 0 12 ? * 6"));
        System.out.println(describe);
        describe = descriptor.describe(cronParser.parse("*/45 * * * * ?"));
        System.out.println(describe);
        
        // 设置语言
		descriptor = CronDescriptor.instance(Locale.CHINESE);
        describe = descriptor.describe(cronParser.parse("0 0 12 ? * 6"));
        System.out.println(describe);
        describe = descriptor.describe(cronParser.parse("*/45 * * * * ?"));
        System.out.println(describe);
    }
}
```

```java
// 运行结果：
at 12:00 at Friday day
every 45 seconds
在 12:00 在 星期五 天
每 45 秒
```

### 校验 cron 表达式的正确性

```java
public class Test {

    public static void main(String[] args) {
        CronDefinition cronDefinition = CronDefinitionBuilder.instanceDefinitionFor(QUARTZ);
        CronParser cronParser = new CronParser(cronDefinition);
        Cron cron = cronParser.parse("0 0 12 ? * 6");
        // 校验 cron 表达式
        cron.validate();
        cron = cronParser.parse("0 0 12 ? * ?");
        cron.validate();
    }
}
```

## 工具类

### WeekEnum

定义星期的枚举类信息

```java
@Getter
@AllArgsConstructor
public enum WeekEnum {

    SUNDAY(1, "星期天"),
    MONDAY(2, "星期一"),
    TUESDAY(3, "星期二"),
    WEDNESDAY(4, "星期三"),
    THURSDAY(5, "星期四"),
    FRIDAY(6, "星期五"),
    SATURDAY(7, "星期六");

    private Integer code;

    private String desc;
}
```

### CycleTypeEnum

定义要生成的 cron 表达式类型枚举类信息

```java
@Getter
@AllArgsConstructor
public enum CycleTypeEnum {

    MINUTE(1, "分钟"),
    HOUR(2, "小时"),
    DAY(3, "日"),
    WEEK(4, "周"),
    MONTH(5, "月"),
    QUARTER(6, "季度"),
    YEAR(7, "年");

    private Integer code;

    private String desc;
}
```

### RepeatRuleEnum

定义要生成月、季度的 cron 表达式循环规则枚举类信息

```java
@Getter
@AllArgsConstructor
public enum RepeatRuleEnum {

    WEEK(1, "周"),
    DATE(2, "日期");

    private Integer code;

    private String desc;
}
```

### CronDto

定义 cron 表达式工具类的请求体信息

```java
@Data
public class CronDto {

    /**
     * 周期类型 minute: 分钟 hour: 小时; day: 天; week: 周; month: 月; quarter: 季; year: 年
     */
    private Integer cycleType;

    /**
     * 执行时间
     */
    private LocalDateTime executionTime;

    /**
     * 指定一周哪几天
     */
    private List<Integer> weekDays;

    /**
     * 指定一个月哪几天
     */
    private List<Integer> monthDays;

    /**
     * 指定一年哪几月
     */
    private List<Integer> quartzMonths;

    /**
     * 一周的星期几
     */
    private Integer dayOfWeek;

    /**
     * 第几周
     */
    private Integer week;

    /**
     * 重复规则：周 天
     */
    private Integer repeatRule;
}
```

### CronUtils

根据年、月、日、时、分、秒、星期、季度实现不同的 cron 表达式

注意：生成年、月、季度的 cron 表达式时可以根据日或者星期额外判断

```java
public class CronUtils {

    /**
     * 星期
     */
    private static final List<Integer> WEEKS = Arrays.stream(WeekEnum.values()).map(WeekEnum::getCode).collect(Collectors.toList());

    public static String createCron(CronDto cronDto) {
        Integer cycleType = cronDto.getCycleType();
        LocalDateTime executionTime = cronDto.getExecutionTime();
        CronBuilder cronBuilder = CronBuilder.cron(CronDefinitionBuilder.instanceDefinitionFor(CronType.QUARTZ));
        // 每分钟一次
        if (Objects.equals(CycleTypeEnum.MINUTE.getCode(), cycleType)) {
            return getSecondCron(cronBuilder, executionTime);
        }
        // 每小时一次
        if (Objects.equals(CycleTypeEnum.HOUR.getCode(), cycleType)) {
            return getMinuteCron(cronBuilder, executionTime);
        }
        // 每日一次
        if (Objects.equals(CycleTypeEnum.DAY.getCode(), cycleType)) {
            return getDayCron(cronBuilder, executionTime);
        }
        // 每周一次
        if (Objects.equals(CycleTypeEnum.WEEK.getCode(), cycleType)) {
            return getWeekCron(cronDto, cronBuilder, executionTime);
        }
        // 每月一次
        if (Objects.equals(CycleTypeEnum.MONTH.getCode(), cycleType)) {
            return getMonthCron(cronDto, cronBuilder, executionTime);
        }
        // 每季度一次
        if (Objects.equals(CycleTypeEnum.QUARTER.getCode(), cycleType)) {
            return getQuarterCron(cronDto, cronBuilder, executionTime);
        }
        // 每年一次
        if (Objects.equals(CycleTypeEnum.YEAR.getCode(), cycleType)) {
            return getYearCron(cronBuilder, executionTime);
        }
        return "";
    }

    public static String getYearCron(CronBuilder cronBuilder, LocalDateTime executionTime) {
        return cronBuilder.withSecond(on(executionTime.getSecond()))
                .withMinute(on(executionTime.getMinute()))
                .withHour(on(executionTime.getHour()))
                .withDoM(on(executionTime.getDayOfMonth()))
                .withMonth(on(executionTime.getMonthValue()))
                .withDoW(questionMark())
                .instance()
                .asString();
    }

    public static String getQuarterCron(CronDto cronDto, CronBuilder cronBuilder, LocalDateTime executionTime) {
        List<FieldExpression> flist = new ArrayList<>();
        cronDto.getQuartzMonths().forEach(e -> flist.add(FieldExpressionFactory.on(e)));
        return cronBuilder.withSecond(on(executionTime.getSecond()))
                .withMinute(on(executionTime.getMinute()))
                .withHour(on(executionTime.getHour()))
                .withDoM(questionMark())
                .withMonth(and(flist))
                .withDoW(on(WEEKS.get(cronDto.getDayOfWeek()), SpecialChar.HASH, cronDto.getWeek()))
                .instance()
                .asString();
    }

    public static String getMonthCron(CronDto cronDto, CronBuilder cronBuilder, LocalDateTime executionTime) {
        Integer repeatRule = cronDto.getRepeatRule();
        // 按周
        if (Objects.equals(RepeatRuleEnum.WEEK.getCode(), repeatRule)) {
            List<FieldExpression> weekDays = new ArrayList<>();
            if (!CollectionUtils.isEmpty(cronDto.getWeekDays())) {
                cronDto.getWeekDays().forEach(e -> weekDays.add(FieldExpressionFactory.on(WEEKS.get(cronDto.getDayOfWeek()),
                        SpecialChar.HASH, e)));
            }
            return cronBuilder.withSecond(on(executionTime.getSecond()))
                    .withMinute(on(executionTime.getMinute()))
                    .withHour(on(executionTime.getHour()))
                    .withDoM(questionMark())
                    .withMonth(always())
                    .withDoW(CollectionUtils.isEmpty(weekDays) ? on(WEEKS.get(cronDto.getDayOfWeek()), SpecialChar.HASH,
                            cronDto.getWeek()) : and(weekDays))
                    .instance()
                    .asString();

        }
        // 按天
        if (Objects.equals(RepeatRuleEnum.DATE.getCode(), repeatRule)) {
            List<FieldExpression> monthDays = new ArrayList<>();
            cronDto.getMonthDays().forEach(e -> monthDays.add(FieldExpressionFactory.on(e)));
            return cronBuilder.withSecond(on(executionTime.getSecond()))
                    .withMinute(on(executionTime.getMinute()))
                    .withHour(on(executionTime.getHour()))
                    .withDoM(and(monthDays))
                    .withMonth(always())
                    .withDoW(questionMark())
                    .instance()
                    .asString();
        }
        return "";
    }

    public static String getWeekCron(CronDto cronDto, CronBuilder cronBuilder, LocalDateTime executionTime) {
        List<FieldExpression> weekDays = new ArrayList<>();
        cronDto.getWeekDays().forEach(e -> weekDays.add(FieldExpressionFactory.on(e)));
        return cronBuilder.withSecond(on(executionTime.getSecond()))
                .withMinute(on(executionTime.getMinute()))
                .withHour(on(executionTime.getHour()))
                .withDoM(questionMark())
                .withMonth(always())
                .withDoW(and(weekDays))
                .instance()
                .asString();
    }

    public static String getDayCron(CronBuilder cronBuilder, LocalDateTime executionTime) {
        return cronBuilder.withSecond(on(executionTime.getSecond()))
                .withMinute(on(executionTime.getMinute()))
                .withHour(on(executionTime.getHour()))
                .withDoM(always())
                .withMonth(always())
                .withDoW(questionMark())
                .instance()
                .asString();
    }

    public static String getMinuteCron(CronBuilder cronBuilder, LocalDateTime executionTime) {
        return cronBuilder.withSecond(on(executionTime.getSecond()))
                .withMinute(on(executionTime.getMinute()))
                .withHour(always())
                .withDoM(always())
                .withMonth(always())
                .withDoW(questionMark())
                .instance()
                .asString();
    }

    public static String getSecondCron(CronBuilder cronBuilder, LocalDateTime executionTime) {
        return cronBuilder.withSecond(on(executionTime.getSecond()))
                .withMinute(always())
                .withHour(always())
                .withDoM(always())
                .withMonth(always())
                .withDoW(questionMark())
                .instance()
                .asString();
    }
}
```

### 使用案例

```java
public class Test {
    public static void main(String[] args) {
        CronDto cronDto = new CronDto();
        cronDto.setCycleType(1);
        cronDto.setExecutionTime(LocalDateTime.now());
        String cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(2);
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(3);
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(4);
        cronDto.setWeekDays(Arrays.asList(1, 2));
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(5);
        cronDto.setRepeatRule(1);
        cronDto.setDayOfWeek(1);
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(5);
        cronDto.setRepeatRule(1);
        cronDto.setWeek(1);
        cronDto.setDayOfWeek(1);
        cronDto.setWeekDays(null);
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(5);
        cronDto.setRepeatRule(2);
        cronDto.setMonthDays(Arrays.asList(1, 2));
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(6);
        cronDto.setQuartzMonths(Arrays.asList(1, 2));
        cron = createCron(cronDto);
        System.out.println(cron);

        cronDto.setCycleType(7);
        cron = createCron(cronDto);
        System.out.println(cron);
    }
}
```

```java
// 运行结果：
14 * * * * ?
14 28 * * * ?
14 28 9 * * ?
14 28 9 ? * 1,2
14 28 9 ? * 2#1,2#2
14 28 9 ? * 2#1
14 28 9 1,2 * ?
14 28 9 ? 1,2 2#1
14 28 9 19 11 ?
```

