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

## 广播模式

```xml
<dependency>
    <groupId>com.rabbitmq</groupId>
    <artifactId>amqp-client</artifactId>
    <version>5.13.0</version>
</dependency> 
```

### Simple 模式（简单模式）

一个生产者，一个消费者，一个队列，采用默认交换机。可以理解为生产者 P 发送消息到队列 Q，一个消费者 C 接收。

![](RabbitMQ（2-基本使用）/9.png)

```java
public class Producer {    
    
    public static void main(String[] args) {
        // 所有的中间件技术都是基于tcp/ip协议基础之上构建新型的协议规范，只不过rabbitmq遵循的是amqp
        // ip port
        // 1: 创建连接工程
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("127.0.0.1");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");//rabbitmq登录的账号
        connectionFactory.setPassword("guest");//rabbitmq登录的密码
        connectionFactory.setVirtualHost("/");
        
        Connection connection = null;
        Channel channel = null;
        try {
            // 2: 创建连接Connection Rabbitmq为什么是基于channel去处理而不是链接? 长连接----信道channel
            connection = connectionFactory.newConnection("生产者");
            // 3: 通过连接获取通道Channel
            channel = connection.createChannel();
            // 4: 通过通创建交换机，声明队列，绑定关系，路由key,发送消息，和接收消息
            String queueName = "queue1";
            
            /*
            * @params1 队列的名称
            * @params2 是否要持久化durable=false 所谓持久化消息是否存盘，如果false 非持久化 true是持久化? 非持久化会存盘吗？ 会存盘，但是会随从重启服务会丢失。
            * @params3 排他性，是否是独占独立
            * @params4 是否自动删除，随着最后一个消费者消息完毕消息以后是否把队列自动删除
            * @params5 携带附属参数
            */
            channel.queueDeclare(queueName, true, false, false, null);
            // 5: 准备消息内容
            String message = "Hello chenjinxian!!!";
            // 6: 发送消息给队列queue
            // @params1: 交换机  
            // @params2 队列、路由key 
            // @params3 消息的状态控制  
            // @params4 消息主题
            // 面试题：可以存在没有交换机的队列吗？不可能，虽然没有指定交换机但是一定会存在一个默认的交换机。
            channel.basicPublish("", queueName, null, message.getBytes());
            System.out.println("消息发送成功!!!");
        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            // 7: 关闭通道
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
            // 8: 关闭连接
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Consumer {
 
    public static void main(String[] args) { 
        // 1: 创建连接工程
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("128.197.157.151");//服务器IP
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");
        connectionFactory.setVirtualHost("/");
 
        Connection connection = null;
        Channel channel = null;
        try {
            // 2: 创建连接Connection
            connection = connectionFactory.newConnection("消费者");
            // 3: 通过连接获取通道Channel
            channel = connection.createChannel();
            // 4: 通过通创建交换机，声明队列，绑定关系，路由key,发送消息，和接收消息
 
            Channel channel2 = channel;
            //参数1：队列名称
            //参数2：是否自动确认消息
            //	true = ack 正常的逻辑是没问题
            //	false = nack 消息这在消费消息的时候可能会异常和故障
            //参数3：重写接受函数
            //参数4：重写回调函数，即失败情况
            channel2.basicConsume("queue1", false, new DeliverCallback() {
                public void handle(String consumerTag, Delivery message) throws IOException {
                    try {
                        System.out.println("收到消息是" + new String(message.getBody(), "UTF-8"));
                        channel2.basicAck(message.getEnvelope().getDeliveryTag(),false);
                    }catch (Exception ex){
                        ex.printStackTrace();
                        // 三次确认 -- reject + 死信
                    }
                }
            }, new CancelCallback() {
                public void handle(String consumerTag) throws IOException {
                    System.out.println("接受失败了...");
                }
            });
 
            System.out.println("开始接受消息");
            System.in.read();
        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            // 7: 关闭通道
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
            // 8: 关闭连接
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        }
    }
}
```

### Work 模式（轮询模式）

一个生产者，多个消费者，一个队列，采用默认交换机。可以理解为生产者 P 发送消息到队列 Q，可以由多个消费者 C1、C2 进行接收。

![](RabbitMQ（2-基本使用）/2.png)

1. 非公平

consumer1 处理任务的速度非常快，consumer2 处理速度非常慢，如果采用轮询分发的话，就会使处理速度快的 consumer1 很大一部分时间处于空闲状态，而 consumer2 一直在干活

