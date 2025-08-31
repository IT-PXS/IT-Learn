---
title: MySQL（7-事务）
tag: MySQL
category: 数据库
date: 2025-05-14 22:38:34
description: MySQL事务是一组原子性SQL操作，满足ACID特性：原子性（Atomicity）确保操作全成功或全失败；一致性（Consistency）保持数据合法；隔离性（Isolation）控制并发访问；持久性（Durability）保证提交后永久生效。不同隔离级别解决脏读、不可重复读等问题。
---

## 基本介绍

数据库中的事务是指对数据库执行一批操作，在同一个事务当中，这些操作最终要么全部执行成功，要么全部失败，不会存在部分成功的情况。

- 事务是一个原子操作，是一个最小执行单元，可以由一个或多个 SQL 语句组成
- 在同一个事务当中，所有的 SQL 语句都成功执行时整个事务成功，有一个 SQL 语句执行失败时整个事务都执行失败。

**使用案例**

比如 A 用户给 B 用户转账 100 操作，过程如下：

1. 从 A 账户扣 100
2. 给 B 账户加 100

如果在事务的支持下，上面最终只有 2 种结果：

1. 操作成功：A 账户减少 100；B 账户增加 100
2. 操作失败：A、B 两个账户都没有发生变化

## 四大特征

1. 原子性：是不可分割的最小操作单位，要么同时成功，要么同时失败
2. 持久性：当事务提交或回滚后，数据库会持久化的保持数据
3. 隔离性：多个事务之间相互独立，一个事务的执行不能被其他事务干扰
4. 一致性：事务操作前后，数据总量不变

## 事务操作

### 分类

mysql 中事务默认是隐式事务，执行 insert、update、delete 操作的时候，数据库自动开启事务、提交或回滚事务。是否开启隐式事务是由变量 autocommit 控制的，所以事务分为隐式事务和显式事务。

1. 隐式事务

事务自动开启、提交或回滚，比如 insert、update、delete 语句，事务的开启、提交或回滚由 mysql 内部自动控制的。

查看变量 autocommit 是否开启了自动提交：show variables like 'autocommit';

2. 显式事务

事务需要手动开启、提交或回滚，由开发者自己控制。

```sql
-- 方式1：设置不自动提交事务
set autocommit=0;

-- 方式2：开启事务
start transaction;
-- 执行事务操作
commit|rollback;
```

### 语法

1. 开启事务：start  transaction
2. 回滚：rollback
3. 提交：commit
4. 事务提交的两种方式：

+ 自动提交：MySQL 是自动提交的，一条 DML（增删改）语句会自动提交一次事务
+ 手动提交：Oracle 数据库默认是手动提交事务，需要先开启事务，再提交

修改事务的默认提交方式：

+ 查看事务的默认提交方式：select  @@autocommit;（1 代表自动提交，0 代表手动提交）
+ 修改默认提交方式：set  @@autocommit = 0;

5. 部分回滚：savepoint
5. 只读事务：start transaction read only;

### 使用案例

1. 事务提交

```sql
mysql> select * from test1;
+------+
| a   |
+------+
|   1 |
+------+
1 row in set (0.00 sec)

mysql> start transaction;
Query OK, 0 rows affected (0.00 sec)

mysql> insert into test1 values (2);
Query OK, 1 row affected (0.00 sec)

mysql> insert into test1 values (3);
Query OK, 1 row affected (0.00 sec)

mysql> commit;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from test1;
+------+
| a   |
+------+
|   1 |
|   2 |
|   3 |
+------+
3 rows in set (0.00 sec)
```

2. 事务部分回滚

```sql
mysql> start transaction;
Query OK, 0 rows affected (0.00 sec)

mysql> insert into test1 values (1);
Query OK, 1 row affected (0.00 sec)

mysql> savepoint part1; -- 设置一个保存点
Query OK, 0 rows affected (0.00 sec)

mysql> insert into test1 values (2);
Query OK, 1 row affected (0.00 sec)

mysql> rollback to part1; -- 将savepint = part1的语句到当前语句之间所有的操作回滚
Query OK, 0 rows affected (0.00 sec)

mysql> commit; -- 提交事务
Query OK, 0 rows affected (0.00 sec)

mysql> select * from test1;
+------+
| a   |
+------+
|   1 |
+------+
1 row in set (0.00 sec)
```

