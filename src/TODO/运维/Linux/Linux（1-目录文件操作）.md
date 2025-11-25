---
title: Linux（1-目录文件操作）
tags:
  - Linux
categories: 运维
cover: /img/index/linux.jpg
top_img: /img/index/linux.jpg
description: >-
  Linux
  文件目录操作包括创建、删除、重命名和移动文件及目录。常用命令有mkdir创建目录，rmdir和rm删除目录或文件，mv用于移动或重命名，cp复制文件或目录，ls用于查看目录内容。掌握这些基本命令能有效管理文件系统。
published: true
abbrlink: 8994
date: 2024-11-17 23:11:11
---

## Linux 系统目录结构图

![](Linux（1-目录文件操作）/1.jpg)

1. /root：该目录为系统管理员的用户主目录
2. /bin（Binary）：存放着最经常使用的命令
3. /boot：存放的是启动 Linux 时使用的一些核心文件，包括一些连接文件以及镜像文件
4. /dev（Device）：存放的是 Linux 的外部设备，在 Linux 中访问设备的方式和访问文件的方式是相同的
5. /ect：存放所有的系统管理所需要的配置文件和子目录
6. /home：用户的主目录，在 Linux 中，每个用户都有一个自己的目录，一般该目录名是以用户的账户命名的
7. /var：存放着在不断扩充着的东西，习惯将那些经常被修改的目录放在这个目录下，包括各种日志文件
8. /lib：存放着系统最基本的动态连接共享库，其作用类似于 Windows 的 DLL 文件，几乎所有的应用程序都需要用到这些共享库
9. /usr：用户的很多应用程序和文件都放在这个目录下，类似于 Windows 下的 program files 目录
10. /usr/bin：系统用户使用的应用程序
11. /usr/sbin：超级用户使用的比较高级的管理程序和系统守护程序
12. /usr/src：内核源代码默认的放置目录
13. /media：Linux 系统会自动识别一些设备，例如 U 盘、光驱等，当识别后，Linux 会把识别的设备挂载到这个目录下
14. /opt：给主机额外安装软件所摆放的目录
15. /proc：一个虚拟的目录，是系统内存的映射，可以通过直接访问这个目录来获取系统信息
16. /sbin（s 指 Super User）：存放的是系统管理员使用的系统管理程序
17. /srv：存放一些服务启动之后需要提取的数据
18. /tmp：用来存放一些临时文件

## 目录操作命令
### cd：目录切换
```shell
cd / ：切换到根目录
cd /usr：切换到根目录下的usr目录
cd ..：切换到上一级目录
cd ~：切换到home目录
cd -：切换到上次访问的目录
```

### ls：目录查看
1. -l：以长格式查看文件和目录
2. -o：作用同-l，显示除用户组外的详细信息
3. -a：查看当前目录下的所有目录和文件（包括隐藏的文件）
4. -R：遇到目录要进行递归展开（继续列出目录下面的文件和内容）
5. -d：只列出目录，不列出其他内容
6. -S/-t：按大小/时间排序

```shell
ls：查看当前目录下的所有目录和文件
ls -a：查看当前目录下的所有目录和文件（包括隐藏的文件）
ls -l 或 ll：列表查看当前目录下的所有目录和文件（列表查看，显示更多信息）
ls /dir：查看指定目录下的所有目录和文件，如：ls /usr
```

### mkdir：创建目录
1. -m（mode）：配置文件的权限，不需要看默认权限 (umask) 的脸色
2. -p（parents）：直接将所需要的目录（包含上一级目录）递归创建起来
3. -v（verbose）：为每一个创建的目录打印一个信息

```shell
mkdir aaa：在当前目录下创建一个名为aaa的目录
mkdir /usr/aaa：在指定目录usr（已存在）下创建一个名为aaa的目录
mkdir -p test2/test3：递归创建多个目录
mkdir -v test6：创建目录打印输出信息
mkdir -m=r-- test1：创建一个test1目录，同时目录所有者、用户组和其他用户针对该目录赋予只读权限
mkdir -m=777 test1：创建一个test1目录，同时目录所有者、用户组和其他用户针对该目录赋予所有权限
```

### rm：删除目录
1. -r 或-R：递归处理，将指定目录下的所有文件与子目录一并处理
2. -f：强制删除文件或目录
3. -i：删除已有文件或目录之前先询问用户
4. -v：打印操作的信息

