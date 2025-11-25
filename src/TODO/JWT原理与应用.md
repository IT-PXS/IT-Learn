---
title: JWT原理与应用
tag:
  - SpringBoot
category: Java
description: JWT（JSON Web Token）是一种紧凑的安全令牌格式，广泛用于身份认证和信息传递。它由Header、Payload和Signature组成，采用Base64编码，支持HMAC或RSA等签名机制，确保数据完整性。JWT适用于无状态认证，如OAuth 2.0，便于分布式系统中高效传递用户身份信息。
date: 2025-04-05 12:42:19
---

## 出现背景

基于 session 认证所显露的问题：

1. Session：每个用户经过我们的应用认证之后，我们的应用都要在服务端做一次记录，以方便用户下次请求的鉴别，通常而言 session 都是保存在内存中，而随着认证用户的增多，服务端的开销会明显增大。
2. 扩展性：用户认证之后，服务端做认证记录，如果认证的记录被保存在内存中的话，这意味着用户下次请求还必须要请求在这台服务器上，这样才能拿到授权的资源，这样在分布式的应用上，相应的限制了负载均衡器的能力。这也意味着限制了应用的扩展能力。
3. CSRF：因为是基于 cookie 来进行用户识别的，cookie 如果被截获，用户就会很容易受到跨站请求伪造的攻击。

| **对比项** | **JWT**            | **Session**       |
| ---------- | ------------------ | ----------------- |
| 存储位置   | 客户端（Token）    | 服务器（Session） |
| 状态管理   | 无状态             | 有状态            |
| 安全性     | 需要加密+签名      | 依赖服务器安全    |
| 适用于     | 分布式系统、微服务 | 传统 Web 应用     |

## 基本概念

### 什么是 JWT？

JWT（JSON Web Token）是一种用于身份认证和信息传递的轻量级安全令牌标准，基于 JSON 格式，它常用于用户身份验证、授权以及 信息传递，尤其在单点登录（SSO）和 前后端分离架构下被广泛使用。

作用：只需要服务端生成 token，客户端保存这个 token，每次请求携带这个 token，服务端认证解析即可。简单便捷，无需通过 Redis 缓存，而是直接根据 token 取出保存的用户信息，以及对 token 可用性校验

### 优缺点

**优点**

1. 占资源少：不在服务端保存信息
2. 扩展性好：分布式中，Session 需要做多机数据共享，通常存在数据库或者 Redis 中，而 JWT 不需要
3. 跨语言：Token 是以 JSON 加密的形式保存在客户端的，所以 JWT 是跨语言的，原则上任何 web 形式都支持

**缺点**

1. 无法废弃已颁布的令牌：一旦签发一个 JWT，在到期之前就会始终有效，无法中途废弃。例如：在 payload 中存储了一些信息，当信息需要更新时，则重新签发一个 JWT，但由于旧的 JWT 还没过期，拿着这些旧的 JWT 依旧可以登录

解决方法：服务端部署额外的逻辑，例如：设置黑名单，一旦签发了新的 JWT，旧的就加入黑名单（如存在 Redis 里面），避免被再次使用（违背 JWT 初衷）

2. 过期需要重新生成 JWT：Cookie 续签方案一般都是框架自带的，如：Session 有效期 30 分钟，若 30 分钟内有访问，有效期刷新至 30 分钟。对于 JWT，改变 JWT 的有效时间，就要签发新的 JWT

解决方法：

+ 每次请求刷新 JWT，即每个 HTTP 请求都返回一个新的 JWT，这个方法每次请求都要做 JWT 的加密解密，会带来性能问题
+ 在 Redis 中单独为每个 JWT 设置过期时间，每次访问时刷新 JWT 的过期时间，引入 Redis 后就把无状态的 JWT 变成了有状态（违背了 JWT 的初衷）

### JWT 的构成

一个 token 分 3 部分，按顺序为：头部（header），载荷（payload），签证（signature），每部分使用 `.` 进行分隔：Header.Payload.Signature

#### header
JWT 的头部承载两部分信息：

1. alg：签名算法（如 HS256、RS256）

2. typ：令牌类型（JWT）

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