```java
public class Producer {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setPort(5672);
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("生产者");
            channel = connection.createChannel();
            for (int i = 0; i < 30; i++) {
                String msg = "hello " + i;
                /**
                 * 参数1：交换机exchange
                 * 参数2：队列名称/路由key
                 * 参数3：属性配置
                 * 参数4：发送消息的内容
                 */
                channel.basicPublish("", "queue1", null, msg.getBytes());
            }
            System.out.println("消息发送成功");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Work1 {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("消费者1");
            channel = connection.createChannel();

            /**
             * 参数1：queue队列的名称
             * 参数2：durable队列是否持久化
             * 参数3：exclusive是否排他，即是否私有的，如果为true，会对当前队列加锁，其他的通道不能访问，并且连接自动关闭
             * 参数4：autoDelete是否自动删除，当最后一个消费者断开连接之后是否自动删除消息
             * 参数5：arguments可以设置队列附加参数，设置队列的有效期，消息的最大长度，队列的消息生命周期等
             */
            //channel.queueDeclare("queue1",false,false,false,null);
            Channel channel2 = channel;
            channel2.basicConsume("queue1", true, new DeliverCallback() {
                @Override
                public void handle(String s, Delivery delivery) throws IOException {
                    try {
                        System.out.println("Work1收到消息是：" + new String(delivery.getBody(), "UTF-8"));
                        Thread.sleep(200);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, new CancelCallback() {
                @Override
                public void handle(String s) throws IOException {
                    System.out.println("消息发送失败");
                }
            });
            System.out.println("Work1开始接收消息");
            System.in.read();
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("发送消息出现异常");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Work2 {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("消费者2");
            channel = connection.createChannel();

            Channel channel2 = channel;
            channel2.basicConsume("queue1", true, new DeliverCallback() {
                @Override
                public void handle(String s, Delivery delivery) throws IOException {
                    try {
                        System.out.println("Work2接收消息是：" + new String(delivery.getBody(), "UTF-8"));
                        Thread.sleep(100);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, new CancelCallback() {
                @Override
                public void handle(String s) throws IOException {
                    System.out.println("消息发送失败");
                }
            });
            System.out.println("Work2开始接收消息");
            System.in.read();
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("发送消息出现异常");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

2. 公平

预取值：通过 basic.qos 方法设置“预取计数”，该值定义通道上允许的未确认消息的最大数量，一旦数量达到配置的数量，RabbitMQ 将停止在通道上传递更多消息，除非至少有一个未处理的消息被确认。

假设在通道上有未确认的消息 5、6、7，8，并且通道的预取计数设置为 4，此时 RabbitMQ 将不会在该通道上再传递任何消息，除非至少有一个未应答的消息被 ack

![](RabbitMQ（2-基本使用）/3.png)

设置参数 channel.basicQos(1)：即每个消费者只能处理完当前消息才能接受新的消息

如果当前消息我没有处理完的后或者还没有应答的话，新的消息就先别分配给我，然后 RabbitMQ 就会把该任务分配给没有那么忙的那个空闲消费者

```java
public class Producer {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("生产者");
            channel = connection.createChannel();

