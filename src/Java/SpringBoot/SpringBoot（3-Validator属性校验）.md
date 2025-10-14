---
title: SpringBoot（3-Validator属性校验）
tag:
  - SpringBoot
category: Java
description: Spring Validation 通过 @Valid 和 @Validated 结合 javax.validation 注解（如 @NotNull、@Size、@Pattern）实现数据校验，支持自定义校验器。常用于参数校验、表单验证，可结合全局异常处理提高健壮性，适用于Spring MVC和Spring Boot。
date: 2025-03-19 12:42:19
---

## 依赖

Java API 规范（JSR 303）定义了 Bean 校验的标准 `validation-api`，但没有提供实现。`Hibernate Validator` 是对这个规范的实现，并增加了校验注解如 `@Email`、`@Length` 等。Spring Validation 是对 `Hibernate Validator` 的二次封装，用于支持 Spring MVC 参数自动校验

如果 spring-boot 版本小于 2.3.x，`spring-boot-starter-web` 会自动传入 `hibernate-validator` 依赖。如果 spring-boot 版本大于 2.3.x，则需要手动引入依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<!--<dependency>-->
<!--    <groupId>org.hibernate</groupId>-->
<!--    <artifactId>hibernate-validator</artifactId>-->
<!--    <version>6.0.1.Final</version>-->
<!--</dependency>-->
```

## 常用注解

| 注解                                         | 返回值                                                       | 功能                                                         |
| -------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| @AssertFalse                                 | Boolean, boolean                                              | 验证注解的元素值是 false                                      |
| @AssertTrue                                  | Boolean, boolean                                              | 验证注解的元素值是 true                                       |
| @NotNull                                     | 任意类型                                                     | 验证注解的元素值不是 null                                     |
| @Null                                        | 任意类型                                                     | 验证注解的元素值是 null                                       |
| @Min(value = 值)                               | BigDecimal，BigInteger, byte, short, int, long，等任何 Number 或 CharSequence（存储的是数字）子类型 | 验证注解的元素值大于等于@Min 指定的 value 值                    |
| @Max（value = 值）                             | 和@Min 要求一样                                               | 验证注解的元素值小于等于@Max 指定的 value 值                    |
| @DecimalMin(value = 值)                        | 和@Min 要求一样                                               | 验证注解的元素值大于等于@ DecimalMin 指定的 value 值            |
| @DecimalMax(value = 值)                        | 和@Min 要求一样                                               | 验证注解的元素值小于等于@ DecimalMax 指定的 value 值            |
| @Digits(integer = 整数位数, fraction = 小数位数) | 和@Min 要求一样                                               | 验证注解的元素值的整数位数和小数位数上限                     |
| @Size(min = 下限, max = 上限)                    | 字符串、Collection、Map、数组等                              | 验证注解的元素值的在 min 和 max（包含）指定区间之内，如字符长度、集合大小 |
| @Past                                        | java.util.Date, java.util.Calendar; Joda Time 类库的日期类型    | 验证注解的元素值（日期类型）比当前时间早                     |
| @Future                                      | 与@Past 要求一样                                              | 验证注解的元素值（日期类型）比当前时间晚                     |
| @NotBlank                                    | CharSequence 子类型                                           | 验证注解的元素值不为空（不为 null、去除首位空格后长度为 0），不同于@NotEmpty，@NotBlank 只应用于字符串且在比较时会去除字符串的首位空格 |
| @Length(min = 下限, max = 上限)                  | CharSequence 子类型                                           | 验证注解的元素值长度在 min 和 max 区间内                         |
| @NotEmpty                                    | CharSequence 子类型、Collection、Map、数组                    | 验证注解的元素值不为 null 且不为空（字符串长度不为 0、集合大小不为 0） |
| @Range(min = 最小值, max = 最大值)               | BigDecimal, BigInteger, CharSequence, byte, short, int, long 等原子类型和包装类型 | 验证注解的元素值在最小值和最大值之间                         |
| @Email(regexp = 正则表达式, flag = 标志的模式)    | CharSequence 子类型（如 String）                               | 验证注解的元素值是 Email，也可以通过 regexp 和 flag 指定自定义的 email 格式 |
| @Pattern(regexp = 正则表达式, flag = 标志的模式)  | String，任何 CharSequence 的子类型                             | 验证注解的元素值与指定的正则表达式匹配                       |
| @Valid                                       | 任何非原子类型                                               | 指定递归验证关联的对象；如用户对象中有个地址对象属性，如果想在验证用户对象时一起验证地址对象的话，在地址对象上加@Valid 注解即可级联验证 |

## 使用案例

### 基本使用

1. 在请求参数上声明校验注解

```java
@Getter
@Setter
public class UserValid implements Serializable {
 
