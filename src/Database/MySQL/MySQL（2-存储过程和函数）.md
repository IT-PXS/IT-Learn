---
title: MySQL（2-存储过程和函数）
tag: MySQL
category: 数据库
date: 2025-04-23 22:38:34
description: MySQL存储过程和函数是预编译SQL语句集合，存储过程支持复杂业务逻辑，无返回值；函数必须有返回值，用于计算。两者提高代码复用性、安全性和执行效率，减少网络传输，适用于高频数据处理场景，可通过CREATE PROCEDURE/FUNCTION定义。
---

## 常用语法

### 查看

1. 查看存储过程和函数的创建信息

```sql
show create {procedure | function} 存储过程名或函数名
```

* procedure：指定存储过程
* function：指定存储函数

2. 查看存储过程和函数的状态信息

```sql
show {procedure | function} status [like 'pattern']
```

+ like  'pattern'：匹配存储过程或函数的名称，可以省略

3. 查看存储过程和函数的信息

```sql
select * from information_schema.Routines [where ROUTINE_NAME = '存储过程或函数名' AND ROUTINE_TYPE = {'PROCEDURE|FUNCTION'}];
```

注意：如果在 MySQL 数据库中存在存储过程和函数名称相同的情况，最好指定 ROUTINE_TYPE 查询条件来指明查询的是存储过程还是函数

### 修改

修改存储过程或函数，不影响存储过程或函数功能，只是修改相关特征

```sql
ALTER {PROCEDURE | FUNCTION} 存储过程或函数的名 [characteristic ...]
```

characteristic 指定存储过程或函数的特性，其取值信息与创建存储过程、函数时的取值信息略有不同

```sql
COMMENT 'string'
| LANGUAGE SQL
| { CONTAINS SQL | NO SQL | READS SQL DATA | MODIFIES SQL DATA }
| SQL SECURITY { DEFINER | INVOKER }
```

### 删除

```sql
drop {procedure | function} [if  exists] 存储过程名或函数名
```

注意：不能在一个存储过程中删除另一个存储过程，只能调用另一个存储过程

### 使用案例

1. 修改存储过程

```sql
ALTER PROCEDURE CountProc
MODIFIES SQL DATA
SQL SECURITY INVOKER ;
```

2. 修改存储函数

```sql
ALTER FUNCTION CountProc
READS SQL DATA
COMMENT 'FIND NAME' ;
```

## 存储过程

### 优缺点

优点：

1. 可以一次编译、多次使用。存储过程只在创建时进行编译，之后的使用都不需要重新编译，这就提升了 SQL 的执行效率。
2. 可以减少开发工作量。将代码封装成模块，实际上是编程的核心思想之一，这样可以把复杂的问题拆解成不同的模块，然后模块之间可以重复使用，在减少开发工作量的同时，还能保证代码的结构清晰。
3. 安全性强。我们在设定存储过程的时候可以设置对用户的使用权限，这样就和视图一样具有较强的安全性。
4. 可以减少网络传输量。因为代码封装到存储过程中，每次使用只需要调用存储过程即可，这样就减少了网络传输量。
5. 良好的封装性。在进行相对复杂的数据库操作时，原本需要使用一条一条的 SQL 语句，可能要连接多次数据库才能完成的操作，现在变成了一次存储过程，只需要连接一次即可 

缺点：

1. 可移植性差。存储过程不能跨数据库移植，比如：在 MySQL、Oracle 和 SQL Server 里编写的存储过程，在换成其他数据库时都需要重新编写。
2. 调试困难。只有少数 DBMS 支持存储过程的调试，对于复杂的存储过程来说，开发和维护都不容易。虽然也有一些第三方工具可以对存储过程进行调试，但要收费。
3. 版本管理很困难。比如：数据表索引发生变化了，可能会导致存储过程失效。我们在开发软件的时候往往需要进行版本管理，但是存储过程本身没有版本控制，版本迭代更新的时候很麻烦。
4. 不适合高并发的场景。高并发的场景需要减少数据库的压力，有时数据库会采用分库分表的方式，而且对可扩展性要求很高，在这种情况下，存储过程会变得难以维护， 增加数据库的压力 ，显然就不适用了。

