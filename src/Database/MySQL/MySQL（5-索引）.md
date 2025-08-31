---
title: MySQL（5-索引）
tag: MySQL
category: 数据库
date: 2025-05-11 22:38:34
description: MySQL索引是加速数据检索的关键数据结构，常见类型包括B-Tree、哈希和全文索引。合理使用索引可大幅提升查询性能，但过多索引会增加写入开销。优化索引策略需结合查询模式和数据特点，平衡读写效率。
---

## 基本概念

索引是一种特殊的数据库结构，可以用来快速查询数据库表中的特定记录，是提高数据库性能的重要方式。MySQL 中，所有的数据类型都可以被索引。

通过索引，查询数据时可以不必读完记录的所有信息，而只是查询索引列，否则数据库系统将读取每条记录的所有信息进行匹配。

例如：索引相当于新华字典的音序表，如果要查“过”字，如果不适用音序，就需要从字典的第一页开始翻几百页；如果提取拼音出来，构成音序表，就只需要从 10 多页的音序表中直接查找，这样就可以大大节省时间。因此，使用索引可以在很大程度上提高数据库的查询速度，有效地提高了数据库系统的性能。

## 优缺点

1. 优点：可以提高检索数据的速度。 

2. 缺点：

* 创建和维护索引需要耗费时间，耗费时间量随着数据量的增加而增加；
* 索引需要占用物理空间，每一个索引要占一定的物理空间；
* 增加、删除和修改数据时，要动态地维护索引，造成数据的维护速度降低了。 

## 普通索引

### 创建表时定义索引

```sql
CREATE TABLE tablename(
    propname1 type1,
    propname2 type2,
    ....
    propnamen typen,  
    # 以上为属性声明
    INDEX | KEY
    [indexname] (propnamen [(length)] [ ASC | DESC ] ) 
);
```

1. INDEX 和 KEY：用来指定字段为索引的，两者选择其中之一就可以了，作用是一样的；
2. indexname：索引名字，可省略；
3. propname：索引对应的字段的名称，该字段必须为前面定义好的字段；
4. length：可选参数，其指索引的长度，必须是字符串类型才可以使用（如果长度太短，可表示的信息就越少，对于超大量数据就没法全部表示，一般会由 MySQL 自己根据数据量确定长度）；
5. ASC 和 DESC：可选参数，ASC 表示升序排列，DESC 表示降序排列，如果不指定，则为升序。

### 已存在的表上创建索引

```sql
CREATE INDEX indexname  
ON tablename (propname [(length)] [ASC|DESC]);  


ALTER TABLE tablename ADD INDEX | KEY indexname  
(propname [(length)] [ASC|DESC]);  
```

### 使用案例

```sql
create table class(
    id int,
    name varchar(128) unique,
    teaccher varchar(64) ,
    index index_no (id desc)
);
```

```sql
create index index_id on class(id asc);

alter table class add index index_id (id asc);
```

## 唯一索引

### 创建表时定义索引

```sql
CREATE TABLE tablename(
    propname1 type1,
    ...
    propnamen typen,
    UNIQUE INDEX | KEY 
    [indexname] (propnamen [(length)] [ ASC | DESC ] ) 
);
```

### 已存在的表上创建索引

```sql
CREATE UNIQUE INDEX indexname  
ON tablename (propname [(length)] [ASC|DESC]);  

ALTER TABLE tablename ADD UNIQUE INDEX | KEY 
indexname (propname [(length)] [ASC|DESC]);  
```

### 使用案例

```sql
create table class (
    id int ,
    name varchar(128),
    teacher varchar(64),
    unique index name_index(name)
);
```

```sql
create table class(
    id int,
    name varchar(128) unique,
    teacher varchar(64),
    unique index name_index (name)
);

## 当我们给某给字段定义了唯一约束时，MySQL为了保证唯一性，便会自动给这个字段添加唯一索引，而之后再手动给这个字段添加唯一索引便是一些多余操作
```

```sql
create unique index name_index on class(name);

alter table class add unique index name_index (name);
```

## 全文索引

### 创建表时定义索引

```sql
CREATE TABLE tablename(
    propname1 type1,
    propname2 type2,
    ...
    propnamen typen,
    FULLTEXT INDEX | KEY
    [indexname] (propnamen [(length)] ) 
);
```

### 已存在的表上创建索引

```sql
CREATE FULLTEXT INDEX indexname
ON tablename(propname [(length)]); 

ALTER TABLE tablename
ADD FULLTEXT INDEX|KEY indexname(propname [(length)]);
```

### 使用案例

```sql
create table class(
    id int,
    name varchar(128) unique,
    teacher varchar(64),
    comment varchar(1024),
    fulltext index index_comm(comment)
);
```

```sql
create fulltext index index_comment on class(comment);

alter table class add fulltext index index_comm(comment);
```

## 多列索引

### 创建表时定义索引

```sql
CREATE TABLE tablename(
    propname1 type1,
    ...
    propnamen typen,
    INDEX | KEY [indexname] (propname1 [(length)] [ ASC | DESC ],
                             propname2 [(length)] [ ASC | DESC ], 
                              ... ...                               
                             propnamen [(length)] [ ASC | DESC ]) 
);
```

### 已存在的表上创建索引

```sql
CREATE INDEX indexname
ON tablename( propname1 [(length)] [ ASC | DESC ],  
              propname2 [(length)] [ ASC | DESC ],   
              ...                          
              propnamen [(length)] [ ASC | DESC ]); 
              


ALTER TABLE tablename
ADD INDEX|KEY indexname(propname1 [(length)] [ ASC | DESC ],  
              			propname2 [(length)] [ ASC | DESC ],              
                        ...                                       
                     	propnamen [(length)] [ ASC | DESC ]); 
```

### 使用案例

```sql
create table class(
    id int,
    name varchar(128) unique,
    teacher varchar(64),
    index index_mult_columns(id asc, teacher)
);
```

```sql
create index index_mult_columns on class(id,teacher);

alter table class add index index_mult_columns(id,teacher);
```