    @NotNull(message = "id不能为空")
    private Long id;
 
    @NotNull(message = "date不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @Future(message = "只能是将来的日期")
    private Date date;
 
    @NotNull
    @DecimalMax(value = "10000.0")
    @DecimalMin(value = "1.0")
    private Double doubleValue = null;
 
    @NotNull
    @Max(value = 100, message = "最大值")
    @Min(value = 1, message = "最小值")
    private Integer integer;
 
    @Range(min = 1,max = 100,message = "范围")
    private Long range;
 
    @Email(message = "邮箱格式错误")
    private String email;
 
    @Size(min = 2,max = 10,message = "字符串长度在2-10")
    private String size;
}
```

```java
@PostMapping("/save")
public Result saveUser(@RequestBody @Validated UserValid userValid) {
    // 校验通过，才会执行业务逻辑处理
    return Result.ok();
}
```

2. RequestParam/PathVariable 参数校验

GET 请求一般会使用 `RequestParam`/`PathVariable` 传参。如果参数比较多（比如超过 6 个），还是推荐使用 `DTO` 对象接收。否则，推荐将一个个参数平铺到方法入参中。在这种情况下，必须在 Controller 类上标注 `@Validated` 注解，并在入参上声明约束注解（如 `@Min` 等）。如果校验失败，会抛出 `ConstraintViolationException` 异常

```java
@RequestMapping("/api/user")
@RestController
@Validated
public class UserController {
    // 路径变量
    @GetMapping("{userId}")
    public Result detail(@PathVariable("userId") @Min(10000000000000000L) Long userId) {
        // 校验通过，才会执行业务逻辑处理
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(userId);
        userDTO.setAccount("11111111111111111");
        userDTO.setUserName("xixi");
        userDTO.setAccount("11111111111111111");
        return Result.ok(userDTO);
    }

    // 查询参数
    @GetMapping("getByAccount")
    public Result getByAccount(@Length(min = 6, max = 20) @NotNull String  account) {
        // 校验通过，才会执行业务逻辑处理
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(10000000000000003L);
        userDTO.setAccount(account);
        userDTO.setUserName("xixi");
        userDTO.setAccount("11111111111111111");
        return Result.ok(userDTO);
    }
}
```

### 多级嵌套

当实体类中字段中包含其他对象时，且该对象是需要校验时，需要在实体类字段中加上@Valid

```java
@Data
public class Project {

    @NotBlank(message = "Project title must be present")
    @Size(min = 3, max = 20, message = "Project title size not valid")
    private String title;

    // 校验嵌套的对象
    @Valid
    private User owner;
}
```

```java
@Data
public class User {

    // 校验规则
    @NotBlank(message = "User name must be present")
    @Size(min = 3, max = 50, message = "User name size not valid")
    private String name;

    // 校验规则
    @NotBlank(message = "User email must be present")
    @Email(message = "User email format is incorrect")
    private String email;
}
```

### 分组校验

在很多时候，同一个模型可能会在多处被用到，但每处的校验场景又不一定相同（如：新增用户接口、修改用户接口，参数都是 `User` 模型，在新增时 `User` 中 `name` 字段不能为空，`userNo` 字段可以为空；在修改时 `User` 中 `name` 字段可以为空，`userNo` 字段不能为空）。

我们可以用 groups 来实现：同一个模型在不同场景下，动态区分校验模型中的不同字段。

```java
public interface Add{
}

public interface Edit{
}
```

```java
// 新增
public AjaxResult addSave(@Validated(Add.class) @RequestBody Xxxx xxxx){
    return success(xxxx);
}

// 编辑
public AjaxResult editSave(@Validated(Edit.class) @RequestBody Xxxx xxxx){
    return success(xxxx);
}
```

```java
// 仅在新增时验证
@NotNull(message = "不能为空", groups = {Add.class})
private String xxxx;

// 在新增和修改时验证
@NotBlank(message = "不能为空", groups = {Add.class, Edit.class})
private String xxxx;
```

### 自定义注解校验

```java
/**
 * 自定义校验注解
 *     1、message、contains、payload 是必须要写的
 *     2、还需要什么方法可根据自己的实际业务需求，自行添加定义即可
 * 注: 当没有指定默认值时，那么在使用此注解时，就必须输入对应的属性值
 */
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
@Documented
// 指定此注解的实现，即: 验证器
@Constraint(validatedBy ={JustryDengValidator.class})
public @interface ConstraintsJustryDeng {
 