```shell
删除文件：
rm a.txt：删除当前目录下的a文件
rm -f a.txt：删除当前目录的的a文件（不询问）

# 删除目录：
rm -r aaa：递归删除当前目录下的aaa目录
rm -rf aaa：递归删除当前目录下的aaa目录（不询问）

# 全部删除：
rm -rf * ：将当前目录下的所有目录和文件全部删除
rm -rf /* ：【自杀命令！慎用！慎用！慎用！】将根目录下的所有文件全部删除，删库跑路
```

### mv：目录修改
1. -b：当文件存在时，覆盖前为其创建一个备份
2. -f：force 强制，如果目标文件已经存在，不会询问而直接覆盖

```shell
重命名目录：mv 当前目录 新目录
mv aaa bbb
# 重命名文件
mv a.txt b.txt
# 剪切目录：mv 目录名称 目录的新位置
mv /usr/tmp/aaa /usr
```

### cp：目录复制
1. -r：代表递归

```shell
贝目录
cp -r /usr/tmp/aaa /usr
#拷贝文件
cp a.txt b.txt
```

### pwd：查看当前目录

## 文件操作命令
### touch：新建文件
语法：touch 文件名

```shell
touch a.txt
```

### rm：删除文件
语法：rm -rf 文件名

```shell
rm -rf a.txt
```

### vi 或 vim：修改文件

#### 切换插入模式

1. i：切换到输入模式，在光标当前位置开始输入文本
2. a：进入插入模式，在光标下一个位置开始输入文本
3. o：在当前行的下方插入一个新行，并进入插入模式
4. O：在当前行的上方插入一个新行，并进入插入模式

#### 切换末行模式

1. :：切换到底线命令模式，以在最底一行输入命令
2. : w：保存文件
3. : q：退出 vim 编辑器
4. : wq：保存并退出编辑
5. : q!：强制退出 vim 编辑器，不保存修改

#### 删除、复制和粘贴

1. x：删除当前光标所在处的字符
2. D：删除从光标到行尾的所有内容
3. dd：删除光标所在的一行
4. ndd：删除光标所在的向下 n 行
5. yy：复制光标所在的一行
6. nyy：复制光标所在的向下 n 行
7. p：粘贴剪贴板内容到光标下方
8. P：粘贴剪贴板内容到光标上方
9. r：替换光标下的字符
10. R：进入替换模式，替换当前光标后的内容，直到按 Esc 退出

#### 查找和替换

1. /字符串：向下寻找一个名为字符串的字符串
2. ?字符串：向上寻找一个名为字符串的字符串
3. n：重复上一次搜索，向下查找下一个匹配
4. N：重复上一次搜索，向上查找上一个匹配
5. :%s/old/new/g：将整个文件中的 old 替换为 new
6. :%s/old/new/gc：替换前进行确认

#### 撤销和恢复

1. u：撤销上一次操作
2. Ctrl+r：重做上一次的操作

![](Linux（1-目录文件操作）/2.png)

命令行模式下的常用命令：

1. shift+z+z：保存并退出快捷键
2. shift+g：光标跳到最后一行快捷键
3. set  noreadonly：修改 readonly 形式

### 查看文件

#### cat：第一行开始显示

格式：cat [options] 文件名

1. -b：列出行号，仅针对非空白行做行号显示，空白行不标行号
2. -n：列出行号，连同空白行也会有行号
3. -s：将连续的空行压缩为单个空行

```shell
cat a.txt
cat file1.txt file2.txt # 将多个文件的内容合并并显示
cat -n myfile.txt # 显示文件内容并包括行号
cat -s myfile.txt # 压缩空行
```

#### more：百分比显示

格式：more [options] 文件名

1. 空白键：向下翻一页
2. Enter：向下翻一行
3. b：往回翻页
4. q：退出查看
5. -数字 n：查看 n 行
6. +数字 n：从第 n 行开始看

```shell
more a.txt
```

#### less：翻页查看

格式：less [options] 文件名

1. 上下键：上下翻页
2. /字符串：代表在这个显示的内容中，向下搜寻 [字符串] 这个关键字
3. ?字符串：代表在这个显示的内容中，向上搜寻 [字符串] 这个关键字

* n：向下找下一个
* N：向上找上一个

```shell
less a.txt
```

#### tail：取出文件后面几行

格式：tail [options] 文件名

1. -f：实时打印文件内容
2. -n 数字 m：显示文件最后 m 行内容
3. -c 数字 m：显示文件最后 m 个字符

