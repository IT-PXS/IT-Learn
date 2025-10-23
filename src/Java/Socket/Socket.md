## 基本使用

### 服务端

```java
public class TCPServer {
    public static void main(String[] args) {
        int serverPort = 8080; // 服务器的端口号
        try (ServerSocket serverSocket = new ServerSocket(serverPort); // 创建ServerSocket，并监听指定端口
             Socket clientSocket = serverSocket.accept();
             // 创建输入流和输出流
             BufferedReader reader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
             PrintWriter writer = new PrintWriter(clientSocket.getOutputStream(), true);) {

            System.out.println("Server listening on port " + serverPort);
            // 等待客户端连接
            System.out.println("Client connected: " + clientSocket.getInetAddress());
            // 接收客户端数据
            String clientData = reader.readLine();
            System.out.println("Client sent: " + clientData);

            // 发送响应给客户端
            writer.println("Hello, client!");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 客户端

```java
public class TCPClient {

    public static void main(String[] args) {
        String serverIpAddress = "127.0.0.1"; // 服务器的IP地址
        int serverPort = 8080; // 服务器的端口号
        try (Socket socket = new Socket(serverIpAddress, serverPort); // 建立Socket连接
             BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream())); // 创建输入流和输出流
             PrintWriter writer = new PrintWriter(socket.getOutputStream(), true);) {

            // 发送数据
            writer.println("Hello, server!");
            // 接收数据
            String response = reader.readLine();
            System.out.println("Server response: " + response);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 单聊实现

### 服务端

```java
public class Server {
    public static void main(String[] args) {
        int DEFAULT_PORT = 8888;
        //创建ServerSocket监听8888端口
        try (ServerSocket serverSocket = new ServerSocket(DEFAULT_PORT);
             Socket socket = serverSocket.accept();
             //接收消息
             BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             //发送消息
             BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));) {
            System.out.println("Client[" + socket.getPort() + "]Online");
            String msg = null;
            while ((msg = reader.readLine()) != null) {
                System.out.println("Client[" + socket.getPort() + "]:" + msg);
                //写入服务端要发送的消息
                writer.write("Server:" + msg + "\n");
                writer.flush();
                //如果客户端的消息是quit代表他退出了，并跳出循环，不用再接收他的消息了。如果客户端再次连接就会重新上线
                if (msg.equals("quit")) {
                    System.out.println("Client[" + socket.getPort() + "]:Offline");
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 客户端

```java
public class Client {
    public static void main(String[] args) {
        //这是服务端的IP和端口
        String DEFAULT_SERVER_HOST = "127.0.0.1";
        int DEFAULT_SERVER_PORT = 8888;
        //创建Socket
        try (Socket socket = new Socket(DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT);
            //接收消息
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            //发送消息
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));
            //获取用户输入的消息
            BufferedReader userReader = new BufferedReader(new InputStreamReader(System.in));) {
            String msg = null;
            //循环的话客户端就可以一直输入消息，不然执行完try catch会自动释放资源，也就是断开连接
            while (true) {
                String input = userReader.readLine();
                //写入客户端要发送的消息。因为服务端用readLine获取消息，其以\n为终点，所以要在消息最后加上\n
                writer.write(input + "\n");
                writer.flush();
                msg = reader.readLine();
                System.out.println(msg);
                //如果客户端输入quit就可以跳出循环、断开连接了
                if (input.equals("quit")) {
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

