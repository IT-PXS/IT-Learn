---
title: SpringSecurity5（14-Gateway整合）
tag:
  - SpringSecurity
category: Java
date: 2025-02-27 22:38:34
description: Spring Security整合Gateway可实现API网关级别的身份认证与权限控制。通过Gateway的全局过滤器拦截请求，结合OAuth2或JWT进行身份验证，并基于Spring Security的授权规则进行访问控制，从而确保微服务架构下的安全性与高效性。
---

## MVC 与 WebFlux 关系

SpringSecurity 设置要采用响应式配置，基于 WebFlux 中 WebFilter 实现，与 Spring MVC 的 Security 是通过 Servlet 的 Filter 实现类似，也是一系列 filter 组成的过滤链。

Reactor 与传统 MVC 配置对应：

| webflux                                             | mvc                          | 作用             |
| --------------------------------------------------- | ---------------------------- | ---------------- |
| @EnableWebFluxSecurity                              | @EnableWebSecurity           | 开启 security 配置 |
| ServerAuthenticationSuccessHandler                  | AuthenticationSuccessHandler | 登录成功 Handler  |
| ServerAuthenticationFailureHandler                  | AuthenticationFailureHandler | 登录失败 Handler |
| ServerLogoutSuccessHandler | LogoutSuccessHandler | 注销成功Handler |
| ServerSecurityContextRepository                     | SecurityContextHolder        | 认证信息存储管理 |
| ReactiveUserDetailsService                          | UserDetailsService           | 用户登录逻辑处理     |
| ReactiveAuthenticationManager | AuthorizationManager | 认证管理  |
| ReactiveAuthorizationManager | AccessDecisionManager | 鉴权管理         |
| ServerAuthenticationEntryPoint                      | AuthenticationEntryPoint     | 未认证 Handler    |
| ServerAccessDeniedHandler                           | AccessDeniedHandler          | 鉴权失败 Handler  |
| AuthenticationWebFilter | FilterSecurityInterceptor | 拦截器 |

## 快速入门

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-security</artifactId>
    <version>2.2.5.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
    <version>2.2.6.RELEASE</version>
</dependency>
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>2.0.38</version>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

### 内存管理用户信息

```java
@EnableWebFluxSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
       http.httpBasic()
               .and()
               .authorizeExchange()
               .anyExchange()
               .authenticated();
        return http.build();
    }

    /**
     * 内存管理用户信息
     */
    @Bean
    public MapReactiveUserDetailsService userDetailsService() {
        UserDetails user = User.withDefaultPasswordEncoder()
                .username("user")
                .password("password")
                .roles("USER")
                .build();
        return new MapReactiveUserDetailsService(user);
    }
}
```

### 自定义登录、注销处理器

1. 自定义登录成功处理器

```java
@Component
public class LoginSuccessHandler implements ServerAuthenticationSuccessHandler {

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        return Mono.defer(() -> Mono.just(webFilterExchange.getExchange().getResponse()).flatMap(response -> {
            DataBufferFactory dataBufferFactory = response.bufferFactory();
            DataBuffer dataBuffer = dataBufferFactory.wrap("登录成功".getBytes());
            return response.writeWith(Mono.just(dataBuffer));
        }));
    }
}
```

2. 自定义登录失败处理器

```java
@Component
public class LoginFailHandler implements ServerAuthenticationFailureHandler {

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        return Mono.defer(() -> Mono.just(webFilterExchange.getExchange().getResponse()).flatMap(response -> {
            DataBufferFactory dataBufferFactory = response.bufferFactory();
            DataBuffer dataBuffer = dataBufferFactory.wrap("登录失败".getBytes());
            return response.writeWith(Mono.just(dataBuffer));
        }));
    }
}
```

3. 自定义注销成功处理器

```java
@Component
public class LogoutSuccessHandler implements ServerLogoutSuccessHandler {

    @Override
    public Mono<Void> onLogoutSuccess(WebFilterExchange exchange, Authentication authentication) {
        return Mono.defer(() -> Mono.just(exchange.getExchange().getResponse()).flatMap(response -> {
            DataBufferFactory dataBufferFactory = response.bufferFactory();
            DataBuffer dataBuffer = dataBufferFactory.wrap("logout success".getBytes());
            return response.writeWith(Mono.just(dataBuffer));
        }));
    }
}
```