            for (int i = 0; i < 20; i++) {
                String msg = "hello " + i;
                channel.basicPublish("", "queue1", null, msg.getBytes());
            }
            System.out.println("消息发送成功!");
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("发送消息出现异常");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Work1 {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("消费者1");
            channel = connection.createChannel();

            //定义接收消息的回调
            Channel channel2 = channel;
            //同一时刻，服务器只会推送一条消息给消费者
            channel2.basicQos(1);
            //监听队列，false表示手动返回完成状态，true表示自动
            channel2.basicConsume("queue1", false, new DeliverCallback() {
                @Override
                public void handle(String s, Delivery delivery) throws IOException {
                    try {
                        System.out.println("Work1收到消息是：" + new String(delivery.getBody(), "UTF-8"));
                        Thread.sleep(1000);
                        //使用手动应答
                        channel2.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, new CancelCallback() {
                @Override
                public void handle(String s) throws IOException {

                }
            });
            System.out.println("Work1开始接收消息");
            System.in.read();
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("发送消息异常");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Work2 {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("消费者2");
            channel = connection.createChannel();

            Channel channel2 = channel;
            channel2.basicQos(1);
            channel2.basicConsume("queue1", false, new DeliverCallback() {
                @Override
                public void handle(String s, Delivery delivery) {
                    try {
                        System.out.println("Work2收到消息是：" + new String(delivery.getBody(), "UTF-8"));
                        Thread.sleep(2000);
                        channel2.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, new CancelCallback() {
                @Override
                public void handle(String s) throws IOException {
                }
            });
            System.out.println("Work2开始接收消息");
            System.in.read();
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Work2接收消息失败");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

### Fanout 模式（订阅模式）

一个生产者、一个 fanout 类型的交换机、多个队列、多个消费者。一个生产者发送的消息会被多个消费者获取。其中 fanout 类型就是发布订阅模式，只有订阅该生产者的消费者会收到消息。

![](RabbitMQ（2-基本使用）/20.png)

```java
public class Producer {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("生产者");
            channel = connection.createChannel();
            //交换机名称
            String exchangeName = "fanout_test";
            //交换机类型
            String type = "fanout";
            channel.exchangeDeclare(exchangeName, type, true);

            channel.queueDeclare("fanout1", true, false, false, null);
            channel.queueDeclare("fanout2", true, false, false, null);

            //绑定队列和交换机
            //参数1：队列名称
            //参数2：交换机名称
            //参数3：路由名称
            channel.queueBind("fanout1", exchangeName, "");
            channel.queueBind("fanout2", exchangeName, "");
            String message = "hello";
            channel.basicPublish(exchangeName, "", null, message.getBytes());
            System.out.println("消息发送成功");
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("消息发送异常");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Consumer {
    private static Runnable runnable = new Runnable() {
        @Override
        public void run() {
            ConnectionFactory factory = new ConnectionFactory();
            factory.setHost("localhost");
            factory.setPort(5672);
            factory.setUsername("guest");
            factory.setPassword("guest");
            factory.setVirtualHost("/");

            //获取队列名称
            String queueName = Thread.currentThread().getName();
            Connection connection = null;
            Channel channel = null;
            try {
                connection = factory.newConnection("生产者");
                channel = connection.createChannel();
                Channel channel2 = channel;
                channel2.basicConsume(queueName, true, new DeliverCallback() {
                    @Override
                    public void handle(String s, Delivery delivery) throws IOException {
                        System.out.println(queueName + ":收到消息是：" + new String(delivery.getBody(), "UTF-8"));
                    }
                }, new CancelCallback() {
                    @Override
                    public void handle(String s) throws IOException {
                    }
                });
                System.out.println(queueName + ":开始接收消息");
                System.in.read();
            } catch (Exception e) {
                e.printStackTrace();
                System.out.println("接收消息异常");
            } finally {
                if (channel != null && channel.isOpen()) {
                    try {
                        channel.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                if (connection != null && connection.isOpen()) {
                    try {
                        connection.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    };

    public static void main(String[] args) {
        new Thread(runnable, "fanout1").start();
        new Thread(runnable, "fanout2").start();
    }
}
```

**控制台使用**

1. 新建一个 fanout 类型的交换机

![](RabbitMQ（2-基本使用）/10.png)

2. 声明两个队列 queue1、queue2

![](RabbitMQ（2-基本使用）/11.png)

3. 将队列与交换机进行绑定

![](RabbitMQ（2-基本使用）/12.png)

4. 向交换机中投递一条消息

![](RabbitMQ（2-基本使用）/13.png)

5. 在两个队列中都可以看到收到的消息

![](RabbitMQ（2-基本使用）/14.png)

![](RabbitMQ（2-基本使用）/15.png)

### Direct 模式（路由模式）

一个生产者，一个 direct 类型的交换机，多个队列，交换机与队列之间通过 routing-key 进行关联绑定，多个消费者。生产者发送消息到交换机并且要指定 routing-key，然后消息根据这交换机与队列之间的 routing-key 绑定规则进行路由被指定消费者消费。

![](RabbitMQ（2-基本使用）/5.png)

```java
public class Producer {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("生产者");
            channel = connection.createChannel();
            String exchangeName = "direct_test";
            String type = "direct";
            String routeKey="test1";
            
            channel.exchangeDeclare(exchangeName, type, true);

            channel.queueDeclare("direct1", true, false, false, null);
            channel.queueDeclare("direct2", true, false, false, null);

            //参数三：路由名称
            channel.queueBind("direct1", exchangeName, "test1");
            channel.queueBind("direct2", exchangeName, "test2");

            String message = "hello";
            channel.basicPublish(exchangeName, routeKey, null, message.getBytes());
            System.out.println("消息发送成功");
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("消息发送异常");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Consumer {

    private static Runnable runnable = new Runnable() {
        @Override
        public void run() {
            ConnectionFactory factory = new ConnectionFactory();
            factory.setHost("localhost");
            factory.setPort(5672);
            factory.setUsername("guest");
            factory.setPassword("guest");
            factory.setVirtualHost("/");

            Connection connection = null;
            Channel channel = null;
            try {
                connection = factory.newConnection("消费者");
                channel = connection.createChannel();

                String queueName = Thread.currentThread().getName();
                Channel channel2 = channel;
                channel2.basicConsume(queueName, true, new DeliverCallback() {
                    @Override
                    public void handle(String s, Delivery delivery) throws IOException {
                        System.out.println(queueName + ":开始接收消息：" + new String(delivery.getBody(), "UTF-8"));
                    }
                }, new CancelCallback() {
                    @Override
                    public void handle(String s) throws IOException {
                    }
                });
                System.out.println(queueName + "：开始接收消息");
                System.in.read();
            } catch (Exception e) {
                e.printStackTrace();
                System.out.println("消息接收失败");
            } finally {
                if (channel != null && channel.isOpen()) {
                    try {
                        channel.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                if (connection != null && connection.isOpen()) {
                    try {
                        connection.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    };

    public static void main(String[] args) {
        new Thread(runnable, "direct1").start();
        new Thread(runnable, "direct2").start();
    }
}
```

**控制台使用**

1. 新建一个 direct 类型的交换机

![](RabbitMQ（2-基本使用）/16.png)

2. 声明两个队列 queue1、queue2 并绑定刚创建的交换机，设置两者绑定的 routing-key

![](RabbitMQ（2-基本使用）/17.png)

3. 往交换机中发送一条消息，指定一个 routing-key

![](RabbitMQ（2-基本使用）/18.png)

4. 可以看到只有对应 routing-key 的 queue2 收到了消息

![](RabbitMQ（2-基本使用）/19.png)

### Topic 模式（主题模式）

一个生产者，一个 topic 类型的交换机，多个队列，交换机与队列之间通过 routing-key 进行关联绑定，多个消费者。生产者发送消息到交换机并且要指定 routing-key，然后消息根据这交换机与队列之间的 routing-key 绑定规则进行路由被指定消费者消费

1. \* 代表有且只能有一个，必须有一个
2. \# 代表 0~n，可以有 0 个或者无数个

![](RabbitMQ（2-基本使用）/6.png)

```java
public class Producer {
    public static void main(String[] args) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setPort(5672);
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        Connection connection = null;
        Channel channel = null;
        try {
            connection = factory.newConnection("生产者");
            channel = connection.createChannel();

            String exchangeName = "topic_test";
            String type = "topic";
            String routeKey = "com.order.user";
            channel.exchangeDeclare(exchangeName, type, true);

            channel.queueDeclare("topic1", true, false, false, null);
            channel.queueDeclare("topic2", true, false, false, null);
            channel.queueDeclare("topic3", true, false, false, null);

            channel.queueBind("topic1", exchangeName, "com.#");
            channel.queueBind("topic2", exchangeName, "*.course.*");
            channel.queueBind("topic3", exchangeName, "#.order.#");

            String message = "hello";
            channel.basicPublish(exchangeName, routeKey, null, message.getBytes());
            System.out.println("消息发送成功");
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("消息发送失败");
        } finally {
            if (channel != null && channel.isOpen()) {
                try {
                    channel.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            if (connection != null && connection.isOpen()) {
                try {
                    connection.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

```java
public class Consumer {
    private static Runnable runnable = new Runnable() {
        @Override
        public void run() {
            ConnectionFactory factory = new ConnectionFactory();
            factory.setHost("localhost");
            factory.setPort(5672);
            factory.setUsername("guest");
            factory.setPassword("guest");
            factory.setVirtualHost("/");

            Connection connection = null;
            Channel channel = null;
            try {
                connection = factory.newConnection("消费者");
                channel = connection.createChannel();
                String queueName = Thread.currentThread().getName();
                channel.basicConsume(queueName, true, new DeliverCallback() {
                    @Override
                    public void handle(String s, Delivery delivery) throws IOException {
                        System.out.println(queueName + ":开始接收消息:" + new String(delivery.getBody(), "UTF-8"));
                    }
                }, new CancelCallback() {
                    @Override
                    public void handle(String s) throws IOException {
                    }
                });
                System.out.println(queueName + "：开始接收消息");
                System.in.read();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                if (channel != null && channel.isOpen()) {
                    try {
                        channel.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                if (connection != null && connection.isOpen()) {
                    try {
                        connection.close();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    };

    public static void main(String[] args) {
        new Thread(runnable, "topic1").start();
        new Thread(runnable, "topic2").start();
        new Thread(runnable, "topic3").start();
    }
}
```

## 交换机（Exchanges）

Exchanges 的类型总共有四种：直接(direct)、主题(topic)、标题(headers)、扇出(fanout)

### 无名交换机

在本文的前面部分我们对 exchange 一无所知，但仍然能够将消息发送到队列。这是因为我们使用的是默认交换机，我们通过空字符串(“”)进行标识。

```java
channel.basicPublish("", "queueName", null, message.getBytes());
```

### 创建交换机

```java
public class Producer {

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = connectionFactory.newConnection();
        //画定双向车道
        Channel channel = connection.createChannel();

        //声明一个交换机
        //第一个参数是它的名字（最好是英文，见名知意），
        //第二个参数是它的交换机的类型，
        //第三个参数是否要保存到本地磁盘中
        //第四个参数是否要自动删除
        //第五个参数是它要携带的头信息（这里暂时没有）
        channel.exchangeDeclare("交换机direct","direct",true,false,null);

        //有了交换机，再申明一个队列出来
        //第一个参数是它的名字（最好是英文，见名知意）,
        //第二个参数是否要保存到本地磁盘中
        //第三个参数是否要独占（如果是独占，那就只能让它自己使用了，这样不太好）
        //第四个参数是否要自动删除
        //第五个参数是它要携带的头信息（这里暂时没有）
        channel.queueDeclare("队列direct",true,false,false,null);

        //绑定队列
        //第一个参数表示 要绑定的队列名称
        //第二个参数表示 要把队列绑定到那个交换机上
        //第三个参数表示 路由键 （因为这里是直连型交换机，暂时没有路由键，所以可以暂时随便写一个，比如：小兔子乖乖）
        channel.queueBind("队列direct","交换机direct","小兔子乖乖");

        //发送数据到交换机
        //第一个参数表示 要绑定的交换机名称（要发送给哪个交换机）
        //第二个参数表示 路由键  跟上面的路由键保持一致
        //第三个参数表示 携带的头信息数据（这里暂时没有）
        //第四个参数表示 要发送的数据 （这里为了演示，发送了一句话，正常情况下，我们会发送真实的数据）
        String oneData = "这是新买的洗面奶";
        channel.basicPublish("交换机direct","小兔子乖乖",null,oneData.getBytes());

        //关闭信道和连接 顺序从小到大
        channel.close();
        connection.close();
    }
}
```

### Header 自定义属性型交换机

不处理路由键。而是根据发送的消息内容中的 headers 属性进行匹配。在绑定 Queue 与 Exchange 时指定一组键值对；当消息发送到 RabbitMQ 时会取到该消息的 headers 与 Exchange 绑定时指定的键值对进行匹配；如果完全匹配则消息会路由到该队列，否则不会路由到该队列。

匹配规则 x-match 有下列两种类型：

1. x-match = all ：表示 **所有的** 键值对都匹配才能接受到消息（不包括 x-match）
2. x-match = any ：表示 **至少有一个** 键值对匹配就能接受到消息

```java
// header交换机
channel.exchangeDeclare("exchange交换机小米-header-mathc-all","headers",true,false,null);
channel.queueDeclare("Queue小米header-mathc-all", true, false, false, null);

//设置消息头键值对信息
Map<String, Object> headers = new Hashtable<String,Object>();
//这里x-match有两种类型
//all:表示所有的键值对都匹配才能接受到消息
//any:表示最少一个键值对匹配就能接受到消息
headers.put("x-match", "any");
headers.put("name", "jack");
headers.put("age" , 31);
channel.queueBind("Queue小米header-mathc-all","exchange交换机小米-header-mathc-all", "", headers);
```

## 事务性消息

事务消息与数据库的事务类似，只是 MQ 的消息是要保证消息是否会全部发送成功，防止消息丢失的一种策略

RabbitMQ 有两种策略来解决这个问题：

1. 通过 AMQP 的事务机制实现
2. 使用发送者确认模式实现

事务的实现主要是对信道（Channel）的设置，主要方法：

1. channel.txSelect()：声明启动事务模式
2. channel.txCommit()：提交事务
3. channel.txRollback()：回滚事务

### 消息发送

```java
public class Producer {

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
            channel= connection.createChannel();
            channel.queueDeclare("myQueue",true,false,false,null);
            //启动事务
            channel.txSelect();
            
            String message="hello";
            channel.basicPublish("","myQueue",null,message.getBytes());
            //提交事务
            channel.txCommit();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if (channel!=null){
                //回滚，如果未发生异常会提交事务，此时回滚无影响
                channel.txRollback();
                channel.close();
            }
            if (connection!=null){
                connection.close();
            }
        }
    }
}
```

### 消息接收

1. 自动确认模式

```java
public class Consumer1 {

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
            //开启事务
            channel.txSelect();
            
            //在自动确认模式下，即使事务不提交，也会读取到消息并从队列移除
            channel.basicConsume("myQueue",true,"",new DefaultConsumer(channel){
                @Override
                public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                    String s = new String(body, "UTF-8");
                    System.out.println("收到消息："+s);
                }
            });
            System.in.read();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if (channel!=null){
                //回滚，如果未发生异常会提交事务，此时回滚无影响
                channel.txRollback();
                channel.close();
            }
            if (connection!=null){
                connection.close();
            }
        }
    }
}
```

2. 手动确认模式

```java
public class Consumer2 {

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
            channel= connection.createChannel();
            
            //开启事务
            channel.txSelect();
            //如果是手动确认消息，在开启事务下，必须手动commit，否则不会移除消息
            channel.basicConsume("myQueue",false,"",new DefaultConsumer(channel){
                @Override
                public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                    String s = new String(body,"UTF-8");
                    System.out.println("收到消息："+s);
                    Channel channel1 = this.getChannel();
                    channel1.basicAck(envelope.getDeliveryTag(),true);
                    //事务提交
                    channel1.txCommit();
                }
            });
            System.in.read();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            if (channel!=null){
                channel.txRollback();
                channel.close();
            }
            if (connection!=null){
                connection.close();
            }
        }
    }
}
```

注意：

1. 自动确认模式下，即使事务不提交，也会读取到消息并从队列移除，此时事务对消费者无效
2. 手动确认模式下，在开启事务下，必须手动 commit，否则不会移除消息

## 持久化

默认情况下 RabbitMQ 退出或由于某种原因崩溃时，它会清空队列和消息，除非告知它不要这样做。确保消息不会丢失需要做两件事：将队列和消息都标记为持久化。

### 队列持久化

![](RabbitMQ（2-基本使用）/7.png)

### 消息持久化

![](RabbitMQ（2-基本使用）/8.png)

将消息标记为持久化并不能完全保证不会丢失消息，尽管它告诉 RabbitMQ 将消息保存到磁盘，但是这里依然存在当消息刚准备存储在磁盘的时候，但是还没有存储完，消息还在缓存的一个间隔点，此时并没有真正写入磁盘，持久性保证并不强

```java
public class Producer {

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = connectionFactory.newConnection();
        //画定双向车道
        Channel channel = connection.createChannel();

        channel.queueDeclare("queueXiaoMi",true,false,false,null);
        /**
         *  channel.basicPublish("","queueXiaoMi",basicProperties,oneData.getBytes());
         *  basicProperties：表示是否要传入什么数据 这里的数据是持久化的，是保存到本地磁盘的，如果为null则表示什么都不传入
         *  也可以传入数据 比如:MessageProperties.PERSISTENT_BASIC 这是系统自带的 当然也可以自己new一个(保存一些自定义的一些数据)
         * */   
        Map<String,Object> headers = new HashMap<>();
        headers.put("姓名","老王");
        headers.put("电话","15110012023");
        headers.put("地址","江西");
        
         AMQP.BasicProperties basicProperties = new AMQP.BasicProperties()
                .builder()
                //设置字符编码集
                .contentEncoding("UTF-8")
                //设置保存时间是多少 毫秒为单位，如果10秒中内数据没有被消费，那就自动删除了
                .expiration("1000000")
                //设置它的保存模式,有两种保存模式 
             	//1为保存，但不会保存到磁盘上;2为保存，但会保存到磁盘上
                .deliveryMode(2)
                //自定义的一些属性详情 存放一个Map集合
                .headers(headers)
                .build();
        
        String oneData = "hello rabbitMq";
        
        //这是以前的，是没有传入持久化的
        //channel.basicPublish("","queueXiaoMi",null,oneData.getBytes());

        //这是现在的，传入持久化的 
        //其实最终发送的还是hello rabbitMq这句话，只不过在它的基础上增加了一些附带的信息。比如清单信息
        channel.basicPublish("","queueXiaoMi",basicProperties,oneData.getBytes());
        
        //关闭信道和连接 顺序从小到大
        channel.close();
        connection.close();
    }
}
```

```java
public class Consumer {

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = connectionFactory.newConnection();

        //画定双向车道
        Channel channel = connection.createChannel();

        //接收数据 最简单的消息接收
        //不使用交换机，路由规则即交换机的方式
        DefaultConsumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag,
                                       Envelope envelope,
                                       AMQP.BasicProperties properties,
                                       byte[] body) throws IOException{
                String strRecv = "我收到了" + new String(body);
                System.out.println(strRecv);
                
                //获取快递清单数据
                System.out.println("同时我还获取了快递的清单的详情信息");
                Map<String, Object> headers = properties.getHeaders();
                if(headers != null){
                    for (Object value : headers.entrySet()) {
                        System.out.println(value);
                    }
                }
            }
        };
        channel.basicConsume("queueXiaoMi",true,consumer);
    }
}
```

## 其他

### 临时队列

上文所有例子中我们都使用的是具有特定名称的队列，队列的名称我们来说至关重要，用于指定消费者去消费哪个队列的消息。每当我们连接到 RabbitMQ 时都需要一个全新的空队列，但很多时候我们可能不想指定队列名字，只想实验测试一下，此时我们可以创建一个具有随机名称的队列，一旦我们断开了消费者的连接，该队列将被自动删除。这就是临时队列。

```java
// 创建一个临时队列
String queueName = channel.queueDeclare().getQueue();
```

![](RabbitMQ（2-基本使用）/23.png)

### 队列设置大小限制

```java
public class ProducerMaxLengthQueue {

    public static void main(String[] args) {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = null;
        try {
            connection = connectionFactory.newConnection();
            //画定双向车道
            Channel channel = connection.createChannel();

            Map<String,Object> map = new HashMap<>();
            map.put("x-max-length",2);    //最大保存2个消息(包括2个消息)
            //第一个参数是它的名字（最好是英文，见名知意）
            //第二个参数是否持久化到磁盘中
            //第三个参数是否独占
            //第四个参数是否要自动删除
            //第五个参数是它要携带的头信息  比如设置大小限制的队列
            channel.queueDeclare("队列-最多保存2个消息",true,false,false,map);

            String str = "最大限制为2";
            channel.basicPublish("","队列-最多保存2个消息", null, str.getBytes());

            //关闭信道和连接 顺序从小到大
            channel.close();
            connection.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (TimeoutException e) {
            e.printStackTrace();
        }
    }
}
```

### 生产端确认消息

```java
public class ProducerConfirmListener {

    public static void main(String[] args) {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = null;
        try {
            connection = connectionFactory.newConnection();
            //画定双向车道
            Channel channel = connection.createChannel();

            //第一个参数是它的名字（最好是英文，见名知意）
            //第二个参数是否持久化到磁盘中
            //第三个参数是否独占
            //第四个参数是否要自动删除
            //第五个参数是它要携带的头信息 这里没有
            channel.queueDeclare("确认消息是否收到",true,false,false,null);

            String str = "确认消息是否收到MQ";
            //打开生产者的确认模式
            channel.confirmSelect();
            //添加确认监听
            channel.addConfirmListener((deliveryTag, multiple) -> {
                System.out.println("数据成功到达MQ");
            }, (deliveryTag, multiple)->{
                System.out.println("数据出错,可能原因是网络闪断，请排错");
            });
            channel.basicPublish("","确认消息是否收到", null, str.getBytes());

            //关闭信道和连接 顺序从小到大
            //channel.close();
            //connection.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (TimeoutException e) {
            e.printStackTrace();
        }
    }
}
```

在某种情况下，如果我们在发送消息的时候，当前的路由 key 错误，需要监听这种不可达的消息，就要使用 return listener。

1. basicPublish 的参数 Mandatory 为 false 时，如果消息无法正确路由到队列后，会被 MQ 直接丢失
2. basicPublish 的参数 mandatory 设置 true，消息无法正确路由到队列后，会返还给发送者

```java
public class ProducerReturnListener {

    public static void main(String[] args) {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = null;
        try {
            connection = connectionFactory.newConnection();
            //画定双向车道
            Channel channel = connection.createChannel();

            //创建一个交换机
            //声明一个直连型交换机
            //第一个参数是它的名字（最好是英文，见名知意），
            //第二个参数是它的交换机的类型，
            //第三个参数是否要保存到本地磁盘中
            //第四个参数是否要自动删除
            //第五个参数是它要携带的头信息（这里暂时没有）
            channel.exchangeDeclare("交换机ReturnListener","direct",true,false,null);

            //有了交换机就创建一个相对应的队列
            //第一个参数是它的名字（最好是英文，见名知意）
            //第二个参数是否持久化到磁盘中
            //第三个参数是否独占
            //第四个参数是否要自动删除
            //第五个参数是它要携带的头信息 这里没有
            channel.queueDeclare("队列ReturnListener",true,false,false,null);

            //进行绑定
            channel.queueBind("队列ReturnListener","交换机ReturnListener","有内鬼停止交易");

            String str = "确认消息是否收到MQ";
            //添加确认监听
            channel.addReturnListener(
                    // 第一个参数 返回的数字码
                    // 第二个参数 返回的文本信息
                    // 第三个参数 是哪个交换机
                    // 第四个参数 路由键
                    // 第五个参数 附带的信息 （信息清单等）
                    // 第六个参数 真正传输的数据是什么
                    new ReturnListener() {
                        @Override
                        public void handleReturn(
                                int replyCode,
                                String replyText,
                                String exchange,
                                String routingKey,
                                AMQP.BasicProperties properties,
                                byte[] body) throws IOException {

                            System.out.println(replyCode);
                            System.out.println(replyText);
                            System.out.println(exchange);
                            System.out.println(routingKey);
                            System.out.println(properties);
                            System.out.println(body);
                        }
                    }
            );
            //basicPublish方法，里面的参数mandatory设置true，消息无法正确路由到队列后，会返还给发送者
            // mandatory 则表示手动处理返回的信息 上面的ReturnListener才会得到错误的路由信息
            channel.basicPublish("交换机ReturnListener","有内鬼停止交易000", true, null, str.getBytes());

            //关闭信道和连接 顺序从小到大
            //channel.close();
            //connection.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (TimeoutException e) {
            e.printStackTrace();
        }
    }
}
```

### 消费者限流 QOS

```java
//同一时刻服务器只会发送一条消息给消费者
channel.basicQos(10000);

//据说prefetchSize 和global这两项，rabbitmq没有实现，暂且不研究
channel.basicQos(0, 10000, false);

//消费者确认一条，再处理一条。
//最后一个false，是否为多条。
channel.basicAck(delivery.getEnvelope().getDeliveryTag(),false);

//消费时必须取消自动确认
channel.basicConsume("队列Qos限流",true,cosumer);
```

```java
public class ConsumerTomato {

    public static void main(String[] args) {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = null;
        try {
            connection = connectionFactory.newConnection();
            //画定双向车道
            Channel channel = connection.createChannel();

            //消费之前，先限流
            //第二个参数起到作用，表示每次最多处理一条消息
            channel.basicQos(0,1,false);

            DefaultConsumer consumer = new DefaultConsumer(channel){
                @Override
                public void handleDelivery(String consumerTag,
                                           Envelope envelope,
                                           AMQP.BasicProperties properties,
                                           byte[] body) throws IOException {
                    String strRecv = "我收到了" + new String(body);
                    System.out.println(strRecv);

                    //收到消息后，在通知消息中间件，在给我数据
                    // 第一个参数用于标识唯一包裹
                    // 第二个参数用于批处理 一般为false
                    channel.basicAck(envelope.getDeliveryTag(), false);
                }
            };
            //autoAck  消费时必须取消自动确认,否则消息会直接都扔过来
            channel.basicConsume("队列Qos限流",false,consumer);

            //关闭信道和连接 顺序从小到大
            channel.close();
            connection.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (TimeoutException e) {
            e.printStackTrace();
        }
    }
}
```

###  消息设置 TTL

1. TTL 是 Time To Live 的缩写, 也就是生存时间
2. RabbitMQ 支持消息的过期时间，在消息发送时可以进行指定
3. RabbitMQ 支持队列的过期时间，从消息入队列开始计算，只要超过了队列的超时时间配置，那么消息会自动清除

```java
public class ProducerBanana {

    public static void main(String[] args) {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //设置基本配置
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setUsername("guest");
        connectionFactory.setPassword("guest");

        //修建一条高速公路
        Connection connection = null;
        try {
            connection = connectionFactory.newConnection();
            //画定双向车道
            Channel channel = connection.createChannel();

            //创建一个交换机
            //声明一个直连型交换机
            //第一个参数是它的名字（最好是英文，见名知意），
            //第二个参数是它的交换机的类型，
            //第三个参数是否要保存到本地磁盘中
            //第四个参数是否要自动删除
            //第五个参数是它要携带的头信息（这里暂时没有）
            channel.exchangeDeclare("交换机TTL60秒","direct",true,false,null);

            // 定义整个队列的所有的消息的TTL(最大存活时间)为20秒 当然通常情况下，时间控制的不会这么短
            Map<String,Object> map = new HashMap<>();
            // 20秒后消息还没有被消费，会被丢弃
            map.put("x-message-ttl",20000);

            //有了交换机就创建一个相对应的队列
            //第一个参数是它的名字（最好是英文，见名知意）
            //第二个参数是否持久化到磁盘中
            //第三个参数是否独占
            //第四个参数是否要自动删除
            //第五个参数是它要携带的头信息 这里携带的是,数据最多的存活时间 如果使用则写在最后一个参数里,再把str注释打开
            channel.queueDeclare("队列TTL60秒",true,false,false,null);

            //进行绑定
            channel.queueBind("队列TTL60秒","交换机TTL60秒","香蕉好吃吗");
            //这个是设置某一条消息的最大存活时间 为7秒
            String str222 = "我爱吃香蕉222";
            AMQP.BasicProperties properties = new AMQP.BasicProperties()
                                                .builder()
                                                .expiration("7000")
                                                .build();
            channel.basicPublish("交换机TTL60秒","香蕉好吃吗", false,properties, str222.getBytes());

            //关闭信道和连接 顺序从小到大
            channel.close();
            connection.close();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (TimeoutException e) {
            e.printStackTrace();
        }
    }
}
```

### 消息拒绝

```java
public static void main(String[] args) {
    ConnectionFactory connectionFactory = new ConnectionFactory();
    //设置基本配置
    connectionFactory.setHost("localhost");
    connectionFactory.setPort(5672);
    connectionFactory.setUsername("guest");
    connectionFactory.setPassword("guest");

    //修建一条高速公路
    Connection connection = null;
    try {
        connection = connectionFactory.newConnection();
        //画定双向车道
        Channel channel = connection.createChannel();

        DefaultConsumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag,
                                       Envelope envelope,
                                       AMQP.BasicProperties properties,
                                       byte[] body) throws IOException {
                String strRecv = "我收到了" + new String(body);
                System.out.println("确认了死信的信息:"+strRecv+"拒绝消息");

                // 拒绝 消费队列的消息
                // 第一个参数用于标识唯一包裹
                // 第二个参数用于批处理 一般为false
                channel.basicReject(envelope.getDeliveryTag(), false);
            }
        };
        //autoAck  消费时必须取消自动确认,否则消息会直接都扔过来
        channel.basicConsume("队列---处理死信",false,consumer);

        //关闭信道和连接 顺序从小到大
        // channel.close();
        // connection.close();
    } catch (IOException e) {
        e.printStackTrace();
    } catch (TimeoutException e) {
        e.printStackTrace();
    }
}
```

