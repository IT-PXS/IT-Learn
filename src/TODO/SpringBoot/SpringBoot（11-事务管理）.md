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

## 事务实现机制
Spring 为事务管理提供了丰富的功能支持。Spring 事务管理分为编程式和声明式的两种方式。

1. 编程式事务管理： 编程式事务管理使用 TransactionTemplate 或者直接使用底层的 PlatformTransactionManager。对于编程式事务管理，spring 推荐使用 TransactionTemplate。

2. 声明式事务管理： 建立在 AOP 之上的。其本质是对方法前后进行拦截，然后在目标方法开始之前创建或者加入一个事务，在执行完目标方法之后根据执行情况提交或者回滚事务。声明式事务管理不需要入侵代码，更快捷而且简单，推荐使用。

声明式事务有两种方式：

1. 一种是在配置文件（xml）中做相关的事务规则声明（因为很少用本文不讲解）
2. 一种是基于 @Transactional 注解的方式。注释配置是目前流行的使用方式，推荐使用。

在应用系统调用声明了 @Transactional 的目标方法时，Spring Framework 默认使用 AOP 代理，在代码运行时生成一个代理对象，根据 @Transactional 的属性配置信息，这个代理对象决定该声明 @Transactional 的目标方法是否由拦截器 TransactionInterceptor 来使用拦截，在 TransactionInterceptor 拦截时，会在目标方法开始执行之前创建并加入事务，并执行目标方法的逻辑，最后根据执行情况是否出现异常，利用抽象事务管理器 AbstractPlatformTransactionManager 操作数据源 DataSource 提交或回滚事务。

Spring AOP 代理有 CglibAopProxy 和 JdkDynamicAopProxy 两种，以 CglibAopProxy 为例，对于 CglibAopProxy，需要调用其内部类的 DynamicAdvisedInterceptor 的 intercept 方法。对于 JdkDynamicAopProxy，需要调用其 invoke 方法。

## Spring 提供的事务 API

### 事务管理器 PlatformTransactionManager

`PlatformTransactionManager` 是事务管理器的顶层接口。事务的管理是受限于具体的数据源的（例如，JDBC 对应的事务管理器就是 `DatasourceTransactionManager`），因此 `PlatformTransactionManager` 只规定了事务的基本操作：创建事务，提交事务和回滚事务。

```java
public interface PlatformTransactionManager extends TransactionManager {

    /**
     * 打开事务
     */
	TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
			throws TransactionException;

	/**
	 * 提交事务
	 */
	void commit(TransactionStatus status) throws TransactionException;

	/**
	 * 回滚事务
	 */
	void rollback(TransactionStatus status) throws TransactionException;
}
```

### 事务状态 TransactionStatus

```java
public interface TransactionStatus extends TransactionExecution, SavepointManager, Flushable {

	/**
	 * 是否有 Savepoint Savepoint 是当事务回滚时需要恢复的状态
	 */
	boolean hasSavepoint();

	/**
	 * flush()操作和底层数据源有关，并非强制所有数据源都要支持
	 */
	void flush();
}
```

此外，`TransactionStatus`还从父接口中继承了其他方法

```java
/**
 * 是否是新事务(或是其他事务的一部分)
 */
boolean isNewTransaction();

/**
 * 设置 rollback-only 表示之后需要回滚
 */
void setRollbackOnly();

/**
 * 是否 rollback-only
 */
boolean isRollbackOnly();

/**
 * 判断该事务已经完成
 */
boolean isCompleted();

/**
 * 创建一个 Savepoint
 */
Object createSavepoint() throws TransactionException;

/**
 * 回滚到指定 Savepoint
 */
void rollbackToSavepoint(Object savepoint) throws TransactionException;

/**
 * 释放 Savepoint 当事务完成后，事务管理器基本上自动释放该事务所有的 savepoint
 */
void releaseSavepoint(Object savepoint) throws TransactionException;
```

### 事务属性定义TransactionDefinition

`TransactionDefinition` 表示一个事务的定义，将根据它规定的特性去开启事务。

事务的传播等级和隔离级别的常量同样定义在这个接口中。

