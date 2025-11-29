---
title: EasyExcel（2-文件读取）
tag: EasyExcel
category: Java
description: EasyExcel 是一款高效、轻量的Excel读写工具，适用于Java环境，广泛用于批量数据处理。本文详细介绍 EasyExcel 的文件读取功能，包括同步读取、异步读取、监听器使用、异常处理、分批处理和事务管理等核心功能。
date: 2024-10-27 12:42:19
---

## 读取方式对比

| 读取方式 | 适用场景 | 优点 | 缺点 |
|----------|----------|------|------|
| **同步读取** | 小文件、简单处理 | 代码简单、易于理解 | 内存占用大、处理速度慢 |
| **异步读取** | 大文件、复杂处理 | 内存占用小、处理速度快 | 代码复杂、需要监听器 |

## 同步读取

### 读取单个 Sheet

1. 通过 `sheet()` 方法指定对应的 Sheet 名称或下标读取文件信息
2. 使用 `doReadSync()` 方法实现同步读取，适用于小文件处理。


```java
@Data
public class UserExcel {
    @ExcelIgnore
    private Integer id;

    @ExcelProperty(index = 0, value = "姓名")
    private String name;

    @ExcelProperty(index = 1, value = "年龄")
    private Integer age;

    @DateTimeFormat(value = "yyyy-MM-dd")
    @ExcelProperty(index = 2, value = "出生日期")
    private Date birthday;
}
```


