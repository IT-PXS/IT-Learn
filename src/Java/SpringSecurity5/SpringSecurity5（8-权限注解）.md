---
title: SpringSecurity5（8-权限注解）
tag:
  - SpringSecurity
category: Java
date: 2025-02-15 22:38:34
description: Spring Security 提供多种权限注解，如 @PreAuthorize、@PostAuthorize、@Secured 和 @RolesAllowed，用于方法级别的访问控制。@PreAuthorize 适用于方法执行前权限检查，@PostAuthorize 可在方法执行后验证返回值权限，@Secured 和 @RolesAllowed 主要基于角色控制。
---

## 注解使用

Spring Security 默认是禁用注解的，要想开启注解，需要加上@EnableMethodSecurity 注解

1. 使用@Secured 需要在配置类中添加注解@EnableGlobalMethodSecurity(securedEnabled = true)才能生效
2. 使用@PreAuthorize 和@PostAuthorize 需要在配置类中配置注解@EnableGlobalMethodSecurity(prePostEnable = true)才能生效

### @Secured  
角色校验，请求到来访问控制单元方法时必须包含 XX 角色才能访问

注意：

1. 角色必须添加 ROLE_前缀
2. 如果要求只有同时拥有 admin 和 user 的用户才能访问某个方法时，@Secured 就无能为力了

```java
@Component
public class UserDetailServiceImpl implements UserDetailsService {

    @Resource
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username.equals("root")) {
            return new User(username, passwordEncoder.encode("123"), AuthorityUtils.createAuthorityList("ROLE_read"));
        } else if (username.equals("user")) {
            return new User(username, passwordEncoder.encode("123"), AuthorityUtils.createAuthorityList("ROLE_write"));
        }
        return new User(username, passwordEncoder.encode("123"), AuthorityUtils.createAuthorityList("read"));
    }
}
```

```java
@RestController
public class HelloController {

    @RequestMapping("/read")
    @Secured(value = {"ROLE_read"})
    public String read() {
        return "read";
    }

    @RequestMapping("/write")
    @Secured(value = {"ROLE_write"})
    public String write() {
        return "write";
    }

	// 错误实例
    @RequestMapping("/read2")
    @Secured(value = {"read"})
    public String read2() {
        return "read2";
    }
}
```

### @PreAuthorize  
权限校验，请求到来访问控制单元之前必须包含 XX 权限才能访问，控制单元方法执行前进行角色校验

```java
@RestController
public class HelloController {

    @RequestMapping("/read3")
    @PreAuthorize(value = "hasRole('ROLE_read')")
    public String read3() {
        return "read3";
    }

    @RequestMapping("/read4")
    @PreAuthorize(value = "hasAnyRole('ROLE_read','ROLE_write')")
    public String read4() {
        return "read4";
    }

    @RequestMapping("/read5")
    @PreAuthorize(value = "hasAnyAuthority('ROLE_read','read')")
    public String read5() {
        return "read5";
    }
}
```

**hasRole 与 hasAuthority 的区别**

1. hasRole 的值会添加 ROLE_开头进行判断，而 hasAuthority 不会
2. 其他方法判断一致

