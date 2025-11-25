---
title: MySQL进阶（2-查询优化）
tags: MySQL
categories: 数据库
cover: /img/index/mysql.png
top_img: /img/index/mysql.png
published: false
abbrlink: 62148
date: 2024-11-20 22:38:34
description:
---

## 延时关联（分页查询）

通过使用覆盖索引查询返回需要的主键，再根据主键关联原表获得需要的数据，尤其在大分页查询的场景下，可以提高查询效率

```plsql
select * from table where xxx limit a,b;

select * from table where id in (select id from table where xxx limit a,b);
```

在覆盖索引的场景下，第一条的执行逻辑：

1. 通过索引找到（a+b）条符合查询条件的记录 id
2. 再通过（a+b）个 id 回表查询这（a+b）条记录
3. 最后按分页条件给用户返回 b 条记录

而第二条 SQL 的执行逻辑则是：

1. 通过索引找到（a+b）条符合查询条件的记录 id
2. 按分页条件取 b 个记录 id，然后回表查询这 b 条记录
3. 最后给用户返回 b 条记录

第二条 SQL 在覆盖索引的场景下，减少了大量的回表执行次数，从而提高了执行效率，而在非索引覆盖的场景下，延时关联失效，两种 SQL 的执行速度没有多少区别

有时候也可以将 LIMIT 查询转换为已知位置的查询，让 MySQL 通过范围扫描获得对应的结果

```plsql
SELECT film_id,description FROM skila.film
WHERE position BETWEEN 50 AND 54 ORDER BY position;
```

LIMIT 和 OFFSET 的问题，其实是 OFFSET 的问题，它会导致 MySQL 扫描大量不需要的行然后再抛弃掉，如果可以使用书签记录上次取数的位置，那么下次就可以直接从书签记录的位置开始扫描，这样就可以避免 OFFSET

```plsql
SELECT * FROM sakila.rental ORDER BY rental_id DESC LIMIT 20;

-- 假设上面的查询返回的是主键16049到16030的租赁记录，那么下一页查询就可以从16030这个点开始
SELECT * FROM sakila.rental 
WHERE rental_id < 16030 ORDER BY rental_id DESC LIMIT 20;
```

## 连接查询

### 外连接

外连接通过 OUTER JOIN 来实现，它会返回两张表中满足连接条件的数据，同时返回不满足连接条件的数据。

1. 左外连接（LEFT OUTER JOIN）：它会返回左表中的所有记录和右表中满足连接条件的记录
2. 右外连接（RIGHT OUTER JOIN）：它会返回右表中的所有记录和左表中满足连接条件的记录
3. 完全外连接（FULL OUTER JOIN）：但 MySQL 不支持这种形式

### 内连接（自然连接）

只有两个表匹配的行才能在结果集中出现，返回的结果集选取了两个表中所有相匹配的数据，舍弃了不匹配的数据，例如：select * from table1 [inner] join table2 on table1.column = table2.column

### left jon 比 where 快的原因

1. 多表使用 left join 是把主表里的所有数据查询出来，其他表只查询表中的符合条件的某一条记录，所以速度非常快；而多表使用 where 内联，是把所有表的数据全查出来，然后进行比对，所以速度非常慢
2. 如果是 inner join，放 on 和放 where 产生的结果一样；如果是 outer join（left 或 right），效率会不一样，因为已经提前过滤了一部分数据，而 where 生效在后

### 小表驱动大表

小表驱动大表指的是用小的数据集驱动大的数据集，主要目的是通过减少表连接创建的次数，加快查询速度 

1. 小表驱动大表： A 驱动表、B 被驱动表

for(200 条){for(20 万条){...}}

2. 大表驱动小表： B 驱动表、A 被驱动表

for(20 万){for(200 条){...}}

执行结果：

1. 如果小的循环在外层，对于表连接来说就只连接 200 次 ;
2. 如果大的循环在外层，则需要进行 20 万次表连接，从而浪费资源，增加消耗 ;

总结：

1. 当使用 left join 时，左表是驱动表，右表是被驱动表 ;
2. 当使用 right join 时，右表时驱动表，左表是驱动表 ;
3. 当使用 inner join 时，mysql 会选择数据量比较小的表作为驱动表，大表作为被驱动表 ;