#### playload
载荷就是存放有效信息的地方。这个名字像是特指飞机上承载的货品，这些有效信息包含三个部分 

1. 标准中注册的声明 

* iss（issuer）：签发人 
* exp（expiration time）：过期时间 
* sub（subject）：主题 
* aud（audience）：接收 JWT 的一方 
* nbf（Not Before）：生效时间 
* iat （Issued At）：签发时间 
* jti（JWT ID）：JWT 的唯一标识 

2. 公共的声明：如 username、role 等。

3. 私有的声明，应用程序自定义字段。

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

#### signature
JWT 的第三部分是一个签证信息，这个签证信息由三部分组成：

1. header (base64 后的)
2. payload (base64 后的)
3. secret 

```json
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
	your-256-bit-secret
)
```

## 基本使用

### jjwt

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.9.1</version>
</dependency>
```

```java
@SpringBootTest
class Jwt01ApplicationTests {

    private long time=1000*60*60*24;
    private String signature="admin";
    
    @Test
    void contextLoads() {
        JwtBuilder jwtBuilder= Jwts.builder();
        String jwtToken = jwtBuilder
                //header
                .setHeaderParam("typ", "JWT")
                .setHeaderParam("alg","HS256")
                //payload
                .claim("username","tom")
                .claim("role","admin")
                .setSubject("admin-text")
                .setExpiration(new Date(System.currentTimeMillis()+time))
                .setId(UUID.randomUUID().toString())
                //signature
                .signWith(SignatureAlgorithm.HS256,signature)
                .compact();

        System.out.println(jwtToken);
    }

    @Test
    public void parse(){
        String token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InRvbSIsInJvbGUiOiJhZG1pbiIsInN1YiI6ImFkbWluLXRleHQiLCJleHAiOjE2MzY0NjM4OTcsImp0aSI6Ijg5OTkzZGM1LWE5OGQtNDhkZS1hMDg0LTgzMWNlNjcxMGJmZCJ9.hHFAbj6d9e0_y1JXtf2q3ZBbO1M3iIbO_s0v6YqUPeM";
        JwtParser parser = Jwts.parser();
        Jws<Claims> claimsJws = parser.setSigningKey(signature).parseClaimsJws(token);
        Claims body = claimsJws.getBody();
        System.out.println(body.get("username"));
        System.out.println(body.get("role"));
        System.out.println(body.getId());
        System.out.println(body.getSubject());
        System.out.println(body.getExpiration());
    }
}
```

### java-jwt

```xml
<dependency>
    <groupId>com.auth0</groupId>
    <artifactId>java-jwt</artifactId>
    <version>3.18.2</version>
</dependency>
```

1. JWTUtils 工具类

```java
public class JWTUtils {
    private static final String SING="!abcd";

    /**
     * 生成 token  header.payload.sing
     */
    public static String getToken(Map<String,String> map){
        Calendar instance = Calendar.getInstance();
        instance.add(Calendar.DATE,7);//默认 7 天过期
        JWTCreator.Builder builder = JWT.create();
        //payload
        map.forEach((k,v)->{
            builder.withClaim(k,v);
        });
        String token = builder.withExpiresAt(instance.getTime())
                .sign(Algorithm.HMAC256(SING));
        return token;
    }

    /**
     * 验证 token
     */
    public static DecodedJWT verify(String token){
        return JWT.require(Algorithm.HMAC256(SING)).build().verify(token);
    }