### 创建

```sql
DELIMITER //
CREATE PROCEDURE 存储过程名(IN|OUT|INOUT 参数名 参数类型,...)
[characteristics ...]
BEGIN
    存储过程体
END //
```

1. IN：当前参数为输入参数（如果没有定义参数种类，默认是 IN）
2. OUT：当前参数为输出参数
3. INOUT：当前参数既可以为输入参数，也可以为输出参数

characteristics 表示创建过程时指定的对存储过程的约束条件，其取值信息如下：

```sql
LANGUAGE SQL
| [NOT] DETERMINISTIC
| { CONTAINS SQL | NO SQL | READS SQL DATA | MODIFIES SQL DATA }
| SQL SECURITY { DEFINER | INVOKER }
| COMMENT 'string'
```

1. LANGUAGE SQL：说明存储过程执行体是由 SQL 语句组成的，当前系统支持的语言为 SQL

2. [NOT] DETERMINISTIC：指明存储过程执行的结果是否确定（默认为 NOT DETERMINISTIC）

* DETERMINISTIC：表示结果是确定的，相同的输入会得到相同的输出
* NOT DETERMINISTIC：表示结果是不确定的，相同的输入可能得到不同的输出

3. {CONTAINS SQL | NO SQL | READS SQL DATA | MODIFIES SQL DATA}：指明子程序使用 SQL 语句的限制（默认为 CONTAINS SQL）

+ CONTAINS SQL：表示当前存储过程的子程序包含 SQL 语句，但是并不包含读写数据的 SQL 语句
+ NO SQL：表示当前存储过程的子程序中不包含任何 SQL 语句
+ READS SQL DATA：表示当前存储过程的子程序中包含读数据的 SQL 语句
+ MODIFIED SQL DATA：表示当前存储过程的子程序中包含写数据的 SQL 语句

4. SQL SECURITY {DEFINER | INVOKER}：执行当前存储过程的权限，即指明哪些用户能够执行当前存储过程

+ DEFINER：表示只有当前存储过程的创建者或者定义这才能执行当前存储过程
+ INVOKER：表示只有拥有当前存储过程的访问权限的用户能够执行当前存储过程

5. COMMENT 'string'：注释信息，可以用来描述存储过程

**注意**

1. 存储过程体中可以有多条 SQL 语句，如果仅仅一条 SQL 语句，则可以省略 BEGIN 和 END

```sql
BEGIN ... END 	-- 中间包含了多个语句，每个语句都以（;）号为结束符。
DECLARE 		-- 用来声明变量，使用的位置在于 BEGIN…END 语句中间，而且需要在其他语句使用之前进行变量的声明。
SET 			-- 赋值语句，用于对变量进行赋值。
SELECT ... INTO -- 把从数据表中查询的结果存放到变量中，也就是为变量赋值。
```

2. 需要设置新的结束标记

因为 MySQL 默认的语句结束符号为分号 `;`，为了避免与存储过程中 SQL 语句结束符相冲突，需要使用 DELIMITER 改变存储过程的结束符。当使用 DELIMITER 命令时，应该避免使用反斜杠（`\`）字符，因为反斜线是 MySQL 的转义字符。

例如：`DELIMITER //` 语句的作用是将 MySQL 的结束符设置为 `//`，并以 `END //` 结束存储过程。存储过程定义完毕之后再使用 `DELIMITER ;` 恢复默认结束符。DELIMITER 也可以指定其他符号作为结束符。

### 调用

语法：call 存储过程名(实参列表)

1. 调用 in 模式的参数

```sql
CALL sp1('值');
```

2. 调用 out 模式的参数

```sql
SET @name;
CALL sp1(@name);
SELECT @name;
```