```shell
显示文件的最后 10 行
tail myfile.txt
# 显示文件的最后 20 行
tail -n 20 myfile.txt
tail -20 myfile.txt
# 实时追踪查看日志文件的新内容
tail -f /var/log/syslog
tail -20f /var/log/syslog
```

#### head：取出文件前面几行

格式：head [options] 文件名

1. -n 数字 m：显示文件前 m 行内容
2. -c 数字 m：显示文件前 m 个字符

```shell
显示文件的前 10 行
head myfile.txt
# 显示文件的前 5 行
head -5 myfile.txt
head -n 5 myfile.txt
# 显示文件的前 20 字节
head -c 20 myfile.txt
```

## 查找命令
### grep：过滤查找
语法：grep [options] pattern [file..]

1. -n：显示匹配行及行号
2. -i：忽略字母大小写
3. -w：只匹配整个单词，而不是字符串的一部分（如匹配'magic'，而不是'magical'）
4. -l：列出匹配文件内容的文件名
5. -c：统计匹配成功的行数
6. --color：匹配到的关键词会高亮显示
7. -r：递归的搜索目录
8. -v：排除对应的字符串
9. -o：只显示匹配的字符串
10. -a（after）：打印搜索的字符串后 n 行的数据
11. -b（before）：打印搜索的字符串前 n 行的数据
12. -c（both）：打印搜索的字符串前后 n 行的数据

```shell
grep -l 'oldboy' /oldboy/*
grep -i 'OLDBOY' /oldboy/oldboy.txt
grep -n 'man' /oldboy/oldboy.txt

grep -r "ramesh" * # 使用-r 参数来实现递归的搜索目录
grep -c "pattern" filename # 计算出命中匹配的总行数：6
grep -iw "is" demo_file # 只会完整的匹配 is 这个单词
grep -A 3 -i "example" demo_text # After 连着打印“example” 单词后的 2 行，共 3 行
grep -B 3 -i "example" demo_text # Before 连着打印“example” 单词前的 2 行，共 3 行
grep -C 3 -i "example" demo_text # Both 连着打印“example” 单词前后的 2 行，共 5 行
grep -v "go" demo_text  # 显示哪些不包含 go 子串的行
grep -v -e "pattern1" -e "pattern2" filename # 显示不符合 pattern1 和 pattern2 的结果的数据
grep -o "is.*line" demo_file  # 只显示 is 和 line 之间的字符串，而不是一行
```

**管道符结合**

```shell
查找指定 ssh 服务进程 
ps -ef | grep sshd
# 查找指定服务进程，排除 gerp 身 
ps -ef | grep sshd | grep -v grep
# 查找指定进程个数
ps -ef | grep sshd -c
# 显示文件行数
cat b.txt | grep -n b.txt
```

### find：目录查找

find 默认搜索当前目录及其子目录，并且不过滤任何结果（返回所有文件）

语法：find 目录 参数 文件名称

参数：

1. -name <查询方式>：按照指定的文件名查找模式查找文件
2. -user <用户名>：查找属于指定用户名所有文件
3. -group <用户组>：按文件所属组查找文件
4. -size <文件大小>：按照指定的文件大小查找文件
5. -type <文件类型>：按文件类型查找，可以是 f（普通文件）、d（目录）、l（符号链接）等

```shell
find /usr/tmp -name 'a*'：查找/usr/tmp目录下的所有以a开头的目录或文件
find /usr/tmp -user 'root'：查找/usr/tmp目录下的所有以a开头的目录或文件
find . -type f：将当前目录及其子目录中的所有文件列出
find /home -size +1M：查找 /home 目录下大于 1MB 的文件

find . -name "*.log" -ls：在当前目录查找以.log结尾的文件，并显示详细信息
find /root/ -perm 600：查找/root/目录下权限为600的文件
find . -type f -name "*.log"：查找当前目录以.log结尾的普通文件
find . -type d | sort：查找当前所有目录并排序
find . -size +100M：查找当前目录大于100M的文件
```

1. -iname：按照文件名搜索，不区分文件名大小
2. -size [+-] 大小：按照指定大小搜索文件
3. -atime [+-] 时间：按照文件访问时间搜索
4. -mtime [+-] 时间：按照文件数据修改时间搜索
5. -ctime [+-] 时间：按照文件状态修改时间搜索
6. -perm 权限模式：查找文件权限刚好等于“权限模式”的文件
7. -perm -权限模式：查找文件权限全部包含“权限模式”的文件
8. -perm +权限模式：查找文件权限包含“权限模式”的任意一个权限的文件

