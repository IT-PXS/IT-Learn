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

## SpringBoot 整合

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

### Fanout

```yaml
# 配置rabbitmq服务
spring:
  rabbitmq:
    username: admin
    password: admin
    virtual-host: /
    host: 127.0.0.1
    port: 5672
```

```java
@Configuration
public class RabbitMqConfiguration{
    
    //1.声明注册fanout模式的交换机
    @Bean
    public FanoutExchange fanoutExchange(){
        return new FanoutExchange("fanout_order_exchange",true,false);
    }
    
    //2.声明队列
    @Bean
    public Queue smsQueue(){
        return new Queue("sms.fanout.queue",true);
    }
    
    @Bean
    public Queue duanxinQueue(){
        return new Queue("duanxin.fanout.queue",true);
    }
    
    @Bean
    public Queue emailQueue(){
        return new Queue("email.fanout.queue",true);
    }
    
    //3.完成绑定关系
    @Bean
    public Binding smsBingding(){
        return BindingBuilder.bin(smsQueue()).to(fanoutExchange());
    }
    
    @Bean
    public Binding duanxinBingding(){
        return BindingBuilder.bin(duanxinQueue()).to(fanoutExchange());
    }
    
    @Bean
    public Binding emailBingding(){
        return BindingBuilder.bin(emailQueue()).to(fanoutExchange());
    }
}
```

```java
public class OrderService{
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    //模拟用户下单
    public void makeOrder(String userid,String productid,int num){
        //1.根据商品id查询库存是否足够
        //2.保存订单
        String orderId = UUID.randomUUID().toString();
        sout("订单生产成功："+orderId);
        //3.通过MQ来完成消息的分发
        //参数1：交换机 
        //参数2：路由key/queue队列名称 
        //参数3：消息内容
        String exchangeName = "fanout_order_exchange";
        String routingKey = "";
        rabbitTemplate.convertAndSend(exchangeName,routingKey,orderId);
    }
}
```

```java
@Component
@RabbitListener(queue = {"sms.direct.queue"})
public class FanoutSmsConsumer{
    @RabbitHandler
    public void reviceMessage(String message){
        System.out.println("sms接收到了的订单信息是："+message);
    }
}

@Component
@RabbitListener(queue = {"duanxin.direct.queue"})
public class FanoutDuanxinConsumer{
    @RabbitHandler
    public void reviceMessage(String message){
        System.out.println("duanxin接收到了的订单信息是："+message);
    }
}

@Component
@RabbitListener(queue = {"duanxin.direct.queue"})
public class FanoutEmailConsumer{
    @RabbitHandler
    public void reviceMessage(String message){
        System.out.println("email接收到了的订单信息是："+message);
    }
}
```

### Direct

```java
@Configuration
public class RabbitMqConfiguration{
    //1.声明注册fanout模式的交换机
    @Bean
    public DirectExchange directExchange(){
        return new DirectExchange("direct_order_exchange",true,false);
    }
    
    //2.声明队列
    @Bean
    public Queue smsQueue(){
        return new Queue("sms.direct.queue",true);
    }
    
    @Bean
    public Queue duanxinQueue(){
        return new Queue("duanxin.direct.queue",true);
    }
    
    @Bean
    public Queue emailQueue(){
        return new Queue("email.direct.queue",true);
    }
    
    //3.完成绑定关系
    @Bean
    public Binding smsBingding(){
        return BindingBuilder.bin(smsQueue()).to(directExchange()).with("sms");
    }
    
    @Bean
    public Binding duanxinBingding(){
        return BindingBuilder.bin(duanxinQueue()).to(directExchange()).with("duanxin");
    }
    
    @Bean
    public Binding emailBingding(){
        return BindingBuilder.bin(emailQueue()).to(directExchange()).with("email");
    }
}
```

```java
@Service
public class OrderService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void makeOrder(String userId, String productId, int num) {
        String orderId = UUID.randomUUID().toString();
        System.out.println("保存订单成功：id是" + orderId);
        rabbitTemplate.convertAndSend("direct_order", "dir1", orderId);
        rabbitTemplate.convertAndSend("direct_order", "dir2", orderId);
    }
}
```

### Topic

```java
@Configuration
public class RabbitMqConfig {

    @Bean
    public TopicExchange topicExchange(){
        return new TopicExchange("topic_order",true,false);
    }

    @Bean
    public Queue topicQue1(){
        return new Queue("topic_que1",true);
    }
    
    @Bean
    public Queue topicQue2(){
        return new Queue("topic_que2",true);
    }
    
    @Bean
    public Queue topicQue3(){
        return new Queue("topic_que3",true);
    }

    @Bean
    public Binding dingQue1(){
        return BindingBuilder.bind(topicQue1()).to(topicExchange()).with("com.#");
    }
    
    @Bean
    public Binding dingQue2(){
        return BindingBuilder.bind(topicQue2()).to(topicExchange()).with("com.order.#");
    }
    
    @Bean
    public Binding dingQue3(){
        return BindingBuilder.bind(topicQue2()).to(topicExchange()).with("#.user.#");
    }
}
```

## 消息确认机制（ACK）

为了保证消息从队列可靠地到达消费者，RabbitMQ 提供了消息确认机制。消费者在订阅队列时可以指定 autoAck 参数，当 autoAck 参数等于 false 时，RabbitMQ 会等待消费者显示地回复确认信号后才从内存（或者磁盘）中移除消息（实际上是先打上删除标记，之后再删除）。当 autoAck 参数等于 true 时，RabbitMQ 会自动把发送出去的消息置为确认，然后从内存（或者磁盘）中删除，而不管消费者是否真正地消费到这些消息

### 发送方确认模式

1. channel.waitForConfirms()：普通发送方确认模式

```java
public class Producer1 {

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory factory=new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection=null;
        Channel channel=null;
        try {
            connection=factory.newConnection();
            channel=connection.createChannel();
            
            channel.queueDeclare("myQueue1",true,false,false,null);
            //启动发送者确认模式
            channel.confirmSelect();
            
            String msg="hello";
            channel.basicPublish("","myQueue1",null,msg.getBytes());
            //阻塞线程，等待服务器返回响应，该方法可以指定一个等待时间
            if (channel.waitForConfirms()){
                System.out.println("发送成功！");
            }else {
                System.out.println("发送失败！");
            }
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if (channel!=null){
                channel.close();
            }
            if (connection!=null){
                connection.close();
            }
        }
    }
}
```

