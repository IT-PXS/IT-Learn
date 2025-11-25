---
title: MySQL（3-事务和日志）
tags: MySQL
categories: 数据库
cover: /img/index/mysql.png
top_img: /img/index/mysql.png
published: false
abbrlink: 63240
date: 2024-11-22 22:38:34
description:
---

## Java 使用

```xml
<dependency>
    <groupId>org.eclipse.paho</groupId>
    <artifactId>org.eclipse.paho.client.mqttv3</artifactId>
    <version>1.2.5</version>
</dependency>
```

### 生产者

```java
/**
 * 消息发布者
 */
public class Publish {
    // 代理服务器地址
    private static final String BROKER = "wss://y81cc050.ala.cn-hangzhou.emqxsl.cn:8084";

    public static void main(String[] args) throws MqttException {
        /*
            创建消息发布客户端对象
            第一个参数: 代理服务器地址
            第二个参数: 给客户端起一个唯一名字
            第三个参数: 使用MemoryPersistence进行动态消息存储,如果不给值,使用内部默认的类进行持久消息存储
         */
        MqttClient client = new MqttClient(BROKER, MqttClient.generateClientId(), new MemoryPersistence());
        // 创建MQTT连接配置
        MqttConnectOptions connection = new MqttConnectOptions();
        /*
            是否清空会话session
            如果设置false那么就会保留历史session
            如果设置成true每次连接都是新的session
        */
        connection.setCleanSession(true);
        // 设置认证信息
        connection.setUserName("root");
        connection.setPassword("root123456".toCharArray());
        // 将客户端和连接关联
        client.connect(connection);

        /*
            创建消息
            调用有参构造函数进行创建,参数传一个byte数组,数组中是要发布的消息(有效载荷)
         */
        MqttMessage message = new MqttMessage("我是要发布的消息".getBytes(StandardCharsets.UTF_8));
        //设置服务质量
        message.setQos(2);
        /*
            消息发布
            第一个参数: 消息发送到哪一个主题
            第二个参数: 发送的消息对象
         */
        client.publish("test", message);

        // 断开连接
        client.disconnect();
        // 关闭
        client.close();
    }
}
```

### 消费者

```java
/**
 * 消息订阅者
 */
public class Subscribe {

    // 代理服务器地址
    private static final String BROKER = "wss://y81cc050.ala.cn-hangzhou.emqxsl.cn:8084";

    public static void main(String[] args) throws MqttException {
        /*
            创建消息发布客户端对象
            第一个参数: 代理服务器地址
            第二个参数: 给客户端起一个唯一名字
            第三个参数: 使用MemoryPersistence进行动态消息存储,如果不给值,使用内部默认的类进行持久消息存储
         */
        MqttClient client = new MqttClient(BROKER, MqttClient.generateClientId(), new MemoryPersistence());
        // 创建MQTT连接配置
        MqttConnectOptions connection = new MqttConnectOptions();
        /*
            是否清空会话session
            如果设置false那么就会保留历史session
            如果设置成true每次连接都是新的session
        */
        connection.setCleanSession(true);
        // 设置认证信息
        connection.setUserName("root");
        connection.setPassword("root123456".toCharArray());
        // 将客户端和连接关联
        client.connect(connection);
        // 设置回调函数(当发布者发布消息后被订阅者监听到,并且通过回调函数进行接收)
        client.setCallback(new MqttCallback() {
            // 连接丢失
            public void connectionLost(Throwable throwable) {
                System.out.println("连接已丢失..." + throwable.getMessage());
            }

            // 消息已送达
            public void messageArrived(String topic, MqttMessage message) {
                System.out.println("Received message: \n  topic：" + topic + "\n  Qos：" + message.getQos() + "\n  payload："
                        + new String(message.getPayload()));
            }

            // 消息接收完成
            public void deliveryComplete(IMqttDeliveryToken iMqttDeliveryToken) {
                System.out.println("消息接受已完成...." + iMqttDeliveryToken.isComplete());
            }
        });

        /*
         * 订阅test主题的消息
         * subscribe消息订阅函数
         * 参数1: 要订阅的主题
         * 参数2: 服务质量,取值为 0、1、2
         */
        client.subscribe("test", 2);
        System.out.println("消息监听开始.....");
    }
}
```