3. 只读事务

表示在事务中执行的是一些只读操作，如查询，但是不会做 insert、update、delete 操作，数据库内部对只读事务可能会有一些性能上的优化。

```sql
mysql> start transaction read only;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from test1;
+------+
| a   |
+------+
|   1 |
|   1 |
+------+
2 rows in set (0.00 sec)

mysql> delete from test1;
ERROR 1792 (25006): Cannot execute statement in a READ ONLY transaction.
mysql> commit;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from test1;
+------+
| a   |
+------+
|   1 |
|   1 |
+------+
2 rows in set (0.00 sec)
```

## 存在问题

多个事务之间隔离的，相互独立的，但是如果多个事务操作同一批数据，则会引发一些问题，设置不同的隔离级别就可以解决这些问题

1. 脏读：一个事务，读取到另一个事务中没有提交的数据
2. 不可重复读（虚读）：在同一个事务中，两个读取到的数据不一样
3. 幻读：一个事务操作（DML）数据表中所有记录，另一个事务添加了一个数据，则第一个事务查询不到自己的修改

## 隔离级别

### 分类

1. read  uncommitted：读未提交

产生的问题：脏读、不可重复读、幻读

| 时间 | 窗口 A                  | 窗口 B                           |
| :--- | :--------------------- | :------------------------------ |
| T1   | `start transaction;`   |                                 |
| T2   | `select * from test1;` |                                 |
| T3   |                        | `start transaction;`            |
| T4   |                        | `insert into test1 values (1);` |
| T5   |                        | `select * from test1;`          |
| T6   | `select * from test1;` |                                 |
| T7   |                        | `commit;`                       |
| T8   | `commit;`              |                                 |

2. read  committed：读已提交（Oracle）

产生的问题：不可重复读、幻读

| 时间 | 窗口 A                  | 窗口 B                           |
| :--- | :--------------------- | :------------------------------ |
| T1   | `start transaction;`   |                                 |
| T2   | `select * from test1;` |                                 |
| T3   |                        | `start transaction;`            |
| T4   |                        | `insert into test1 values (1);` |
| T5   |                        | `select * from test1;`          |
| T6   | `select * from test1;` |                                 |
| T7   |                        | `commit;`                       |
| T8   | `select * from test1;` |                                 |
| T9   | `commit;`              |                                 |

3. repeatable  read：可重复读（MySQL 默认）

产生的问题：幻读

| 时间 | 窗口 A                  | 窗口 B                           |
| :--- | :--------------------- | :------------------------------ |
| T1   | `start transaction;`   |                                 |
| T2   | `select * from test1;` |                                 |
| T3   |                        | `start transaction;`            |
| T4   |                        | `insert into test1 values (1);` |
| T5   |                        | `select * from test1;`          |
| T6   | `select * from test1;` |                                 |
| T7   |                        | `commit;`                       |
| T8   | `select * from test1;` |                                 |
| T9   | `commit;`              |                                 |
| T10  | `select * from test1;` |                                 |

4. serializable：串行化

可以解决所有的问题

注意：隔离级别从小到大安全性越来越高，但是效率越来越低

### 总结

| 隔离级别         | 脏读可能性 | 不可重复读可能性 | 幻读可能性 |
| ---------------- | ---------- | ---------------- | ---------- |
| READ-UNCOMMITTED | 有         | 有               | 有         |
| READ-COMMITTED   | 无         | 有               | 有         |
| REPEATABLE-READ  | 无         | 无               | 有         |
| SERIALIZABLE     | 无         | 无               | 无         |

### 相关命令

1. 数据库查询隔离级别：

* select  @@tx_isolation;（MySQL5）
* show variables like 'transaction_isolation';

2. 数据库设置隔离级别：set  global  transaction  isolation  level  级别字符串;