```java
@RestController
@RequestMapping("/excel")
public class ExcelReadController {

    /**
     * 同步读取单个 Sheet
     */
    @PostMapping("/uploadFile")
    public void uploadFile(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            List<UserExcel> userExcelList = EasyExcel.read(in)
                    .sheet(0)                    // 读取第一个 sheet
                    .headRowNumber(1)            // 跳过第一行标题
                    .head(UserExcel.class)       // 指定实体类
                    .doReadSync();               // 同步读取
            
            for (UserExcel userExcel : userExcelList) {
                System.out.println(userExcel);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 读取多个 Sheet（同一对象）

使用 `doReadAllSync()` 方法读取所有 Sheet，适用于每个 Sheet 对象结构相同的情况。

```java
@PostMapping("/uploadFile2")
public void uploadFile2(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        List<UserExcel> userExcelList = EasyExcel.read(in)
                .headRowNumber(1)            // 跳过第一行标题
                .head(UserExcel.class)       // 指定实体类
                .doReadAllSync();            // 读取所有 Sheet
        
        log.info("成功读取 {} 条数据", userExcelList.size());
        for (UserExcel userExcel : userExcelList) {
            System.out.println(userExcel);
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### 读取多个 Sheet（不同对象）

当不同 Sheet 结构不同时，使用 `doReadAllSync` 方法无法指定每个 Sheet 的对象，需要分别读取每个 Sheet 进行解析。

> ⚠️ **注意**：依次读取 Sheet 会出现重复读取流对象的情况，一个流对象只能读取一次，重复使用会导致异常。

```java
@PostMapping("/uploadFile4")
public void uploadFile4(MultipartFile file) {
    InputStream in = null;
    try {
        in = file.getInputStream();
        List<UserExcel> userExcelList1 = EasyExcel.read(in)
                // 读取第一个 sheet
                .sheet(0)
                // 如果第一行才是标题，第二行是数据，从第二行开始读取
                .headRowNumber(1)
                .head(UserExcel.class)
                .doReadSync();

        in = file.getInputStream();
        List<UserExcel> userExcelList2 = EasyExcel.read(in)
                // 读取第二个 sheet
                .sheet(1)
                // 如果第一行才是标题，第二行是数据，从第二行开始读取
                .headRowNumber(1)
                .head(UserExcel.class)
                .doReadSync();

        List<UserExcel> userExcelList = new ArrayList<>();
        userExcelList.addAll(userExcelList1);
        userExcelList.addAll(userExcelList2);
        for (UserExcel userExcel : userExcelList) {
            System.out.println(userExcel);
        }
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        try {
            if (in != null) {
                in.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

## 异步读取

### 监听器接口

EasyExcel 提供了 `ReadListener` 接口和 `AnalysisEventListener` 抽象类来实现异步读取。

#### ReadListener 接口

```java
public interface ReadListener<T> extends Listener {
    
    /**
     * 异常处理：转换异常或其他异常时调用
     * 抛出异常则停止读取，不抛出则继续读取下一行
     */
    default void onException(Exception exception, AnalysisContext context) throws Exception {
        throw exception;
    }

    /**
     * 获取表头数据
     */
    default void invokeHead(Map<Integer, ReadCellData<?>> headMap, AnalysisContext context) {}

    /**
     * 逐行读取表格内容
     */
    void invoke(T data, AnalysisContext context);

    /**
     * 读取额外信息：批注、超链接、合并单元格等
     */
    default void extra(CellExtra extra, AnalysisContext context) {}

    /**
     * 读取完成后的操作
     */
    void doAfterAllAnalysed(AnalysisContext context);

    /**
     * 是否还有数据
     */
    default boolean hasNext(AnalysisContext context) {
        return true;
    }
}
```

#### AnalysisEventListener 抽象类

```java
public abstract class AnalysisEventListener<T> implements ReadListener<T> {

    /**
     * 解析表头数据
     */
    @Override
    public void invokeHead(Map<Integer, ReadCellData<?>> headMap, AnalysisContext context) {
        invokeHeadMap(ConverterUtils.convertToStringMap(headMap, context), context);
    }

    /**
     * 表头数据处理（可重写）
     */
    public void invokeHeadMap(Map<Integer, String> headMap, AnalysisContext context) {}
}
```

### 异常处理


#### ExcelDataConvertException

数据转换异常，出现该异常时会继续解析文件信息。

```java
@Getter
@Setter
@EqualsAndHashCode
public class ExcelDataConvertException extends ExcelRuntimeException {

    private Integer rowIndex;        // 行索引
    private Integer columnIndex;     // 列索引
    private CellData<?> cellData;    // 单元格数据
    private ExcelContentProperty excelContentProperty; // 内容属性

    public ExcelDataConvertException(Integer rowIndex, Integer columnIndex, CellData<?> cellData,
        ExcelContentProperty excelContentProperty, String message) {
        super(message);
        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
        this.cellData = cellData;
        this.excelContentProperty = excelContentProperty;
    }

    public ExcelDataConvertException(Integer rowIndex, Integer columnIndex, CellData<?> cellData,
        ExcelContentProperty excelContentProperty, String message, Throwable cause) {
        super(message, cause);
        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
        this.cellData = cellData;
        this.excelContentProperty = excelContentProperty;
    }
}
```

#### ExcelAnalysisStopException

非数据转换异常，抛出后停止解析。

```java
public class ExcelAnalysisStopException extends ExcelAnalysisException {

    public ExcelAnalysisStopException() {}

    public ExcelAnalysisStopException(String message) {
        super(message);
    }

    public ExcelAnalysisStopException(String message, Throwable cause) {
        super(message, cause);
    }

    public ExcelAnalysisStopException(Throwable cause) {
        super(cause);
    }
}
```

### 读取单个 Sheet

#### 不指定对象（Map 格式）

```java
public class UserExcelListener1 extends AnalysisEventListener<Map<Integer, String>> {
    
    private static final Logger log = LoggerFactory.getLogger(UserExcelListener1.class);
    private List<Map<Integer, String>> userExcelList = new ArrayList<>();

    @Override
    public void invoke(Map<Integer, String> map, AnalysisContext analysisContext) {
        log.info("解析到一条数据: {}", JSON.toJSONString(map));
        userExcelList.add(map);
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        log.info("已解析完所有数据，共 {} 条", userExcelList.size());
        // 处理完成后清理数据
        userExcelList.clear();
    }

    @Override
    public void onException(Exception exception, AnalysisContext context) throws Exception {
        if (exception instanceof ExcelDataConvertException) {
            ExcelDataConvertException convertException = (ExcelDataConvertException) exception;
            Integer row = convertException.getRowIndex();
            log.error("第 {} 行数据转换失败，异常信息：{}", row, exception.getMessage());
        } else {
            log.error("导入其他异常信息：{}", exception.getMessage());
        }
    }

    public List<Map<Integer, String>> getUserExcelList() {
        return userExcelList;
    }

    public void setUserExcelList(List<Map<Integer, String>> userExcelList) {
        this.userExcelList = userExcelList;
    }
}
```

```java
@PostMapping("/uploadFile1")
public void uploadFile1(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        UserExcelListener1 listener = new UserExcelListener1();
        EasyExcel.read(in, listener)
                .sheet(0)
                .headRowNumber(1) // 第一行是标题, 从第二行开始读取
                .doRead();
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

#### 指定对象

```java
public class UserExcelListener extends AnalysisEventListener<UserExcel> {
    
    private static final Logger log = LoggerFactory.getLogger(UserExcelListener.class);
    private List<UserExcel> userExcelList = new ArrayList<>();

    @Override
    public void invoke(UserExcel userExcel, AnalysisContext analysisContext) {
        log.info("解析到一条数据: {}", JSON.toJSONString(userExcel));
        userExcelList.add(userExcel);
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        log.info("已解析完所有数据，共 {} 条", userExcelList.size());
        // 处理完成后清理数据
        userExcelList.clear();
    }

    @Override
    public void onException(Exception exception, AnalysisContext context) throws Exception {
        if (exception instanceof ExcelDataConvertException) {
            ExcelDataConvertException convertException = (ExcelDataConvertException) exception;
            Integer row = convertException.getRowIndex();
            log.error("第 {} 行数据转换失败，异常信息：{}", row, exception.getMessage());
        } else {
            log.error("导入其他异常信息：{}", exception.getMessage());
        }
    }

    public List<UserExcel> getUserExcelList() {
        return userExcelList;
    }

    public void setUserExcelList(List<UserExcel> userExcelList) {
        this.userExcelList = userExcelList;
    }
}
```

```java
@PostMapping("/uploadFile5")
public void uploadFile5(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        UserExcelListener listener = new UserExcelListener();
        EasyExcel.read(in, UserExcel.class, listener)
                .sheet(0)
                .headRowNumber(1) // 第一行是标题, 从第二行开始读取
                .doRead();
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### 读取多个 Sheet

1. 获取 Sheet 的总数，通过循环遍历的方式指定每个 Sheet 的监听器进行解析
2. 使用构造器的方式传入 Sheet 对应的下标，在抛出异常时获取 SheetNo 和对应的行号，方便进行排查


```java
public class UserExcelListener2 extends AnalysisEventListener<UserExcel> {
    
    private static final Logger log = LoggerFactory.getLogger(UserExcelListener2.class);
    private Integer sheetNo;
    private List<UserExcel> userExcelList = new ArrayList<>();

    public UserExcelListener2(Integer sheetNo) {
        this.sheetNo = sheetNo;
    }

    @Override
    public void invoke(UserExcel userExcel, AnalysisContext analysisContext) {
        log.info("Sheet {} 解析到一条数据: {}", sheetNo, JSON.toJSONString(userExcel));
        userExcelList.add(userExcel);
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        log.info("Sheet {} 已解析完所有数据，共 {} 条", sheetNo, userExcelList.size());
        userExcelList.clear();
    }

    @Override
    public void onException(Exception exception, AnalysisContext context) throws Exception {
        if (exception instanceof ExcelDataConvertException) {
            ExcelDataConvertException convertException = (ExcelDataConvertException) exception;
            Integer row = convertException.getRowIndex();
            log.error("Sheet {}，第 {} 行数据转换失败，异常信息：{}", 
                     sheetNo, row, exception.getMessage());
        } else {
            log.error("Sheet {} 导入其他异常信息：{}", sheetNo, exception.getMessage());
        }
    }

    public List<UserExcel> getUserExcelList() {
        return userExcelList;
    }

    public void setUserExcelList(List<UserExcel> userExcelList) {
        this.userExcelList = userExcelList;
    }
}
```

```java
@PostMapping("/uploadFile6")
public void uploadFile6(MultipartFile file) {
    try (InputStream in = file.getInputStream();
         ExcelReader build = EasyExcel.read(in).build()) {
        
        List<ReadSheet> readSheets = build.excelExecutor().sheetList();
        log.info("检测到 {} 个 Sheet", readSheets.size());
        
        for (int i = 0, len = readSheets.size(); i < len; i++) {
            UserExcelListener2 listener = new UserExcelListener2(i);
            ReadSheet sheet = EasyExcel.readSheet(readSheets.get(i).getSheetNo())
                    .head(UserExcel.class)
                    .headRowNumber(1)
                    .registerReadListener(listener)
                    .build();
            build.read(sheet);
        }
        build.finish();
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### 分批读取

使用线程池进行分批处理，避免内存消耗，加快文件解析入库。

1. 使用构造器的方式传入 Sheet 对应的下标和自定义线程池，使用这种分批处理的方式，避免内存的消耗，加快文件的解析入库
2. 数据库入库时可以使用 MySQL 的批量插入语法，同时指定每次插入数据的大小，相较于 MyBatisPlus 的批量插入方法较快


```java
/**
 * 分批处理监听器
 * 注意：UserListener 不能被 Spring 管理，每次读取 Excel 都要 new
 * 如果需要使用 Spring 管理的服务，可以通过构造方法传入
 */
public class UserExcelListener3 extends AnalysisEventListener<UserExcel> {

    private static final Logger log = LoggerFactory.getLogger(UserExcelListener3.class);
    private static final Integer BATCH_SIZE = 1000;

    private Integer sheetNo;
    private Executor executor;
    private List<UserExcel> userExcelList = new ArrayList<>();

    public UserExcelListener3(Integer sheetNo, Executor executor) {
        this.sheetNo = sheetNo;
        this.executor = executor;
    }

    @Override
    public void invoke(UserExcel userExcel, AnalysisContext analysisContext) {
        log.debug("Sheet {} 解析到一条数据: {}", sheetNo, JSON.toJSONString(userExcel));
        userExcelList.add(userExcel);
        
        // 达到批处理大小时，异步处理数据
        if (userExcelList.size() >= BATCH_SIZE) {
            List<UserExcel> userExcels = BeanUtil.copyToList(userExcelList, UserExcel.class);
            CompletableFuture.runAsync(() -> {
                // 业务操作：保存到数据库
                saveToDB(userExcels);
            }, executor);
            userExcelList.clear();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        log.info("Sheet {} 已解析完所有数据", sheetNo);
        
        // 处理剩余数据
        if (!userExcelList.isEmpty()) {
            List<UserExcel> userExcels = BeanUtil.copyToList(userExcelList, UserExcel.class);
            CompletableFuture.runAsync(() -> {
                // 业务操作：保存到数据库
                saveToDB(userExcels);
            }, executor);
            userExcelList.clear();
        }
    }

    @Override
    public void onException(Exception exception, AnalysisContext context) throws Exception {
        if (exception instanceof ExcelDataConvertException) {
            ExcelDataConvertException convertException = (ExcelDataConvertException) exception;
            Integer row = convertException.getRowIndex();
            log.error("Sheet {}，第 {} 行数据转换失败，异常信息：{}", 
                     sheetNo, row, exception.getMessage());
        } else {
            log.error("Sheet {} 导入其他异常信息：{}", sheetNo, exception.getMessage());
        }
    }

    /**
     * 保存数据到数据库
     */
    private void saveToDB(List<UserExcel> userExcels) {
        try {
            log.info("开始保存 {} 条数据到数据库", userExcels.size());
            // TODO: 实现数据库保存逻辑
            // userService.saveBatch(userExcels);
            log.info("数据保存完成");
        } catch (Exception e) {
            log.error("数据保存失败", e);
        }
    }
}
```

```java
@PostMapping("/uploadFile7")
public void uploadFile7(MultipartFile file) {
    try (InputStream in = file.getInputStream();
         ExcelReader build = EasyExcel.read(in).build()) {

        // 创建线程池
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            10, 20, 60L, TimeUnit.MILLISECONDS, 
            new ArrayBlockingQueue<>(1000), 
            new ThreadPoolExecutor.AbortPolicy()
        );

        List<ReadSheet> readSheets = build.excelExecutor().sheetList();
        log.info("检测到 {} 个 Sheet，开始分批处理", readSheets.size());
        
        for (int i = 0, len = readSheets.size(); i < len; i++) {
            UserExcelListener3 listener = new UserExcelListener3(i, executor);
            ReadSheet sheet = EasyExcel.readSheet(readSheets.get(i).getSheetNo())
                    .head(UserExcel.class)
                    .headRowNumber(1)
                    .registerReadListener(listener)
                    .build();
            build.read(sheet);
        }
        build.finish();
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### 事务操作

当使用监听器读取文件数据时，由于监听器不被 Spring 管理，无法使用 `@Transactional` 注解。可以通过构造器传入事务管理器来手动管理事务，手动提交和回滚事务。

```java
@Slf4j
public class TestDataListener extends AnalysisEventListener<Test> {
    
    private static final int BATCH_COUNT = 5;
    private List<Test> list = new ArrayList<>();

    // 事务管理相关
    private DataSourceTransactionManager dataSourceTransactionManager;
    private DefaultTransactionDefinition transactionDefinition;
    private TransactionStatus transactionStatus = null;
    private TestService testService;

    public TestDataListener(TestService testService,
                            DataSourceTransactionManager dataSourceTransactionManager,
                            TransactionDefinition transactionDefinition) {
        this.testService = testService;
        this.dataSourceTransactionManager = dataSourceTransactionManager;
        this.transactionDefinition = new DefaultTransactionDefinition(transactionDefinition);
        
        // 设置事务隔离级别：未提交读写
        this.transactionDefinition.setIsolationLevel(TransactionDefinition.ISOLATION_READ_UNCOMMITTED);
        
        // 手动开启事务
        this.transactionStatus = dataSourceTransactionManager.getTransaction(transactionDefinition);
    }

    @Override
    public void invoke(Test data, AnalysisContext context) {
        log.info("解析到一条数据: {}", JSON.toJSONString(data));
        
        // 检查事务状态
        boolean hasCompleted = transactionStatus.isCompleted();
        if (hasCompleted) {
            log.warn("事务已关闭，跳过数据处理");
            return;
        }
        
        list.add(data);
        if (list.size() >= BATCH_COUNT) {
            saveData();
            list.clear();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        // 判断事务是否已被处理
        boolean hasCompleted = transactionStatus.isCompleted();
        if (hasCompleted) {
            return;
        }
        
        saveData();
        log.info("所有数据解析完成！");
        
        if (!hasCompleted) {
            // 提交事务
            dataSourceTransactionManager.commit(transactionStatus);
            log.info("事务已提交");
        }
    }

    @Override
    public void onException(Exception exception, AnalysisContext context) throws Exception {
        log.error("导入过程中出现异常", exception);
        log.info("异常前事务状态：{}", transactionStatus.isCompleted());
        
        // 回滚事务
        dataSourceTransactionManager.rollback(transactionStatus);
        log.info("异常后事务状态：{}", transactionStatus.isCompleted());
        
        throw exception;
    }
    
    /**
     * 保存数据到数据库
     */
    private void saveData() {
        log.info("开始存储 {} 条数据到数据库", list.size());
        if (!CollectionUtils.isEmpty(list)) {
            testService.saveBatch(list);
            log.info("数据存储成功");
        }
        // TODO: 测试事务，如有需要可以打开注释
        // int a = 1/0;
    }
}
```