## SpringBoot 使用

### Spring Intergration 核心组件

#### Message（消息）

Message 是对消息的包装，在 Spring 系统中传递的任何消息都会被包装为 Message，可以理解为是 Spring Integration 消息传递的基本单位

#### Message Channel（消息管道）

消息管道：Message 在 Message Channel 中进行传递，生产者向管道中投递消息，消费者从管道中取出消息。

Spring Integration 支持两种消息传递模型，point-to-point（点对点模型），Publish-subscribe（发布订阅模型）有多种管道类型。

#### Message Endpoint（消息切入点）

消息切入点：消息在管道中流动那必定会有某些流入或流出的点亦或是在某个位置（即特定函数）需要对消息进行处理，过滤，格式转换等。这些点即为 Message Endpoint（实际为某些处理函数），例如消息发送，消息接收都是 Message Endpoint。

#### Message Transformer（消息转化器）

消息转化器：是将消息进行特定转换例如将一个 Object 序列化为 Json 字符串

#### Message Filter（消息过滤器）

消息过滤器：过滤掉特定消息。例如在管道中发送的含 username 和 age 属性的 User 对象，如果当前消息（一个 User 实例的包装）的 age < 18 则将其过滤掉，那么处在过滤器之后的消费者将无法接收到 age < 18 的 User 对象。当然过滤条件不仅是消息负载的属性，也可以是消息本身的属性。

#### Message Router（消息路由）

消息路由：向管道投递消息时可由消息路由根据路由规则选择投递给那个管道

#### Splitter（分割器）

分割器：它从一个输入管道接收一条消息并将其分割为多条消息，再将每条消息发送到不同的输出管道上

#### Aggregator（聚合器）

聚合器：与分割器功能刚好相反

#### Service Activator

Service Activator：它是一个用于将系统服务实例接入到消息系统的泛型切入点，该切入点必须配置输入管道。其返回值可是消息类型也可以是一个消息处理器，当返回值为消息类型时需要指定输出管道，即在该切入点对消息加工处理后再发送到指定的输出管道，如果返回值为消息处理器。那么消息交由消息处理器进行处理。下文中会为 Mqtt 消息出站配置 Service Activator 并且 返回值为消息处理器

#### Channel Adapter（管道适配器）

管道适配器：因为外部协议有无数种，消息适配器则用于连接不同协议的外部系统。从外部系统读入数据并对数据进行处理最终与 Spring Integration 内部的消息系统适配。例如将要进行 Mqtt 集成，那么就需要一个 Mqtt 的管道适配器，事实上也确实有一个，下文中将会看到。

```xml
<dependency>
    <groupId>org.springframework.integration</groupId>
    <artifactId>spring-integration-mqtt</artifactId>
    <version>5.3.8.RELEASE</version>
</dependency>
```

```java
@Configuration
public class Publisher {

    @Bean(name = "mqttOutboundChannel")
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    /**
     * 建立MQTT连接，配置连接的参数选项
     */
    @Bean
    public MqttPahoClientFactory mqttOutClient() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions mqttConnectOptions = new MqttConnectOptions();
        mqttConnectOptions.setServerURIs(new String[]{"wss://y81cc050.ala.cn-hangzhou.emqxsl.cn:8084"});
        mqttConnectOptions.setUserName("root");
        mqttConnectOptions.setPassword("root123456".toCharArray());
        // 接收离线消息
        // 告诉代理客户端是否要建立持久会话，false为建立持久会话
        mqttConnectOptions.setCleanSession(false);
        factory.setConnectionOptions(mqttConnectOptions);
        return factory;
    }

    // 发布通道
    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound() {
        MqttPahoMessageHandler messageHandler = new MqttPahoMessageHandler(MqttClient.generateClientId(), mqttOutClient());
        // 设置发送消息的默认主题，后续发送可以指定topic，所以这里无影响
        messageHandler.setDefaultTopic("test");
        messageHandler.setAsync(true);
        return messageHandler;
    }
}
```