2. channel.waitForConfirmsOrDie()：批量确认模式

用于确认一大批消息模式，但是一旦消息集合有一个没发送成功就会全部失败，需要全部进行补发。这种模式方法无返回值，只能根据异常进行判断，如果确认失败会抛出 IOException 和 InterruptedException

```java
public class Producer2 {

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory factory=new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection=null;
        Channel channel=null;
        try {
            connection=factory.newConnection();
            channel=connection.createChannel();
            
            channel.queueDeclare("myQueue2",true,false,false,null);
            //启动发送者确认模式
            channel.confirmSelect();
            String msg="hello";
            for (int i = 0; i < 5; i++) {
                channel.basicPublish("","myQueue2",null,msg.getBytes());
            }
            try {
                //阻塞线程，等待服务器返回响应，该方法可以指定一个等待时间，无返回值，只能根据抛出的异常判断
                channel.waitForConfirmsOrDie();
            }catch (InterruptedException e){
                System.out.println("发送失败，中断");
            }catch (Exception e){
                System.out.println("发送失败");
            }
            System.in.read();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if (channel!=null){
                channel.close();
            }
            if (connection!=null){
                connection.close();
            }
        }
    }
}
```

3. channel.addConfirmListener()：异步监听发送方确认模式

```java
public class Producer3 {

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory factory=new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection=null;
        Channel channel=null;
        try {
            connection=factory.newConnection();
            channel=connection.createChannel();
            
            channel.queueDeclare("myQueue3",true,false,false,null);
            //启动发送者确认模式
            channel.confirmSelect();
            for (int i = 0; i < 100; i++) {
                String msg="hello "+i;
                channel.basicPublish("","myQueue3",null,msg.getBytes());
            }
            
            //异步监听确认和未确认的消息
            channel.addConfirmListener(new ConfirmListener() {
                /**
                 * 参数1：确认的消息的编号，从1开始递增
                 * 参数2：当前消息是否同时确认了多个
                 * @throws IOException
                 */
                @Override
                public void handleAck(long l, boolean b) throws IOException {
                    System.out.println(String.format("确认消息，序号：%d，是否多个消息：%b",l,b));
                }

                /**
                 * 参数1：确认的消息的编号，从1开始递增
                 * 参数2：当前消息是否同时确认了多个
                 * @throws IOException
                 */
                @Override
                public void handleNack(long l, boolean b) throws IOException {
                    System.out.println(String.format("确认消息，序号：%d，是否多个消息：%b",l,b));
                }
            });
            System.in.read();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if (channel!=null){
                channel.close();
            }
            if (connection!=null){
                connection.close();
            }
        }
    }
}
```

异步模式的优点：执行效率高，不需要等待消息执行完，只需要监听消息即可

注意：不可以关闭 channel 和 connection

**总结**

1. 单独发布消息：同步等待确认，简单，但吞吐量非常有限。
2. 批量发布消息：批量同步等待确认，简单，合理的吞吐量，一旦出现问题但很难推断出是那条消息出现了问题。
3. 异步处理：最佳性能和资源使用，在出现错误的情况下可以很好地控制，但是实现起来稍微难些

### 消息发送确认

![](RabbitMQ（3-SpringBoot整合）/1.png)

1. ConfirmCallback 方法

ConfirmCallBack 是一个回调接口，消息发送到 Broker 后触发回调，确认消息是否到达 Broker 服务器，即只确认是否正确到达 Exchange 中

2. ReturnCallback 方法

通过实现 ReturnCallback 接口，启动消息失败返回，此接口是在交换机路由不到队列时触发回调，该方法可以不使用，因为交换器和队列是在代码里绑定的，如果消息成功投递到 Broker 后几乎不存在绑定队列失败，除非代码写错了

**yaml 配置**

1. publisher-confirm-type：表示确认消息的类型

+ publisher-confirm-type: none：表示禁用发布确认模式（默认值），使用此模式之后，不管消息有没有发送到 Broker 都不会触发 ConfirmCallback 回调
+ publisher-confirm-type: correlated：表示消息成功到达 Broker 后触发 ConfirmCallback 回调
+ publisher-confirm-type: simple：simple 模式下如果消息成功到达 Broker 后一样会触发 ConfirmCallback 回调，发布消息成功后使用 rabbitTemplate 调用 waitForConfirms 或 waitForConfirmsOrDie 方法等待 Broker 节点返回发送结果，根据返回结果来判定下一步的逻辑

注意：waitForConfirmsOrDie 方法如果返回 false 则会关闭 Channel 通道，则接下来无法发送消息到 Broker

2. publisher-returns: true：true 表示开启失败回调，开启后当消息无法路由到指定队列时会触发 ReturnCallback 回调

**使用案例**

```properties
spring:
  rabbitmq:
    username: guest
    password: guest
    host: localhost
    virtual-host: /
    port: 5672
    
    # 消息确认（ACK）
    publisher-confirm-type: correlated #确认消息已发送到交换机（Exchange）
    publisher-returns: true #确认消息已发送到队列（queue）
```

