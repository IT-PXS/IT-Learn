---
title: SpringBoot（6-请求参数和返回结果定义）
tag:
  - SpringBoot
category: Java
description: Spring提供的全局异常处理组件@RestControllerAdvice，结合@ResponseBody自动封装REST异常响应；ResponseBodyAdvice则用于统一拦截控制器返回值，进行数据预处理（如加密/包装）。两者配合可实现API响应的标准化与异常处理的集中化管理，提升代码复用性与一致性。
date: 2025-03-22 12:42:19
---

## @RestControllerAdvice

`@RestControllerAdvice` 是 `Spring Framework` 提供的一个组合注解，专门用于实现 `RESTful API` 的全局异常处理、数据绑定和数据预处理。它是 `@ControllerAdvice` 和 `@ResponseBody` 的组合，简化了 `REST` 异常处理的实现。

### 作用

1. 全局异常处理：集中处理控制器抛出的异常
2. 统一响应格式：确保所有错误响应格式一致
3. 减少重复代码：避免在每个控制器中重复异常处理逻辑
4. REST 专用：专为 `RESTful API` 设计，自动将返回值转为 `JSON/XML`

### 基本使用

```java
@Data
@AllArgsConstructor
public class ErrorResponse {
    private int status;
    
    private String error;
    
    private String message;
    
    private String path;
    
    private LocalDateTime timestamp = LocalDateTime.now();
}
```

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 处理特定异常
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleResourceNotFound(ResourceNotFoundException ex, 
        HttpServletRequest request) {
        log.error("Resource not found: {}", ex.getMessage());
        return new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationErrors(MethodArgumentNotValidException ex,
        HttpServletRequest request) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.toList());
            
        log.error("Validation errors: {}", errors);
        return new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Error",
            errors.toString(),
            request.getRequestURI());
    }

    // 处理所有未明确处理的异常
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleAllExceptions(Exception ex,
        HttpServletRequest request) {
        log.error("Internal server error: {}", ex.getMessage(), ex);
        return new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            "An unexpected error occurred",
            request.getRequestURI());
    }
}
```

### 其他

1. 限定控制器的生效范围

```java
// 只对指定包下的控制器生效
@RestControllerAdvice("com.example.controllers")

// 只对带有特定注解的控制器生效
@RestControllerAdvice(annotations = RestController.class)

// 只对指定的控制器类生效
@RestControllerAdvice(assignableTypes = {UserController.class, ProductController.class})
```

2. 处理数据绑定异常

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
    List<String> errors = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .map(error -> error.getField() + ": " + error.getDefaultMessage())
        .collect(Collectors.toList());
        
    ErrorResponse error = new ErrorResponse(
        HttpStatus.BAD_REQUEST.value(),
        "Validation failed",
        errors.toString());
        
    return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
}
```

3. 处理自定义业务异常

```java
@ExceptionHandler(BusinessException.class)
public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
    ErrorResponse error = new ErrorResponse(
        ex.getErrorCode(),
        ex.getErrorType(),
        ex.getMessage());
        
    return new ResponseEntity<>(error, ex.getHttpStatus());
}
```

## ResponseBodyAdvice

### 作用

`ResponseBodyAdvice` 是 `Spring MVC` 提供的一个增强接口，用于在返回对象被 `HttpMessageConverter` 执行序列化之前对其进行一些自定义的操作。

```java
public interface ResponseBodyAdvice <T> {

    // 用于确定该实现类是否支持对响应体进行处理，通过 returnType 参数可以获取到 Controller 方法的返回类型等信息。
    boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType);

    // 该方法在响应体写入之前被调用，在这个方法中可以通过参数获取到最终要响应给客户端的对象，我们可以对这个对象进行一些操作，最后返回修改后的对象。
    @Nullable
    T beforeBodyWrite(@Nullable T body, MethodParameter returnType, MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request, ServerHttpResponse response);
}
```

1. supports：判断是否要执行 `beforeBodyWrite` 方法，`true` 为执行，`false` 不执行。通过该方法可以选择哪些类或哪些方法的 `response` 要进行处理，其他的不进行处理
2. beforeBodyWrite：对 `response` 方法进行具体操作处理