    // 当验证不通过时的提示信息
    String message() default "JustryDeng : param value must contais specified value!";
 
    // 根据实际需求定的方法
    String contains() default "";
 
    // 约束注解在验证时所属的组别
    Class<?>[] groups() default { };
 
    // 负载
    Class<? extends Payload>[] payload() default { };
}
```

```java
/**
 * ConstraintsJustryDeng 注解 校验器 实现
 * 注: 验证器需要实现 ConstraintValidator <U, V>, 其中 U 为对应的注解类， V 为被该注解标记的字段的类型(或其父类型)
 *
 * 注: 当项目启动后，会(懒加载)创建 ConstraintValidator 实例，在创建实例后会初始化调
 *     用{@link ConstraintValidator#initialize}方法。
 *     所以，只有在第一次请求时，会走 initialize 方法， 后面的请求是不会走 initialize 方法的。
 *
 * 注: (懒加载)创建 ConstraintValidator 实例时， 会走缓存; 如果缓存中有，则直接使用相
 *     同的 ConstraintValidator 实例； 如果缓存中没有，那么会创建新的 ConstraintValidator 实例。
 *     由于缓存的 key 是能唯一定位的， 且 ConstraintValidator 的实例属性只有在
 *     {@link ConstraintValidator#initialize}方法中才会写；
 *	   在{@link ConstraintValidator#isValid}方法中只是读。
 *     所以不用担心线程安全问题。
 *
 * 注: 如何创建 ConstraintValidator 实例的，可详见源码
 *     @see ConstraintTree#getInitializedConstraintValidator(ValidationContext, ValueContext)
 */
public class JustryDengValidator implements ConstraintValidator<ConstraintsJustryDeng, String> {
 
    /** 错误提示信息 */
    private String contains;
 
    /**
     * 初始化方法， 在(懒加载)创建一个当前类实例后，会马上执行此方法
     * 注: 此方法只会执行一次，即: 创建实例后马上执行。
     * @param constraintAnnotation 注解信息模型，可以从该模型中获取注解类中定义的一些信息，如默认值等
     */
    @Override
    public void initialize(ConstraintsJustryDeng constraintAnnotation) {
        System.out.println(constraintAnnotation.message());
        this.contains = constraintAnnotation.contains();
    }
 
    /**
     * 校验方法， 每个需要校验的请求都会走这个方法
     * 注: 此方法可能会并发执行，需要根据实际情况看否是需要保证线程安全。
     * @param value 被校验的对象
     * @param context 上下文
     * @return 校验是否通过
     */
    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        if (value instanceof String) {
            String strMessage = (String) value;
            return strMessage.contains(contains);
        } else if (value instanceof Integer) {
            return contains.contains(String.valueOf(value));
        }
        return false;
    }
}
```

### 编程式校验

```java
@Autowired
private javax.validation.Validator globalValidator;