```java
@Configuration
public class RabbitMQConfig {
    
    public static final String QUEUE_NAME = "queue_name";
    public static final String EXCHANGE_NAME = "exchange_name";
    public static final String ROUTING_KEY = "routing_key";
    
    @Bean
    public RabbitTemplate createRabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate();
        rabbitTemplate.setConnectionFactory(connectionFactory);
        //设置开启Mandatory，才能开启回调函数，无论消息推送结果怎么样都强制调用回调函数
        rabbitTemplate.setMandatory(true);
        
        //确认消息发送到交换机（Exchange）回调
        rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {
            @Override
            public void confirm(CorrelationData correlationData, boolean b, String s) {
                System.out.println("\n确认消息发送到交换机（Exchange）结果：");
                System.out.println("相关数据" + correlationData);
                System.out.println("是否成功：" + b);
                System.out.println("错误原因：" + s);
            }
        });
        
        //确认消息发送到队列（Queue）回调
        rabbitTemplate.setReturnCallback(new RabbitTemplate.ReturnCallback() {
            @Override
            public void returnedMessage(Message message, int i, String s, String s1, String s2) {
                System.out.println("\n确认消息发送到队列（Queue）结果");
                System.out.println("发送消息：" + message);
                System.out.println("回应码：" + i);
                System.out.println("回应信息：" + s);
                System.out.println("交换机：" + s1);
                System.out.println("路由键：" + s2);
            }
        });
        return rabbitTemplate;
    }
    
    @Bean
    public Queue queue() {
        /**
        * String name：队列名称
        * boolean durable：设置是否持久化，默认是false，durable设置为true
        * 表示持久化的队列会存盘，在服务器重启的时候不会丢失相关信息
        * boolean exclusive：设置是否排他，默认是false，为true则设置队列为排他
        * boolean autoDelete：设置是否删除，为true则设置队列为自动删除
        * 当没有生产者或消费者使用此队列，该队列会自动删除
        * Map<String,Object> arguments：设置队列的其他一些参数
        */
        return new Queue(QUEUE_NAME, true, false, false, null);
    }
    
    @Bean
    public DirectExchange exchange() {
        /**
        * String name：交换机名称
        * boolean durable：设置是否持久化，默认是false，设置为true表示持久化
        * 持久化可以将交换机存盘，在服务器重启的时候不会丢失相关信息
        * boolean autoDelete：设置是否自动删除，为true则设置队列为自动删除
        */
        return new DirectExchange(EXCHANGE_NAME, true, false);
    }
    
    @Bean
    public Binding binding() {
        return BindingBuilder.bind(queue()).to(exchange()).with(ROUTING_KEY);
    }
}
```

```java
@SpringBootTest
public class RabbitMqTest{
    @Autowired
    RabbitTemplate rabbitTemplate;
 
    @Test
    public void sendMessage() throws Exception{
        String message = "您好，欢迎访问 pan_junbiao的博客";
 
        //这里故意将routingKey参数写入错误，让其应发确认消息送到队列失败回调
        rabbitTemplate.convertAndSend(RabbitMqConfig.EXCHANGE_NAME, "no_queue_name", message);
 
        //由于这里使用的是测试方法，当测试方法结束，RabbitMQ相关的资源也就关闭了，
        //会导致消息确认的回调出现问题，所有加段延时
        Thread.sleep(2000);
    }
}
```

### 消息接收确认

1. void basicAck(long deliveryTag, boolean multiple)：用于确认当前消息
2. void basicNack(long deliveryTag, boolean multiple, boolean requeue)：用于否定当前消息
3. void basicReject(long deliveryTag, boolean requeue)：用于明确拒绝当前的消息而不是确认，由于 basicReject 方法一次只能拒绝一条消息，如果想批量拒绝消息，则可以使用 basicNack 方法

属性：

1. deliveryTag（唯一标识 ID）：当一个消费者向 RabbitMQ 注册后，会建立起一个 Channel，RabbitMQ 会用 basic.deliver 方法向消费者推送消息，这个方法携带了一个 delivery tag，它代表 RabbitMQ 向该 Channel 投递的这条消息的唯一标识 ID，是一个单调递增的正整数，delivery tag 的范围仅限于 Channel
2. multiple（是否批处理）：当为 true 时，则可以一次性确认 delivery tag 小于等于传入值的所有消息；为 false 时只确认该 deliveryTag 的消息
3. requeue（是否重回队列）：如果为 true，则 RabbitMQ 会重新将这条消息存入队列，以便发送给下一个订阅的消费者；如果 requeue 参数设置为 false，则 RabbitMQ 立即会把消息从队列中移除，而不会把它发送给新的消费者

![](RabbitMQ（3-SpringBoot整合）/2.png)

**消息确认的三种模式**

1. 手动确认（listener.simple.acknowledge-mode: manual）：消费者消费消息后需要根据消费情况给 Broker 返回一个回执，是确认 ACK 使 Broker 删除该条已消费的消息，还是失败确认返回 NACK，还是拒绝该消息。开始手动确认后，如果消费者接收到消息后还没有返回 ACK 就宕机了，这种情况下消息也不会丢失，只有 RabbitMQ 接收到返回 ACK 后，消息才会从队列中被删除
2. 自动确认（listener.simple.acknowledge-mode: none）：RabbitMQ 默认消费者正确处理所有请求（不设置的默认方式）
3. 根据情况确认（listener.simple.acknowledge-mode: auto）

+ 如果消费者在消费的过程中没有抛出异常，则自动确认
+ 当消费者消费的过程中抛出 AmqpRejectAndDontRequeueException 异常的时候，则消息会被拒绝，且该消息不会重回队列
+ 当抛出 ImmediateAcknowledgeAmqpException 异常，消息会被确认
+ 如果抛出其他的异常，则消息会被拒绝，但是与前两个不同的是，该消息会重回队列，如果此时只有一个消费者监听该队列，那么该消息重回队列后又会推送给该消费者，会造成死循环的情况

**使用案例**

```yaml
spring:
  rabbitmq:
    username: guest
    password: guest
    host: localhost
    virtual-host: /
    port: 5672
    
    # 消息确认（ACK）
    publisher-confirm-type: correlated #确认消息已发送到交换机（Exchange） 
    publisher-returns: true #确认消息已发送到队列（queue）
    
    listener:
      simple:
        # 设置消费端手动ack
        acknowledge-mode: manual
        # manual：手动确认
        # none：自动确认
        # auto：根据情况自动确认
        
        #是否支持重试
        retry:
          enabled: true
```

```java
@Component
@RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
public class Customer {
    
    @RabbitHandler
    public void processHandler(String msg, Channel channel, Message message) throws IOException {
        try {
            System.out.println("收到消息：" + msg);
            int i = 1 / 0;
            
            long deliveryTag = message.getMessageProperties().getDeliveryTag();
            /**
            * deliveryTag：唯一标识ID
            * multiple：是否批处理，当该参数为true时，则可以一次性确认delivery_tag小于等于传入的参数
            */
            channel.basicAck(deliveryTag, false);
        } catch (Exception e) {
            System.out.println("返回消息队列再次处理...");
            long deliveryTag = message.getMessageProperties().getDeliveryTag();
            /**
            * deliveryTag：唯一标识ID
            * multiple：是否批处理，当该参数为true时，则可以一次性确认delivery_tag小于等于传入的参数
            * requeue：如果requeue设置为true，则RabbitMQ会重新将这条消息存入队列，以便发送给下一个订阅的消费者
            * 如果requeue设置为false，则RabbitMQ立即会把消息从队列中移除，而不会把它发送给新的消费者
            */
            channel.basicNack(deliveryTag, false, true);
        }
    }
}
```