3. 调用 inout 模式的参数

```sql
SET @name=值;
CALL sp1(@name);
SELECT @name;
```

### 使用案例

```sql
DELIMITER //
CREATE PROCEDURE CountProc(IN sid INT,OUT num INT)
BEGIN
SELECT COUNT(*) INTO num FROM fruits
WHERE s_id = sid;
END //
DELIMITER ;

mysql> CALL CountProc (101, @num);
Query OK, 1 row affected (0.00 sec)

mysql> SELECT @num;
```

## 存储函数

### 创建

```sql
DELIMITER //
CREATE FUNCTION 函数名(参数名 参数类型,...)
RETURNS type
[characteristic ...] 
BEGIN
	函数体 
END //
```

1. 参数类型可以是 mysql 所有支持的类型（FUNCTION 总是默认 IN 参数）
2. RETURNS type：RETURN 子句只能对 FUNCTION 做指定，对函数而言这是强制的。它用来指定函数的返回类型，而且函数体必须包含一个 RETURN value 语句。
3. characteristic：可选项，指定存储函数的特性（同存储过程一致）

**注意**

函数体中肯定有 RETURN 语句 

### 调用

语法：select 函数名(实参列表)

### 使用案例

```sql
-- 创建用户信息表
CREATE TABLE IF NOT EXISTS tb_user(
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户编号',
    name VARCHAR(50) NOT NULL COMMENT '用户姓名'
) COMMENT = '用户信息表';
 
-- 添加数据
INSERT INTO tb_user(name) VALUES('pan_junbiao的博客');
INSERT INTO tb_user(name) VALUES('KevinPan');
INSERT INTO tb_user(name) VALUES('pan_junbiao');
INSERT INTO tb_user(name) VALUES('阿标');
INSERT INTO tb_user(name) VALUES('panjunbiao');
INSERT INTO tb_user(name) VALUES('pan_junbiao的CSDN博客');
INSERT INTO tb_user(name) VALUES('https://blog.csdn.net/pan_junbiao');
```

```sql
-- 创建存储函数
DELIMITER //
CREATE FUNCTION func_user(in_id INT)
RETURNS VARCHAR(50)
COMMENT '查询学生的姓名'
BEGIN
    DECLARE out_name VARCHAR(50);

    SELECT name INTO out_name FROM tb_user
    WHERE id = in_id;

    RETURN out_name;
END //
```

```sql
-- 调用存储函数
SELECT func_user(1);
SELECT func_user(2);
SELECT func_user(3);
```

## 区别

| 名称     | 关键字    | 调用语法        | 返回值            | 应用场景                         |
| -------- | --------- | --------------- | ----------------- | -------------------------------- |
| 存储过程 | PROCEDURE | CALL 存储过程() | 理解为有 0 个或多个 | 一般用于更新                     |
| 存储函数 | FUNCTION  | SELECT 函数()   | 只能是一个        | 一般用于查询结果为一个值并返回时 |

1. 函数只能是 in 类型；存储过程可以使用 in、out、inout 类型。
2. 函数只能通过 return 语句返回单个值或者表对象；而存储过程不允许执行 return，但是通过 out 参数返回多个值。 
3. 函数是可以嵌入在 sql 中使用的，可以在 select 中调用；而存储过程不行。
4. 函数限制比较多，如不能用临时表，只能用表变量等；而存储过程的限制相对就比较少。
5. 函数只能返回一个特定类型的值或者表对象；存储过程可以接受参数、输出参数、返回单个或多个结果集以及返回值，可以向程序返回错误原因。

## 变量

### 定义变量

```sql
DECLARE var_name[,var_name]... data_type [DEFAULT value];
```

- var_name：变量的名称，可以同时定义多个变量；
- type：用来指定变量的类型；
- DEFAULT value：将变量默认值设置为 value，没有使用 DEFAULT 子句时，默认值为 NULL。

### 变量赋值

1. 使用 set 关键词赋值