   /**
    * 获取 token 信息
    */
   public static DecodedJWT getTokenInfo(String token){
       DecodedJWT verify = JWT.require(Algorithm.HMAC256(SING)).build().verify(token);
       return verify;
   }
}
```

2. 拦截器

```java
public class JWTInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = request.getHeader("token");
        HashMap<String, Object> map = new HashMap<>();
        try {
            DecodedJWT verify = JWTUtils.verify(token);
            return true;
        }catch (SignatureVerificationException e){
            e.printStackTrace();//签名异常
            map.put("msg","无效签名");
        }catch (TokenExpiredException e){
            e.printStackTrace();//过期异常
            map.put("msg","token过期");
        }catch (AlgorithmMismatchException e){
            e.printStackTrace();//算法异常
            map.put("msg","算法不一致");
        }catch (Exception e){
            e.printStackTrace();
            map.put("msg","token无效");
        }
        map.put("state",false);
        //将 map 转为 json
        String json = new ObjectMapper().writeValueAsString(map);
        response.setContentType("application/json;charset=utf-8");
        response.getWriter().print(json);
        return false;
    }
}
```

```java
@Configuration
public class InterceptorConfig implements WebMvcConfigurer {
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new JWTInterceptor())
                .addPathPatterns("/user/test")
                .excludePathPatterns("/user/login");
    }
}
```

3. 接口获取 jwt

```java
@RestController
@Slf4j
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/user/login")
    public Map<String,Object> login(User user){
        log.info("用户名：[{}]",user.getName());
        log.info("密码：[{}]",user.getPwd());
        HashMap<String, Object> map = new HashMap<>();
        try {
            User login = userService.login(user);
            HashMap<String,String> payload = new HashMap<>();
            payload.put("id",login.getId());
            payload.put("name",login.getName());
            //生成 JWT 的令牌
            String token = JWTUtils.getToken(payload);

            map.put("state",true);
            map.put("msg","认证成功");
            map.put("token",token);
        }catch (Exception e){
            map.put("state",false);
            map.put("msg",e.getMessage());
        }
        return map;
    }

    @RequestMapping("/user/test")
    public Map<String,Object> test(HttpServletRequest request){
        HashMap<String, Object> map = new HashMap<>();
        String token = request.getHeader("token");
        DecodedJWT verify = JWTUtils.verify(token);
        log.info("用户id：[{}]",verify.getClaim("id").asString());
        log.info("用户name：[{}]",verify.getClaim("name").asString());

        map.put("state",true);
        map.put("msg","请求成功");
        return map;
    }
}
```

### 前端传递 token

1. 放在请求头中

```json
 $.ajax({
    type: "post",
    url: "http:///test/getInfo",
    headers: {      //请求头
        Accept: "application/json; charset=utf-8",
        token: "" + token  //这是获取的token
    },
    data:JSON.stringify(jsonDate),
    contentType: "application/json",  //推荐写这个
    dataType: "json",
    success: function(data){
      console.log('ok');
    },
    error:function(){
        console.log('error');
    }
})
```

2. 使用 beforeSend 设置请求头

```json
 $.ajax({
            type: "post",
            url: "http://aliyun.seatang.cn:8080/onlinejudge/test/getInfoById",
            beforeSend: function(request) {      //使用beforeSend
                request.setRequestHeader("token", token);
                 request.setRequestHeader("Content-Type","application/json");
             },
            data:JSON.stringify(jsonDate),
            dataType: "json",
            success: function(data){
                console.log('ok');
            },
            error:function(){
                console.log('error');
            }
        })
```

3. 前端保存 token

```javascript
data: {
  token:localStorage.getItem("token");
},
success: function (token) {
  localStorage.setItem("token",token);
}
```

### 工具类

```java
public class JWTUtil {

    // 过期时间 5 分钟
    private static final long EXPIRE_TIME = 5*60*1000;
	// 密钥
    private static final String SECERT="chen";
    
    /**
     * 校验 token 是否正确
     * @param token 密钥
     * @param secret 用户的密码
     * @return 是否正确
     */
    public static boolean verify(String token, String username, String secret) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withClaim("username", username)
                    .build();
            DecodedJWT jwt = verifier.verify(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    /**
     * 获得 token 中的信息无需 secret 解密也能获得
     * @return token 中包含的用户名
     */
    public static String getUsername(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            return jwt.getClaim("username").asString();
        } catch (JWTDecodeException e) {
            return null;
        }
    }

    /**
     * 生成签名,5min 后过期
     * @param username 用户名
     * @param secret 用户的密码
     * @return 加密的 token
     */
    public static String sign(String username) {
        try {
            Date date = new Date(System.currentTimeMillis()+EXPIRE_TIME);
            Algorithm algorithm = Algorithm.HMAC256(SECERT);
            // 附带 username 信息
            return JWT.create()
                    .withClaim("username", username)
                    .withExpiresAt(date)
                    .sign(algorithm);
        } catch (UnsupportedEncodingException e) {
            return null;
        }
    }
}
```