问题：业务代码一旦出现 bug，多数情况不会自动修复，一条消息会被无限投递进队列，消费端一直接收处理-> 然后处理失败-> 重新回到队列，导致了死循环

**解决方法**

1. 将失败的消息拒绝之后，重新发送到队列的尾部，这样可以保证其他的正常的消息是可以被处理的

```java
//channel对象重新发送消息到队尾
channel.basicPublish(message.getMessageProperties().getReceivedExchange(),
                    message.getMessageProperties().getReceivedRoutingKey(), 
                     MessageProperties.PERSISTENT_TEXT_PLAIN,
                    JSON.toJSONBytes(msg));
```

2. 设置消息重试次数，达到了重试上限以后，队列删除此消息，并将消息持久化到数据库并推送报警，然后人工处理和定时任务补偿

## 死信队列（DLX）

DLX（dead-letter-exchange）：当消息在一个队列中变成死信之后，它能重新 publish 到另一个 Exchange，这个 Exchange 就是 DLX，DLX 是一个正常的交换机，它们可以像普通的交换机一样使用

进入死信队列的情况：

1. 消息被拒绝（basic.reject/basic.nack），并且 requeue = false
2. 消息 TTL 过期，RabbitMQ 可以对消息和队列设置 TTL
3. 消息队列达到最大长度

### 处理过程

DXL 是一个正常的 Exchange，和一般的 Exchange 没有区别，它能在任何的队列上被指定，实际上就是设置某个队列的属性。当这个队列中有死信时，RabbitMQ 就会自动地将这个消息重新发布到设置的 Exchange 上去，进而被路由到另一个队列，可以监听这个队列中的消息做相应的处理

![](RabbitMQ（3-SpringBoot整合）/3.png)

### 配置过程

1. 配置业务队列，绑定到业务交换机上
2. 为业务队列配置死信交换机和路由 key
3. 为死信交换机配置死信队列

**生产者**

```java
public class Producer {
    public static ConnectionFactory getConnectionFactory() {
        // 创建连接工程，下面给出的是默认的case
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");
        return factory;
    }

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory factory = getConnectionFactory();
        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection();
            channel = connection.createChannel();

            //声明一个死信交换机======order_dead_exchange
            channel.exchangeDeclare("order_dead_exchange", "direct", true, false, null);
            channel.queueDeclare("order_dead_queue", true, false, false, null);
            channel.queueBind("order_dead_queue", "order_dead_exchange", "order_dead_key");

            //声明队列并指定死信交换机为上面死信交换机
            Map<String, Object> arg = new HashMap<>();
            arg.put("x-dead-letter-exchange", "order_dead_exchange");
            //声明死信路由
            arg.put("x-dead-letter-routing-key", "order_dead_key");
            //设置队列中的消息10s钟后过期
            arg.put("x-message-ttl", 10000);
            //声明一个正常的direct类型的交换机
            channel.exchangeDeclare("order_exchange", "direct", true, false, null);
            channel.queueDeclare("order_queue", true, false, false, arg);
            channel.queueBind("order_queue", "order_exchange", "order_routeKey");

            String message = "测试消息";
            channel.basicPublish("order_exchange", "order_routeKey", null, message.getBytes());
            System.out.println("消息发送成功");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (channel != null && channel.isOpen()) {
                channel.close();
            }
            if (connection != null && connection.isOpen()) {
                connection.close();
            }
        }
    }
}
```

**监听正常队列**

```java
public class Consumer1 {
    public static ConnectionFactory getConnectionFactory() {
        // 创建连接工程，下面给出的是默认的case
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");
        return factory;
    }

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory factory = getConnectionFactory();
        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection();
            channel = connection.createChannel();
            
            channel.basicConsume("order_queue", new DefaultConsumer(channel) {
                @Override
                public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                    System.out.println("consumerTag：" + consumerTag);
                    System.out.println("envelope：" + envelope);
                    System.out.println("properties：" + properties);
                    String s = new String(body, "UTF-8");
                    System.out.println("收到消息：" + s);

                    long deliveryTag = envelope.getDeliveryTag();
                    Channel channel1 = this.getChannel();
                    System.out.println("拒绝消息，使之进入死信队列");
                    System.out.println("时间：" + new Date());
                    //basicReject第二个参数为false进入死信队列或丢弃
                    channel1.basicReject(deliveryTag, false);
                }
            });
            TimeUnit.SECONDS.sleep(10000);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (channel != null && channel.isOpen()) {
                channel.close();
            }
            if (connection != null && connection.isOpen()) {
                connection.close();
            }
        }
    }
}
```

**监听死信队列**

```java
public class Consumer2 {
    public static ConnectionFactory getConnectionFactory() {
        // 创建连接工程，下面给出的是默认的case
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");
        return factory;
    }

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory factory = getConnectionFactory();
        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection();
            channel = connection.createChannel();

            System.out.println("消费端启动");
            channel.basicConsume("order_dead_queue", new DefaultConsumer(channel) {
                @Override
                public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                    System.out.println("时间：" + new Date());

                    System.out.println("consumerTag：" + consumerTag);
                    System.out.println("envelope：" + envelope);
                    System.out.println("properties：" + properties);
                    String s = new String(body, "UTF-8");
                    System.out.println("接收到消息：" + s);

                    long deliveryTag = envelope.getDeliveryTag();
                    Channel channel1 = this.getChannel();
                    channel1.basicAck(deliveryTag, true);
                    System.out.println("死信队列中处理完消息");
                }
            });
            TimeUnit.SECONDS.sleep(1000L);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (channel != null && channel.isOpen()) {
                channel.close();
            }
            if (connection != null && connection.isOpen()) {
                connection.close();
            }
        }
    }
}
```

### 生存时间（TTL）

1. 设置队列中的消息过期时间

```java
Map<String, Object> arg = new HashMap<String, Object>();
//设置消息1min后过期
arg.put("x-message-ttl", 60000);
createChannel.queueDeclare("myQueue", true, false, false,arg);
```