```java
public abstract class SecurityExpressionRoot implements SecurityExpressionOperations {
    protected final Authentication authentication;
    private AuthenticationTrustResolver trustResolver;
    private RoleHierarchy roleHierarchy;
    private Set<String> roles;
    private String defaultRolePrefix = "ROLE_";

    /** Allows "permitAll" expression */
    public final boolean permitAll = true;

    /** Allows "denyAll" expression */
    public final boolean denyAll = false;
    private PermissionEvaluator permissionEvaluator;
    public final String read = "read";
    public final String write = "write";
    public final String create = "create";
    public final String delete = "delete";
    public final String admin = "administration";

    //...
    public final boolean hasAuthority(String authority) {
        return hasAnyAuthority(authority);
    }

    public final boolean hasAnyAuthority(String... authorities) {
        return hasAnyAuthorityName(null, authorities);
    }

    public final boolean hasRole(String role) {
        return hasAnyRole(role);
    }

    public final boolean hasAnyRole(String... roles) {
        return hasAnyAuthorityName(defaultRolePrefix, roles);
    }

    private boolean hasAnyAuthorityName(String prefix, String... roles) {
        Set<String> roleSet = getAuthoritySet();
        for (String role : roles) {
            String defaultedRole = getRoleWithDefaultPrefix(prefix, role);
            if (roleSet.contains(defaultedRole)) {
                return true;
            }
        }
        return false;
    }
    // ....

    private static String getRoleWithDefaultPrefix(String defaultRolePrefix, String role) {
        if (role == null) {
            return role;
        }
        if (defaultRolePrefix == null || defaultRolePrefix.length() == 0) {
            return role;
        }
        // 判断是否以 ROLE_开头
        if (role.startsWith(defaultRolePrefix)) {
            return role;
        }
        return defaultRolePrefix + role;
    }
}
```

### @PostAuthorize  
权限校验，请求到来访问控制单元之后必须包含 XX 权限才能访问，在方法执行后进行权限校验，适合验证带有返回值的权限

```java
@PostAuthorize("hasRole('ROLE_管理员')")
@RequestMapping("/toMain")
public String toMain(){
    return "main";
}

@GetMapping("/helloUser")
@PostAuthorize("returnObject!=null && returnObject.username == authentication.name")
public User helloUser() {
    Object pricipal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    User user;
    if("anonymousUser".equals(pricipal)) {
        user = null;
    }else {
        user = (User) pricipal;
    }
    return user;
}
```

### @PreFilter  
对传递参数值做过滤

```java
@PostMapping("/preFilter")
@PreAuthorize("hasAnyAuthority('admin','update')") // 注意单引号
@PreFilter("filterObject.id % 2 == 0") // id 为偶数才能请求
public String preFilter(@RequestBody List<User> userLists){
    log.info("=== 进入当前 preFilter ====");
    log.info(userLists.toString());
    return "security test 5  preFilter  需要验证的接口";
}
```

### @PostFilter  
权限验证通过后，留下指定用户名的数据，对返回数据做过滤

```java
@RequestMapping("/postFilter")
@PreAuthorize("hasAnyAuthority('admin','update')") // 注意单引号
@PostFilter("filterObject.username == 'xiangjiao'") // 针对返回数据做过滤
public List<User> postFilter(){
    log.info("=== 进入当前 postFilter ====");
    List<User> userLists = new ArrayList<>();
    userLists.add(new User(1,"xiangjiao","bunana",1,0));
    userLists.add(new User(2,"xiangjiao2","bunana2",1,0));
    return userLists;
}
```

### 使用注意
1. 使用@EnableGlobalMethodSecurity 开启注解支持后，用户必须实现 UserDetailsService 方法，使用 auth.inMemoryAuthentication()内存管理用户信息会失效
2. 如果注解要使用 permitAll()、isAnonymous()等方法时，需要在 config 方法中取消.anyRequest().authenticated()的设置，否则会无效。

```java
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled=true)
public class MyWebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.cors()
            .and()
            .csrf().disable();
        // 下面需注释，否则注解无效，生效的是这里的配置
            /*.authorizeRequests()
        	.anyRequest()
        	.authenticated(); */
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
        	.passwordEncoder(bCryptPasswordEncoder);
    }
}
```

```java
@RestController
public class HelloController {

    @RequestMapping("/read3")
    @PreAuthorize(value = "hasRole('ROLE_read')")
    public String read3() {
        return "read3";
    }

    @RequestMapping("/read4")
    @PreAuthorize(value = "hasAnyRole('ROLE_read','ROLE_write')")
    public String read4() {
        return "read4";
    }

    @RequestMapping("/read5")
    @PreAuthorize(value = "hasAnyAuthority('ROLE_read','read')")
    public String read5() {
        return "read5";
    }

    @RequestMapping("/isAnonymous")
    @PreAuthorize(value = "isAnonymous()")
    public String isAnonymous() {
        return "isAnonymous";
    }
}
```