```java
@Configuration
@IntegrationComponentScan
public class Consumer {

    @Bean(name = "mqttInputChannel")
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }
    
    @Bean(name = "mqttErrorChannel")
    public MessageChannel mqttErrorChannel() {
        return new DirectChannel();
    }

    @Bean
    public MqttPahoClientFactory mqttInClient() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        // 这里配置了订阅的主题
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{"wss://y81cc050.ala.cn-hangzhou.emqxsl.cn:8084"});
        options.setUserName("root");
        options.setPassword("root123456".toCharArray());
        // 接受离线消息
        options.setCleanSession(false);
        // 设置是否自动重连
        options.setAutomaticReconnect(true);
        // 设置连接超时
        options.setConnectionTimeout(10);
        // 设置会话心跳时间
        options.setKeepAliveInterval(2);
        factory.setConnectionOptions(options);
        return factory;
    }

    /**
     * 配置Client，监听Topic
     */
    @Bean
    public MessageProducer inbound() {
        // Mqtt管道适配器
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(MqttClient.generateClientId(),
                mqttInClient(), "test/#");
        // 添加 TOPICS
        // adapter.addTopic();
        adapter.setCompletionTimeout(1000 * 5);
        adapter.setQos(1);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setOutputChannel(mqttInputChannel());
		adapter.setErrorChannel(mqttErrorChannel());
        return adapter;
    }

    /**
     * 通过通道获取数据，即处理MQTT发送过来的消息，可以通过MQTTX工具发送数据测试
     */
    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler handler() {
        return message -> {
            Object payload = message.getPayload();
            MessageHeaders messageHeaders = message.getHeaders();
            Object qos = messageHeaders.get(MqttHeaders.RECEIVED_QOS);
            String topic = (String) messageHeaders.get(MqttHeaders.RECEIVED_TOPIC);
            // 解析数据，分发到指定方法
            String handMessage = "收到消息" + " topic ===> " + topic + "\nQOS ===> " + qos + "\n内容 ===> " + payload;
            System.out.println(handMessage);
        };
    }
}
```

```java
/**
 * mqtt消息发送
 */
@Service
@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
public interface MqttGateWayService {

    void sendMessageToMqtt(String data);

    void sendMessageToMqtt(String data, @Header(MqttHeaders.TOPIC) String topic);

    void sendMessageToMqtt(String data, @Header(MqttHeaders.TOPIC) String topic, @Header(MqttHeaders.QOS) int qos);

    void sendMessageToMqtt(byte[] data, @Header(MqttHeaders.TOPIC) String topic, @Header(MqttHeaders.QOS) int qos);
}
```

```java
@Service
public class MqttService {

    @Resource
    private MessageChannel mqttOutboundChannel;

    /**
     * 发送消息到默认主题
     *
     * @param payload 消息内容
     */
    public void sendMessage(String payload) {
        Message<String> message = MessageBuilder.withPayload(payload).build();
        mqttOutboundChannel.send(message);
    }

    /**
     * 发送消息到指定主题
     *
     * @param topic   主题
     * @param payload 消息内容
     */
    public void sendMessage(String topic, String payload) {
        Message<String> message = MessageBuilder.withPayload(payload)
                .setHeader(MqttHeaders.TOPIC, topic)
                .build();
        mqttOutboundChannel.send(message);
    }

    /**
     * 发送消息到指定主题并设置QoS
     *
     * @param topic   主题
     * @param payload 消息内容
     * @param qos     QoS级别(0,1,2)
     */
    public void sendMessage(String topic, String payload, int qos) {
        Message<String> message = MessageBuilder.withPayload(payload)
                .setHeader(MqttHeaders.TOPIC, topic)
                .setHeader(MqttHeaders.QOS, qos)
                .build();
        mqttOutboundChannel.send(message);
    }
}
```

```java
@RestController
@RequestMapping("/mqtt")
public class MqttController {

    @Resource
    private MqttGateWayService gateWay;
    @Resource
    private MqttService mqttService;

    @PostMapping(value = "/sendMqtt")
    public void sendMqtt(@RequestParam(value = "topic") String topic,
                         @RequestParam(value = "msg") String msg,
                         @RequestParam(value = "qos") int qos) {
        gateWay.sendMessageToMqtt(msg, topic, qos);
    }

    /**
     * 发送消息到默认主题
     */
    @GetMapping("/send/{message}")
    public String send(@PathVariable String message) {
        mqttService.sendMessage(message);
        return "Message sent: " + message;
    }

    /**
     * 发送消息到指定主题
     */
    @GetMapping("/send/{topic}/{message}")
    public String sendToTopic(
            @PathVariable String topic,
            @PathVariable String message) {
        mqttService.sendMessage(topic, message);
        return "Message sent to topic " + topic + ": " + message;
    }
}
```