2. 设置消息的过期时间（只对单个消息有效）

```java
createChannel.queueDeclare("myQueue", true, false, false, null);
String message = "测试消息";
//消息1min后过期
AMQP.BasicProperties properties = new AMQP.BasicProperties.Builder()
    .expiration("60000")
    .build();
createChannel.basicPublish("", "myQueue", properties, message.getBytes());
```

存在问题：消息过期后，只有消息在队列顶端（马上要被消费了），才会将其删除，如果消息不在顶端，即使过期也不会移除

3. 给队列设置生存时间（超时之后不进入死信）

```java
Map<String, Object> arg = new HashMap<String, Object>();
arg.put("x-expires", 60000);
createChannel.queueDeclare("myQueue", true, false, false, arg);
String message = "测试消息";
createChannel.basicPublish("", "myQueue", null, message.getBytes());
```

### 延时队列

1. 使用场景：在使用抖音抢购有时候五分钟未到下单我们就可以再次抢单，用户下单了，库存减一，五分钟未支付，获取到该订单，将商品库存加一
2. 注意：RabbitMQ 本身没提供延时队列，可以利用消息的生存时间和死信队列实现延时

**延迟队列插件**

1. 安装 rabbitmq_delayed_message_exchange 插件，声明 x-delayed-message 类型的交换机

```java
Map<String, Object> args = new HashMap<String, Object>();
args.put("x-delayed-type", "direct");
channel.exchangeDeclare("delay_plugin_exchange", "x-delayed-message", true, false, args);
```

```java
@Configuration
public class DelayedQueueConfig {
    //交换机
    public static final String DELAYED_EXCHANGE ="delayed_exchange";
    //队列
    public static final String DELAYED_QUEUE ="delayed_queue";
    //routeingKey
    public static final String DELAYED_ROUTINGKEY ="delayed_routingKey";

    //声明延迟交换机
    @Bean
    public CustomExchange delayedExchange(){
        HashMap<String, Object> arguments = new HashMap<>();
        //自定义交换机的类型
        arguments.put("x-delayed-type", "direct");
        /**
         * 交换机名
         * 交换机类型
         * 持久化
         * 自动删除
         */
        return new CustomExchange(DELAYED_EXCHANGE,"x-delayed-message",true,false,arguments);
    }

    /**
     * 声明队列
     */
    @Bean
    public Queue delayedQueue(){
        return new Queue(DELAYED_QUEUE);
    }

    //延迟交换机和队列绑定
    @Bean
    public Binding delayedQueueBindingDelayedExchange(Queue delayedQueue,CustomExchange delayedExchange){
        return BindingBuilder.bind(delayedQueue).to(delayedExchange).with(DELAYED_ROUTINGKEY).noargs();
    }
}
```

2. 发送消息的时候通过 header 添加 "x-delay" 参数来设置消息的延迟时间，单位为毫秒

```java
Map<String, Object> headers = new HashMap<String, Object>java();
headers.put("x-delay", 5000);
BasicProperties props = new AMQP.BasicProperties.Builder()
	                .headers(headers).build();
channel.basicPublish("delay_plugin_exchange", "delay", props , "延迟消息".getBytes());
```

```java
@GetMapping("/delay/{message}/{delayedTime}")
public void delayedTimeMessage(@PathVariable String message,@PathVariable Integer delayedTime){
    log.info("当前时间：{} 发送一条信息给delayed交换机{},delayedTime：{}",new Date().toString(),message,delayedTime);
    rabbitTemplate.convertAndSend(DelayedQueueConfig.DELAYED_EXCHANGE,DelayedQueueConfig.DELAYED_ROUTINGKEY,message,(msg -> {
        //发送消息 并设置delayedTime
        msg.getMessageProperties().setDelay(delayedTime);
        //给消息设置延迟毫秒值
        //msg.getMessageProperties().setHeader("x-delay",delayTimes);
        return msg;
    }));
}
```

## 优先级队列

![](RabbitMQ（3-SpringBoot整合）/4.png)

1. 在 web 界面创建队列时添加

![](RabbitMQ（3-SpringBoot整合）/5.png)

2. 在 web 界面 policies 中设置

![](RabbitMQ（3-SpringBoot整合）/6.png)

3. 代码实现

```java
// 1.队列声明的代码中添加优先级参数
Map<String, Object> params = new HashMap();
params.put("x-max-priority", 10);	// 官方允许是0～255之间,此处设置为10,即允许优先级范围从0～10（不要设置过大以免浪费cpu和内存）
channel.queueDeclare("hello", true, false, false, params);

// 2.消息中代码添加优先级（要在队列优先级设置的范围内）
AMQP.BasicProperties properties = new AMQP.BasicProperties().builder().priority(5).build();
channel.basicPublish("",QUEUE_NAME,properties,message.getBytes());
```

注意：队列需要设置为优先级队列的同时，消息也必须设置优先级才能生效，而且消费者需要等待消息全部发送到队列中才去消费，因为这样才有机会对消息进行排序

## 惰性队列

惰性队列会尽可能地将消息存入磁盘中，而在消费者消费到相应的消息时才会被加载到内存中，能够支持更长的队列，即支持更多的消息存储。

默认情况下，当生产者将消息发送到 RabbitMQ 的时候，队列中的消息会尽可能地存储在内存之中，这样可以更加快速地发送给消费者，即使是持久化的消息，在被写入磁盘的同时也会在内存中驻留一份备份。当 RabbitMQ 需要释放内存的时候，会将内存中的消息换页至磁盘中，这个操作会耗费较长的时间，也会阻塞队列的操作，进而无法接收新的消息

**队列模式**

队列模式分为 default 和 lazy 模式。lazy 为惰性队列，可以通过调用 channel.queueDeclare 方法的时候在参数中设置，也可以通过 Policies 的方法设置，如果一个队列同时使用这两种方法设置的话，那么 Policies 的方法具备更高的优先级

1. Policies 方法

![](RabbitMQ（3-SpringBoot整合）/7.png)

2. channel.queueDeclare 方法

```java
Map<String, Object> args = new HashMap<String, Object>();
args.put("x-queue-mode", "lazy");
channel.queueDeclare("myqueue", false, false, false, args);
```

