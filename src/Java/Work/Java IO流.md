---
title: Java IO流
tag: 工作技巧
category: Java
description: Java IO流用于处理输入输出操作，包括字节流（InputStream、OutputStream）和字符流（Reader、Writer）。常见类型有文件流、缓冲流、数据流等，支持文件读写、网络传输等功能。通过装饰者模式提升性能，如BufferedReader提高读取效率。NIO提供非阻塞IO，提高并发处理能力，适用于高性能场景。
date: 2024-04-09 12:42:19
---

## 基本概念

### 流分类
1. 字节流（Byte Streams）：以字节为单位进行操作，适用于处理二进制数据或不需要进行字符编码转换的场景。主要的字节流类包括 InputStream 和 OutputStream 及其子类。
2. 字符流（Character Streams）：以字符为单位进行操作，适用于处理文本数据并支持字符编码转换。主要的字符流类包括 Reader 和 Writer 及其子类。

### 作用
1. 实现数据的输入和输出：通过 IO 流，可以从外部源中读取数据到程序中，或者将程序中的数据写入到外部源中。
2. 处理文件操作：可以通过 IO 流读取、写入文件，实现文件的读取、写入和操作。
3. 网络通信：通过 IO 流可以实现网络通信，包括建立 Socket 连接、传输数据等。

### 使用场景
1. 文件操作：读取、写入和处理文件。
2. 网络编程：建立 Socket 连接，进行网络通信。
3. 数据处理：通过 IO 流实现数据的输入、输出和处理，包括序列化、反序列化等操作。
4. 图像处理：读取、写入图像文件，并进行图像处理操作。

## 字节流
### 常用类
1. InputStream 输入流

| 类名                | 说明                                                         |
|---------------------|------------------------------------------------------------|
| FileInputStream     |  用于从文件中读取数据的输入流。                              |
| ByteArrayInputStream|  从内存中的字节数组中读取数据的输入流。                      |
| BufferedInputStream |  带有缓冲区的输入流，可以提高读取性能。                      |
| DataInputStream     |  读取基本数据类型的输入流，例如 int、double 等。             |
| ObjectInputStream   |  用于反序列化对象的输入流，可以将对象从字节流中恢复为原来的对象。|

2. OutputStream 输出流

| 类名                | 说明                                                         |
|---------------------|------------------------------------------------------------|
| FileOutputStream    |  用于向文件中写入数据的输出流。                              |
| ByteArrayOutputStream|  将数据写入到内存中的字节数组的输出流。                      |
| BufferedOutputStream|  带有缓冲区的输出流，可以提高写入性能。                      |
| DataOutputStream    |  写入基本数据类型的输出流，例如 int、double 等。             |
| ObjectOutputStream  |  用于序列化对象的输出流，可以将对象转换为字节流进行持久化存储。|


