---
title: SpringSecurity5（4-自定义登录、登出处理器）
tag:
  - SpringSecurity
category: Java
date: 2025-02-07 22:38:34
description: 通过实现AuthenticationSuccessHandler、AuthenticationFailureHandler和LogoutSuccessHandler接口，来自定义登录成功、登录失败和退出成功的处理逻辑。通过这些自定义处理器，开发者可以在用户登录或退出时执行特定的业务逻辑，如记录日志、更新用户状态或返回特定的响应信息，从而增强应用程序的安全性和用户体验
---

## 自定义登录页面

### 常用方法

**http.formLogin()**

1. loginPage(String loginPage)：设置用户登录页面的访问路径，默认为 GET 请求的 /login
2. loginProcessingUrl(String loginProcessingUrl)：设置登录表单提交的路径，默认为是 POST 请求的 loginPage() 设置的路径
3. successForwardUrl(String forwordUrl)：设置用户认证成功后转发的地址
4. successHandler(AuthenticationSuccessHandler successHandler)：配置用户认证成功后的自定义处理器
5. defaultSuccessUrl(String defaultSuccessUrl)：设置用户认证成功后重定向的地址。这里需要注意，该路径是用户直接访问登录页面认证成功后重定向的路径，如果是其他路径跳转到登录页面认证成功后会重定向到原始访问路径。可设置第二个参数为 true，使认证成功后始终重定向到该地址
6. failureForwrad(String forwardUrl)：设置用户认证失败后转发的地址
7. failureHandler(AuthenticationFailureHandler authenticationFailureHandler)：设置用户登录失败后的自定义错误处理器
8. failureUrl(String authenticationFailureUrl)：设置用户登录失败后重定向的地址，指定的路径要能匿名访问，默认为 loginPage() + ?error
9. usernameParamter(String usernameParamter)：设置登录表单中的用户名参数，默认为 username
10. passwordParamter(String passwordParamter)：设置登录表单中的密码参数，默认为 password

### 使用案例

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>登录</title>
</head>
<body>
<form class="login-page" action="/login" method="post">
    <div class="form">
        <h3>账户登录</h3>
        <input type="text" placeholder="用户名" name="username" required="required" />
        <input type="password" placeholder="密码" name="password" required="required" />
        <button type="submit">登录</button>
    </div>
</form>
</body>
</html>
```

```java
@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        /**
         * fromLogin()：表单认证
         * httpBasic()：弹出框认证
         * authorizeRequests()：身份认证请求
         * anyRequest()：所有请求
         * authenticated()：身份认证
         * loginPage()：登录页面地址
         * loginProcessingUrl()：登录表单提交地址
         * csrf().disable()：关闭 Spring Security 的跨站请求伪造的功能
         */
        http.csrf().disable()
                .formLogin()
                .loginPage("/login.html")
                .loginProcessingUrl("/login")
                .and()
                .authorizeRequests()
                .antMatchers("/login.html").permitAll()
                .anyRequest()
                .authenticated();
    }
}
```

注意：SpringBoot 项目集成 Spring Security 5.3.4RELEASE 后，默认情况 crsf 是开启的。每次请求会校验请求头中 X-CSRF-TOKEN 的值与内存中保存的是否一致，如果一致框架则认为登录页面是安全的，如果不一致，会报 403。

```java
@Controller
public class LoginController {

    @RequestMapping("/login.html")
    public String login(){
        return "login";
    }

    @RequestMapping("/test")
    @ResponseBody
    public String test(){
        return "test";
    }
}
```

1. 转发

```java
http.formLogin()
    .usernameParameter("name") // 设置请求参数中，用户名参数名称。 默认 username
    .passwordParameter("pswd") // 设置请求参数中，密码参数名称。 默认 password
    .loginPage("/toLogin") // 当用户未登录的时候，跳转的登录页面地址是什么？ 默认 /login
    .loginProcessingUrl("/login") // 用户登录逻辑请求地址是什么。 默认是 /login
    .failureForwardUrl("/failure"); // 登录失败后，请求转发的位置。Security 请求转发使用 Post 请求。默认转发到：loginPage?error
    .successForwardUrl("/toMain"); // 用户登录成功后，请求转发到的位置。Security 请求转发使用 POST 请求。
```

2. 重定向

```java
http.formLogin()
    .usernameParameter("name") // 设置请求参数中，用户名参数名称。 默认 username
    .passwordParameter("pswd") // 设置请求参数中，密码参数名称。 默认 password
    .loginPage("/toLogin") // 当用户未登录的时候，跳转的登录页面地址是什么？ 默认 /login
    .loginProcessingUrl("/login") // 用户登录逻辑请求地址是什么。 默认是 /login
    .defaultSuccessUrl("/toMain",true); //用户登录成功后，响应重定向到的位置。GET 请求。必须配置绝对地址。
    .failureUrl("/failure"); // 登录失败后，重定向的位置。
```

## 自定义登录处理器
### AuthenticationSuccessHandler
用来处理认证成功的情况

```java
public interface AuthenticationSuccessHandler {

    default void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain, Authentication authentication)
            throws IOException, ServletException{
        onAuthenticationSuccess(request, response, authentication);
        chain.doFilter(request, response);
    }

    void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException;
}
```

```java
@Slf4j
@Component
public class AuthenticationSuccessHandlerImpl implements AuthenticationSuccessHandler {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Authentication authentication) throws IOException, ServletException {
        log.info("登录成功");
        httpServletResponse.setContentType("application/json;charset=utf-8");
        httpServletResponse.getWriter().write(objectMapper.writeValueAsString(authentication));
    }
}
```

### AuthenticationFailureHandler

用来处理认证失败的情况

```java
public interface AuthenticationFailureHandler {