**内存开销对比**

在发送 1 百万条消息，每条消息大概占 1KB 的情况下，普通队列占用内存是 1.2GB，而惰性队列仅占用 1.5MB

## 联邦队列

## 其他

### 发送消息

```java
@SpringBootTest
class TestRabbitmqTemplate {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    //使用RabbitMq模板给交换机发送消息 使用convertAndSend()方法
    @Test
    void TestSimpleSend(){
        //第一个参数 交换机的名字
        //第二个参数 路由键 (因为是直连型交换机，所以路由键必须一致)
        //第三个参数 发送的具体信息 (这里不用使用 .getBytes()方法了)
        //也可以使用第4个参数 携带的头信息
        String sendSMS = "直连型交换机发送短信";
        rabbitTemplate.convertAndSend("交换机spring短信", "发送短信", sendSMS, new MessagePostProcessor() {
            @Override
            public Message postProcessMessage(Message message) throws AmqpException {
                message.getMessageProperties().getHeaders().put("登录次数",2);
                return message;
            }
        });
    }
}
```

```java
//使用RabbitMq模板给交换机发送消息 使用send()方法
@Test
void testSend(){
    MessageProperties properties = new MessageProperties();
    properties.setContentEncoding("UTF-8");
    properties.getHeaders().put("登录次数",3);

	String sendSMS = "使用send()方法来发送短信";
    Message message = new Message(sendSMS.getBytes(),properties);
    rabbitTemplate.send("交换机spring短信-fanout","",message);
}


//使用RabbitMq模板给交换机发送消息 使用send()方法
@Test
void testSendTopicAndHeaders(){
    MessageProperties properties = new MessageProperties();
    properties.setContentEncoding("UTF-8");
    properties.getHeaders().put("登录次数",4);

	//给Topic交换机上发送消息
    String sendSMSTopic = "使用send()方法来发送短信---Topic型交换机";
    Message message = new Message(sendSMSTopic.getBytes(),properties);
    rabbitTemplate.send("交换机spring短信-topic","0086.18734910102",message);


    MessageProperties propertiesHeader = new MessageProperties();
    propertiesHeader.setContentEncoding("UTF-8");
    propertiesHeader.getHeaders().put("userName","华为");
    propertiesHeader.getHeaders().put("passWord","123456");
    propertiesHeader.getHeaders().put("登录次数",5);
    
    //给Header交换机上发送消息
    String sendSMSHeader = "使用send()方法来发送短信---Header型交换机";
    Message messageHeaders = new Message(sendSMSHeader.getBytes(),propertiesHeader);
    rabbitTemplate.send("交换机spring短信-header","",messageHeaders);
}
```

### SimpleMessageListenerContainer

```java
@Configuration
public class ConfigurationConsumer {

    @Bean
    public Queue queueXiaoMi(){
        //创建队列
        //需要导入这个类 import org.springframework.amqp.core.Queue;
        //第一个参数 名字（最好是英文）见名知意
        //第二个参数 是否要持久化到本地磁盘中
        //第三个参数 是否独占 （一般不使用独占，除非是特殊业务）
        //第四个参数 是否自动删除
        Queue queue = new Queue("队列spring-监听器-小米",true,false,false);
        return queue;
    }

    @Bean
    public Queue queueHongMi(){
        //创建队列
        //需要导入这个类 import org.springframework.amqp.core.Queue;
        //第一个参数 名字（最好是英文）见名知意
        //第二个参数 是否要持久化到本地磁盘中
        //第三个参数 是否独占 （一般不使用独占，除非是特殊业务）
        //第四个参数 是否自动删除
        Queue queue = new Queue("队列spring-监听器-红米",true,false,false);
        return queue;
    }

    private Integer num = 0;

    @Bean
    public SimpleMessageListenerContainer simpleMessageListenerContainer(ConnectionFactory connectionFactory,Queue queueSMS){
        //把工厂传进来
        SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer(connectionFactory);

        //设置多个监听队列
        simpleMessageListenerContainer.setQueues(queueSMS,queueXiaoMi(),queueHongMi());

        //1个监听器，可以监听多少个队列 （一般设置为1,不能设置为0）
        simpleMessageListenerContainer.setConcurrentConsumers(1);

        //创建多少个监听器，来监听消息队列
        simpleMessageListenerContainer.setMaxConcurrentConsumers(5);

        //设置收到消息后的确认模式  AcknowledgeMode.AUTO表示为自动模式
        simpleMessageListenerContainer.setAcknowledgeMode(AcknowledgeMode.AUTO);

        //设置标签，然后台更加的认识它们
        simpleMessageListenerContainer.setConsumerTagStrategy(new ConsumerTagStrategy(){
            @Override
            public String createConsumerTag(String consumerTag) {
                //自己手写改动过后的
                consumerTag = consumerTag + "-" + num++;
                return consumerTag;

                //默认返回的就是,rabbitMq自动给咱们起好的名字
                //return consumerTag;
            }
        });

        //设置消息监听器
        simpleMessageListenerContainer.setMessageListener(new MessageListener() {
            @Override
            public void onMessage(Message message) {
                //获取出消息，在打印
                String oneData = new String(message.getBody());
                System.out.println( "收到了消息:" + oneData);

                //获取信息的自定义内容
                Map<String, Object> headers = message.getMessageProperties().getHeaders();

                //遍历获取信息的自定义内容
                for (Map.Entry<String, Object> entry : headers.entrySet()) {
                    System.out.println(entry);
                }
            }
        });
        return simpleMessageListenerContainer;
    }
}
```

```java
//使用RabbitMq模板给交换机发送消息 使用send()方法
@Test
void testSendTopicAndHeaders(){
    MessageProperties properties = new MessageProperties();
    properties.setContentEncoding("UTF-8");
    properties.getHeaders().put("登录次数",4);
    //给Topic交换机上发送消息
    String sendSMSTopic = "使用send()方法来发送短信---Topic型交换机";
    Message message = new Message(sendSMSTopic.getBytes(),properties);
    rabbitTemplate.send("交换机spring短信-topic","0086.18734910102",message);


    MessageProperties propertiesHeader = new MessageProperties();
    propertiesHeader.setContentEncoding("UTF-8");
    propertiesHeader.getHeaders().put("userName","华为");
    propertiesHeader.getHeaders().put("passWord","123456");
    propertiesHeader.getHeaders().put("登录次数",5);
    //给Header交换机上发送消息
    String sendSMSHeader = "使用send()方法来发送短信---Header型交换机";
    Message messageHeaders = new Message(sendSMSHeader.getBytes(),propertiesHeader);
    rabbitTemplate.send("交换机spring短信-header","",messageHeaders);
}
```