// 编程式校验
@PostMapping("/saveWithCodingValidate")
public Result saveWithCodingValidate(@RequestBody UserDTO userDTO) {
    Set<ConstraintViolation<UserDTO>> validate = globalValidator.validate(userDTO, UserDTO.Save.class);
    // 如果校验通过，validate 为空；否则，validate 包含未校验通过项
    if (validate.isEmpty()) {
        // 校验通过，才会执行业务逻辑处理
    } else {
        for (ConstraintViolation<UserDTO> userDTOConstraintViolation : validate) {
            // 校验失败，做其它逻辑
            System.out.println(userDTOConstraintViolation);
        }
    }
    return Result.ok();
}
```

### 快速失败

Spring Validation 默认会校验完所有字段，然后才抛出异常。可以通过一些简单的配置，开启 Fail Fast 模式，一旦校验失败就立即返回。

```java
@Bean
public Validator validator() {
    ValidatorFactory validatorFactory = Validation.byProvider(HibernateValidator.class)
            .configure()
            // 快速失败模式
            .failFast(true)
            .buildValidatorFactory();
    return validatorFactory.getValidator();
}
```

## 异常信息

### 异常分类

注解校验不通过时，可能抛出的异常：

1. MethodArgumentNotValidException
2. ConstraintViolationException
3. BindException

### 异常捕获

**MVC 全局捕获**

```java
@ControllerAdvice
@ResponseBody
public class GlobleExceptionHandler {
    /**
     * 要拦截的异常 Exception
     */
    @ExceptionHandler(value = {BindException.class, ValidationException.class, MethodArgumentNotValidException.class})
    public ResponseEntity<Result<?>> handleValidatedException(Exception e) {
        Result<?> resp = null;

        if (e instanceof MethodArgumentNotValidException) {
            // BeanValidation exception
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            resp =	Result.error(500, ex.getBindingResult().getAllErrors().stream()
                    .map(ObjectError::getDefaultMessage)
                    .collect(Collectors.joining("; "))
            );
        } else if (e instanceof ConstraintViolationException) {
            // BeanValidation GET simple param
            ConstraintViolationException ex = (ConstraintViolationException) e;
            resp = Result.error(500,ex.getConstraintViolations().stream()
                            .map(ConstraintViolation::getMessage)
                            .collect(Collectors.joining("; "))
            );
        } else if (e instanceof BindException) {
            // BeanValidation GET object param
            BindException ex = (BindException) e;
            resp = Result.error(500,ex.getAllErrors().stream()
                            .map(ObjectError::getDefaultMessage)
                            .collect(Collectors.joining("; "))
            );
        }
        return new ResponseEntity<>(resp,HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

**接口捕获异常**

```java
@RestController
public class IndexController {

    @Autowired
    private MessageSource messageSource;

    @RequestMapping("/validator")
    public String validator(@Validated User user, BindingResult result){
        if (result.hasErrors()){
            StringBuffer msg=new StringBuffer();
            //获取错误字段集合
            List<FieldError> fieldErrors = result.getFieldErrors();
            //获取本地 locale, zh_CN
            Locale currentLocale = LocaleContextHolder.getLocale();
            //遍历错误字段获取错误信息
            for (FieldError fieldError : fieldErrors) {
                //获取错误信息
                String errorMessage = messageSource.getMessage(fieldError, currentLocale);
                //添加到错误信息
                msg.append(fieldError.getField()+":"+errorMessage+",");
            }
            return msg.toString();
        }
        return "验证通过";
    }
}
```

## @Validated 与@Valid 区别

| 区别         | @Valid                                          | @Validated              |
| ------------ | ----------------------------------------------- | ----------------------- |
| 提供者       | JSR-303 规范                                     | Spring                  |
| 是否支持分组 | 不支持                                          | 支持                    |
| 标注位置     | METHOD, FIELD, CONSTRUCTOR, PARAMETER, TYPE_USE | TYPE, METHOD, PARAMETER |
| 嵌套校验     | 支持                                            | 不支持                  |

## 实现原理

校验触发的时机，其实是从两个点触发，一个跟 SpringMVC 的请求处理过程息息相关，一个是跟 `MethodValidationPostProcessor` 相关

### RequestBody 参数

在 Spring MVC 中，`RequestResponseBodyMethodProcessor` 是用于解析 `@RequestBody` 标注的参数以及处理 `@ResponseBody` 标注方法的返回值的。显然，执行参数校验的逻辑肯定就在解析参数的方法 `resolveArgument()` 中：

```java
public class RequestResponseBodyMethodProcessor extends AbstractMessageConverterMethodProcessor {
    @Override
    public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {

        parameter = parameter.nestedIfOptional();
        // 将请求数据封装到 DTO 对象中
        Object arg = readWithMessageConverters(webRequest, parameter, parameter.getNestedGenericParameterType());
        String name = Conventions.getVariableNameForParameter(parameter);

        if (binderFactory != null) {
            WebDataBinder binder = binderFactory.createBinder(webRequest, arg, name);
            if (arg != null) {
                // 执行数据校验
                validateIfApplicable(binder, parameter);
                if (binder.getBindingResult().hasErrors() && isBindExceptionRequired(binder, parameter)) {
                    throw new MethodArgumentNotValidException(parameter, binder.getBindingResult());
                }
            }
            if (mavContainer != null) {
                mavContainer.addAttribute(BindingResult.MODEL_KEY_PREFIX + name, binder.getBindingResult());
            }
        }
        return adaptArgumentIfNecessary(arg, parameter);
    }
}
```

```java
protected void validateIfApplicable(WebDataBinder binder, MethodParameter parameter) {
    // 获取参数注解，比如@RequestBody、@Valid、@Validated
    Annotation[] annotations = parameter.getParameterAnnotations();
    for (Annotation ann : annotations) {
        // 先尝试获取@Validated 注解
        Validated validatedAnn = AnnotationUtils.getAnnotation(ann, Validated.class);
        // 如果直接标注了@Validated，那么直接开启校验。
        // 如果没有，那么判断参数前是否有 Valid 起头的注解。
        if (validatedAnn != null || ann.annotationType().getSimpleName().startsWith("Valid")) {
            Object hints = (validatedAnn != null ? validatedAnn.value() : AnnotationUtils.getValue(ann));
            Object[] validationHints = (hints instanceof Object[] ? (Object[]) hints : new Object[] {hints});
            //执行校验
            binder.validate(validationHints);
            break;
        }
    }
}
```

```java
public void validate(Object... validationHints) {
    Object target = getTarget();
    Assert.state(target != null, "No target to validate");
    BindingResult bindingResult = getBindingResult();
    // Call each validator with the same binding result
    for (Validator validator : getValidators()) {
        if (!ObjectUtils.isEmpty(validationHints) && validator instanceof SmartValidator) {
            ((SmartValidator) validator).validate(target, bindingResult, validationHints);
        }
        else if (validator != null) {
            validator.validate(target, bindingResult);
        }
    }
}

@Override
public void validate(Object target, Errors errors, Object... validationHints) {
    if (this.targetValidator != null) {
        processConstraintViolations(
            // 此处调用 Hibernate Validator 执行真正的校验
            this.targetValidator.validate(target, asValidationGroups(validationHints)), errors);
    }
}
```

### 方法级别

上面提到的将参数一个个平铺到方法参数中，然后在每个参数前面声明约束注解的校验方式，就是方法级别的参数校验。实际上，这种方式可用于任何 Spring Bean 的方法上，比如 `Controller/ Service` 等。其底层实现原理就是 AOP，具体来说是通过 `MethodValidationPostProcessor` 动态注册 AOP 切面，然后使用 `MethodValidationInterceptor` 对切点方法织入增强。

```java
public class MethodValidationPostProcessor extends AbstractBeanFactoryAwareAdvisingPostProcessorimplements InitializingBean {
    @Override
    public void afterPropertiesSet() {
        // 为所有 `@Validated` 标注的 Bean 创建切面
        Pointcut pointcut = new AnnotationMatchingPointcut(this.validatedAnnotationType, true);
        // 创建 Advisor 进行增强
        this.advisor = new DefaultPointcutAdvisor(pointcut, createMethodValidationAdvice(this.validator));
    }

    // 创建 Advice，本质就是一个方法拦截器
    protected Advice createMethodValidationAdvice(@Nullable Validator validator) {
        return (validator != null ? new MethodValidationInterceptor(validator) : new MethodValidationInterceptor());
    }
}
```

```java
public class MethodValidationInterceptor implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        // 无需增强的方法，直接跳过
        if (isFactoryBeanMetadataMethod(invocation.getMethod())) {
            return invocation.proceed();
        }
        // 获取分组信息
        Class<?>[] groups = determineValidationGroups(invocation);
        ExecutableValidator execVal = this.validator.forExecutables();
        Method methodToValidate = invocation.getMethod();
        Set<ConstraintViolation<Object>> result;
        try {
            // 方法入参校验，最终还是委托给 Hibernate Validator 来校验
            result = execVal.validateParameters(
                invocation.getThis(), methodToValidate, invocation.getArguments(), groups);
        }
        catch (IllegalArgumentException ex) {
			methodToValidate = BridgeMethodResolver.findBridgedMethod(
					ClassUtils.getMostSpecificMethod(invocation.getMethod(), invocation.getThis().getClass()));
			result = execVal.validateParameters(
					invocation.getThis(), methodToValidate, invocation.getArguments(), groups);
        }
        // 有异常直接抛出
        if (!result.isEmpty()) {
            throw new ConstraintViolationException(result);
        }
        // 真正的方法调用
        Object returnValue = invocation.proceed();
        // 对返回值做校验，最终还是委托给 Hibernate Validator 来校验
        result = execVal.validateReturnValue(invocation.getThis(), methodToValidate, returnValue, groups);
        // 有异常直接抛出
        if (!result.isEmpty()) {
            throw new ConstraintViolationException(result);
        }
        return returnValue;
    }
}
```

### 总结

实际上，不管是 RequestBody 参数校验 还是 方法级别的校验，最终都是调用 Hibernate Validator 执行校验，Spring Validation 只是做了一层封装。