```sql
SET var_name=expr[,var_name=expr]…  #可以是确定值，也可以是表达式
```

- var_name：变量的名称；
- expr：赋值表达式。一个 SET 语句可以同时为多个变量赋值，各个变量的赋值语句之间用逗号隔开。 

2. 使用 SELECT … INTO 语句为变量赋值

```sql
SELECT col_name[,...] INTO var_name[,...]     
FROM table_name WHERE condition  
```

- col_name：表示查询的字段名称；
- var_name：变量的名称；
- table_name：指表的名称；
- condition：指查询条件。 

### 创建用户变量 

使用@关键字创建“用户变量”，“用户变量的作用范围”在整个当前对话中，其语法形式如下：

```sql
@var_name;
```

例如：创建“用户变量”调用上面的存储过程，并使用 select 语句查看变量

```sql
call proc_query_student(3,@name,@count);
select @name,@count;
```

### 全局变量的持久化

MySQL 数据库中，全局变量可以通过 SET GLOBAL 语句来设置。

例如：设置服务器语句超时的限制

```sql
SET GLOBAL MAX_EXECUTION_TIME = 2000;
```

### 使用案例

```sql
delimiter $$
create procedure proc_query_student(in sid int,out cname varchar(64),out ccount int)
begin
    declare temp_cid int;
    declare temp_cname varchar(64);
    declare temp_ccount int;
    select class_id into temp_cid from student where id=sid;
    select name,count into temp_cname,temp_ccount from class where id=temp_cid;
    set cname=temp_cname,ccount=temp_ccount;
end;
$$
delimiter ;
```

## 流程控制

### IF

其语法的基本形式如下：

```sql
IF search_condition THEN statement_list       
[ELSEIF search_condition THEN statement_list] ...
[ELSE statement_list]                           
END  IF
```

- search_condition：表示条件判断语句；
- statement_list：表示不同条件的执行语句。

**使用案例**

```sql
delimiter $$
create procedure proc_age(in input int,out output int)
begin
    if input>20 then 
        set output = input+1;
    elseif input=20 then 
        set output = input+2;
    else 
        set output = input+3;
    end if;
end;
$$
delimiter ;
```

```sql
call proc_age(23,@out);
select @out;
call proc_age(4,@out);
select @out;
```

### CASE

其语法的基本形式如下：

```sql
CASE case_value                                  
WHEN when_value THEN statement_list            
[WHEN when_value THEN statement_list]          
[ELSE statement_list]                               
END CASE         
```

- case_value：表示条件判断的变量；
- when_value：表示变量的取值；
- statement_list：表示不同 when_value 值的执行语句。

**使用案例**

```sql
CASE level                                    
    WHEN 20 THEN 
    	SET attack = attack + 5;  
    WHEN 30 THEN 
    	SET attack = attack + 10; 
    WHEN 40 THEN 
    	SET attack = attack + 15; 
    ELSE 
    	SET attack = attack + 1; 
END CASE     
```

### LOOP

LOOP 语句可以使某些特定的语句重复执行，实现一个简单的循环。LOOP 语句本身没有停止循环，只有遇到 LEAVE 语句等才能停止循环。LOOP 语句的语句形式如下： 

```sql
[begin_label:] LOOP             
statement_list                  
END LOOP [end_label] 
```

- begin_label 和 end_label：分别表示循环开始和结束的标志，这两个标志必须相同，而且都可以省略；
- statement_list：表示需要循坏执行的语句。 

**使用案例**

```sql
add_num:LOOP                 
    SET @count = @count + 1; 
END LOOP add_num;   
```

### LEAVE

LEAVE 语句主要用于跳出循环控制（相当于 C/C++ 的 break），其语法形式如下：

 ```sql
 LEAVE label   
 ```

- label：表示循环的标志。 

**使用案例**

```sql
delimiter $$
create procedure proc_loop(in input int,out ouput int)
begin
    add_num:loop
        set input = input+1;
        if input = 100 then
            leave add_num;
        end if;
    end loop add_num;
    set ouput = input;
end;
$$  
delimiter ;  
```