### ChannelAwareMessageListener

```java
//测试手动接受消息确认
@Bean
public SimpleMessageListenerContainer simpleMessageListenerContainer(ConnectionFactory connectionFactory,Queue queueSMS){
    //把工厂传进来
    SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer(connectionFactory);

    //设置多个监听队列
    simpleMessageListenerContainer.setQueues(queueSMS,queueXiaoMi(),queueHongMi());

    //1个监听器，可以监听多少个队列 （一般设置为1,不能设置为0）
    simpleMessageListenerContainer.setConcurrentConsumers(1);

    //创建多少个监听器，来监听消息队列
    simpleMessageListenerContainer.setMaxConcurrentConsumers(5);

    //设置收到消息后的确认模式  AcknowledgeMode.MANUAL表示手动接收消息
    simpleMessageListenerContainer.setAcknowledgeMode(AcknowledgeMode.MANUAL);

    //设置标签，然后台更加的认识它们
    simpleMessageListenerContainer.setConsumerTagStrategy(new ConsumerTagStrategy(){
        @Override
        public String createConsumerTag(String consumerTag) {
            //自己手写改动过后的
            consumerTag = consumerTag + "-" + num++;
            return consumerTag;

            //默认返回的就是,rabbitMq自动给咱们起好的名字
            //return consumerTag;
        }
    });

    //设置消息监听器
    simpleMessageListenerContainer.setMessageListener(new ChannelAwareMessageListener() {
        @Override
        public void onMessage(Message message, Channel channel) throws Exception {
            //获取出消息，在打印
            String oneData = new String(message.getBody());
            System.out.println( "收到了消息:" + oneData);

            //获取信息的自定义内容
            Map<String, Object> headers = message.getMessageProperties().getHeaders();
            //遍历获取信息的自定义内容
            for (Map.Entry<String, Object> entry : headers.entrySet()) {
                System.out.println(entry);
            }

            //对消息进行了手动的确认  第二个参数表示:是否批量(这里我们是一条一条处理，所以不用批量)
            channel.basicAck(message.getMessageProperties().getDeliveryTag(),false);
            //也可以使用这种方法 nack增加了重回队列的参数，最后一个false代表不用重回
			//channel.basicNack(message.getMessageProperties().getDeliveryTag(),false,false);
        }
    });
    return simpleMessageListenerContainer;
}
```

### MessageListenerAdapter

使用 MessageListenerAdapter 处理器进行消息队列监听处理，如果容器没有设置 setDefaultListenerMethod，则处理器中默认的处理方法名是 handleMessage，如果设置了 setDefaultListenerMethod，则处理器中处理消息的方法名就是 setDefaultListenerMethod 方法参数设置的值。也可以通过 setQueueOrTagToMethodName 方法为不同的队列设置不同的消息处理方法

自定义消息处理类，注意方法名和参数类型必须要一致

```java
public class MyMessageDelegate {

    public void handleMessage(byte[] body){
        String strMessage = new String(body);
        System.out.println("我收到了：" + strMessage);
    }
}
```

```java
//使用监听适配器对消息进行接受和消费
@Bean
public SimpleMessageListenerContainer simpleMessageListenerContainer(ConnectionFactory connectionFactory,Queue queueSMS){
    //把工厂传进来
    SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer(connectionFactory);

    //设置多个监听队列
    simpleMessageListenerContainer.setQueues(queueSMS,queueXiaoMi(),queueHongMi());

    //1个监听器，可以监听多少个队列 （一般设置为1,不能设置为0）
    simpleMessageListenerContainer.setConcurrentConsumers(1);

    //创建多少个监听器，来监听消息队列
    simpleMessageListenerContainer.setMaxConcurrentConsumers(5);

    //设置收到消息后的确认模式  AcknowledgeMode.AUTO 表示对消息进行自动确认
    simpleMessageListenerContainer.setAcknowledgeMode(AcknowledgeMode.AUTO);

    //设置标签，然后台更加的认识它们
    simpleMessageListenerContainer.setConsumerTagStrategy(new ConsumerTagStrategy(){
        @Override
        public String createConsumerTag(String consumerTag) {
            //自己手写改动过后的
            consumerTag = consumerTag + "-" + num++;
            return consumerTag;

            //默认返回的就是,rabbitMq自动给咱们起好的名字
            //return consumerTag;
        }
    });
    //使用MessageListenerAdapter类进行消息接收并处理
    MessageListenerAdapter messageListenerAdapter = new MessageListenerAdapter();
    //new MyMessageDelegate() 这里使用自己的方法
    messageListenerAdapter.setDelegate(new MyMessageDelegate());

    //进行绑定
    simpleMessageListenerContainer.setMessageListener(messageListenerAdapter);
    return simpleMessageListenerContainer;
}
```

```java
//自定义的处理消息的方法名称
public void myHandleMessage(byte[] body){
    String strMessage = new String(body);
    System.out.println("自定义名称的方法 我收到了：" + strMessage);
}
```

```java
//使用监听适配器对消息进行接受和消费
@Bean
public SimpleMessageListenerContainer simpleMessageListenerContainer(ConnectionFactory connectionFactory,Queue queueSMS){
    //把工厂传进来
    SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer(connectionFactory);

    //设置多个监听队列
    simpleMessageListenerContainer.setQueues(queueSMS,queueXiaoMi(),queueHongMi());

    //1个监听器，可以监听多少个队列 （一般设置为1,不能设置为0）
    simpleMessageListenerContainer.setConcurrentConsumers(1);

    //创建多少个监听器，来监听消息队列
    simpleMessageListenerContainer.setMaxConcurrentConsumers(5);

    //设置收到消息后的确认模式  AcknowledgeMode.AUTO 表示对消息进行自动确认
    simpleMessageListenerContainer.setAcknowledgeMode(AcknowledgeMode.AUTO);

    //设置标签，然后台更加的认识它们
    simpleMessageListenerContainer.setConsumerTagStrategy(new ConsumerTagStrategy(){
        @Override
        public String createConsumerTag(String consumerTag) {
            //自己手写改动过后的
            consumerTag = consumerTag + "-" + num++;
            return consumerTag;

            //默认返回的就是,rabbitMq自动给咱们起好的名字
            //return consumerTag;
        }
    });

    //使用MessageListenerAdapter类进行消息接收并处理
    MessageListenerAdapter messageListenerAdapter = new MessageListenerAdapter();
    //new MyMessageDelegate() 这里使用自己的方法
    messageListenerAdapter.setDelegate(new MyMessageDelegate());

    //使用自己定义的MessageDelegate
    messageListenerAdapter.setDefaultListenerMethod("myHandleMessage");

    //进行绑定
    simpleMessageListenerContainer.setMessageListener(messageListenerAdapter);
    return simpleMessageListenerContainer;
}
```

