---
title: EasyExcel（2-文件读取详解）
tag: EasyExcel
category: Java
description: EasyExcel 是一款高效、轻量的Excel读写工具，适用于Java环境，广泛用于批量数据处理。本文详细介绍 EasyExcel 的文件读取功能，包括同步读取、异步读取、监听器使用、异常处理、分批处理和事务管理等核心功能。
date: 2024-10-27 12:42:19
---

## 📋 目录

- [读取方式对比](#读取方式对比)
- [同步读取](#同步读取)
  - [读取单个 Sheet](#读取单个-sheet)
  - [读取多个 Sheet（同一对象）](#读取多个-sheet同一对象)
  - [读取多个 Sheet（不同对象）](#读取多个-sheet不同对象)
- [异步读取](#异步读取)
  - [监听器接口](#监听器接口)
  - [异常处理](#异常处理)
  - [读取单个 Sheet](#读取单个-sheet-1)
  - [读取多个 Sheet](#读取多个-sheet)
  - [分批读取](#分批读取)
  - [事务操作](#事务操作)
- [最佳实践](#最佳实践)

## 🔄 读取方式对比

| 读取方式 | 适用场景 | 优点 | 缺点 |
|----------|----------|------|------|
| **同步读取** | 小文件、简单处理 | 代码简单、易于理解 | 内存占用大、处理速度慢 |
| **异步读取** | 大文件、复杂处理 | 内存占用小、处理速度快 | 代码复杂、需要监听器 |

## 📖 同步读取

### 读取单个 Sheet

使用 `doReadSync()` 方法实现同步读取，适用于小文件处理。

**实体类定义**

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

**控制器实现**

```java
@RestController
@RequestMapping("/excel")
public class ExcelReadController {

    /**
     * 同步读取单个 Sheet
     */
    @PostMapping("/uploadFile")
    public ResponseEntity<String> uploadFile(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            List<UserExcel> userExcelList = EasyExcel.read(in)
                    .sheet(0)                    // 读取第一个 sheet
                    .headRowNumber(1)            // 跳过第一行标题
                    .head(UserExcel.class)       // 指定实体类
                    .doReadSync();               // 同步读取
            
            log.info("成功读取 {} 条数据", userExcelList.size());
            return ResponseEntity.ok("读取成功，共 " + userExcelList.size() + " 条数据");
            
        } catch (Exception e) {
            log.error("文件读取失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("文件读取失败：" + e.getMessage());
        }
    }
}
```

### 读取多个 Sheet（同一对象）

使用 `doReadAllSync()` 方法读取所有 Sheet，适用于每个 Sheet 结构相同的情况。

```java
@PostMapping("/uploadFile2")
public ResponseEntity<String> uploadFile2(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        List<UserExcel> userExcelList = EasyExcel.read(in)
                .headRowNumber(1)            // 跳过第一行标题
                .head(UserExcel.class)       // 指定实体类
                .doReadAllSync();            // 读取所有 Sheet
        
        log.info("成功读取 {} 条数据", userExcelList.size());
        return ResponseEntity.ok("读取成功，共 " + userExcelList.size() + " 条数据");
        
    } catch (Exception e) {
        log.error("文件读取失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("文件读取失败：" + e.getMessage());
    }
}
```

### 读取多个 Sheet（不同对象）

当不同 Sheet 结构不同时，需要分别读取每个 Sheet。

> ⚠️ **注意**：一个流对象只能读取一次，重复使用会导致异常。

```java
@PostMapping("/uploadFile4")
public ResponseEntity<String> uploadFile4(MultipartFile file) {
    try {
        // 读取第一个 Sheet
        List<UserExcel> userExcelList1;
        try (InputStream in1 = file.getInputStream()) {
            userExcelList1 = EasyExcel.read(in1)
                    .sheet(0)
                    .headRowNumber(1)
                    .head(UserExcel.class)
                    .doReadSync();
        }

        // 读取第二个 Sheet
        List<UserExcel> userExcelList2;
        try (InputStream in2 = file.getInputStream()) {
            userExcelList2 = EasyExcel.read(in2)
                    .sheet(1)
                    .headRowNumber(1)
                    .head(UserExcel.class)
                    .doReadSync();
        }

        // 合并结果
        List<UserExcel> allData = new ArrayList<>();
        allData.addAll(userExcelList1);
        allData.addAll(userExcelList2);
        
        log.info("成功读取 {} 条数据", allData.size());
        return ResponseEntity.ok("读取成功，共 " + allData.size() + " 条数据");
        
    } catch (Exception e) {
        log.error("文件读取失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("文件读取失败：" + e.getMessage());
    }
}
```

## ⚡ 异步读取

### 监听器接口

EasyExcel 提供了 `ReadListener` 接口和 `AnalysisEventListener` 抽象类来实现异步读取。

**ReadListener 接口**

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

**AnalysisEventListener 抽象类**

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

EasyExcel 提供了两种异常类型来处理不同的错误情况。

#### ExcelDataConvertException

数据转换异常，出现时继续解析文件。

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
}
```

```java
@PostMapping("/uploadFile1")
public ResponseEntity<String> uploadFile1(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        UserExcelListener1 listener = new UserExcelListener1();
        EasyExcel.read(in, listener)
                .sheet(0)
                .headRowNumber(1) // 第一行是标题，从第二行开始读取
                .doRead();
        
        return ResponseEntity.ok("异步读取完成");
        
    } catch (Exception e) {
        log.error("文件读取失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("文件读取失败：" + e.getMessage());
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
}
```

```java
@PostMapping("/uploadFile5")
public ResponseEntity<String> uploadFile5(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        UserExcelListener listener = new UserExcelListener();
        EasyExcel.read(in, UserExcel.class, listener)
                .sheet(0)
                .headRowNumber(1) // 第一行是标题，从第二行开始读取
                .doRead();
        
        return ResponseEntity.ok("异步读取完成");
        
    } catch (Exception e) {
        log.error("文件读取失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("文件读取失败：" + e.getMessage());
    }
}
```

### 读取多个 Sheet

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
}
```

```java
@PostMapping("/uploadFile6")
public ResponseEntity<String> uploadFile6(MultipartFile file) {
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
        
        return ResponseEntity.ok("多 Sheet 异步读取完成");
        
    } catch (Exception e) {
        log.error("文件读取失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("文件读取失败：" + e.getMessage());
    }
}
```

### 分批读取

使用线程池进行分批处理，避免内存消耗，加快文件解析入库。

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
public ResponseEntity<String> uploadFile7(MultipartFile file) {
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
        
        // 关闭线程池
        executor.shutdown();
        
        return ResponseEntity.ok("分批处理完成");
        
    } catch (Exception e) {
        log.error("文件读取失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("文件读取失败：" + e.getMessage());
    }
}
```

### 事务操作

当使用监听器读取文件数据时，由于监听器不被 Spring 管理，无法使用 `@Transactional` 注解。可以通过构造器传入事务管理器来手动管理事务。

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

## 💡 最佳实践

### 1. 读取方式选择

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 小文件（< 1MB） | 同步读取 | 简单快速，代码清晰 |
| 大文件（> 1MB） | 异步读取 | 内存占用小，性能更好 |
| 需要实时处理 | 异步读取 | 支持流式处理 |
| 批量导入 | 分批读取 | 避免内存溢出 |

### 2. 性能优化建议

- **合理设置批处理大小**：根据内存和数据库性能调整 `BATCH_SIZE`
- **使用线程池**：避免频繁创建线程，提高并发性能
- **及时清理数据**：处理完数据后及时清理，避免内存泄漏
- **异常处理**：合理处理异常，避免程序中断

### 3. 代码示例

**完整的文件上传控制器**

```java
@RestController
@RequestMapping("/excel")
@Slf4j
public class ExcelUploadController {

    @Autowired
    private UserService userService;

    /**
     * 文件上传并读取
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            // 文件验证
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("文件不能为空"));
            }

            String fileName = file.getOriginalFilename();
            if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("只支持 Excel 文件"));
            }

            // 根据文件大小选择读取方式
            if (file.getSize() < 1024 * 1024) { // 小于 1MB
                return syncRead(file);
            } else {
                return asyncRead(file);
            }

        } catch (Exception e) {
            log.error("文件上传处理失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("文件处理失败：" + e.getMessage()));
        }
    }

    /**
     * 同步读取
     */
    private ResponseEntity<ApiResponse<String>> syncRead(MultipartFile file) throws IOException {
        try (InputStream in = file.getInputStream()) {
            List<UserExcel> userExcelList = EasyExcel.read(in)
                    .sheet(0)
                    .headRowNumber(1)
                    .head(UserExcel.class)
                    .doReadSync();

            // 保存到数据库
            userService.saveBatch(userExcelList);

            return ResponseEntity.ok(ApiResponse.success("同步读取完成，共处理 " + userExcelList.size() + " 条数据"));
        }
    }

    /**
     * 异步读取
     */
    private ResponseEntity<ApiResponse<String>> asyncRead(MultipartFile file) throws IOException {
        try (InputStream in = file.getInputStream()) {
            UserExcelListener listener = new UserExcelListener();
            EasyExcel.read(in, UserExcel.class, listener)
                    .sheet(0)
                    .headRowNumber(1)
                    .doRead();

            return ResponseEntity.ok(ApiResponse.success("异步读取完成"));
        }
    }
}

/**
 * API 响应封装
 */
@Data
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "操作成功", data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

通过以上优化，文档现在具有更好的结构、更清晰的示例和更实用的最佳实践指导。

