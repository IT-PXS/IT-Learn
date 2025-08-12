---
title: Easyexcel（3-文件导出）
tag: EasyExcel
category: Java
description: EasyExcel 是一个便捷、高效的Excel读写库，尤其在大数据量的文件导出场景中表现出色。其核心优势在于减少内存占用和提升数据处理速度，适合用于Java项目中大批量数据的导出。
date: 2024-10-27 18:42:19
---

## 响应头设置

通过设置文件导出的响应头，可以自定义文件导出的名字信息等

```java
//编码格式为UTF-8
response.setCharacterEncoding("UTF-8");

//让服务器告诉浏览器它发送的数据属于excel文件类型
response.setContentType("application/vnd.ms-excel;charset=UTF-8");

//描述内容在传输过程中的编码格式，BINARY可能不止包含非ASCII字符，还可能不是一个短行（超过1000字符）。
response.setHeader("Content-Transfer-Encoding", "binary");

//must-revalidate：强制页面不缓存，post-check=0, pre-check=0：0秒后，在显示给用户之前，该对象被选中进行更新过
response.setHeader("Cache-Control", "must-revalidate, post-check=0, pre-check=0");

//表示响应可能是任何缓存的，即使它只是通常是非缓存或可缓存的仅在非共享缓存中
response.setHeader("Pragma", "public");

//告诉浏览器这个文件的名字和类型，attachment：作为附件下载；inline：直接打开
response.setHeader("Content-Disposition", "attachment;filename=" + fileName + ".xls");
```

## 写入单个Sheet

### 一次性写入数据

指定导出内容所对应的对象信息，通过doWrite写入数据

注意：doWrite方法必须传入的是集合

```java
@Data
public class User {

    @ExcelProperty(value = "用户Id")
    private Integer userId;

    @ExcelProperty(value = "姓名")
    private String name;

    @ExcelProperty(value = "手机")
    private String phone;

    @ExcelProperty(value = "邮箱")
    private String email;

    @ExcelProperty(value = "创建时间")
    private Date createTime;
}
```

