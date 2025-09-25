---
title: MySQL（1-常用命令）
tag: MySQL
category: 数据库
description: MySQL常用命令包括：DDL（数据定义语言）用于创建和修改数据库结构，如CREATE、ALTER；DML（数据操纵语言）用于增删改数据，如INSERT、UPDATE；DQL（数据查询语言）通过SELECT进行数据查询；DCL（数据控制语言）管理权限，如GRANT、REVOKE。
date: 2024-11-10 22:38:34
---

## DDL（定义数据库、表结构）

### 操作数据库

#### 创建数据库

```sql
-- 创建数据库
create database 数据库名称;

-- 创建数据库，判断是否存在
create database if not exists 数据库名称;

-- 创建数据库，判断是否存在，并指定字符集
create database 数据库名称 character set 字符集;
```

#### 查询数据库

```sql
-- 查询所有数据库的名称
show databases;

-- 查询某个数据库的字符集
show create database 数据库名称;
```

#### 修改数据库

```sql
-- 修改数据库的字符集
alter database 数据库名称 character set 字符集;
```

#### 删除数据库

```sql
-- 删除数据库
drop database 数据库名称;

-- 判断数据库是否存在，存在则删除
drop database if exists 数据库名称;
```

#### 使用数据库

```sql
-- 查询当前正在使用的数据库名称
select database();

-- 使用数据库
use 数据库名称;
```

### 操作表

#### 创建表

```sql
create table 表名(
    列名1  数据类型1,
    列名2  数据类型2,
    ........
    列名n  数据类型n 
);
```

**注意：** 最后一列不需要加逗号

#### 复制表

```sql
-- 只复制表结构
create table 表名 like 被复制的表名;

-- 复制表结构及数据
create table 表名 select * from 被复制的表名;
```

#### 查询表

```sql
-- 查询某个数据库中所有的表名称
show tables;

-- 查询表结构
desc 表名;

-- 查看建表语句
show create table 表名;
```

#### 修改表

```sql
-- 修改表名
alter table 表名 rename to 新表名;

-- 修改表的字符集
alter table 表名 character set 字符集名称;

-- 添加一列
alter table 表名 add 列名 数据类型;

-- 修改列名称和类型
alter table 表名 change 列名 新列名 新数据类型;
alter table 表名 modify 列名 新数据类型;

-- 删除列
alter table 表名 drop 列名;
```

#### 删除表

```sql
-- 删除表
drop table 表名;

-- 如果存在表，则删除
drop table if exists 表名;
```

### 约束

#### 主键约束（primary key）

1. 创建表时添加约束

```sql
create table 表名 (
    字段名 数据类型 primary key,
    ......
);
```

2. 创建表完后删除约束

```sql
alter table 表名 drop primary key;
```

3. 创建表完后添加约束

```sql
alter table 表名 add primary key(字段名);
alter table 表名 modify 字段名 数据类型 primary key;
alter table 表名 change 旧字段名 新字段名 数据类型 primary key; 
alter table 表名 add constraint 约束名称 primary key(字段名);
```

**注意**

1. 非空且唯一（等于唯一约束+非空约束），一张表只能有一个字段为主键
2. 表需有该字段才能添加约束，有自动增长时需先删除自动增长，然后才能删除主键，否则会报错

#### 自动增长（auto_increment）

如果某一列是数值类型的，使用 `auto_increment` 可以来实现自动增长

1. 创建表时添加自动增长

```sql
create table 表名(
    字段名 数据类型 primary key auto_increment,
    ......
);
```

2. 创建表完后删除自动增长

```sql
alter table 表名 modify 字段名 数据类型;
alter table 表名 change 旧字段名 新字段名 数据类型;
```

3. 创建表完后添加自动增长

```sql
alter table 表名 modify 字段名 数据类型 auto_increment;
alter table 表名 change 旧字段名 新字段名 数据类型 auto_increment;
```

**注意**

1. 一张表只能有一个自增列，并且该列必须定义了约束
2. 必须为主键才可以设置为递增，并且只能在数字类型中使用，否则会报错

#### 非空约束（not null）

1. 创建表时添加约束

```sql
create table 表名(
	字段名 数据类型 not null,
	.......
);
```

2. 创建表完后删除约束

```sql
alter table 表名 modify 字段名 数据类型;
alter table 表名 change 旧字段名 新字段名 数据类型;
```

3. 创建表完后添加约束

```sql
alter table 表名 modify 字段名 数据类型 not null;
alter table 表名 change 旧字段名 新字段名 数据类型 not null;
```

#### 默认值约束（default）

1. 创建表时添加约束

```sql
create table 表名(
    字段名 数据类型 default 值,
    ......
);
```

2. 创建表完后删除约束