## 注解方法

1. hasAuthority(String)：判断角色是否具有特定权限

http.authorizeRequests().antMatchers("/main1.html").hasAuthority("admin")

2. hasAnyAuthority(String ...)：如果用户具备给定权限中某一个，就允许访问

http.authorizeRequests().antMatchers("/admin/read").hasAnyAuthority("xxx", "xxx")

3. hasRole(String)：如果用户具备给定角色就允许访问，否则出现 403

http.authorizeRequests().antMatchers("/admin/read").hasRole("ROLE_管理员")

4. hasAnyRole(String ...)：如果用户具备给定角色的任意一个，就允许被访问

http.authorizeRequests().antMatchers("/guest/read").hasAnyRole("ROLE_管理员", "ROLE_访客")

5. hasIpAddress(String)：请求是指定的 IP 就允许访问

http.authorizeRequests().antMatchers("/ip").hasIpAddress("127.0.0.1")

6. permitAll()：允许所有人（可无任何权限）访问
7. denyAll()：不允许任何（即使有最大权限）访问。
8. isAnonymous()：为可匿名（不登录）访问。
9. isAuthenticated()：为身份证认证后访问。
10. isRememberMe()：为记住我用户操作访问。
11. isFullyAuthenticated()：为非匿名且非记住我用户允许访问

## JSR-250 注解

注意：使用 JSR-250 注解需要设置@EnableGlobalMethodSecurity(jsr250Enabled = true)才能使用

1. @DenyAll  
2. @PermitAll  
3. @RolesAllowed  

例如：@RolesAllowed({"USER", "ADMIN"})，代表标注的方法只要具有 USER、ADMIN 任意一种权限就可以访问

## 使用案例

### 自定义权限校验

```java
interface TestPermissionEvaluator {
    boolean check(Authentication authentication);
}

@Service("testPermissionEvaluator")
public class TestPermissionEvaluatorImpl implements TestPermissionEvaluator {

    public boolean check(Authentication authentication) {
        System.out.println("进入了自定义的匹配器" + authentication);
        return false;
    }
}
```

```java
@PreAuthorize("@testPermissionEvaluator.check(authentication)")
public String test0() {
	return "说明你有自定义权限";
}
```

### 权限异常处理

#### AuthenticationEntryPoint

用来解决匿名用户访问无权限资源时的异常

注意：使用 AuthenticationEntryPoint 会导致原来的/login 登录页面失效

```java
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        response.setCharacterEncoding("utf-8");
        response.setContentType("text/javascript;charset=utf-8");
        response.getWriter().print(JSONObject.toJSONString(RestMsg.error("没有访问权限!")));
    }
}
```

#### AccessDeniedHandler

用来解决认证过的用户访问无权限资源时的异常

```java
@Component
public class MyAccessDeniedHandler implements AccessDeniedHandler {
    
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e) 
            throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write(
                "<html>" +
                        "<body>" +
                        "<div style='width:800px;text-align:center;margin:auto;font-size:24px'>" +
                        "权限不足，请联系管理员" +
                        "</div>" +
                        "</body>" +
                        "</html>"
        );
        response.getWriter().flush();//刷新缓冲区
    }
}
```

#### SecurityConfig 配置

```java
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled=true)
public class MyWebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsService userDetailsService;
    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.cors()
            .and()
            .csrf().disable()
            .authorizeRequests()
            .antMatchers("/user/sign").permitAll()
            .anyRequest()
            .authenticated();
             
        //添加自定义异常入口
        http.exceptionHandling()
            .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
            .accessDeniedHandler(new CustomAccessDeineHandler());       
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
        	.passwordEncoder(bCryptPasswordEncoder);
    }
}
```