```java
/**
 * 返回事务的传播级别
 */
default int getPropagationBehavior() {
    return PROPAGATION_REQUIRED;
}

/**
 * 返回事务的隔离级别
 */
default int getIsolationLevel() {
    return ISOLATION_DEFAULT;
}

/**
 * 事务超时时间
 */
default int getTimeout() {
    return TIMEOUT_DEFAULT;
}

/**
 * 是否为只读事务(只读事务在处理上能有一些优化)
 */
default boolean isReadOnly() {
    return false;
}

/**
 * 返回事务的名称
 */
@Nullable
default String getName() {
    return null;
}

/**
 * 默认的事务配置
 */
static TransactionDefinition withDefaults() {
    return StaticTransactionDefinition.INSTANCE;
}
```



## @Transactional

| 参 数 名 称                | 功 能 描 述                                                  |
| -------------------------- | ------------------------------------------------------------ |
| readOnly                   | 用于设置当前事务是否为只读事务，设置为 true 表示只读，false 则表示可读写，默认值为 false。<br />例如：@Transactional(readOnly = true) |
| rollbackFor                | 用于设置需要进行回滚的异常类数组，当方法中抛出指定异常数组中的异常时，则进行事务回滚。<br />例如：指定单一异常类：@Transactional(rollbackFor = RuntimeException.class)；指定多个异常类：@Transactional(rollbackFor ={RuntimeException.class, Exception.class}) |
| transactionManager / value | 多个事务管理器托管在 Spring 容器中时，指定事务管理器的 bean 名称 |
| rollbackForClassName       | 用于设置需要进行回滚的异常类名称数组，当方法中抛出指定异常名称数组中的异常时，则进行事务回滚。<br />例如：指定单一异常类名称 @Transactional(rollbackForClassName =”RuntimeException”)；指定多个异常类名称：@Transactional(rollbackForClassName ={“RuntimeException”,”Exception”}) |
| noRollbackFor              | 用于设置不需要进行回滚的异常类数组，当方法中抛出指定异常数组中的异常时，不进行事务回滚。<br />例如：指定单一异常类：@Transactional(noRollbackFor = RuntimeException.class)；指定多个异常类：@Transactional(noRollbackFor ={RuntimeException.class, Exception.class}) |
| noRollbackForClassName     | 用于设置不需要进行回滚的异常类名称数组，当方法中抛出指定异常名称数组中的异常时，不进行事务回滚。<br />例如：指定单一异常类名称：@Transactional(noRollbackForClassName =”RuntimeException”)；指定多个异常类名称：@Transactional(noRollbackForClassName ={“RuntimeException”, ”Exception”}) |
| propagation                | 用于设置事务的传播行为。<br />例如：@Transactional(propagation = Propagation.NOT_SUPPORTED, readOnly = true) |
| isolation                  | 用于设置底层数据库的事务隔离级别，事务隔离级别用于处理多事务并发的情况，通常使用数据库的默认隔离级别即可，基本不需要进行设置 |
| timeout                    | 该属性用于设置事务的超时秒数，默认值为 -1 表示永不超时 <br />例如：事务超时设置为 30 秒：@Transactional(timeout = 30) |

**Propagation 的属性（事务的传播行为）**

例如：@Transactional(propagation = Propagation.NOT_SUPPORTED, readOnly = true)

| Propagation 属性 | 含义                                                         |
| ---------------- | ------------------------------------------------------------ |
| REQUIRED         | 默认值，在有 transaction 状态下执行；如当前没有 transaction，则创建新的 transaction； |
| SUPPORTS         | 如当前有 transaction，则在 transaction 状态下执行；如果当前没有 transaction，在无 transaction 状态下执行； |
| MANDATORY        | 必须在有 transaction 状态下执行，如果当前没有 transaction，则抛出异常 IllegalTransactionStateException； |
| REQUIRES_NEW     | 创建新的 transaction 并执行；如果当前已有 transaction，则将当前 transaction 挂起； |
| NOT_SUPPORTED    | 在无 transaction 状态下执行；如果当前已有 transaction，则将当前 transaction 挂起； |
| NEVER            | 在无 transaction 状态下执行；如果当前已有 transaction，则抛出异常 IllegalTransactionStateException。 |

**事务 5 种隔离级别**

例如：@Transactional(isolation = Isolation.READ_COMMITTED)