```java
@EnableWebFluxSecurity
@Configuration
public class SecurityConfig {

    @Resource
    private LoginSuccessHandler loginSuccessHandler;
    @Resource
    private LoginFailHandler loginFailHandler;
    @Resource
    private LogoutSuccessHandler logoutSuccessHandler;

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http.httpBasic()
                .and()
                .authorizeExchange()
                .anyExchange()
                .authenticated();

        http.formLogin()
                .authenticationSuccessHandler(loginSuccessHandler)
                .authenticationFailureHandler(loginFailHandler)
            	.and()
                .logout()
                .logoutSuccessHandler(logoutSuccessHandler);
        return http.build();
    }

    /**
     * 内存管理用户信息
     */
    @Bean
    public MapReactiveUserDetailsService userDetailsService() {
        UserDetails user = User.withDefaultPasswordEncoder()
                .username("user")
                .password("password")
                .roles("USER")
                .build();
        return new MapReactiveUserDetailsService(user);
    }
}
```

### 自定义用户信息

1. 仿照 MapReactiveUserDetailsService 编写获取用户认证类

```java
@Component
public class UserDetailService implements ReactiveUserDetailsService, ReactiveUserDetailsPasswordService {

    private final Map<String, UserDetails> users = new HashMap<>();

    @Resource
    private PasswordEncoder passwordEncoder;

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        User user = null;
        if ("user".equals(username)) {
            user = new User("user", passwordEncoder.encode("123456"), true, true, true, true, new ArrayList<>());
        }
        return Mono.justOrEmpty(user);
    }

    @Override
    public Mono<UserDetails> updatePassword(UserDetails user, String newPassword) {
        return Mono.just(user)
                .map(u ->
                        User.withUserDetails(u)
                                .password(newPassword)
                                .build()
                )
                .doOnNext(u -> {
                    this.users.put(user.getUsername().toLowerCase(), u);
                });
    }
}
```

2. 仿照 AbstractUserDetailsReactiveAuthenticationManager 编写用户认证管理类

```java
@Component
public class UserAuthenticationManager extends AbstractUserDetailsReactiveAuthenticationManager {

    @Resource
    private PasswordEncoder passwordEncoder;
    @Resource
    private ReactiveUserDetailsService userDetailService;
    @Resource
    private ReactiveUserDetailsPasswordService userDetailsPswService;

    private Scheduler scheduler = Schedulers.boundedElastic();

    private UserDetailsChecker preAuthenticationChecks = user -> {
        if (!user.isAccountNonLocked()) {
            logger.debug("User account is locked");

            throw new LockedException(this.messages.getMessage(
                    "AbstractUserDetailsAuthenticationProvider.locked",
                    "User account is locked"));
        }

        if (!user.isEnabled()) {
            logger.debug("User account is disabled");

            throw new DisabledException(this.messages.getMessage(
                    "AbstractUserDetailsAuthenticationProvider.disabled",
                    "User is disabled"));
        }

        if (!user.isAccountNonExpired()) {
            logger.debug("User account is expired");

            throw new AccountExpiredException(this.messages.getMessage(
                    "AbstractUserDetailsAuthenticationProvider.expired",
                    "User account has expired"));
        }
    };

    private UserDetailsChecker postAuthenticationChecks = user -> {
        if (!user.isCredentialsNonExpired()) {
            logger.debug("User account credentials have expired");

            throw new CredentialsExpiredException(this.messages.getMessage(
                    "AbstractUserDetailsAuthenticationProvider.credentialsExpired",
                    "User credentials have expired"));
        }
    };


    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        final String username = authentication.getName();
        final String presentedPassword = (String) authentication.getCredentials();
        return retrieveUser(username)
                .doOnNext(this.preAuthenticationChecks::check)
                .publishOn(this.scheduler)
                .filter(u -> this.passwordEncoder.matches(presentedPassword, u.getPassword()))
                .switchIfEmpty(Mono.defer(() -> Mono.error(new BadCredentialsException("Invalid Credentials"))))
                .flatMap(u -> {
                    boolean upgradeEncoding = this.userDetailsPswService != null
                            && this.passwordEncoder.upgradeEncoding(u.getPassword());
                    if (upgradeEncoding) {
                        String newPassword = this.passwordEncoder.encode(presentedPassword);
                        return this.userDetailsPswService.updatePassword(u, newPassword);
                    }
                    return Mono.just(u);
                })
                .doOnNext(this.postAuthenticationChecks::check)
                .map(u -> new UsernamePasswordAuthenticationToken(u, u.getPassword(), u.getAuthorities()) );
    }


    @Override
    protected Mono<UserDetails> retrieveUser(String username) {
        return userDetailService.findBysername(username);
    }
}
```