### EXISTS 替代 IN

1. IN 使用情况

```sql
mysql> select * from t_user where id in (select user_id from t_order where buy_date=curdate());
+----+------+----------------------------------+------------+--------+
| id | name | password                         | email      | phone  |
+----+------+----------------------------------+------------+--------+
|  2 | xyz2 | 5838eec5e44b83f35c2763382b45e469 | 456@qq.com | 456789 |
+----+------+----------------------------------+------------+--------+
```

```sql
mysql> explain select * from t_user where id in (select user_id from t_order where buy_date=curdate());
+----+-------------+---------+------------+------+-----------------------------------------------+--------------+---------+-------+------+----------+---------------------------------+
| id | select_type | table   | partitions | type | possible_keys                                 | key          | key_len | ref   | rows | filtered | Extra                           |
+----+-------------+---------+------------+------+-----------------------------------------------+--------------+---------+-------+------+----------+---------------------------------+
|  1 | SIMPLE      | t_user  | NULL       | ALL  | PRIMARY                                       | NULL         | NULL    | NULL  |    1 |   100.00 | NULL                            |
|  1 | SIMPLE      | t_order | NULL       | ref  | idx_user_id,idx_user_id_buy_date,idx_buy_date | idx_buy_date | 3       | const |    1 |   100.00 | Using where; FirstMatch(t_user) |
+----+-------------+---------+------------+------+-----------------------------------------------+--------------+---------+-------+------+----------+---------------------------------+
2 rows in set, 1 warning (0.00 sec)
```

对于外层 SELECT 对应用户表 t_user 的每一行数据都要执行一次这个子查询，而这个子查询是需要返回一个数据集合而不是单条数据，然后再判断外层 SELECT 的当前数据行的该列的值是否在这个集合中，类似于 O(N)的线性时间复杂度，如 Java 的集合的 contains 方法，所以性能是很低的，即 MySQL 需要返回的数据量大同时查询的时间复杂度高

2. EXISTS 使用情况

```sql
mysql> select * from t_user where exists (select * from t_order where t_user.id=t_order.user_id and t_order. buy_date=curdate());
+----+------+----------------------------------+------------+--------+
| id | name | password                         | email      | phone  |
+----+------+----------------------------------+------------+--------+
|  2 | xyz2 | 5838eec5e44b83f35c2763382b45e469 | 456@qq.com | 456789 |
+----+------+----------------------------------+------------+--------+
1 row in set (0.00 sec)
```

```sql
mysql> explain select * from t_user where exists (select * from t_order where t_user.id=t_order.user_id and t_order. buy_date=curdate());
+----+--------------------+---------+------------+------+-----------------------------------------------+--------------+---------+-------+------+----------+-------------+
| id | select_type        | table   | partitions | type | possible_keys                                 | key          | key_len | ref   | rows | filtered | Extra       |
+----+--------------------+---------+------------+------+-----------------------------------------------+--------------+---------+-------+------+----------+-------------+
|  1 | PRIMARY            | t_user  | NULL       | ALL  | NULL                                          | NULL         | NULL    | NULL  |    1 |   100.00 | Using where |
|  2 | DEPENDENT SUBQUERY | t_order | NULL       | ref  | idx_user_id,idx_user_id_buy_date,idx_buy_date | idx_buy_date | 3       | const |    1 |    25.00 | Using where |
+----+--------------------+---------+------------+------+-----------------------------------------------+--------------+---------+-------+------+----------+-------------+
2 rows in set, 2 warnings (0.00 sec)
```

执行计划与 IN 差不多，外层 SELECT 的 type 都是 ALL，即全表扫描，但是 EXISTS 的执行过程与 IN 不一致，对于 EXISTS 而言，外层 SELECT 对应的用户表 t_user 也参与到了子查询的 SQL 中，即 where t_user.id = t_order.user_id，故如果子查询的结果不为空，即存在数据，则外层 SELECT 对应的 t_user 表的当前数据行肯定是符合要求的，故该子查询实际上并不返回任何数据，而是返回值 True 或 False，不需要与 IN 一样返回一个数据集合。