| 隔离级别         | 含义                                                         |
| ---------------- | ------------------------------------------------------------ |
| DEFAULT          | 这是一个 PlatfromTransactionManager 默认的隔离级别，使用数据库默认的事务隔离级别另外四个与 JDBC 的隔离级别相对应； |
| READ_UNCOMMITTED | 最低的隔离级别。事实上我们不应该称其为隔离级别，因为在事务完成前，其他事务可以看到该事务所修改的数据。而在其他事务提交前，该事务也可以看到其他事务所做的修改。可能导致脏，幻，不可重复读 |
| READ_COMMITTED   | 大多数数据库的默认级别。在事务完成前，其他事务无法看到该事务所修改的数据。遗憾的是，在该事务提交后，你就可以查看其他事务插入或更新的数据。这意味着在事务的不同点上，如果其他事务修改了数据，你就会看到不同的数据。可防止脏读，但幻读和不可重复读仍可以发生。 |
| REPEATABLE_READ  | 比 ISOLATION_READ_COMMITTED 更严格，该隔离级别确保如果在事务中查询了某个数据集，你至少还能再次查询到相同的数据集，即使其他事务修改了所查询的数据。然而如果其他事务插入了新数据，你就可以查询到该新插入的数据。可防止脏读，不可重复读，但幻读仍可能发生。 |
| SERIALIZABLE     | 完全服从 ACID 的隔离级别，确保不发生脏读、不可重复读和幻影读。这在所有隔离级别中也是最慢的，因为它通常是通过完全锁定当前事务所涉及的数据表来完成的。代价最大、可靠性最高的隔离级别，所有的事务都是按顺序一个接一个地执行。避免所有不安全读取。 |

**使用注意事项（防止事务失效）**

1. 在具体的类（或类的方法）上使用 @Transactional 注解，而不要使用在类所要实现的任何接口上。
2. @Transactional 注解应该只被应用在 public 修饰的方法上。 如果你在 protected、private 或者 package-visible 的方法上使用 该注解，它也不会报错（IDEA 会有提示）， 但事务并没有生效。
3. 被外部调用的公共方法 A 有两个进行了数据操作的子方法 B 和子方法 C 的事务注解说明：

* 被外部调用的公共方法 A 未声明事务 @Transactional，子方法 B 和 C 若是其他类的方法且各自声明事务，则事务由子方法 B 和 C 各自控制
* 被外部调用的公共方法 A 未声明事务 @Transactional，子方法 B 和 C 若是本类的方法，则无论子方法 B 和 C 是否声明事务，事务均不会生效
* 被外部调用的公共方法 A 声明事务 @Transactional，无论子方法 B 和 C 是不是本类的方法，无论子方法 B 和 C 是否声明事务，事务均由公共方法 A 控制
* 被外部调用的公共方法 A 声明事务 @Transactional，子方法运行异常，但运行异常被子方法自己 try-catch 处理了，则事务回滚是不会生效的！

默认情况下，Spring 会对 unchecked 异常进行事务回滚，也就是默认对 RuntimeException() 异常或是其子类进行事务回滚。

4. 数据库要支持事务，如果是 mysql，要使用 innodb 引擎，myisam 不支持事务
5. 事务 @Transactional 由 spring 控制时，它会在抛出异常的时候进行回滚。如果自己使用 try-catch 捕获处理了，是不生效的。如果想事务生效可以进行手动回滚或者在 catch 里面将异常抛出【throw new RuntimeException();】

## 手动管理事务

```java
@Autowired
DataSourceTransactionManager dataSourceTransactionManager;
@Autowired
TransactionDefinition transactionDefinition;

public void test() {
    TransactionStatus transactionStatus = null;
    try {
        // 手动开启事务
        transactionStatus = dataSourceTransactionManager.getTransaction(transactionDefinition);
        // .....
        // 手动提交事务
		dataSourceTransactionManager.commit(transactionStatus);
    } catch(Exception e) {
        if(transactionStatus != null) {
            // 手动回滚事务，最好是放在 catch 里面, 防止程序异常而事务一直卡在哪里未提交
			dataSourceTransactionManager.rollback(transactionStatus);
        }
    }
}
```

PlatformTransactionManager 手动提交事务，设置隔离级别

```java
@Autowired
private PlatformTransactionManager transactionManager;

public void test() {
	DefaultTransactionDefinition defaultTransactionDefinition = new DefaultTransactionDefinition();
	defaultTransactionDefinition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
	TransactionStatus transactionStatus = transactionManager.getTransaction(defaultTransactionDefinition);
	try {
		// 数据库操作 
		// 提交事务
		transactionManager.commit(transactionStatus);
	} catch (Exception e) {
		log.error("xxxx", e);
		// 回滚事务
		transactionManager.rollback(transactionStatus);
	}
}
```