```java
@EnableWebFluxSecurity
@Configuration
public class SecurityConfig {

    @Resource
    private LoginSuccessHandler loginSuccessHandler;
    @Resource
    private LoginFailHandler loginFailHandler;
    @Resource
    private LogoutSuccessHandler logoutSuccessHandler;
    @Resource
    private UserAuthenticationManager userAuthenticationManager;

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http.httpBasic()
                .and()
                .authorizeExchange()
                .anyExchange()
                .authenticated();

        http.formLogin()
                .authenticationManager(authenticationManager())
                .authenticationSuccessHandler(loginSuccessHandler)
                .authenticationFailureHandler(loginFailHandler)
				.and()
                .logout()
                .logoutSuccessHandler(logoutSuccessHandler);
        return http.build();
    }

    /**
     * 注册用户信息验证管理器，可按需求添加多个按顺序执行
     */
    @Bean
    public ReactiveAuthenticationManager authenticationManager() {
        LinkedList<ReactiveAuthenticationManager> managers = new LinkedList<>();
        managers.add(userAuthenticationManager);
        return new DelegatingReactiveAuthenticationManager(managers);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 权限注解

```java
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Configuration
public class SecurityConfig {
	// ....
}
```

```java
@RestController
public class TestController {

    /**
     * 无效
     */
    @Secured({"ROLE_ADMIN"})
    @RequestMapping(value = "/test")
    public Mono<String> test() {
        return Mono.just("test");
    }

    /**
     * 有效
     */
    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "/test1")
    public Mono<String> test1() {
        return Mono.just("test1");
    }

    @Secured({"ROLE_TEST"})
    @RequestMapping(value = "/test2")
    public Mono<String> test2() {
        return Mono.just("test2");
    }
}
```

### 自定义权限处理器

```java
@Component
public class AccessDeniedHandler implements ServerAccessDeniedHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, AccessDeniedException denied) {
        return Mono.defer(() -> Mono.just(exchange.getResponse()).flatMap(response -> {
            DataBufferFactory dataBufferFactory = response.bufferFactory();
            DataBuffer dataBuffer = dataBufferFactory.wrap("permission denied".getBytes());
            return response.writeWith(Mono.just(dataBuffer));
        }));
    }
}
```

```java
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Configuration
public class SecurityConfig {

    @Resource
    private LoginSuccessHandler loginSuccessHandler;
    @Resource
    private LoginFailHandler loginFailHandler;
    @Resource
    private LogoutSuccessHandler logoutSuccessHandler;
    @Resource
    private UserAuthenticationManager userAuthenticationManager;
    @Resource
    private AccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http.httpBasic()
                .and()
                .authorizeExchange()
                .anyExchange()
                .authenticated();