```java
//专用于处理消息队列-小米手机的方法
public void myHandleMessageXiaoMi(byte[] body){
    String strMessage = new String(body);
    System.out.println("自定义名称的方法-小米 我收到了：" + strMessage);
}

//专用于处理消息队列-红米手机的方法
public void myHandleMessageHongMi(byte[] body){
    String strMessage = new String(body);
    System.out.println("自定义名称的方法-红米 我收到了：" + strMessage);
}
```

```java
//使用监听适配器，针对不同队列的消息使用不同的方法，进行处理
@Bean
public SimpleMessageListenerContainer simpleMessageListenerContainer(ConnectionFactory connectionFactory,Queue queueSMS){
    //把工厂传进来
    SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer(connectionFactory);

    //设置多个监听队列
    simpleMessageListenerContainer.setQueues(queueSMS,queueXiaoMi(),queueHongMi());

    //1个监听器，可以监听多少个队列 （一般设置为1,不能设置为0）
    simpleMessageListenerContainer.setConcurrentConsumers(1);

    //创建多少个监听器，来监听消息队列
    simpleMessageListenerContainer.setMaxConcurrentConsumers(5);

    //设置收到消息后的确认模式  AcknowledgeMode.AUTO 表示对消息进行自动确认
    simpleMessageListenerContainer.setAcknowledgeMode(AcknowledgeMode.AUTO);

    //设置标签，然后台更加的认识它们
    simpleMessageListenerContainer.setConsumerTagStrategy(new ConsumerTagStrategy(){
        @Override
        public String createConsumerTag(String consumerTag) {
            //自己手写改动过后的
            consumerTag = consumerTag + "-" + num++;
            return consumerTag;

            //默认返回的就是,rabbitMq自动给咱们起好的名字
            //return consumerTag;
        }
    });

    //使用MessageListenerAdapter类进行消息接收并处理
    MessageListenerAdapter messageListenerAdapter = new MessageListenerAdapter();
    //new MyMessageDelegate() 这里使用自己的方法
    messageListenerAdapter.setDelegate(new MyMessageDelegate());

    //这个Map记录了哪个队列使用哪个方法 key为队列的名字 value为方法的名字
    Map<String,String> queueMethod = new HashMap<>();
    queueMethod.put("队列spring-监听器-小米","myHandleMessageXiaoMi");
    queueMethod.put("队列spring-监听器-红米","myHandleMessageHongMi");

    //通过队列的名字来和方法的名字进行绑定  （此处使用Map集合）
    messageListenerAdapter.setQueueOrTagToMethodName(queueMethod);

    //进行绑定
    simpleMessageListenerContainer.setMessageListener(messageListenerAdapter);

    return simpleMessageListenerContainer;
}
```

### MessageConverter

```java
public class MyMessageTestConverter implements MessageConverter {

    // java对象转换为Message对象
    @Override
    public Message toMessage(Object o, MessageProperties messageProperties) throws MessageConversionException {
        Message message = new Message(o.toString().getBytes(),messageProperties);
        return message;
    }

    // Message对象转换为java对象
    @Override
    public Object fromMessage(Message message) throws MessageConversionException {
        String contentType = message.getMessageProperties().getContentType();
        if(contentType != null && contentType.contains("text")){
            String str = new String(message.getBody());
            return str;
        }else{
            //对于不是文本的类型，直接返回字节数组
            return message.getBody();
        }
    }
}
```

```java
//使用监听适配器，针对不同队列的消息使用不同的方法，进行处理
@Bean
public SimpleMessageListenerContainer simpleMessageListenerContainer(ConnectionFactory connectionFactory,Queue queueSMS){
    //把工厂传进来
    SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer(connectionFactory);

    //设置多个监听队列
    simpleMessageListenerContainer.setQueues(queueSMS,queueXiaoMi(),queueHongMi());

    //1个监听器，可以监听多少个队列 （一般设置为1,不能设置为0）
    simpleMessageListenerContainer.setConcurrentConsumers(1);

    //创建多少个监听器，来监听消息队列
    simpleMessageListenerContainer.setMaxConcurrentConsumers(5);

    //设置收到消息后的确认模式  AcknowledgeMode.AUTO 表示对消息进行自动确认
    simpleMessageListenerContainer.setAcknowledgeMode(AcknowledgeMode.AUTO);

    //设置标签，然后台更加的认识它们
    simpleMessageListenerContainer.setConsumerTagStrategy(new ConsumerTagStrategy(){
        @Override
        public String createConsumerTag(String consumerTag) {
            //自己手写改动过后的
            consumerTag = consumerTag + "-" + num++;
            return consumerTag;

            //默认返回的就是,rabbitMq自动给咱们起好的名字
            //return consumerTag;
        }
    });

    //使用MessageListenerAdapter类进行消息接收并处理
    MessageListenerAdapter messageListenerAdapter = new MessageListenerAdapter();

    //设置消息的转换器
    messageListenerAdapter.setMessageConverter(new MyMessageTestConverter());

    //new MyMessageDelegate() 这里使用自己的方法
    messageListenerAdapter.setDelegate(new MyMessageDelegate());

    //使用自己的类型转换器
    messageListenerAdapter.setDefaultListenerMethod("myHandleMessage");

    //进行绑定
    simpleMessageListenerContainer.setMessageListener(messageListenerAdapter);

    return simpleMessageListenerContainer;
}
```