而对外层 SELECT 来说，通过 EXISTS 判断子查询返回的 boolean 值 True 或者 False 来判断当前数据行是否符合要求，故时间复杂度为常量级别 O(1)

## count()

### 区别

1. count(*)：包括了所有的列，相当于行数，在统计结果的时候，包含字段为 NULL 的记录
2. count(1)：忽略所有列，用 1 代表代码行，在统计结果的时候，包含字段为 NULL 的记录
3. count(列名)：只包括列名那一列，在统计结果的时候，某个字段值为 NULL 时不统计

### 性能比较

![](MySQL进阶（2-查询优化）/1.png)

1. count(主键字段)

如果表里只有主键索引，没有二级索引时，那么，InnoDB 循环遍历聚簇索引，将读取到的记录返回给 server 层，然后读取记录中的 id 值，就会 id 值判断是否为 NULL，如果不为 NULL，就将 count 变量加 1。

 如果表里有二级索引时，InnoDB 循环遍历的对象就不是聚簇索引，而是二级索引。这是因为相同数量的二级索引记录可以比聚簇索引记录占用更少的存储空间，所以二级索引树比聚簇索引树小，这样遍历二级索引的 I/O 成本比遍历聚簇索引的 I/O 成本小，因此「优化器」优先选择的是二级索引 

2. count(1)

如果表里只有主键索引，没有二级索引时。那么 InnoDB 循环遍历聚簇索引（主键索引），将读取到的记录返回给 server 层，但是不会读取记录中的任何字段的值，因为 count 函数的参数是 1，不是字段，所以不需要读取记录中的字段值。参数 1 很明显并不是 NULL，因此 server 层每从 InnoDB 读取到一条记录，就将 count 变量加 1。

可以看到，count(1) 相比 count(主键字段) 少一个步骤，就是不需要读取记录中的字段值，所以通常会说 count(1) 执行效率会比 count(主键字段) 高一点。

但是，如果表里有二级索引时，InnoDB 循环遍历的对象就二级索引了。

3. count(*)

对于 select * 这条语句来说是读取记录中的所有字段值这个意思，但是在 count(*) 中并不是这个意思。count(\*) 其实等于 count(0)，也就是说，当你使用 count(\*) 时，MySQL 会将 * 参数转化为参数 0 来处理。

所以，count(\*) 执行过程跟 count(1) 执行过程基本一样的，性能没有什么差异。而且 MySQL 会对 count(*) 和 count(1) 有个优化，如果有多个二级索引的时候，优化器会使用 key_len 最小的二级索引进行扫描。

只有当没有二级索引的时候，才会采用主键索引来进行统计。

4. count(字段)

不使用索引来查询时，会采用全表扫描的方式来计数，所以它的执行效率是比较差的。

### 总结

1. count(1)、 count(*)、 count(主键字段)在执行的时候，如果表里存在二级索引，优化器就会选择二级索引进行扫描。
2. 如果要执行 count(1)、 count(*)、 count(主键字段) 时，尽量在数据表上建立二级索引，这样优化器会自动采用 key_len 最小的二级索引进行扫描，相比于扫描主键索引效率会高一些。
3. 不要使用 count(字段) 来统计记录个数，因为它的效率是最差的，会采用全表扫描的方式来统计。如果你非要统计表中该字段不为 NULL 的记录个数，建议给这个字段建立一个二级索引

## SQL 优化

1. 查询时尽量不要使用*

2. 连表查询时尽量不要关联太多表

3. 多表查询时一定要以小驱大

```sql
-- 假设 zz_student 学生表中有 10000 条数据，zz_class 班级表中有 100 条数据，当需要关联这两张表查询数据时
-- 大表在前，小表在后
select * from zz_student as s left join zz_class as c on s.class_id = c.class_id;
-- 小表在前，大表在后
select * from zz_class as c left join zz_student as s on c.class_id = s.class_id;
```

上述是两种联查的 `SQL` 语法，如果学生表在前作为驱动表，根据 `Nest Loop Join` 算法会循环一万次查询数据，而反之如果班级表在前，则只需要循环 `100` 次即可查询出数据，因此诸位在写 `SQL` 时一定要记得将小表作为驱动表。