```java
@GetMapping("/download1")
public void download1(HttpServletResponse response) {
    try {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        // 这里URLEncoder.encode可以防止中文乱码 当然和easyexcel没有关系
        String fileName = URLEncoder.encode("测试", "UTF-8").replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename=" + fileName + ".xls");

        User user = new User();
        user.setUserId(123);
        user.setName("as");
        user.setPhone("15213");
        user.setEmail("5456");
        user.setCreateTime(new Date());
        EasyExcel.write(response.getOutputStream(), User.class)
                .sheet("模板")
                .doWrite(Arrays.asList(user));
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### 分批写入数据

```java
@GetMapping("/download2")
public void download2(HttpServletResponse response) {
    ExcelWriter excelWriter = null;
    try {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        // 这里URLEncoder.encode可以防止中文乱码 当然和easyexcel没有关系
        String fileName = URLEncoder.encode("测试", "UTF-8").replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename=" + fileName + ".xls");

        User user = new User();
        user.setUserId(123);
        user.setName("as");
        user.setPhone("15213");
        user.setEmail("5456");
        user.setCreateTime(new Date());

        excelWriter = EasyExcel.write(response.getOutputStream(), User.class).build();
        WriteSheet writeSheet = EasyExcel.writerSheet("测试").build();

        // 业务逻辑处理，分页查询
        excelWriter.write(Arrays.asList(user), writeSheet);
        excelWriter.write(Arrays.asList(user), writeSheet);
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        if (excelWriter != null) {
            excelWriter.finish();
        }
    }
}
```

通过WriteSheet对象可以指定要写入的Sheet，通过上面方式我们可以手工控制流的关闭，这样我们就可以实现多次写。可以实现分页查询获取数据，然后将数据写入Excel中，避免一次性加载的数据过多，导致内存溢出

在使用excelWriter.write方式时务必保证至少执行一次write，这样是为了将sheet和表头写入excel，否则打开excel时会报错。write的第一个参数可以为null

### 导出表头自定义

使用注解的方式定义表头时不能动态控制，每次修改表头内容时只能重新修改代码，这时可以通过head方法动态传参自定义表头

注意：内容结构必须是List<List\<T>>，如果使用List\<T>会出现问题

```java
@GetMapping("/download3")
public void download3(HttpServletResponse response) {
    ExcelWriter excelWriter = null;
    try {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        // 这里URLEncoder.encode可以防止中文乱码 当然和easyexcel没有关系
        String fileName = URLEncoder.encode("测试", "UTF-8").replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename=" + fileName + ".xls");

        User user = new User();
        user.setUserId(123);
        user.setName("as");
        user.setPhone("15213");
        user.setEmail("5456");
        user.setCreateTime(new Date());

        List<List<String>> heads = new ArrayList<>();
        heads.add(Arrays.asList("姓名"));
        heads.add(Arrays.asList("年龄"));
        heads.add(Arrays.asList("地址"));
        excelWriter = EasyExcel.write(response.getOutputStream()).head(heads).build();
        WriteSheet writeSheet = EasyExcel.writerSheet("测试").build();
        excelWriter.write(Arrays.asList(user), writeSheet);
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        if (excelWriter != null) {
            excelWriter.finish();
        }
    }
}
```

![](Easyexcel（3-文件导出）/1.png)

### 导出内容自定义

当导出的内容不是某个固定的实体类时，希望导出不同的内容时可以通过List<List\<String>>自定义要写入的内容

```java
@GetMapping("/download5")
public void download5(HttpServletResponse response) {
    ExcelWriter excelWriter = null;
    try {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        // 这里URLEncoder.encode可以防止中文乱码 当然和easyexcel没有关系
        String fileName = URLEncoder.encode("测试", "UTF-8").replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename=" + fileName + ".xls");

        List<List<String>> heads = new ArrayList<>();
        heads.add(Arrays.asList("姓名"));
        heads.add(Arrays.asList("年龄"));
        heads.add(Arrays.asList("地址"));
        excelWriter = EasyExcel.write(response.getOutputStream()).head(heads).build();
        WriteSheet writeSheet = EasyExcel.writerSheet("测试").build();

        List<List<String>> dataList = new ArrayList<>();
        dataList.add(Arrays.asList("张三", "18", "上海"));
        dataList.add(Arrays.asList("李四", "28"));
        excelWriter.write(dataList, writeSheet);
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        if (excelWriter != null) {
            excelWriter.finish();
        }
    }
}
```

![](Easyexcel（3-文件导出）/2.png)

### 写入多个表头

若业务需求要求在同一个Sheet中写多个表，就需要用到WriteTable了。只定义一个WriteSheet，有几个表就定义几个WriteTable即可

```java
@GetMapping("/download4")
public void download4(HttpServletResponse response) {
    ExcelWriter excelWriter = null;
    try {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        // 这里URLEncoder.encode可以防止中文乱码 当然和easyexcel没有关系
        String fileName = URLEncoder.encode("测试", "UTF-8").replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename=" + fileName + ".xls");

        User user = new User();
        user.setUserId(123);
        user.setName("as");
        user.setPhone("15213");
        user.setEmail("5456");
        user.setCreateTime(new Date());

        excelWriter = EasyExcel.write(response.getOutputStream()).build();
        WriteSheet writeSheet = EasyExcel.writerSheet("测试").build();

        List<List<String>> heads1 = new ArrayList<>();
        heads1.add(Arrays.asList("姓名"));
        heads1.add(Arrays.asList("年龄"));
        heads1.add(Arrays.asList("地址"));
        WriteTable writeTable1 = EasyExcel.writerTable(1).head(heads1).needHead(true).build();

        List<List<String>> heads2 = new ArrayList<>();
        heads2.add(Arrays.asList("姓名"));
        heads2.add(Arrays.asList("年龄"));
        heads2.add(Arrays.asList("地址"));
        heads2.add(Arrays.asList("出生日期"));
        WriteTable writeTable2 = EasyExcel.writerTable(2).head(heads2).needHead(true).build();

        excelWriter.write(Arrays.asList(user), writeSheet, writeTable1);
        excelWriter.write(Arrays.asList(user), writeSheet, writeTable2);
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        if (excelWriter != null) {
            excelWriter.finish();
        }
    }
}
```

![](Easyexcel（3-文件导出）/3.png)

## 写入多个Sheet

通过EasyExcel.writerSheet创建对应的sheet，然后在写入sheet时指定对应的WriteSheet即可，同时可指定每个Sheet对应的对象

```java
@GetMapping("/download6")
public void download6(HttpServletResponse response) {
    ExcelWriter excelWriter = null;
    try {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        // 这里URLEncoder.encode可以防止中文乱码 当然和easyexcel没有关系
        String fileName = URLEncoder.encode("测试", "UTF-8").replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename=" + fileName + ".xls");

        List<List<String>> heads = new ArrayList<>();
        heads.add(Arrays.asList("姓名"));
        heads.add(Arrays.asList("年龄"));
        heads.add(Arrays.asList("地址"));
        excelWriter = EasyExcel.write(response.getOutputStream()).head(heads).build();

        WriteSheet writeSheet1 = EasyExcel.writerSheet(0, "测试1").build();
        WriteSheet writeSheet2 = EasyExcel.writerSheet(1, "测试2").build();
        User user = new User();
        user.setUserId(123);
        user.setName("as");
        user.setPhone("15213");
        user.setEmail("5456");
        user.setCreateTime(new Date());
        excelWriter.write(Arrays.asList(user), writeSheet1);
        excelWriter.write(Arrays.asList(user), writeSheet2);
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        if (excelWriter != null) {
            excelWriter.finish();
        }
    }
}
```

![](Easyexcel（3-文件导出）/4.png)