### locate
格式：locate [选项] [参数]

1. -A：显示匹配所有模式的文件，可使用多个匹配值选择要查找的文件
2. -b：只能匹配文件名，有绝对路径的情况下不进行匹配
3. -c：只显示文件数量
4. -i：匹配不区分大小写的文件

locate 指令无需遍历整个文件系统，查询速度较快，因为是去搜索一个数据库（/var/lib/mlocate/mlocate.db），可以很快速的搜寻某个路径，默认每天自动更新一次，所以使用 locate 命令查不到最新变动过的文件，为了避免这种情况，可以在使用 locate 之前，先使用 updatedb 命令，手动更新数据库。由于 locate 指令基于数据库进行查询，所以第一次运行前，必须使用 updatedb 指令创建 locate 数据库

```shell
updatedb
# 搜索 etc 目录下所有以 sh 开头的文件
locate /etc/sh
# 查找和 pwd 相关的所有文件
locate pwd
# 查找包含 pass 和 txt 都有的文件
locate -A "pass" "txt"
# 匹配不区分大小写的文件
locate -i "testdir"
```

与 find 的区别：

1. locate 命令查找文件在数据库中查找，查找的速度非常快，几乎是马上列出结果；而 find 命令查找时则是直接查找硬盘上的文件，查找的速度相应的非常慢
2. locate 需要先 updatedb 才能找到文件；而 find 不需要

### whereis
whereis 命令是定位可执行文件、源代码文件、帮助文件在文件系统中的位置，这些文件的属性应属于原始代码、二进制文件或帮助文件

```shell
whereis ls：将和ls文件相关的文件都查找出来
```

### which：环境变量
which 命令的作用是在 PATH 变量指定的路径中，搜索某个系统命令的位置，并且返回第一个搜索结果

```shell
which pwd	#查找 pwd 命令所在路径
which java	#查找 path 中 java 的路径
```

## 压缩文件操作
1. Linux 中的打包文件：aa.tar      
2. Linux 中的压缩文件：bb.gz   
3. Linux 中打包并压缩的文件：.tar.gz
4. Linux 中的打包文件一般是以.tar 结尾的，压缩的命令一般是以.gz 结尾的。

一般情况下打包和压缩是一起进行的，打包并压缩后的文件的后缀名一般.tar.gz。

### tar

1. 压缩命令：tar [-zcvf] 打包压缩后的文件名 要打包的文件
2. 解压命令：tar [-zxvf] 压缩文件    
+ z：调用 gzip 命令进行压缩和解压
+ c：打包文件
+ v：显示运行过程
+ f：指定文件名
+ x：代表解压

```shell
tar -cvf test.tar abd.txt bcd.txt
tar -xvf test.tar 

# 压缩文件 file1 和目录 dir2 到 test.tar.gz
tar -zcvf test.tar.gz file1 dir2
# 打包并压缩/usr/tmp 下的所有文件
tar -zcvf test.tar.gz *

# 解压 test.tar.gz（将 c 换成 x 即可），解压到当前目录下
tar -zxvf test.tar.gz
# 将/usr/tmp 下的 ab.tar 解压到根目录/usr 下
tar -zxvf test.tar.gz -C /usr

# 列出压缩文件的内容
tar -ztvf test.tar.gz 
```

### rar
### gzip/gunzip

1. gzip 文件：压缩文件（不会保留原有的文件）
+ -c：将压缩数据输出到标准输出中，可以用于保留源文件
+ -r：把目录下的所有文件都压缩，而不是把这个目录压缩（不能打包）
2. gunzip 文件.gz：解压缩文件

```shell
gzip abc.txt 
gzip -c bcd.txt > bcd.txt.gz
gzip -r aaaa/
```

### zip/unzip

1. zip [选项] 文件.zip 要压缩的文件：压缩文件和目录
+ -r：递归压缩，即压缩目录
2. unzip [选项] 文件.zip：解压缩文件
+ -d <目录>：指定解压后文件的存放目录（如果不指定 -d 参数，默认解压到当前目录下）

```shell
压缩文件
zip -r test.zip file
# 解压文件
unzip test.zip
unzip -d /home/hepingfly/abc/ mytxt.zip 
```

