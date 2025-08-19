---
title: SpringSecurity5（11-跨域配置）
tag:
  - SpringSecurity
category: Java
date: 2025-02-18 22:38:34
description: Spring Security跨域配置通过在WebSecurityConfigurerAdapter中自定义CorsConfiguration实现。可以配置允许的请求来源、请求方法、请求头等，以确保前端与后端之间的安全通信。结合@CrossOrigin注解或CorsFilter进行灵活配置，保障不同源的资源访问权限控制和数据安全。
---

## SpringBoot跨域处理

### @CrossOrigin（局部跨域）

1. 作用在方法上

```java
@RestController
public class IndexController {

    @CrossOrigin(value = "http://localhost:8082")
    @GetMapping("/hello")
    public String hello() {
        return "get hello";
    }

    @CrossOrigin(value = "http://localhost:8082")
    @PostMapping("/hello")
    public String hello2() {
        return "post hello";
    }
}
```

2. 作用在类上

```java
@CrossOrigin(origins = "http://example.com", maxAge = 3600)
@RestController
@RequestMapping("/account")
public class AccountController {

    @RequestMapping(method = RequestMethod.GET, path = "/{id}")
    public Account retrieve(@PathVariable Long id) {
        // ...
    }

    @RequestMapping(method = RequestMethod.DELETE, path = "/{id}")
    public void remove(@PathVariable Long id) {
        // ...
    }
}
```