**其他**

在有些设备开发中，发送中文字符需要使用他指定的编码格式，例如 GBK，发送时可以使用 MqttGateWayService 中的第四个方法，可以使用工具 MQTT.fx 进行测试，发送的中文是 GBK 编码，MQTTX 则是 UTF-8

```java
@PostMapping(value = "/sendGBK")
public void sendMqtt(@RequestParam(value = "topic") String topic,
                     @RequestParam(value = "msg") String msg,
                     @RequestParam(value = "qos") int qos) {
    gateWay.sendMessageToMqtt(msg.getBytes("GBK"), topic, qos);
}
```

```java
/**
 * 配置Client，监听Topic
 */
@Bean
public MessageProducer inbound() {
    // Mqtt管道适配器
    MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(MqttClient.generateClientId(),
            mqttInClient(), "test/#");
    // 添加 TOPICS
    // adapter.addTopic();
    adapter.setCompletionTimeout(1000 * 5);
    adapter.setQos(1);
    // 设置转换器，用byte[]接收
    DefaultPahoMessageConverter defaultPahoMessageConverter = new DefaultPahoMessageConverter();
    defaultPahoMessageConverter.setPayloadAsBytes(true);
    adapter.setConverter(defaultPahoMessageConverter);
    adapter.setOutputChannel(mqttInputChannel());
    adapter.setErrorChannel(mqttErrorChannel());
    return adapter;
}
```

```java
/**
 * 通过通道获取数据,即处理 MQTT 发送过来的消息，可以通过 MQTTX 工具发送数据测试
 */
@Bean
@ServiceActivator(inputChannel = "mqttInputChannel")
public MessageHandler handler() {
    return message -> {
        Object payload = message.getPayload();
        String data = "";
        try {
            if (payload instanceof byte[]) {
                data = new String((byte[]) payload, "GBK");
            } else if (payload instanceof String) {
                data = (String) payload;
            }
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
    };
}
```

### 其他

**核心组件**

`MqttPahoClientFactory`

- **作用**：配置 MQTT 客户端连接选项（如服务器地址、用户名、密码、超时设置等）。

- **实现类**：`DefaultMqttPahoClientFactory`

- **关键配置项**：

```java
MqttConnectOptions options = new MqttConnectOptions();
options.setServerURIs(new String[]{"tcp://broker.hivemq.com:1883"}); // MQTT 服务器地址
options.setUserName("username");  // 用户名（可选）
options.setPassword("password".toCharArray());  // 密码（可选）
options.setConnectionTimeout(10); // 连接超时（秒）
options.setKeepAliveInterval(60); // 心跳间隔（秒）
options.setAutomaticReconnect(true); // 自动重连
factory.setConnectionOptions(options);
```

`MqttPahoMessageHandler`

- **作用**：向 MQTT Broker **发送消息**。

- **关键配置**：

```java
MqttPahoMessageHandler handler = new MqttPahoMessageHandler("clientId-out", mqttClientFactory);
handler.setDefaultTopic("default/topic"); // 默认发送主题
handler.setAsync(true); // 异步发送（推荐）
handler.setConverter(new DefaultPahoMessageConverter()); // 消息转换器
```

- **绑定到消息通道**：

```java
@ServiceActivator(inputChannel = "mqttOutboundChannel")
public MessageHandler mqttOutbound() { ... }
```

`MqttPahoMessageDrivenChannelAdapter`（入站消息适配器）

- **作用**：订阅 MQTT 主题并 **接收消息**。

- **关键配置**：

```java
MqttPahoMessageDrivenChannelAdapter adapter = 
  new MqttPahoMessageDrivenChannelAdapter("clientId-in", mqttClientFactory, "topic1", "topic2");
adapter.setQos(1); // QoS 级别（0/1/2）
adapter.setCompletionTimeout(5000); // 操作超时（毫秒）
adapter.setConverter(new DefaultPahoMessageConverter()); // 消息转换器
adapter.setOutputChannel(mqttInputChannel()); // 绑定消息通道
```