```sql
call proc_loop(2,@num);
select @num;
```

### ITERATE

ITERATE 语句也是用来跳出循环的语句，但是 ITERATE 语句是跳出本次循环，然后直接进入下一次循环（相当于 C/C++ 的 continue），ITERATE 语句的语法形式如下：

```sql
ITERATE label
```

- label：表示循环的标志。 

**使用案例**

```sql
set @count = 1;
delimiter $$
create procedure proc_iterate()
begin
    add_num:loop
        set @count = @count+1;
        if @count = 4 then
            leave add_num;
        elseif mod(@count,2) =0 then
            iterate add_num;
        else
            select * from student;
        end if;
    end loop add_num;
end;
$$
delimiter ;
```

### REPEAT

REPEAT 语句是有条件控制的循环语句（相当于 C/C++ 的 do ...while）。当满足特定条件时，就会跳出循环语句。REPEAT 语句的基本语法形式如下：

```sql
[begin_label:] REPEAT        
    statement_list;       
    UNTIL search_condition
END REPEAT [end_label]      
```

- statement_list：表示循环的执行语句；
- search_condition：表示结束循环的条件，满足该条件时循环结束。

**使用案例**

```sql
REPEAT                        
    SET @count = @count+1;   
    UNTIL @count = 100        
END REPEAT;         
```

### WHILE

WHILE 语句也是有条件控制的循环语句，但 WHILE 语句和 REPEAT 语句是不一样的。WHILE 语句是当满足条件时执行循环内的语句。WHILE 语句的基本语法形式如下：

```sql
[begin_label:] WHILE search_condition DO   
    statement_list                      
END WHILE [end_label]                     
```

- search_condition：表示循环执行的条件，满足该条件时循环执行；
- statement_list：表示循环的执行语句。

**使用案例**

```sql
WHILE @count<100 DO       
    SET @count = @count + 1;
END WHILE;
```

## 光标

### 什么是光标 ？

查询语句可能查询出多条记录，在存储过程和函数中使用光标来逐条读取查询结果集中的记录，有些书上将光标称为游标。光标的使用包括声明光标、打开光标、使用光标和关闭光标，光标必须声明在处理程序之前，并且声明在变量和条件之后。

### 声明光标

在 MySQL 中，可以使用 DECLARE 关键字来声明光标，其基本语法如下：

```sql
DECLARE cursor_name CURSOR         
FOR select_statement;                  
```

- cursor_name：表示光标的名称；
- select_statement：表示 SELECT 语句的内容。

### 打开光标

在 MySQL 中，使用关键字 OPEN 来打开光标，其基本语法如下：

```sql
OPEN cursor_name;
```

- cursor_name：表示光标的名称。

### 使用光标

在 MySQL 中，使用关键字 FETCH 来使用光标，其基本语法如下： 

```sql
FETCH cursor_name
INTO var_name[,var_name...];
```

- cursor_name：表示光标的名称；
- var_name：表示将光标中的 SELECT 语句查询出来的信息存入该参数中。var_name 必须在声明光标之前就定义好。 

### 关闭光标 

在 MySQL 中，使用关键字 CLOSE 来关闭光标，其基本语法如下：

```sql
CLOSE cursor_name;
```

- cursor_name：表示光标的名称。

### 使用案例

```sql
delimiter $$
create procedure proc_query_student(in sid int,out cname varchar(64) ,out cid int)
begin
    declare temp_name varchar(64);
    declare temp_cid int;
    # 声明光标
    declare cur_student cursor for select name ,class_id from student where id=sid;
    open cur_student;   # 打开光标
    fetch cur_student into temp_name,temp_cid;  # 使用光标
    select temp_name,temp_cid;  # 打印从光标中获得的值
    close cur_student;  # 关闭光标
    set cname=temp_name,cid=temp_cid;
end;
$$
 
delimiter ;
```