```sql
select * from xxx where yyy in (select yyy from zzz where ....);
```

`MySQL` 在执行上述这条 `SQL` 时，会先去执行 `in` 后面的子查询语句，这时尽量要保证子查询的结果集小于 `in` 前面主查询的结果集，这样能够在一定程度上减少检索的数据量。通常使用 `in` 做子查询时，都要确保 `in` 的条件位于所有条件的最后面，这样能够在最大程度上减小多表查询的数据匹配量，如下

```sql
-- 优化前：
select xxx,xxx,xxx from table where colum in(sql) and id = 10;
-- 优化后：
select xxx,xxx,xxx from table where id = 10 and colum in(sql);
```

4. 不要使用 like 左模糊和全模糊查询

5. 查询时尽量不要对字段做空值判断

```sql
select * from xxx where yyy is null;
select * from xxx where yyy not is null;
```

当出现基于字段做空值判断的情况时，会导致索引失效，因为判断 `null` 的情况不会走索引，因此切记要避免这样的情况，一般在设计字段结构的时候，请使用 `not null` 来定义字段，同时如果想为空的字段，可以设计一个 `0、""` 这类空字符代替，一方面要查询空值时可通过查询空字符的方式走索引检索，同时也能避免 `MyBatis` 注入对象属性时触发空指针异常。

6. 不要在条件查询 `=` 前对字段做任何运算

```sql
select * from zz_users where user_id * 2 = 8;
select * from zz_users where trim(user_name) = "熊猫";
```

7. !=、! <>、not in、not like、or...要慎用

在实际过程中可以使用其他的一些语法代替，比如 `or` 可以使用 `union all` 来代替：

```sql
select user_name from zz_users where user_id=1 or user_id=2;
-- 可以替换成：
select user_name from zz_users where user_id=1
union all
select user_name from zz_users where user_id=2;
```

8. 必要情况下可以强制指定索引

9. 避免频繁创建、销毁临时表

临时表是一种数据缓存，对于一些常用的查询结果可以为其建立临时表，这样后续要查询时可以直接基于临时表来获取数据，`MySQL` 默认会在内存中开辟一块临时表数据的存放空间，所以走临时表查询数据是直接基于内存的，速度会比走磁盘检索快上很多倍。但一定要切记一点，只有对于经常查询的数据才对其建立临时表，不要盲目的去无限制创建，否则频繁的创建、销毁会对 `MySQL` 造成不小的负担

10. 尽量将大事务拆分为小事务执行

一个事务占有锁之后，会导致其他要操作相同数据的事务被阻塞，如果当一个事务比较大时，会导致一部分数据的锁定周期较长，在高并发情况下会引起大量事务出现阻塞，从而最终拖垮整个 `MySQL` 系统。

`show status like 'innodb_log_waits';` 查看是否有大事务由于 `redo_log_buffer` 不足，而在等待写入日志。

大事务也会导致日志写入时出现阻塞，这种情况下会强制触发刷盘机制，大事务的日志需要阻塞到有足够的空间时，才能继续写入日志到缓冲区，这也可能会引起线上出现阻塞。

11. 从业务设计层面减少大量数据返回的情况

12. 尽量避免深分页的情况出现

13. SQL 务必要写完整，不要使用缩写法

```sql
-- 为字段取别名的简单写法
select user_name "姓名" from zz_users;
-- 为字段取别名的完整写法
select user_name as "姓名" from zz_users;

-- 内连表查询的简单写法
select * from 表1,表2... where 表1.字段 = 表2.字段 ...; 
-- 内连表查询的完整写法
select * from 表1 别名1 inner join 表2 别名2 on 别名1.字段 = 别名2.字段;
```

这类情况下还有很多，在写的时候为了图简单，都会将一些能简写的 `SQL` 就简写，但其实这种做法也略微有些问题，因为隐式的这种写法，在 `MySQL` 底层都需要做一次转换，将其转换为完整的写法，因此简写的 `SQL` 会比完整的 `SQL` 多一步转化过程，如果你考虑极致程度的优化，也切记将 `SQL` 写成完整的语法。

14. 基于联合索引查询时请务必确保字段的顺序性

15. 明确仅返回一条数据的语句可以使用 limit 1