`MessageChannel`（消息通道）

- **作用**：作为消息传递的管道，连接生产者和消费者。

- **常用实现**：

  - `DirectChannel`（默认，同步处理）
  - `PublishSubscribeChannel`（发布/订阅模式）
  - `ExecutorChannel`（异步处理）

- **示例**：

```java
@Bean
public MessageChannel mqttInputChannel() {
    return new DirectChannel(); // 入站通道
}

@Bean
public MessageChannel mqttOutboundChannel() {
    return new DirectChannel(); // 出站通道
}
```

`MessageHandler`（消息处理器）

- **作用**：处理从 MQTT 接收到的消息。

- **绑定方式**：

```java
@Bean
@ServiceActivator(inputChannel = "mqttInputChannel")
public MessageHandler handler() {
  return message -> {
      String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);
      String payload = message.getPayload().toString();
      System.out.println("Received: " + topic + " | " + payload);
  };
}
```

**核心注解**

`@IntegrationComponentScan`

- **作用**：扫描 Spring Integration 组件（如 `@ServiceActivator`）。

`@ServiceActivator`

- **作用**：将方法绑定到消息通道，处理输入/输出消息。

- **示例**：

```java
@ServiceActivator(inputChannel = "mqttOutboundChannel")
public MessageHandler mqttOutbound() { ... }

@ServiceActivator(inputChannel = "mqttInputChannel")
public MessageHandler handler() { ... }
```

`@MessagingGateway`（可选）

- **作用**：定义消息网关接口，简化 MQTT 调用。

- **示例**：

```java
@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
public interface MqttGateway {
  void sendToMqtt(String payload);
  void sendToMqtt(@Header(MqttHeaders.TOPIC) String topic, String payload);
}
```

  **调用方式**：

```java
@Autowired
private MqttGateway mqttGateway;

mqttGateway.sendToMqtt("Hello MQTT!"); // 发送到默认主题
mqttGateway.sendToMqtt("custom/topic", "Hello!"); // 发送到指定主题
```

**消息头（Headers）**

MQTT 消息可以携带元信息，通过 `MessageHeaders` 传递：

| **Header 键**          | **说明**                     |
| :--------------------- | :--------------------------- |
| `MqttHeaders.TOPIC`    | 消息主题（用于发送时指定）   |
| `MqttHeaders.QOS`      | QoS 级别（0/1/2）            |
| `MqttHeaders.RETAINED` | 是否保留消息（true/false）   |
| `mqtt_receivedTopic`   | 接收到的消息主题（入站消息） |

**示例**：

```java
// 发送消息时指定 Topic 和 QoS
Message<String> message = MessageBuilder.withPayload("Hello")
        .setHeader(MqttHeaders.TOPIC, "test/topic")
        .setHeader(MqttHeaders.QOS, 1)
        .build();
mqttOutboundChannel.send(message);

// 接收消息时获取 Topic
@ServiceActivator(inputChannel = "mqttInputChannel")
public MessageHandler handler() {
    return message -> {
        String topic = message.getHeaders().get("mqtt_receivedTopic", String.class);
        System.out.println("Topic: " + topic);
    };
}
```

**总结**

| **组件/注解**                         | **作用**                   |
| :------------------------------------ | :------------------------- |
| `MqttPahoClientFactory`               | 配置 MQTT 连接参数         |
| `MqttPahoMessageHandler`              | 发送消息到 MQTT Broker     |
| `MqttPahoMessageDrivenChannelAdapter` | 订阅 MQTT 主题并接收消息   |
| `MessageChannel`                      | 消息传递通道               |
| `@ServiceActivator`                   | 绑定消息处理器到通道       |
| `@MessagingGateway`                   | 定义简化调用的消息网关接口 |

通过合理组合这些组件和注解，可以轻松实现 **MQTT 消息的发布和订阅**。如果需要更复杂的逻辑（如 JSON 序列化、多主题动态订阅），可以结合 `ObjectMapper` 和 Spring Integration 的动态通道适配器进一步扩展。