### WebMvcConfigurer（全局跨域）
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
 
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedHeaders("Content-Type","X-Requested-With","accept,Origin","Access-Control-Request-Method","Access-Control-Request-Headers","token")
                .allowedMethods("*")
                .allowedOrigins("*")
                .allowCredentials(true);
    }
}
```

## SpringSecurity跨域处理

### 跨域配置详解

如果使用了 Spring Security，上面的跨域配置会失效，因为请求被 Spring Security 拦截了

在项目中使用 Spring Security，我们必须采取额外的步骤确保它与 CORS 协作良好。这是因为 CORS 需要首先处理，否则，Spring Security 会在请求到达 Spring MVC 之前将其拒绝

```java
@Configuration
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.cors().and()...
    }
}
```

可以配置 CORS 以覆盖默认的 Spring Security CORS 处理器。为此，我们需要添加一个 CorsConfigurationSource Bean，使用 CorsConfiguration 实例来处理 CORS 配置。如果添加了 CorsFilter Bean，http.cors() 方法就会使用 CorsFilter，否则就会使用 CorsConfigurationSource。如果两者都未配置，则使用 Spring MVC pattern inspector handler。

```java
public class CorsConfigurer<H extends HttpSecurityBuilder<H>>
		extends AbstractHttpConfigurer<CorsConfigurer<H>, H> {

    private static final String HANDLER_MAPPING_INTROSPECTOR = "org.springframework.web.servlet.handler.HandlerMappingIntrospector";
    private static final String CORS_CONFIGURATION_SOURCE_BEAN_NAME = "corsConfigurationSource";
    private static final String CORS_FILTER_BEAN_NAME = "corsFilter";

    private CorsConfigurationSource configurationSource;

    public CorsConfigurer() {
    }

    public CorsConfigurer<H> configurationSource(
            CorsConfigurationSource configurationSource) {
        this.configurationSource = configurationSource;
        return this;
    }

    @Override
    public void configure(H http) {
        ApplicationContext context = http.getSharedObject(ApplicationContext.class);

        CorsFilter corsFilter = getCorsFilter(context);
        if (corsFilter == null) {
            throw new IllegalStateException(
                    "Please configure either a " + CORS_FILTER_BEAN_NAME + " bean or a "
                            + CORS_CONFIGURATION_SOURCE_BEAN_NAME + "bean.");
        }
        http.addFilter(corsFilter);
    }

    private CorsFilter getCorsFilter(ApplicationContext context) {
        if (this.configurationSource != null) {
            return new CorsFilter(this.configurationSource);
        }

        // 查找是否有名为corsFilter的Bean对象
        boolean containsCorsFilter = context
                .containsBeanDefinition(CORS_FILTER_BEAN_NAME);
        if (containsCorsFilter) {
            return context.getBean(CORS_FILTER_BEAN_NAME, CorsFilter.class);
        }

        // 查找是否有名为corsConfigurationSource的Bean对象
        boolean containsCorsSource = context
                .containsBean(CORS_CONFIGURATION_SOURCE_BEAN_NAME);
        if (containsCorsSource) {
            CorsConfigurationSource configurationSource = context.getBean(
                    CORS_CONFIGURATION_SOURCE_BEAN_NAME, CorsConfigurationSource.class);
            return new CorsFilter(configurationSource);
        }

        // 查找是否有org.springframework.web.servlet.handler.HandlerMappingIntrospector该类
        boolean mvcPresent = ClassUtils.isPresent(HANDLER_MAPPING_INTROSPECTOR,
                context.getClassLoader());
        if (mvcPresent) {
            return MvcCorsFilter.getMvcCorsFilter(context);
        }
        return null;
    }


    static class MvcCorsFilter {
        private static final String HANDLER_MAPPING_INTROSPECTOR_BEAN_NAME = "mvcHandlerMappingIntrospector";

        private static CorsFilter getMvcCorsFilter(ApplicationContext context) {
            if (!context.containsBean(HANDLER_MAPPING_INTROSPECTOR_BEAN_NAME)) {
                throw new NoSuchBeanDefinitionException(HANDLER_MAPPING_INTROSPECTOR_BEAN_NAME, "A Bean named " + HANDLER_MAPPING_INTROSPECTOR_BEAN_NAME +" of type " + HandlerMappingIntrospector.class.getName()
                        + " is required to use MvcRequestMatcher. Please ensure Spring Security & Spring MVC are configured in a shared ApplicationContext.");
            }
            // 获取名为mvcHandlerMappingIntrospector的Bean对象
            HandlerMappingIntrospector mappingIntrospector = context.getBean(HANDLER_MAPPING_INTROSPECTOR_BEAN_NAME, HandlerMappingIntrospector.class);
            return new CorsFilter(mappingIntrospector);
        }
    }
}
```

### CorsConfigurationSource（全局跨域）
```java
@Configuration
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .anyRequest()
            .permitAll()
            .and()
            .formLogin()
            .permitAll()
            .and()
            .httpBasic()
            .and()
            // 支持跨域访问
            .cors()
            // 可以选择配置
            //.configurationSource(corsConfigurationSource())
            .and()
            .csrf()
            .disable();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("*"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### CosFilter（全局跨域）

还有一种情况就是支持 OAuth2 相关接口的跨域，比如用户要访问 OAuth2 中的 /oauth/token 等接口，可以配置一个全局的 CorsFilter 跨域过滤器类

```java
@Configuration
public class GlobalCorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        //1.添加CORS配置信息
        CorsConfiguration config = new CorsConfiguration();
        //放行哪些原始域
        config.addAllowedOrigin("*");
        //是否发送Cookie信息
        config.setAllowCredentials(true);
        //放行哪些原始域(请求方式)
        config.addAllowedMethod("*");
        //放行哪些原始域(头部信息）
        config.addAllowedHeader("*");
        //暴露哪些头部信息（因为跨域访问默认不能获取全部头部信息）
        config.addExposedHeader("*");
 
        //2.添加映射路径
        UrlBasedCorsConfigurationSource configSource = new UrlBasedCorsConfigurationSource();
        configSource.registerCorsConfiguration("/**", config);
 
        //3.返回新的CorsFilter.
        return new CorsFilter(configSource);
    }
}
```

### 自定义Filter（全局跨域）
```java
public class CorsFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String orignalHeader = StringUtils.defaultIfBlank(request.getHeader("Origin"), "*");
        // 指定本次预检请求的有效期
        response.setHeader("Access-Control-Max-Age", "3600");
        // 服务器支持的所有头信息字段
        response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"));
        response.setHeader("Access-Control-Allow-Origin", orignalHeader);
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
        filterChain.doFilter(request, response);
    }
}
```

```java
@Configuration
public class WebMvcConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.addFilterBefore(new CorsFilter(), WebAsyncManagerIntegrationFilter.class);
    }
}
```



