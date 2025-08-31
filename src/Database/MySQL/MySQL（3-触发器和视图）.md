---
title: MySQL（3-触发器和视图）
tag: MySQL
category: 数据库
date: 2025-05-01 22:38:34
description: 触发器是自动执行的数据库操作，响应INSERT、UPDATE或DELETE事件，用于数据验证、审计等场景。视图是基于查询的虚拟表，简化复杂SQL、增强安全性并提供数据抽象。两者结合可提升数据一致性和查询效率，优化数据库管理。
---

## 触发器

### 什么是触发器？

触发器是与表有关的数据库对象，当我们对一个表进行数据操作时，可以在 insert、 update、 delete 之前或之后触发并执行触发器中定义的 SQL 语句。当数据库系统执行这些事件时，就会激活触发器执行相应的操作，这种特性可以协助应用系统在数据库端确保数据的完整性、日志记录、数据校验等操作。

特点：

1. 自动执行：当满足特定条件时自动触发
2. 与表相关：触发器必须关联到特定表
3. 事件驱动：响应 INSERT、UPDATE、DELETE 操作
4. 不可调用：不能像存储过程那样直接调用

缺点：

1. 性能影响：触发器会增加数据库负担，复杂触发器可能影响性能

2. 调试困难：触发器错误可能难以调试

3. 递归触发：可能导致意外的递归触发

4. 事务处理：触发器在事务中执行，失败会导致整个事务回滚

5. MySQL 限制：

* 同一表同一事件同一时间的触发器只能有一个
* 不能在触发器中使用 CALL 调用存储过程
* 不能在触发器中使用事务控制语句(COMMIT, ROLLBACK 等)

### 查看

```sql
show triggers [from schema_name];

# 查询系统表triggers中的触发器
select * from information_schema.triggers; 
select * from information_schema.triggers where trigger_name='触发器名称';  
select * from information_schema.triggers where TRIGGER_SCHEMA='数据库名'; 
```

### 删除

```sql
drop trigger [if exists] [schema_name.]触发器名称;
```

### 创建

```sql
CREATE TRIGGER 触发器名称
BEFORE|AFTER INSERT|UPDATE|DELETE
ON 表名
FOR EACH ROW
BEGIN
    触发器要执行的功能
END;
```

1. BEFORE 和 AFTER：指定了触发器执行的时间，前者在触发器事件之前执行触发器语句，后者在触发器事件之后执行触发器语句；
2. INSERT、UPDATE、DELETE：表示触发事件，即触发器执行条件（触发事件）
3. FOR EACH ROW：行级触发器，修改一行数据触发一次，不写就默认语句级触发器，不管修改多少行数据，只执行一次

**注意**

可以使用别名 NEW 和 OLD 来引用触发器中发生变化的内容记录，mysql 中定义了 new 和 old，用来表示触发器的所在表中触发了触发器的那一行数据

使用方法： NEW.columnName （columnName 为相应数据表某一列名）

+ 在 INSERT 型触发器中，NEW 用来表示将要（BEFORE）或已经（AFTER）插入的新数据；
+ 在 UPDATE 型触发器中，OLD 用来表示已经被修改的原数据，NEW 用来表示将要修改为的新数据；
+ 在 DELETE 型触发器中，OLD 用来表示已经被删除的原数据；

**触发器执行顺序**

1. 如果 BEFORE 触发器执行失败，SQL 无法正确执行
2. SQL 执行失败时，AFTER 型触发器不会触发
3. AFTER 类型的触发器执行失败，SQL 会回滚

### 使用案例

1. 数据插入后进行更新

```sql
DELIMITER $$
create trigger tri_insert_student 
after insert on student 
for each row 
begin
    update class set count=count+1 where class.id=new.class_id;
end;
$$                                       
DELIMITER ;
```

2. 数据删除后进行更新

```sql
DELIMITER $$
create trigger tri_delete_student 
after delete on student 
for each row 
begin
    update class set count=count-1 where old.class_id=class.id
end;
$$                                       
DELIMITER ;
```

## 视图

### 什么是视图？

视图是从一个或多个表中导出来的表，是一种虚拟存在的表。视图就像一个窗口，通过这个窗口可以看到系统专门提供的数据，这样用户可以不看整个数据库表中的数据，而只关心对自己有用的数据。视图可以使用户的操作更方便，而且可以保障数据库系统的安全性。 

特点：

1. 虚拟表：不存储实际数据，只存储查询定义
2. 动态数据：每次访问视图时都会执行其定义的查询
3. 简化查询：可以封装复杂查询逻辑
4. 数据安全：可以限制用户访问底层表的特定列
5. 逻辑抽象：为应用程序提供一致的数据接口

### 创建

```sql
CREATE[OR REPLACE] VIEW viewname[(columnlist)]   
AS SELECT statement  
[WITH [CASCADED | LOCAL] CHECK OPTION]
```

- CREATE：表示创建新的视图；
- REPLACE：表示替换已经创建的视图；
- columnlist：属性列，表示可以显示的指出视图中有哪些列（必须和 select 语句对应）；
- viewname：视图的名称；
- SELECT statement：表示 SELECT 语句； 

### 修改

修改视图是指修改数据库中存在的视图，当基本表的某些字段发生变化的时候，可以通过修改视图来保持与基本表的一致性。

```sql
ALTER VIEW viewname[columnlist]   
AS SELECT statement
```

注意：当真实表中修改了某个存在视图中的字段时，这个视图也需要跟着变，否则会变成无效的视图

### 删除

删除视图是指删除数据库中已存在的视图。删除视图时，只能删除视图的定义，不会删除数据。

```sql
DROP VIEW [IF EXISTS] viewname [,viewname....]；
```

### 查看

```sql
# 查看视图基本信息
show tables;
desc viewname;

# 查看视图创建信息
SHOW CREATE VIEW viewname;
```

### 更新视图数据

更新视图是指通过视图来插入（INSERT）、更新（UPDATE）和删除（DELETE）表中的数据。因为视图实质是一个虚拟表，其中没有数据，通过视图更新时都是转换到基本表更新。更新视图时，只能更新权限范围内的数据，超出范围就不能更新了。

不能更新的情况：

1. 视图中包含 SUM()、COUNT()、MAX()和 MIN()等函数；
2. 视图中包含 UNION、UNION ALL、DISTINCT、GROUP BY 和 HAVING 等关键字；
3. 视图对应的表存在没有默认值的列，而且该列没有包含在视图里；
4. 包含子查询的视图；
5. 其他特殊情况；

### 使用案例

1. 在单表上创建视图

```sql
create view view_student 
as select id,name,class_id,sex from student;
```

2. 在多表上创建视图

```sql
create view view_student_teacher 
as select class.id as teacher_id,teacher,class,student.id,student.name,sex 
from class 
left join student 
on class.id=student.class_id;
```

3. 修改视图

```sql
alter view view_student_teacher 
as select teacher,class,name,sex 
from class 
left join student 
on class.id=student.class_id;
```

4. 更新视图数据

```sql
CREATE VIEW high_salary_emps AS
SELECT id, name, department, salary
FROM employees
WHERE salary > 10000
WITH CHECK OPTION;

-- 此操作会失败，因为新工资不满足>10000的条件
UPDATE high_salary_emps SET salary = 9000 WHERE id = 101;
```