```sql
alter table 表名 modify 字段名 数据类型;
alter table 表名 change 旧字段名 新字段名 数据类型;
```

3. 创建表完后添加约束

```sql
alter table 表名 modify 字段名 数据类型 default 值;
alter table 表名 change 旧字段名 新字段名 数据类型 default 值;
```

#### 唯一约束（unique）

1. 创建表时添加约束

```sql
create table 表名(
    字段名 数据类型 unique,
    ......
);
```

2. 创建表完后删除约束

```sql
alter table 表名 drop index 字段名;
```

3. 创建表完后添加约束

```sql
alter table 表名 add unique(字段名);
alter table 表名 add unique key(字段名);
alter table 表名 add constraint 约束名 unique(字段名);
alter table 表名 add constraint 约束名 unique key(字段名);
alter table 表名 modify 字段名 数据类型 unique;
alter table 表名 change 旧字段名 新字段名 数据类型 unique;
```

**注意：** 唯一约束可以有 `null` 值，`null` 值只能有一个

#### 外键约束（foreign key）

`foreign key`：让表与表之间产生联系，保证数据的正确性

1. 创建表时添加约束

```sql
create table 表名(
    ......,
    外键列,
    constraint 外键名称(自定义) foreign key(外键列名称) references 主表名称(主表列名称)
);
```

2. 创建表完后删除约束

```sql
alter table 表名 drop foreign key 外键名称;
```

3. 创建表完后添加约束

```sql
alter table 表名 add constraint 外键名称(自定义) foreign key (外键列名称) references 主表名称(主表列名称);
```

4. 级联操作

```sql
alter table 表名 add constraint 外键名称 foreign key (外键字段名称) references 主表名称(主表列名称) on update cascade on delete cascade;
```

- 级联更新：`on update cascade`
- 级联删除：`on delete cascade`

**注意：** 从表的外键关联的必须是主表的主键，且主键和外键的类型必须一致

## DML（增删改表中数据）

### 添加数据

```sql
-- 指定列名添加数据
insert into 表名(列名1, 列名2,......列名n) values (值1, 值2,......值n);

-- 给所有列添加值
insert into 表名 values (值1, 值2,......值n);

-- 从表2 查询向表1 添加数据
insert into 表名1(列名1, 列名2,......列名n) select 字段1, 字段2,......字段n from 表名2;
```

**注意：**

1. 列名和值要一一对应
2. 除了数字类型，其他类型需要使用引号（单双引号）都可以

### 删除数据

```sql
-- 删除符合条件的数据
delete from 表名 where 条件;

-- 删除所有数据
delete from 表名;

-- 删除表结构和数据
truncate table 表名;（不可以加条件语句）
```

### 修改数据

```sql
-- 更新符合条件的数据
update 表名 set 列名1 = 值1, 列名2 = 值2, ....  where 条件;

-- 更新所有数据
update 表名 set 列名1 = 值1, 列名2 = 值2, ....
```

## DQL（查询表中的数据）

### 语法结构

```sql
select 字段列表
from 表名列表
where 条件列表
group by 分组列表
having 分组之后的条件
order by 排序方式
limit 分页限定
```

**注意：** 执行顺序如下

1. from
2. where
3. group by
4. having
5. select
6. order by
7. limit

### 基础查询

#### 多字段查询

```sql
-- 查询指定字段数据
select 字段名1, 字段名2 .....  from 表名;

-- 查询所有数据
select * from 表名;
```

#### 去除重复值（distinct）

```sql
-- 去除重复值查询
select distinct 字段名1, 字段名2 .....  from 表名;
select distinct 字段名1, distinct 字段名2 .....  from 表名;
```

#### 计算列（ifnull）

```sql
-- 计算列查询（一般只会进行数值型的计算）
select 字段名1, 字段名2 .....  字段名1+字段名2  from  表名;
```

**注意：**

`ifnull(表达式1, 表达式2)`：`null` 参与的运算，计算结果都为 `null`，所以要使用 `ifnull`

- 表达式1：哪个字段需要判断是否为 `null`
- 表达式2：如果该字段为 `null` 后的替换值

#### 起别名（as）

```sql
-- 起别名查询（注意：as 也可以省略）
select  字段名1 as 别名, 字段名2 .....  from 表名 as 别名;
select  字段名1 别名, 字段名2 .....  from 表名 别名;
```

### 条件查询

**运算符：**

1. `>`、`<`、`<=`、`>=`、`=`、`<>` 表示不等于
2. `BETWEEN...AND`
3. `LIKE`：模糊查询（占位符如下）
- `_`：单个任意字符
- `%`：任意字符
- `[]`：用来指定一个字符集，它必须匹配指定位置（通配符的位置）的一个字符，可以用前缀字符^来否定
4. `IS NULL`
5. `and` 或 `&&`
6. `or` 或 `||`
7. `not` 或 `!`
8. `IN(集合)`