### 基本使用

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseResponse <T> implements Serializable {
    private int code;
    
    private String msg;
    
    private T data;
}
```

```java
@Component
@Slf4j
@RestControllerAdvice(annotations = {RestController.class}) 
// 通过注解进行过滤哪些请求响应会被拦截，避免错误拦截。
public class ResponseAdvice implements ResponseBodyAdvice {

    /**
     * 我们可以选择哪些方法或者类进入 beforeBodyWrite 方法
     * 从returnType获取类名和方法名，通过returnType.getMethod().getDeclaringClass.getName获取类名
     * converterType 表示当前请求使用的一个数据转换器，根据我们在 controller 指定返回类型决定
     */
    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        log.info(returnType.getMethod().getDeclaringClass().getName());
        log.info(converterType.toString());
        return true;
        // 如果方法上添加了自定义注解@EncodeBody，才对返回对象进行编码
        // return returnType.hasMethodAnnotation(EncodeBody.class);
    }
    
    /**
     * body—请求即将返回给客户端的实体信息
     * body 还可能存在出现异常的情况，需要进行处理
     */
    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType, Class selectedConverterType, ServerHttpRequest request, ServerHttpResponse response) {
        log.info(selectedContentType.getType());
        // jackson 序列化
        ObjectMapper objectMapper = new ObjectMapper();
        // 我们也可以根据 selectConvertorType 的类型进行判断
        if (body instanceof String) {
            try {
                return objectMapper.writeValueAsString(new BaseResponse(0, "操作成功", body));
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
        if (body instanceof Page) {
            HashMap map = new LinkedHashMap();
            map.put("data", ((Page<?>) body).getRecords());
            map.put("current", ((Page<?>) body).getCurrent());
            map.put("size", ((Page<?>) body).getSize());
            map.put("total", ((Page<?>) body).getTotal());
            return new BaseResponse(0, "操作成功", map);
        }
        return new BaseResponse(0, "操作成功", body);
    }
}
```

### 存在问题

返回 `String` 类型的 `ContentType` 是 `"text/plain"`，对应的转换器是 `StringHttpMessageConverter`，由于我们将返回结果都封装成 `BaseResponse` 导致由其转换成 `String` 类型会引发类型错误

解决方法有两个：

1. 设置接口的返回类型

```java
@GetMapping(value = "/ok", produces = "application/json;charset=utf-8")
public String ok() {
    return "ok";
}
```

2. 通过 `SpringBoot` 内置提供 `Jackson` 序列化 `ObjectMapper` 实现实体信息的序列化

```java
ObjectMapper objectMapper = new ObjectMapper();
if (body instanceof String) {
    try {
        return objectMapper.writeValueAsString(new Response(0, "操作成功", body));
    } catch (JsonProcessingException e) {
        e.printStackTrace();
    }
}
```

## 转换器

### 使用枚举为请求参数

```java
@Getter
public enum GenderEnum {
    /**
     * 男
     */
    MALE(0),
    /**
     * 女
     */
    FEMALE(1);
 
    /**
     * 性别编码
     */
    private Integer code;
 
    GenderEnum(int code) {
        this.code = code;
    }
}
```

```java
@Data
public class QueryRequest {
    private GenderEnum gender;
}
```

```java
@Slf4j
@RestController
@RequestMapping("/enum")
public class EnumTestController {
 
    @GetMapping("/get")
    public Dict testGet(QueryRequest request) {
        log.info("【get-request】= {}", JSONUtil.toJsonStr(request));
        return Dict.create().set("get-request", request);
    }
 
    @PostMapping("/post")
    public Dict testPost(@RequestBody QueryRequest request) {
        log.info("【post-request】= {}", JSONUtil.toJsonStr(request));
        return Dict.create().set("post-request", request);
    }
}
```

### 转换器

`gender` 只能接收到 `MALE`、`FEMALE` 这样的参数，除此以外，均会报类型不匹配的错误信息，此时是无法处理 `0`、`1` 这样的参数的

**需求：**

1. 接收到 `MALE`、`FEMALE` 这样的参数，可以自动转为对应的枚举值；
2. 接收到 `0`、`1` 这样的参数，也可以自动转为对应的枚举值

```java
public class IntegerCodeToGenderEnumConverter implements Converter<Integer, GenderEnum> {
    private Map<Integer, GenderEnum> enumMap = Maps.newHashMap();
 
    public IntegerCodeToGenderEnumConverter() {
        for (GenderEnum genderEnum : GenderEnum.values()) {
            enumMap.put(genderEnum.getCode(), genderEnum);
        }
    }
 
    @Override
    public GenderEnum convert(Integer source) {
        GenderEnum genderEnum = enumMap.get(source);
        if (ObjectUtil.isNull(genderEnum)) {
            throw new IllegalArgumentException("无法匹配对应的枚举类型");
        }
        return genderEnum;
    }
}
```

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
 
    /**
     * 枚举类的转换器
     */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new IntegerCodeToGenderEnumConverter());
    }
}
```

### 转换器工厂

```java
public interface BaseEnum {
    /**
     * 获取枚举编码
     *
     * @return 编码
     */
    Integer getCode();
}
```

```java
@Getter
public enum GenderEnum implements BaseEnum {
    /**
     * 男
     */
    MALE(0),
    /**
     * 女
     */
    FEMALE(1);
 
    /**
     * 性别编码
     */
    private Integer code;
 
    GenderEnum(int code) {
        this.code = code;
    }
}
```

```java
public class IntegerToEnumConverter<T extends BaseEnum> implements Converter<Integer, T> {
    private Map<Integer, T> enumMap = Maps.newHashMap();
 
    public IntegerToEnumConverter(Class<T> enumType) {
        T[] enums = enumType.getEnumConstants();
        for (T e : enums) {
            enumMap.put(e.getCode(), e);
        }
    }
 
    @Override
    public T convert(Integer source) {
        T t = enumMap.get(source);
        if (Objects.isNull(t)) {
            throw new IllegalArgumentException("无法匹配对应的枚举类型");
        }
        return t;
    }
}
```

```java
public class IntegerCodeToEnumConverterFactory implements ConverterFactory<Integer, BaseEnum> {
    private static final Map<Class, Converter> CONVERTERS = Maps.newHashMap();
 
    /**
     * 获取一个从 Integer 转化为 T 的转换器，T 是一个泛型，有多个实现
     *
     * @param targetType 转换后的类型
     * @return 返回一个转化器
     */
    @Override
    public <T extends BaseEnum> Converter<Integer, T> getConverter(Class<T> targetType) {
        Converter<Integer, T> converter = CONVERTERS.get(targetType);
        if (converter == null) {
            converter = new IntegerToEnumConverter<>(targetType);
            CONVERTERS.put(targetType, converter);
        }
        return converter;
    }
}
```

```java
public class StringToEnumConverter<T extends BaseEnum> implements Converter<String, T> {
    private Map<String, T> enumMap = Maps.newHashMap();
 
    public StringToEnumConverter(Class<T> enumType) {
        T[] enums = enumType.getEnumConstants();
        for (T e : enums) {
            enumMap.put(e.getCode().toString(), e);
        }
    }
 
    @Override
    public T convert(String source) {
        T t = enumMap.get(source);
        if (Objects.isNull(t)) {
            throw new IllegalArgumentException("无法匹配对应的枚举类型");
        }
        return t;
    }
}
```

```java
public class StringCodeToEnumConverterFactory implements ConverterFactory<String, BaseEnum> {
    private static final Map<Class, Converter> CONVERTERS = Maps.newHashMap();
 
    /**
     * 获取一个从 Integer 转化为 T 的转换器，T 是一个泛型，有多个实现
     *
     * @param targetType 转换后的类型
     * @return 返回一个转化器
     */
    @Override
    public <T extends BaseEnum> Converter<String, T> getConverter(Class<T> targetType) {
        Converter<String, T> converter = CONVERTERS.get(targetType);
        if (converter == null) {
            converter = new StringToEnumConverter<>(targetType);
            CONVERTERS.put(targetType, converter);
        }
        return converter;
    }
}
```

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
 
    /**
     * 枚举类的转换器工厂 addConverterFactory
     */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(new IntegerCodeToEnumConverterFactory());
        registry.addConverterFactory(new StringCodeToEnumConverterFactory());
    }
}
```