### 使用案例
#### FileInputStream
```java
public class FileInputStreamExample {
    public static void main(String[] args) {
        try (FileInputStream fis = new FileInputStream("example.txt")) {
            int data;
            while ((data = fis.read()) != -1) {
                System.out.print((char) data);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### FileOutputStream
```java
public class FileOutputStreamExample {
    public static void main(String[] args) {
        String data = "Hello, FileOutputStream!";
        try (FileOutputStream fos = new FileOutputStream("output.txt")) {
            fos.write(data.getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### ByteArrayInputStream
```java
public class ByteArrayInputStreamExample {
    public static void main(String[] args) {
        byte[] bytes = {72, 101, 108, 108, 111};
        try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes)) {
            int data;
            while ((data = bais.read()) != -1) {
                System.out.print((char) data);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### ByteArrayOutputStream
```java
public class ByteArrayOutputStreamExample {
    public static void main(String[] args) {
        String data = "Hello, ByteArrayOutputStream!";
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            baos.write(data.getBytes());
            byte[] result = baos.toByteArray();
            System.out.println(new String(result));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### BufferedInputStream
```java
public class BufferedInputStreamExample {
    public static void main(String[] args) {
        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream("example.txt"))) {
            int data;
            while ((data = bis.read()) != -1) {
                System.out.print((char) data);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### BufferedOutputStream
```java
public class BufferedOutputStreamExample {
    public static void main(String[] args) {
        String data = "Hello, BufferedOutputStream!";
        try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream("output.txt"))) {
            bos.write(data.getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### DataInputStream
```java
public class DataInputStreamExample {
    public static void main(String[] args) {
        try (DataInputStream dis = new DataInputStream(new FileInputStream("data.bin"))) {
            int intValue = dis.readInt();
            double doubleValue = dis.readDouble();
            System.out.println("Int value: " + intValue);
            System.out.println("Double value: " + doubleValue);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### DataOutputStream
```java
public class DataOutputStreamExample {
    public static void main(String[] args) {
        try (DataOutputStream dos = new DataOutputStream(new FileOutputStream("data.bin"))) {
            int intValue = 42;
            double doubleValue = 3.14;
            dos.writeInt(intValue);
            dos.writeDouble(doubleValue);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### ObjectInputStream
```java
public class ObjectInputStreamExample {
    public static void main(String[] args) {
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("object.bin"))) {
            // 从文件中读取对象
            MyClass obj = (MyClass) ois.readObject();
            System.out.println("Object read from file: " + obj);
        } catch (IOException | ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

#### ObjectOutputStream
```java
public class ObjectOutputStreamExample {
    public static void main(String[] args) {
        MyClass obj = new MyClass("John", 30);
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("object.bin"))) {
            // 将对象写入文件
            oos.writeObject(obj);
            System.out.println("Object written to file: " + obj);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 字符流
### 常用类
1. Reader 读取字符流

| 类名                | 说明                                         |
|---------------------|----------------------------------------------|
| FileReader          | 从文件中读取字符数据的字符输入流。           |
| BufferedReader      | 带有缓冲区的字符输入流，提高读取性能。       |
| InputStreamReader   | 将字节流转换为字符流的桥梁，支持指定字符编码。|
| StringReader        | 从字符串中读取字符数据的字符输入流。         |

2. Writer 写入字符流

| 类名                | 说明                                         |
|---------------------|----------------------------------------------|
| FileWriter          | 向文件中写入字符数据的字符输出流。           |
| BufferedWriter      | 带有缓冲区的字符输出流，提高写入性能。       |
| OutputStreamWriter  | 将字符流转换为字节流的桥梁，支持指定字符编码。|
| StringWriter        | 将字符数据写入到字符串中的字符输出流。       |

### 使用案例
#### FileReader
```java
public class FileReaderExample {
    public static void main(String[] args) {
        try (FileReader reader = new FileReader("example.txt")) {
            int character;
            while ((character = reader.read()) != -1) {
                System.out.print((char) character);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### FileWriter
```java
public class FileWriterExample {
    public static void main(String[] args) {
        String data = "Hello, FileWriter!";
        try (FileWriter writer = new FileWriter("output.txt")) {
            writer.write(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### BufferedReader
```java
public class BufferedReaderExample {
    public static void main(String[] args) {
        try (BufferedReader reader = new BufferedReader(new FileReader("example.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### BufferedWriter
```java
public class BufferedWriterExample {
    public static void main(String[] args) {
        String data = "Hello, BufferedWriter!";
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("output.txt"))) {
            writer.write(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### InputStreamReader
```java
public class InputStreamReaderExample {
    public static void main(String[] args) {
        try (InputStreamReader isr = new InputStreamReader(new FileInputStream("example.txt"), "UTF-8")) {
            int character;
            while ((character = isr.read()) != -1) {
                System.out.print((char) character);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### OutputStreamWriter
```java
public class OutputStreamWriterExample {
    public static void main(String[] args) {
        String data = "Hello, OutputStreamWriter!";
        try (OutputStreamWriter osw = new OutputStreamWriter(new FileOutputStream("output.txt"), "UTF-8")) {
            osw.write(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### StringReader
```java
public class StringReaderExample {
    public static void main(String[] args) {
        String data = "Hello, StringReader!";
        try (StringReader reader = new StringReader(data)) {
            int character;
            while ((character = reader.read()) != -1) {
                System.out.print((char) character);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### StringWriter
```java
public class StringWriterExample {
    public static void main(String[] args) {
        try (StringWriter writer = new StringWriter()) {
            String data = "Hello, StringWriter!";
            writer.write(data);
            System.out.println(writer.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 其他

### FileOutputStream 和 BufferedOutputStream

|                | FileOutputStream                                   | BufferedOutputStream                                         |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| 是否含有缓存区 | 无                                                 | 有，默认缓存区大小为 8192byte，可通过构造函数自定义缓存区大小 |
| flush 方法      | 继承 OutputStream 类的 flush 方法，该类 flush 方法为空。 | 有 flush 方法，flush 方法调用 OutputStream 类的 write 方法，将缓存区中的数据写入文件 |
| write 方法      | write 一次写入文件一次                              | writre 方法将数据写入缓冲区，缓冲区满时将数据写入文件。       |
| 效率           | 低效，消耗资源                                     | 高效                                                         |

### 计算文件 MD5
1. 使用 java.security.MessageDigest 类

```java
import java.io.FileInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class MD5Util {
    /**
     * 获取一个文件的 md5 值(可处理大文件)
     * @return md5 value
     */
    public static String getMD5(File file) {
        FileInputStream fileInputStream = null;
        try {
            MessageDigest MD5 = MessageDigest.getInstance("MD5");
            fileInputStream = new FileInputStream(file);
            byte[] buffer = new byte[8192];
            int length;
            while ((length = fileInputStream.read(buffer)) != -1) {
                MD5.update(buffer, 0, length);
            }
            return new String(Hex.encodeHex(MD5.digest()));
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            try {
                if (fileInputStream != null){
                    fileInputStream.close();
				}
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

2. 使用 Apache Commons Codec 库

```java
import org.apache.commons.codec.digest.DigestUtils;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class MD5Util {
    public static String getFileMD5(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        byte[] bytes = Files.readAllBytes(path);
        return DigestUtils.md5Hex(bytes);
    }
}
```

### 逐行读取文件
1. BufferedReader：最快地读取每一行

```java
@Test
public void bufferReaderTest() {
    try (BufferedReader bufferedReader = new BufferedReader(new FileReader("D:\\aa.txt"))) {
        String line;
        while ((line = bufferedReader.readLine())  != null) {
            // 处理每一行数据 .....
        }
    } catch (Exception e) {
        log.error(e.getMessage(), e);
    }
}
```

2. Scanner：相比较 Scanner 会慢一点

```java
@Test
public void scannerTest() {
    try (Scanner scanner = new Scanner(new File("D:\\aa.txt"))) {
        while (scanner.hasNextLine()) {
            // 处理每一行数据 .....
            String line = scanner.nextLine();
        }
    } catch (Exception e) {
        log.error(e.getMessage(), e);
    }
}
```

3. RandomAccessFile：行数达到一定规模，使用此方法读取会非常慢

```java
@Test
public void randomAccessFileTest() {
    try (RandomAccessFile accessFile = new RandomAccessFile("D:\\aa.txt", "r")) {
        String line;
        while ((line = accessFile.readLine()) != null) {
            // 处理每一行数据 .....

        }
    } catch (Exception e) {
        log.error(e.getMessage(), e);
    }
}
```

4. Files：一次把所有数据都读到内存中，当文件非常大时，会消耗掉内存资源导致程序崩掉，文件规模小推荐使用

```java
@Test
public void filesTest() {
    try {
        List<String> lines = Files.readAllLines(Paths.get("D:\\aa.txt"));
        lines.forEach(line -> {
            // 处理每一行数据 .....

        });
    } catch (Exception e) {
        log.error(e.getMessage(), e);
    }
}
```

### 压缩和解压流

#### 压缩文件

| 方法名                                                      | 介绍                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| ZipOutputStream(OutputStream out)                           | 构造方法：创建新的 ZIP 输出流                           |
| public void putNextEntry(ZipEntry e)                        | 开始编写新的 ZIP 文件条目，并将流定位到条目数据的开头。 |
| public synchronized void write(byte [] b, int off, int len) | 将一个字节数组写入当前的 ZIP 条目数据                   |
| public void finish()                                        | 完成编写 ZIP 输出流的内容，而不关闭底层流               |
| public void setComment(String comment)                      | 设置 ZIP 文件注释                                       |

```java
public class ZipFilesExample {
    public static void main(String[] args) {
        // 两个文件的路径
        String file1Path = "/path/to/file1.txt";
        String file2Path = "/path/to/file2.txt";

        // ZIP 文件的输出路径
        String zipOutputPath = "/path/to/output.zip";
        try (FileOutputStream fos = new FileOutputStream(zipOutputPath);
            ZipOutputStream zipOut = new ZipOutputStream(fos);
            FileInputStream fis1 = new FileInputStream(file1Path);
            FileInputStream fis2 = new FileInputStream(file2Path)) {

            // 添加第一个文件到 ZIP 文件
            addToZipFile(file1Path, fis1, zipOut);
            // 添加第二个文件到 ZIP 文件
            addToZipFile(file2Path, fis2, zipOut);
            System.out.println("文件成功打包成ZIP文件！");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static void addToZipFile(String filePath, FileInputStream fis, ZipOutputStream zipOut)
        throws IOException {
        // 创建 ZIP 条目
        ZipEntry zipEntry = new ZipEntry(new File(filePath).getName());
        // 将 ZIP 条目添加到 ZIP 文件
        zipOut.putNextEntry(zipEntry);

        // 从输入流读取数据并写入 ZIP 文件
        byte[] bytes = new byte[1024];
        int length;
        while ((length = fis.read(bytes)) >= 0) {
            zipOut.write(bytes, 0, length);
        }
        // 关闭当前 ZIP 条目
        zipOut.closeEntry();
    }
}
```

#### 解压文件

| 方法名                                | 介绍                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| public ZipInputStream(InputStream in) | 创建新的 ZIP 输入流。                                   |
| public ZipEntry getNextEntry()        | 读取下一个 ZIP 文件条目并将流定位到该条目数据的开始处。 |

假如要去压缩一个文件夹，每一个文件就是一个条目，每一个条目就是一个 ZipEntry，有多少个文件就要有多少个 ZipEntry ，然后 putNextEntry

```java
public class ZipUtils {

    /**
     * 解压
     * 
     * @param zipFilePath 带解压文件
     * @param desDirectory 解压到的目录
     * @throws Exception
     */
    public static void unzip(String zipFilePath, String desDirectory) throws Exception {
        File desDir = new File(desDirectory);
        if (!desDir.exists()) {
            boolean mkdirSuccess = desDir.mkdir();
            if (!mkdirSuccess) {
                throw new Exception("创建解压目标文件夹失败");
            }
        }
        // 读入流
        ZipInputStream zipInputStream = new ZipInputStream(new FileInputStream(zipFilePath));
        // 遍历每一个文件
        ZipEntry zipEntry = zipInputStream.getNextEntry();
        while (zipEntry != null) {
            if (zipEntry.isDirectory()) { // 文件夹
                String unzipFilePath = desDirectory + File.separator + zipEntry.getName();
                // 直接创建
                mkdir(new File(unzipFilePath));
            } else { // 文件
                String unzipFilePath = desDirectory + File.separator + zipEntry.getName();
                File file = new File(unzipFilePath);
                // 创建父目录
                mkdir(file.getParentFile());
                // 写出文件流
                BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(new FileOutputStream(unzipFilePath));
                byte[] bytes = new byte[1024];
                int readLen;
                while ((readLen = zipInputStream.read(bytes)) != -1) {
                    bufferedOutputStream.write(bytes, 0, readLen);
                }
                bufferedOutputStream.close();
            }
            zipInputStream.closeEntry();
            zipEntry = zipInputStream.getNextEntry();
        }
        zipInputStream.close();
    }

    // 如果父目录不存在则创建
    private static void mkdir(File file) {
        if (null == file || file.exists()) {
            return;
        }
        mkdir(file.getParentFile());
        file.mkdir();
    }

    public static void main(String[] args) throws Exception {
        String zipFilePath = "D:/test.zip";
        String desDirectory = "D:/a";
        unzip(zipFilePath, desDirectory);
    }
}
```

#### 读取文件内容

```java
public static void main(String[] args) throws IOException {
   //获取文件输入流
   FileInputStream input = new FileInputStream("C:\\Users\\Administrator\\Desktop\\test\\test.zip");
   //获取 ZIP 输入流(一定要指定字符集 Charset.forName("GBK")否则会报 java.lang.IllegalArgumentException: MALFORMED)
   ZipInputStream zipInputStream = new ZipInputStream(new BufferedInputStream(input), Charset.forName("GBK"));
 
   //定义 ZipEntry 置为 null, 避免由于重复调用 zipInputStream.getNextEntry 造成的不必要的问题
   ZipEntry ze = null;
   //循环遍历
   while ((ze = zipInputStream.getNextEntry()) != null) {
       System.out.println("文件名：" + ze.getName() + " 文件大小：" + ze.getSize() + " bytes");
       System.out.println("文件内容：");
       //读取
       BufferedReader br = new BufferedReader(new InputStreamReader(zipInputStream,Charset.forName("GBK")));
       String line;
       //内容不为空，输出
       while ((line = br.readLine()) != null) {
           System.out.println(line);
       }
   }
   //一定记得关闭流
   zipInputStream.closeEntry();
   input.close();
}
```