### 排序查询

```sql
order by 字段1 排序方式1, ......字段n 排序方式n
```

**排序方式：**

1. `ASC`：升序，默认的
2. `DESC`：降序

### 聚合函数

1. `count`（计算个数）
2. `max`（计算最大值）
3. `min`（计算最小值）
4. `sum`（计算和）
5. `avg`（计算平均值）

**注意：**

聚合函数的计算，要排除 `null` 值时，可以使用下面解决方法：

1. 选择不包含非空的列进行计算
2. `IFNULL` 函数

### 分组查询

```sql
group by 字段1, 字段2......
```

**注意：**

1. 分组之后查询的字段必须是：分组字段、聚合函数
2. `where` 和 `having` 的区别：
- `where` 在分组之前进行限定，如果不满足条件，则不参与分组；`having` 在分组之后进行限定，如果不满足条件，则不会被查询出来
- `where` 后不可以跟聚合函数；`having` 可以进行聚合函数的判断

### 分页查询

```sql
limit 开始的索引, 每页查询的条数
```

**公式：** 开始的索引 =（当前的页码-1）* 每页显示的条数

### 多表查询

#### 自然连接

```sql
select ... from 表名1 natural join 表名2
```

**注意：** 自然连接是一种特殊的等值连接，他要求两个关系表中进行连接的必须是相同的属性列（名字相同），无须添加连接条件，并且在结果中消除重复的属性列

#### 内连接查询

1. 隐式内连接（使用 where 条件消除无用数据）

```sql
select 别名.字段名,.....
from 表名 别名,......
where 别名.字段名=别名.字段名,.....;
```

2. 显式内连接

```sql
select 字段列表 from 表名1 inner(可选) join 表名2 on 条件;
```

#### 外连接查询

1. 全外连接（看两边表）

```sql
select 字段列表 from 表名1 full outer(可选) join 表2 on 条件;
```

2. 左外连接（看左边表）：查询的是左表所有数据以及其交集部分

```sql
select 字段列表 from 表名1 left outer(可选) join 表2 on 条件;
```

**注意：** 若在左表的某行在右表中没有匹配的行，则在相关联的结果集行中右表的所有选择列均为空值

3. 右外连接（看右边表）：查询的是右表所有数据以及其交集部分

```sql
select 字段列表 from 表名1 right outer(可选) join 表2 on 条件;
```

**注意：** 若在右表的某行在左表中没有匹配的行，则在相关联的结果集行中左表的所有选择列均为空值

#### 子查询

1. 子查询的结果是单行单列的

子查询可以作为条件，使用运算符去判断，运算符：`>`、`<`、`>=`、`<=`、`=`

2. 子查询的结果是多行单列的

子查询可以作为条件，使用运算符 `in` 来判断

3. 子查询的结果是多行多列的

子查询可以作为一张虚拟表

```sql
-- 例子：查询工资最高的员工信息
select * from emp where emp.'salary'=(select max(salary) from emp);
```

## DCL（用户和权限管理）

### 用户管理

#### 添加用户

```sql
create user '用户名'@'主机名' identified by '密码';
```

#### 删除用户

```sql
drop user '用户名'@'主机名';
```

#### 修改用户密码

```sql
-- MySQL5.7 之前
update user set password = password('新密码') where user ='用户名';
set password for '用户名'@'主机名'= password('新密码');

-- MySQL5.7 之后
update user set authentication_string = password("新密码") where user ='用户名';
```

**MySQL 中忘记了 root 用户的密码时：**

1. 停止 MySQL 服务（需要管理员运行 cmd）：`net stop mysql`
2. 使用无验证方式启动 MySQL 服务：`mysqld --skip-grant-tables`
3. 打开新的 cmd 窗口，直接输入 mysql 命令，敲回车，就可以登录成功
```sql
use mysql;
update user set password = password('新密码') where user = 'root';
```
4. 关闭两个窗口
5. 打开任务管理器，手动结束 mysqld.exe 的进程
6. 启动 mysql 服务
7. 使用新密码登录

#### 查询用户

```sql
-- 1. 切换到 MySQL 数据库
use mysql;

-- 2. 查询 user 表
select * from user;
```

### 权限管理

#### 查询权限

```sql
show grants for '用户名'@'主机名';
```

#### 授予权限

```sql
grant 权限列表 on 数据库名.表名 to '用户名'@'主机名';

-- 给张三用户授予所有权限，在任意数据库任意表上
grant all on *.* to 'zhangsan'@'localhost';
```

#### 撤销权限

```sql
revoke 权限列表 on 数据库名.表名 from '用户名'@'主机名';
```