    void onAuthenticationFailure(HttpServletRequest request,
            HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException;
}
```

```java
@Slf4j
@Component
public class AuthenticationFailureHandlerImpl implements AuthenticationFailureHandler {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void onAuthenticationFailure(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AuthenticationException e) throws IOException, ServletException {
        log.info("登录失败");
        httpServletResponse.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        httpServletResponse.setContentType("application/json;charset=utf-8");
        httpServletResponse.getWriter().write(objectMapper.writeValueAsString(e));
    }
}
```

### SimpleUrlAuthenticationSuccessHandler

用来处理认证成功后跳转的 URL 信息

```java
public class SimpleUrlAuthenticationSuccessHandler extends
		AbstractAuthenticationTargetUrlRequestHandler implements
		AuthenticationSuccessHandler {

    public SimpleUrlAuthenticationSuccessHandler() {
    }

    public SimpleUrlAuthenticationSuccessHandler(String defaultTargetUrl) {
        setDefaultTargetUrl(defaultTargetUrl);
    }

    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        handle(request, response, authentication);
        clearAuthenticationAttributes(request);
    }

    protected final void clearAuthenticationAttributes(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return;
        }
        session.removeAttribute(WebAttributes.AUTHENTICATION_EXCEPTION);
    }
}
```

### 使用案例

```java
@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private AuthenticationSuccessHandlerImpl authenticationSuccessHandler;
    @Autowired
    private AuthenticationFailureHandlerImpl authenticationFailureHandler;
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        /**
         * fromLogin()：表单认证
         * httpBasic()：弹出框认证
         * authorizeRequests()：身份认证请求
         * anyRequest()：所有请求
         * authenticated()：身份认证
         * loginPage()：登录页面地址
         * loginProcessingUrl()：登录表单提交地址
         * csrf().disable()：关闭 Spring Security 的跨站请求伪造的功能
         */
        http.csrf().disable()
                .formLogin()
                .loginPage("/login")
                .loginProcessingUrl("/auth/login")
                .successHandler(authenticationSuccessHandler)
                .failureHandler(authenticationFailureHandler)
                .and()
                .authorizeRequests()
                .antMatchers("/login").permitAll()
                .anyRequest()
                .authenticated();
    }
}
```

## 自定义退出处理器
### LogoutSuccessHandler
用来处理退出成功的情况

```java
public interface LogoutSuccessHandler {

    void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException;
}
```

```java
@Component
public class MyLogOutSuccessHandler implements LogoutSuccessHandler {

    @Override
    public void onLogoutSuccess(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Authentication authentication) throws IOException, ServletException {
        httpServletResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
        httpServletResponse.setContentType("application/json;charset=utf-8");
        httpServletResponse.getWriter().write("退出成功，请重新登录");
    }
}
```

### SimpleUrlLogoutSuccessHandler

用来处理退出成功跳转的 URL 信息

```java
public class SimpleUrlLogoutSuccessHandler extends
		AbstractAuthenticationTargetUrlRequestHandler implements LogoutSuccessHandler {

    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        super.handle(request, response, authentication);
    }
}
```

### LogoutHandler

```java
http.and()
    .logout() //提供系统退出支持，使用 WebSecurityConfigurerAdapter 会自动被应用
    .logoutUrl("/logout") //默认退出地址
    .logoutSuccessUrl("/login‐view?logout") //退出后的跳转地址
    .addLogoutHandler(logoutHandler) //添加一个 LogoutHandler，用于实现用户退出时的清理工作.默认 SecurityContextLogoutHandler 会被添加为最后一个 LogoutHandler 。
    .invalidateHttpSession(true);  //指定是否在退出时让 HttpSession 失效，默认是 true
```

一般来说， LogoutHandler 的实现类被用来执行必要的清理，因而他们不应该抛出异常。

下面是 Spring Security 提供的一些实现：

1. PersistentTokenBasedRememberMeServices：基于持久化 token 的 RememberMe 功能的相关清理
2. TokenBasedRememberMeService：基于 token 的 RememberMe 功能的相关清理
3. CookieClearingLogoutHandler：退出时 Cookie 的相关清理
4. CsrfLogoutHandler：负责在退出时移除 csrfToken
5. SecurityContextLogoutHandler：退出时 SecurityContext 的相关清理

### 使用案例

```java
@GetMapping("/signout/success")
public String signout() {
    return "退出成功，请重新登录";
}
```

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private AuthenticationSuccessHandlerImpl authenticationSuccessHandler;
    @Autowired
    private AuthenticationFailureHandlerImpl authenticationFailureHandler;
    @Resource
    private MyLogOutSuccessHandler logOutSuccessHandler;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.formLogin()
            .successHandler(authenticationSuccessHandler)
            .failureHandler(authenticationFailureHandler)
            .and()
            .logout()
            //.logoutUrl("/signout")
            .logoutSuccessUrl("/signout/success")
            .deleteCookies("JSESSIONID")
            .logoutSuccessHandler(logoutSuccessHandler)
            .and()
            .authorizeRequests()
            .anyRequest()
            .authenticated();
    }
}
```

Spring Security 默认的退出登录 URL 为/logout，退出登录后，Spring Security 会做如下处理：

1. 使当前的 Session 失效
2. 清除与当前用户关联的 RememberMe 记录
3. 清空当前的 SecurityContext
4. 重定向到登录页