        http.formLogin()
                .authenticationManager(authenticationManager())
                .authenticationSuccessHandler(loginSuccessHandler)
                .authenticationFailureHandler(loginFailHandler)
                .and()
                .logout()
                .logoutSuccessHandler(logoutSuccessHandler)
                .and()
                .exceptionHandling()
                .accessDeniedHandler(accessDeniedHandler);
        return http.build();
    }

    /**
     * 注册用户信息验证管理器，可按需求添加多个按顺序执行
     */
    @Bean
    public ReactiveAuthenticationManager authenticationManager() {
        LinkedList<ReactiveAuthenticationManager> managers = new LinkedList<>();
        managers.add(userAuthenticationManager);
        return new DelegatingReactiveAuthenticationManager(managers);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 自定义认证处理器

```java
@Component
public class AuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException e) {
        return Mono.defer(() -> Mono.just(exchange.getResponse()).flatMap(response -> {
            DataBufferFactory dataBufferFactory = response.bufferFactory();
            DataBuffer dataBuffer = dataBufferFactory.wrap("Authentication fail".getBytes());
            return response.writeWith(Mono.just(dataBuffer));
        }));
    }
}
```

```java
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Configuration
public class SecurityConfig {

    @Resource
    private LoginSuccessHandler loginSuccessHandler;
    @Resource
    private LoginFailHandler loginFailHandler;
    @Resource
    private LogoutSuccessHandler logoutSuccessHandler;
    @Resource
    private UserAuthenticationManager userAuthenticationManager;
    @Resource
    private AccessDeniedHandler accessDeniedHandler;
    @Resource
    private AuthenticationEntryPoint authenticationEntryPoint;

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http.httpBasic()
                .and()
                .authorizeExchange()
                .anyExchange()
                .authenticated();

        http.formLogin()
                .authenticationManager(authenticationManager())
                .authenticationSuccessHandler(loginSuccessHandler)
                .authenticationFailureHandler(loginFailHandler)
                .and()
                .logout()
                .logoutSuccessHandler(logoutSuccessHandler)
                .and()
                .exceptionHandling()
                .accessDeniedHandler(accessDeniedHandler)
                .authenticationEntryPoint(authenticationEntryPoint);
        return http.build();
    }

    /**
     * 注册用户信息验证管理器，可按需求添加多个按顺序执行
     */
    @Bean
    public ReactiveAuthenticationManager authenticationManager() {
        LinkedList<ReactiveAuthenticationManager> managers = new LinkedList<>();
        managers.add(userAuthenticationManager);
        return new DelegatingReactiveAuthenticationManager(managers);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 自定义鉴权处理器

```java
@Slf4j
@Component
public class AuthorizeConfigManager implements ReactiveAuthorizationManager<AuthorizationContext> {

    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    public Mono<AuthorizationDecision> check(Mono<Authentication> authentication,
                                             AuthorizationContext authorizationContext) {
        return authentication.map(auth -> {
            ServerWebExchange exchange = authorizationContext.getExchange();
            ServerHttpRequest request = exchange.getRequest();

            Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
            for (GrantedAuthority authority : authorities) {
                String authorityAuthority = authority.getAuthority();
                String path = request.getURI().getPath();
                if (antPathMatcher.match(authorityAuthority, path)) {
                    log.info(String.format("用户请求API校验通过，GrantedAuthority:{%s}  Path:{%s} ", authorityAuthority, path));
                    return new AuthorizationDecision(true);
                }
            }
            return new AuthorizationDecision(false);
        }).defaultIfEmpty(new AuthorizationDecision(false));
    }

    @Override
    public Mono<Void> verify(Mono<Authentication> authentication, AuthorizationContext object) {
        return check(authentication, object)
                .filter(AuthorizationDecision::isGranted)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new AccessDeniedException("Access Denied"))))
                .flatMap(d -> Mono.empty());
    }
}
```

```java
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Configuration
public class SecurityConfig {

    @Resource
    private LoginSuccessHandler loginSuccessHandler;
    @Resource
    private LoginFailHandler loginFailHandler;
    @Resource
    private LogoutSuccessHandler logoutSuccessHandler;
    @Resource
    private UserAuthenticationManager userAuthenticationManager;
    @Resource
    private AccessDeniedHandler accessDeniedHandler;
    @Resource
    private AuthenticationEntryPoint authenticationEntryPoint;
    @Resource
    private AuthorizeConfigManager authorizeConfigManager;

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        http.httpBasic()
                .and()
                .authorizeExchange(e -> e
                        .anyExchange()
                        .access(authorizeConfigManager));

        http.formLogin()
                .authenticationManager(authenticationManager())
                .authenticationSuccessHandler(loginSuccessHandler)
                .authenticationFailureHandler(loginFailHandler)
                .and()
                .logout()
                .logoutSuccessHandler(logoutSuccessHandler)
                .and()
                .exceptionHandling()
                .accessDeniedHandler(accessDeniedHandler)
                .authenticationEntryPoint(authenticationEntryPoint);
        return http.build();
    }

    /**
     * 注册用户信息验证管理器，可按需求添加多个按顺序执行
     */
    @Bean
    public ReactiveAuthenticationManager authenticationManager() {
        LinkedList<ReactiveAuthenticationManager> managers = new LinkedList<>();
        managers.add(userAuthenticationManager);
        return new DelegatingReactiveAuthenticationManager(managers);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

