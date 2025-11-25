---
title: 
series: 
tags:
 
categories: 
cover: /img/index/
top_img: /img/index/
description: 
abbrlink: 7790
date: 2024-10-26 12:42:19
published: false
---

## React 的特点

1. 采用组件化模式，声明式编码，提高开发效率及组件复用率;
2. 在 React Native 中可以使用 React 语法进行 *移动端开发*；
3. 使用虚拟 DOM+优秀的 Diffing 算法，尽量减少与真实 DOM 的交互。

![](react/1.png)

对比两次生成的虚拟 DOM，如果重复，直接用页面之前有的 DOM，而不是全部重绘真实 DOM

## 引入文件

- react.js （核心库）：核心库要在 react-dom 之前引入
- react-dom.js ：提供操作 DOM 的 react 扩展库
- babel.min.js：解析 JSX 语法代码转为 JS 代码的库，即 ES6 ==> ES5; JSX== > JS

## JSX

全称: JavaScript XML，是 react 定义的一种类似于 XML 的 JS 扩展语法，本质是 `React.createElement(component, props, ...children)` 方法的语法糖。JXS 最终产生的 [虚拟 DOM](https://so.csdn.net/so/search?q=虚拟DOM&spm=1001.2101.3001.7020) 就是一个 JS 对象。

**JSX 语法规则**

- 定义虚拟 DOM 时不用写引号
- 标签中混入 JS 表达式时要用 `{}`

```js
const VDOM=(
        <div>
            <h1>前端js框架列表</h1>
            <ul>
                {
                    data.map((item,index)=>{
                        return <li key={index}>{item}</li>
                    })
                }
            </ul>               
        </div>           
    )
```

遇到以 { 开头的代码，以 JS 语法解析，且标签中的 js 表达式必须用{ }包含，比如 \< ul > 中的{}中的{index}和{item}

注：key ={index}：在进行组件遍历的时候必须要加一个 key 来区分每个组件

1. CSS 类名指定不用 class，用 className

2. 内联样式 style ={{key：value}}，如 style ={{color：‘white’，fontSize：20px}}

3. 虚拟 DOM 必须只有一个根标签

4. 标签必须闭合，如 \< input type = "test" />

5. 标签首字母

* 若小写字母开头，则转为 html5 中的同名元素，如无则报错
* 若大写字母开头，react 就去渲染对应的组件，若组件没有定义，则报错

## 虚拟 DOM

1. 本质是 Object，即一般对象（不是数组对象和函数对象）
2. 虚拟 DOM 比较“轻”，真实 DOM 比较“重”，因为虚拟 DOM 是 react 内部在用，无需真实 DOM 中那么多属性
3. 虚拟 DOM 最终会被 react 转换为真实 DOM 呈现在页面上

## 模块与组件

**模块**

1. 向外界提供特定功能的 js 程序。随着业务逻辑增加，代码越来越多且复杂，此时 js 一般会拆成多个 js 文件来编写，一般一个 js 文件就是一个模块
2. 作用：复用 js，简化 js 的编写，提高 js 的运行效率
3. 模块化：当应用的 js 都以模块来编写的，这个应用就是一个模块化的应用

**组件**

1. 用来实现局部功能效果的代码和资源的集合(html/css/js/image 等等)。比如一个功能齐全的 Header 栏就是一个组件。
2. 复用编码，简化项目编码， 提高运行效率
3. 组件化：当应用是以多组件的方式实现, 这个应用就是一个组件化的应用

## 创建组件

### 函数式组件

适用于简单组件（无 `state`）

```js
<script type="text/babel">
    // 创建函数组件
    function MyComponent(){
        return <h2>我是用函数定义的组件(适用于【简单组件】的定义)</h2>
    }
    //2.渲染组件到页面
    ReactDOM.render(<MyComponent/>,document.getElementById('test'))
</script>
```

注意事项：函数中的 this 指向 undefined，因为 babel 编译后开启了严格模式

本例中，执行了 ReactDOM.render(\< MyComponent/>.......）之后，发生了什么？

1. React 解析组件标签，找到了 MyComponent 组件。
2. 发现组件是使用函数定义的，随后调用该函数，将返回的虚拟 DOM 转为真实 DOM，随后呈现在页面中。

### 类式组件

适用于复杂组件（有 `state`）

```js
<script type="text/babel">
    //1.创建类式组件
    class MyComponent extends React.Component {
        render(){
            return <h2>我是用类定义的组件(适用于【复杂组件】的定义)</h2>
        }
    }
    //2.渲染组件到页面
    ReactDOM.render(<MyComponent/>,document.getElementById('test'))
</script>
```

注意事项：

1. 类式组件必须要继承 react 的内值类 React.Component
2. 一定要写 render 函数，且要有返回值
3. render 是放在类的原型对象上，供实例使用。
4. render 中的 this 指向类的实例对象（原因见下方） <=> 类式组件的实例对象。

本例中，执行了 ReactDOM.render(\< MyComponent/>.......）之后，发生了什么？

1. React 解析组件标签，找到了 MyComponent 组件。
2. 发现组件是使用类定义的，随后 new 出来该类的实例，并通过该实例调用到原型上的 render 方法。
3. 将 render 返回的虚拟 DOM 转为真实 DOM，随后呈现在页面中。

## 组件实例的三大属性

### state 属性

- `state` 是组件对象最重要的属性, 值是对象(可以包含多个 key-value 的组合)
- 组件被称为 "状态机"， 通过更新组件的 `state` 来 **更新** 对应的页面显示(重新渲染组件)

```js
<script type="text/babel">
    //1.创建组件
    class Weather extends React.Component{

        //构造器调用几次？ ———— 1次，只写了一个weather标签
        constructor(props){  //为了操作state
            console.log('constructor');
            super(props)
            //初始化状态
            this.state = {isHot:false,wind:'微风'}
            //解决changeWeather中this指向问题
            this.changeWeather = this.changeWeather.bind(this)
        }

        //render调用几次？ ———— 1+n次 1是初始化的那次 n是状态更新的次数
        render(){
            console.log('render');
            //读取状态
            const {isHot,wind} = this.state   //这种写法的依据?
            //复杂方法
            // const isHot = this.state.isHot;
            // const wind = this.state.wind;
            return <h1 onClick={this.changeWeather}>今天天气很{isHot ? '炎热' : '凉爽'}，{wind}</h1>
        }
        //、这里onclick是赋值语句，不能调用
        //changeWeather调用几次？ ———— 点几次调几次
        changeWeather(){
            //changeWeather放在哪里？ ———— Weather的原型对象上，供实例使用
            //由于changeWeather是作为onClick的回调，所以不是通过实例调用的，是直接调用
            //类中的方法默认开启了局部的严格模式，所以changeWeather中的this为undefined

            console.log('changeWeather');
            //获取原来的(isHot值
            const isHot = this.state.isHot
            //严重注意：状态必须通过setState进行更新,且更新是一种合并，不是替换（wind还在）。
            this.setState({isHot:!isHot})
            console.log(this);

            //严重注意：状态(state)不可直接更改，下面这行就是直接更改！！！
            //this.state.isHot = !isHot //这是错误的写法
        }
    }
    //2.渲染组件到页面
    ReactDOM.render(<Weather/>,document.getElementById('test'))
</script>
```

注意事项：

1. 在构造器 constructor 中初始化 state，且要用对象形式初始化 state
2. 在 render 函数中创建虚拟 DOM 时，直接在标签中绑定事件，且事件写法不同于原生 JS，如原生 JS 中的 onclick 事件，在 react 中要写成 onClick，其他同理。
3. onClick ={this.changeWeather}是将 this.changeWeather 函数赋值给 onClick，函数后面不能加括号，否则就是将函数返回值赋值
4. 事件的回调函数要写在类中，此时它放在类的实例对象的原型链上，供实例使用。在本例中，由于 changeWeather 是作为 onClick 的回调，所以不是通过实例调用的，是直接调用，且类中的方法默认开启了局部的严格模式，所以其中 this 的指向不是实例对象，而是 undefined。render 函数也是放在对象的原型链上，但是它是由类的实例对象调用的，所以 this 指向实例对象
5. 自定义的事件回调函数的 this 可以在构造器中用 bind 更改指向，生成的新函数直接在类中，所以 this 指向实例对象
6. 注意： 状态必须通过 setState 以对象的形式进行更新，且更新是一种合并，不是替换
7. const {isHot, wind} = this.state 是 ES6 中的对象解构，获取多个对象属性的方法

**简写方法**

```js
<script type="text/babel">
    //1.创建组件
    class Weather extends React.Component{
        //初始化状态 类里可以直接写赋值语句，相当于追加属性（值写死）
        state = {isHot:false,wind:'微风'}

        render(){
            const {isHot,wind} = this.state
            return <h1 onClick={this.changeWeather}>今天天气很{isHot ? '炎热' : '凉爽'}，{wind}</h1>
        }

        //自定义方法————要用赋值语句的形式+箭头函数
        // changeWeather从原型上移到实例对象自身，外层函数的this就是箭头函数的this
        changeWeather = ()=>{
            const isHot = this.state.isHot
            this.setState({isHot:!isHot})
        }
    }
    //2.渲染组件到页面
    ReactDOM.render(<Weather/>,document.getElementById('test'))
</script>
```

注意事项：

1. 类里可以直接写赋值语句，相当于追加属性（值写死），所以 state 可以直接在类里通过赋值的形式初始化，而不是在构造函数中
2. 自定义回调函数的指向可以通过将箭头函数赋值的方式，从原型上转移到实例对象自身，箭头函数中 this 指向外层函数中的 this，这里即为实例对象

3. 组件中 render 方法中的 this 为组件实例对象

4. 组件自定义的方法中 this 为 undefined，如何解决？

* 强制绑定 this: 通过函数对象的 bind()（可在 constructor 中用 bind，也可在绑定事件函数时用 bind，即 onClick ={this.changeWeather。bind(this)）
* 箭头函数

5. 状态数据，不能直接修改或更新

### props 属性

1. 作用：通过标签属性（创建虚拟 DOM 时直接添加的数据）从组件外向组件内传递变化的数据
2. 传递 props，即传递标签属性，props 批量传递标签属性
3. 每个组件对象都会有 props(properties 的简写)属性
4. 组件标签的所有属性都保存在 props 中
5. 注意: 组件内部不要修改 props 数据

```js
<script type="text/babel">
    //创建组件
    class Person extends React.Component{
        render(){
            // console.log(this);
            const {name,age,sex} = this.props
            return (
                <ul>
                    <li>姓名：{name}</li>
                    <li>性别：{sex}</li>
                    <li>年龄：{age+1}</li>
                </ul>
            )
        }
    }
    //渲染组件到页面
    ReactDOM.render(<Person name="jerry" age={19}  sex="男" speak={speak}/>,document.getElementById('test1'))
    ReactDOM.render(<Person name="tom" age={18} sex="女"/>,document.getElementById('test2'))

    const p = {name:'老刘',age:18,sex:'女'}
    ReactDOM.render(<Person {...p}/>,document.getElementById('test3'))

    function speak(){
        console.log('我说话了');
    }
</script>
```

注意事项：

写入数据有两种方式：

1. 在虚拟 DOM 标签中直接写入数据，如 \< Person name = "18" age ={18} sex = "女"/>（{18}代表是数值型，“18”代表是字符串）。props 是对象，里面存储着键值对形式，name = "18" 中，name 是键，"18" 是值
2. 在虚拟 DOM 标签中用扩展运算符展开对象，如 <Person {...p}/>。这里…不是三点（拓展/展开运算符），因为对象不能使用拓展运算符（数组和可遍历的伪数组可以）。而{...obj}是 ES6 语法，是一个复制对象。但是在这里，{...p}并不是复制对象，因为这里的{}表示括号里面要写 js 表达式了，所以真正写的还是...p，这里 react+babel 就允许用展开运算符展开对象，不能随便使用（不能用 console.log()查看）, 仅仅适用于标签传递数据时。
3. 数据会存入到类式组件 props 属性中，在 render 中可以通过 this.props 获取数据
4. 内部读取某个属性值用 this.props.属性名
5. 组件类的构造函数 constructor 可省。

在 react 组件挂载之前，会调用它的构造函数。在为 React.Component 子类实现构造函数时，应在其他语句之前调用 super(props)。否则，this.props 在构造函数中可能会出现未定义的 bug。

通常，在 react 中，构造函数仅用于以下两种情况： a）通过给 this.state 赋值对象来初始化内部 state。
b）为事件处理函数绑定实例

**对 props 进行限制**

首先要引入 prop-types 库，用于对组件标签属性进行限制

限制 `props` 有两种方法：

1. 限制内容写在类外面

```js
Person.propTypes = {
    name:PropTypes.string.isRequired, //限制name必传，且为字符串
    sex:PropTypes.string,//限制sex为字符串
    age:PropTypes.number,//限制age为数值
    speak:PropTypes.func,//限制speak为函数
}
//指定默认标签属性值
Person.defaultProps = {
	sex:'男',//sex默认值为男
	age:18 //age默认值为18
}
```

2. 限制内容写在类里面

```js
static propTypes = {
    name:PropTypes.string.isRequired, //限制name必传，且为字符串
    sex:PropTypes.string,//限制sex为字符串
    age:PropTypes.number,//限制age为数值
}

//指定默认标签属性值
static defaultProps = {
	sex:'男',//sex默认值为男
	age:18 //age默认值为18
}
```

注意事项：

- 首字母小写的 `propTypes` 是类里的属性规则
- 首字母大写的 `PropTypes` 是 prop-types 库里的内置对象
- React v15.5 开始已弃用的写法 `name: React.PropTypes.string.isRequired`

**函数组件使用 props**

三大属性中，只有 `props` 可以用于函数组件，因为函数可以接收参数，`state` 和 `refs` 都不能用于函数组件

```js
<script type="text/babel">
    //创建组件
    function Person (props){
        const {name,age,sex} = props
        return (
                <ul>
                    <li>姓名：{name}</li>
                    <li>性别：{sex}</li>
                    <li>年龄：{age}</li>
                </ul>
            )
    }
    Person.propTypes = {
        name:PropTypes.string.isRequired, //限制name必传，且为字符串
        sex:PropTypes.string,//限制sex为字符串
        age:PropTypes.number,//限制age为数值
    }

    //指定默认标签属性值
    Person.defaultProps = {
        sex:'男',//sex默认值为男
        age:18 //age默认值为18
    }
    //渲染组件到页面
    ReactDOM.render(<Person name="jerry"/>,document.getElementById('test1'))
</script>
```

注意事项：限制 `props` 只能使用第一种方法

### refs 属性

组件内的标签可以定义 `ref` 属性来标识自己。`this.refs` 拿到真实 DOM

**字符串形式的 ref**

```js
class Demo extends React.Component{
    //展示左侧输入框的数据
    showData = ()=>{
        console.log(this);
        const {input1} = this.refs
        alert(input1.value)
    }
    //展示右侧输入框的数据
    showData2 = ()=>{
        console.log(this);
        const {input2} = this.refs
        alert(input2.value)
    }
    render(){
        return(
            <div>
                <input ref="input1" type="text" placeholder="点击按钮提示数据"/>&nbsp;
                <button onClick={this.showData}>点我提示左侧的数据</button>&nbsp;
                <input ref="input2" onBlur={this.showData2} type="text" placeholder="失去焦点提示数据"/>
            </div>
        )
    }
}
//渲染组件到页面
ReactDOM.render(<Demo a="1" b="2"/>,document.getElementById('test'))
```

**回调 ref**

1. 内联函数

```js
<input ref={currentNode => this.input1 = currentNode } type="text" placeholder="点击按钮提示数据"/>&nbsp; 
{/*这里的this是指向实例对象，因为箭头函数没有指向，查找外侧的this指向*/}
```

注意：

- 函数中的参数 `currentNode` 是 `ref` 所在的节点
- 此时 `input1` 是类的属性，即 **直接绑定到类里**，而不是像字符串 ref 一样添加到 `refs` 对象里

2. 类绑定函数

```js
saveInput = (c)=>{
				this.input1 = c;
				console.log('@',c);
			}
<input ref={this.saveInput} type="text"/>
```

3. 回调 ref 中回调执行次数

内联函数更新时会执行两次，一次清空，一次执行函数，类绑定函数不会。

交互和更改状态的区别：取决于是否修改 `render` 函数中节点的内容

```js
<script type="text/babel">
    class Demo extends React.Component{
        myRef = React.createRef()
        myRef2 = React.createRef()
        showData = ()=>{
            alert(this.myRef.current.value);
        }
        showData2 = ()=>{
            alert(this.myRef2.current.value);
        }
        render(){
            return(
                <div>
                    <input ref={this.myRef} type="text" placeholder="点击按钮提示数据"/>&nbsp;
                    <button onClick={this.showData}>点我提示左侧的数据</button>&nbsp;
                    <input onBlur={this.showData2} ref={this.myRef2} type="text" placeholder="失去焦点提示数据"/>&nbsp;
                </div>
            )
        }
    }
    ReactDOM.render(<Demo a="1" b="2"/>,document.getElementById('test'))
</script>
```

`React.createRef` 调用后可以返回一个容器，该容器可以存储被 `ref` 所标识的节点, 该容器是“专人专用”的，有多少个节点表示 `ref`，就要调用多少次 `React.createRef`

### 事件处理

1. 通过 onXxx 属性指定事件处理函数(注意大小写)

* React 使用的是自定义(合成)事件, 而不是使用的原生 DOM 事件——为了更好的兼容性
* React 中的事件是通过事件委托方式处理的(委托给组件最外层的元素)———为了高效

2. 通过 event.target 得到发生事件的 DOM 元素对象。发生事件的元素就是操作的元素则可以省略 ref。

3. 不要过度使用 ref。

## 受控组件和非受控组件

### 非受控组件

页面中所有的输入类 DOM 现用现取，即通过 `ref` 标识 DOM，进而获取数据

```js
<script type="text/babel">
    //创建组件
    class Login extends React.Component{
        handleSubmit = (event)=>{
            event.preventDefault() //阻止表单提交
            const {username,password} = this
            alert(`你输入的用户名是：${username.value},你输入的密码是：${password.value}`)
        }
        render(){
            return(
                <form onSubmit={this.handleSubmit}>
                    用户名：<input ref={c => this.username = c} type="text" name="username"/>
                    密码：<input ref={c => this.password = c} type="password" name="password"/>
                    <button>登录</button>
                </form>
            )
        }
    }
    //渲染组件
    ReactDOM.render(<Login/>,document.getElementById('test'))
</script>
```

1. 表单 \< form > 中都有 onSubmit 属性来控制提交之后的状态
2. 输入 DOM（如 \< input >）得有 name 属性才能通过 GET 请求获取到 query 参数（用？携带）
3. 删掉 action 无法阻止表单页面刷新以及地址栏更新，得要禁止默认事件 event.preventDefault()
4. \< button > 的默认 type 属性值就是 submit

### 受控组件

用 `onChange`+`state` 实现，页面中所有的输入类 DOM 将数据存在 `state` 中

更推荐用受控组件，减少 `ref` 的使用

```js
<script type="text/babel">
    //创建组件
    class Login extends React.Component{

        //初始化状态
        state = {
            username:'', //用户名
            password:'' //密码
        }

        //保存用户名到状态中
        saveUsername = (event)=>{
            this.setState({username:event.target.value})
        }

        //保存密码到状态中
        savePassword = (event)=>{
            this.setState({password:event.target.value})
        }

        //表单提交的回调
        handleSubmit = (event)=>{
            event.preventDefault() //阻止表单提交
            const {username,password} = this.state
            alert(`你输入的用户名是：${username},你输入的密码是：${password}`)
        }

        render(){
            return(
                <form onSubmit={this.handleSubmit}>
                    用户名：<input onChange={this.saveUsername} type="text" name="username"/>
                    密码：<input onChange={this.savePassword} type="password" name="password"/>
                    <button>登录</button>
                </form>
            )
        }
    }
    //渲染组件
    ReactDOM.render(<Login/>,document.getElementById('test'))
</script>
```

### 高阶函数

如果一个函数符合下面 2 个规范中的任何一个，那该函数就是高阶函数。

1. 若 A 函数，接收的参数是一个函数，那么 A 就可以称之为高阶函数。
2. 若 A 函数，调用的返回值依然是一个函数，那么 A 就可以称之为高阶函数。常见的高阶函数有：Promise、setTimeout、arr.map()等等

函数的柯里化：通过函数调用继续返回函数的方式，实现多次接收参数最后统一处理的函数编码形式。

```js
function sum(a){
	return(b)=>{
		return (c)=>{
			return a+b+c
		}
	}
}
```

**用函数的柯里化实现受控组件**

为了不重复编写相似的代码，如 `saveUsername` 和 `savePassword`

```js
<script type="text/babel">
    //创建组件
    class Login extends React.Component{
        //初始化状态
        state = {
            username:'', //用户名
            password:'' //密码
        }

        //保存表单数据到状态中（函数的柯里化）
        saveFormData = (dataType)=>{
            return (event)=>{
                this.setState({[dataType]:event.target.value})
            }
        }

        //表单提交的回调
        handleSubmit = (event)=>{
            event.preventDefault() //阻止表单提交
            const {username,password} = this.state
            alert(`你输入的用户名是：${username},你输入的密码是：${password}`)
        }
        render(){
            return(
                <form onSubmit={this.handleSubmit}>
                    用户名：<input onChange={this.saveFormData('username')} type="text" name="username"/>
                    密码：<input onChange={this.saveFormData('password')} type="password" name="password"/>
                    <button>登录</button>
                </form>
            )
        }
    }
    //渲染组件
    ReactDOM.render(<Login/>,document.getElementById('test'))
</script>
```

1. this.saveFormData('username')，有了小括号，立即调用，但是返回的还是一个函数，符合回调函数的要求
2. [dataType]：调用变量形式的对象属性名
3. event 形参不需要实参，可以直接调用，所以 event 不能写进 this.saveFormData('username')的参数中，得用柯里化形式来体现

## 生命周期

### react 生命周期（旧）

![](react/2.png)

1. 父组件 render–> componentWillReceiveProps–> shouldComponentUpdate–> componentWillUpdate–> render–> componentDidUpdate–> componentWillUnmount
2. setState()–> shouldComponentUpdate–> componentWillUpdate–> render–> componentDidUpdate–> componentWillUnmount
3. forceUpdate()–> componentWillUpdate–> render–> componentDidUpdate–> componentWillUnmount

**知识点：**

- `shouldComponentUpdate` 返回值必须为 `true` 或 `false`，若不写，默认为 `true`
- `forceUpdate()`：强制更新。不更改任何状态中的数据，强制更新一下
- `componentWillReceiveProps`：第一次调用不算。

**生命周期的三个阶段（旧）**

1. 初始化阶段：由 ReactDOM.render()触发—初次渲染

* constructor()
* componentWillMount()
* render()： 常用，一定得调用
* componentDidMount()： 常用，一般在这个钩子中做一些初始化的事，如开启定时器、发送网络请求、订阅消息

2. 更新阶段：由组件内部 this.setSate()或父组件重新 render 触发

* shouldComponentUpdate()
* componentWillUpdate()
* render()
* componentDidUpdate()

3. 卸载组件：由 ReactDOM.unmountComponentAtNode()触发

componentWillUnmount() ：常用，一般在这个钩子中做一些收尾的事，如关闭定时器、取消订阅消息

### react 生命周期（新）

![](react/3.png)

1. 17 及以上版本 componentWillMount、componentWillUpdate、componentWillReceiveProps 三个钩子使用前要加 UNSAFE_前缀才能使用，以后可能会被彻底废弃，不建议使用。
2. 新的生命周期和旧的生命周期相比，除了即将废弃三个钩子，还添加了两个新的钩子 getDerivedStateFromProps 和 getSnapshotBeforeUpdate
3. static getDerivedStateFromProps：适用于罕见用例（几乎不用），返回 null 或 state 对象，state 的值在任何时候都取决于 props
4. getSnapshotBeforeUpdate(prevProps, prevState,)：在更新之前获取快照，返回值传递给 componentDidUpdate(prevProps, prevState, snapshotValue)

## 虚拟 DOM 与 DOM Diffing 算法

DOM Diffing 算法对比的最小粒度是标签，且逐层对比

![](react/4.png)

**为什么遍历列表时，key 最好不要用 index?**

1. 若对数据进行：**逆序** 添加、**逆序** 删除等破坏顺序操作：会产生没有必要的真实 DOM 更新 ==> 界面效果没问题，但效率低。
2. 如果结构中还包含输入类的 DOM（如 input，虚拟 DOM 中标签属性少，input 没有 value 属性）：会产生错误 DOM 更新 ==> 界面有问题。

## React 脚手架

### 配置代理

```js
"proxy":"http://localhost:5000"
```

1. 创建代理配置文件：在 src 下创建配置文件：src/setupProxy.js(不允许改名)

2. 编写 setupProxy.js 配置具体代理规则：

```js
const proxy = require('http-proxy-middleware')

module.exports = function(app) {
  app.use(
    proxy('/api1', {  //api1是需要转发的请求(所有带有/api1前缀的请求都会转发给5000)
      target: 'http://localhost:5000', //配置转发目标地址(能返回数据的服务器地址)
      changeOrigin: true, //控制服务器接收到的请求头中host字段的值
      /*
      	changeOrigin设置为true时，服务器收到的请求头中的host为：localhost:5000
      	changeOrigin设置为false时，服务器收到的请求头中的host为：localhost:3000
      	changeOrigin默认值为false，但我们一般将changeOrigin值设为true
      */
      pathRewrite: {'^/api1': ''} //去除请求前缀/api1，保证交给后台服务器的是正常请求地址(必须配置)
    }),
    proxy('/api2', { 
      target: 'http://localhost:5001',
      changeOrigin: true,
      pathRewrite: {'^/api2': ''}
    })
  )
}
```

### 连续解构赋值

```js
const {keyWordElement:{value}} = this
// 相当于 this.keyWordElement.value，此时keyWordElement并没有被解构，只是写的过程，即
console.log(keyWordElement) // undefined

const {keyWordElement:{value:keyWord}} = this
```

### 路由组件与一般组件

1. 写法不同：

* 一般组件：\< Demo/>
* 路由组件：\< Route path = "/demo" component ={Demo}/>

2. 存放位置不同：

* 一般组件：components
* 路由组件：pages

3. 接收到的 props 不同：

* 一般组件：写组件标签时传递了什么，就能收到什么
* 路由组件：接收到三个固定的属性

### 解决样式丢失问题

**什么时候样式丢失？**

路由路径多级，且刷新的时候

**解决办法**

1. public/index.html 中 引入样式时不写 ./ 而是写 / （**常用**）。因为./是相对路径，去掉之后就是绝对路径，直接去 localhost: 3000 下调文件

```js
<link rel="stylesheet" href="/css/bootstrap.css">
```

2. public/index.html 中 引入样式时不写 ./ 写 %PUBLIC_URL% （**常用**）。因为%PUBLIC_URL%代表 public 的绝对路径

```js
<link rel="stylesheet" href="%PUBLIC_URL%/css/bootstrap.css">
```

3. 将 `<BrowserRouter>` 改为 `<HashRouter>`

### Switch

1. 注册路由时用 Switch 包裹所有路由
2. 通常情况下，path 和 component 是一一对应的关系。
3. Switch 可以提高路由匹配效率(**单一匹配**)。

### NavLink 及其封装

1. NavLink 可以实现路由链接的高亮，通过 **activeClassName** 指定样式名
2. 标签体内容是一个特殊的标签属性，可以通过 this.props.children 获取。因此以下两段代码是等价的。

```js
<NavLink activeClassName="atguigu" className="list-group-item" children="About" />
<NavLink activeClassName="atguigu" className="list-group-item" to="/about">About</NavLink>
```

### 路由的模糊匹配与严格匹配

1. 默认使用的是模糊匹配（简单记：【输入的路径】必须包含要【匹配的路径】，且顺序要一致）

```js
<MyNavLink to="/about/a/b">Home</MyNavLink>  //模糊匹配
<Route path="/about" component={About}/>
```

2. 开启严格匹配

```js
<Route exact={true} path="/about" component={About}/>
// exact={true}可以简写为exact
```

### 嵌套路由（多级路由）

1. 注册子路由时要 **写上父路由** 的 path 值

```js
{/* 注册路由 */}
<Switch>
	<Route path="/home/news" component={News}/>
	<Route path="/home/message" component={Message}/>
	<Redirect to="/home/news"/>
</Switch>
```

2. 路由的匹配是按照 **注册路由的顺序** 进行的

### 向路由组件传递参数

#### params 参数（最多）

1. 路由链接(携带参数)：

```js
<Link to='/demo/test/tom/18'}>详情</Link>
```

2. 注册路由(声明接收)：

```js
<Route path="/demo/test/:name/:age" component={Test}/>
```

3. 接收参数：`this.props.match.params`

#### search 参数

1. 路由链接(携带参数)：

```js
<Link to='/demo/test/?name=tom&age=18'}>详情</Link>
//？前面加不加/
```

2. 注册路由(无需声明，正常注册即可)：

```js
<Route path="/demo/test" component={Test}/>
```

3. 接收参数：this.props.location.search

备注：获取到的 search 是 urlencoded 编码（即，name = tom&age = 18）字符串，需要借助 querystring 解析（querystring.stringify(obj), querystring.parse(str)）。去掉问号用 qs.parse(str.slice(1)

#### state 参数（不同于普通组件的 state 属性）

1. 路由链接(携带参数)：

```js
<Link to={{pathname:'/demo/test',state:{name:'tom',age:18}}}>详情</Link>
```

2. 注册路由(无需声明，正常注册即可)：

```js
<Route path="/demo/test" component={Test}/>
```

3. 接收参数：`this.props.location.state`

### push 和 replace

路由是对浏览器历史记录的操作，总共有两种操作，push（压栈）和 replace（替代栈顶元素）。

默认是 push 模式，要想开启 replace 模式，则在路由连接 \< Link > 标签中加入 replace ={true}或 replace

### 编程式路由导航

借助 this.prosp.history 对象上的 API 对操作路由跳转、前进、后退，而不用路由的 \< Link > 和 \< NavLink >，但还是要注册路由

1. this.prosp.history.push()
2. this.prosp.history.replace()
3. this.prosp.history.goBack()
4. this.prosp.history.goForward()
5. this.prosp.history.go()

### withRouter 的使用

1. `withRouter` 可以加工一般组件，让一般组件具备路由组件所特有的 API
2. `withRouter` 的返回值是一个新组件。
3. 在一般组件中要用到路由组件的 props 属性时引入。

```js
import {withRouter} from 'react-router-dom'
```

需要暴露

```js
export default withRouter(Header)
```

### BrowserRouter 与 HashRouter 的区别

1. 底层原理不一样：

* BrowserRouter 使用的是 H5 的 history API，不兼容 IE9 及以下版本。
* HashRouter 使用的是 URL 的哈希值。

2. path 表现形式不一样

* BrowserRouter 的路径中没有#, 例如：localhost: 3000/demo/test
* HashRouter 的路径包含#, 例如：localhost: 3000/#/demo/test

3. 刷新后对路由 state 参数的影响

* BrowserRouter 没有任何影响，因为 state 保存在 history 对象中。

* HashRouter 刷新后会导致路由 state 参数的丢失！！！

备注： HashRouter 可以用于解决一些路径错误相关的问题。

## redux

### redux 简介

1. redux 是一个专门用于做状态管理的 JS 库(不是 react 插件库)。
2. 它可以用在 react, angular, vue 等项目中, 但基本与 react 配合使用。
3. 作用：集中式管理 react 应用中多个组件共享的状态。

**什么情况下需要使用 redux**

1. 某个组件的状态，需要让其他组件可以随时拿到（共享）。
2. 一个组件需要改变另一个组件的状态（通信）。
3. 总体原则：能不用就不用, 如果不用比较吃力才考虑使用。

### redux 工作流程

![](react/5.png)

### 核心概念

#### action

1. 动作的对象

2. 包含 2 个属性

* `type`：标识属性, 值为字符串, 唯一, 必要属性
* `data`：数据属性, 值类型任意, 可选属性

3. 例子：`{ type: 'ADD_STUDENT',data:{name: 'tom',age:18} }`

#### reducer

1. 用于 **初始化** 状态、**加工** 状态。
2. 加工时，根据旧的 state 和 action， 产生新的 state 的 `纯函数`。
3. 有几个组件就有几个 reducer？

#### store

将 state、action、reducer 联系在一起的对象

如何得到此对象?
1) import {createStore} from 'redux'
2) import reducer from './reducers'
3) const store = createStore(reducer)

此对象的功能?
1) getState(): 得到 state
2) dispatch(action): 分发 action, 触发 reducer 调用, 产生新的 state
3) subscribe(listener): 注册监听, 当产生了新的 state 时, 自动调用

### 求和案例_redux 精简版

src 下建立

```js
//文件
-redux
	-store.js
	-count_reducer.js
```

1. store.js：

* 引入 redux 中的 createStore 函数，创建一个 store
* createStore 调用时要传入一个为其服务的 reducer
* 记得暴露 store 对象（store.js 默认暴露一个函数调用，函数返回一个对象，其他文件引入的时候将此对象命名为 store）

2. count_reducer.js：

* reducer 的本质是一个函数，接收：preState, action，返回加工后的状态
* reducer 有两个作用：初始化状态，加工状态
* reducer 被第一次调用时，是 store 自动触发的。传递的 preState 是 undefined，传递的 action 是:{type:'@@REDUX/INIT_a.2.b.4}

3. 在 index.js 中监测 store 中状态的改变，一旦发生改变重新渲染

**备注**：redux 只负责管理状态，至于状态的改变驱动着页面的展示，要靠我们自己写。

### 求和案例_react-redux 基本使用

![](react/6.png)

如何创建一个容器组件—靠 react-redux 的 `connect` 函数：

```js
connect(mapStateToProps,mapDispatchToProps)(UI组件)
```

1. mapStateToProps: 映射状态，返回值是一个对象。返回的对象中的 key 就作为传递给 UI 组件 props 的 key, value 就作为传递给 UI 组件 props 的 value
2. mapDispatchToProps: 映射操作状态的方法，返回值是一个对象。返回的对象中的 key 就作为传递给 UI 组件 props 的 key, value 就作为传递给 UI 组件 props 的 value

**备注**：容器组件中的 store 是靠 `props` 传进去的，而不是在容器组件中直接引入

### 求和案例_react-redux 优化

1. 容器组件和 UI 组件整合一个文件
2. 若有多个容器组件，无需自己给每个容器组件传递 store，给包裹一个 \< Provider store ={store}> 即可。
3. 使用了 react-redux 后也不用再自己检测 redux 中状态的改变了，容器组件可以自动完成这个工作。
4. mapDispatchToProps 也可以简单的写成一个对象，因为 react-redux 可以自动 dispatch

一个组件要和 react-redux“打交道”要经过哪几步？

* 定义好 UI 组件—不暴露
* 引入 `connect` 生成一个容器组件，并暴露，写法如下：

```js
connect(
	state => ({key:value}), //映射状态
	{key:xxxxxAction} //映射操作状态的方法
)(UI组件)
```

* 在 UI 组件中通过 `this.props.xxxxxxx` 读取和操作状态

## React Router 6

与 React Router 5.x 版本相比，改变了什么？

1. 内置组件的变化：移除 \< Switch/> ，新增 \< Routes/> 等。
2. 语法的变化：component ={About} 变为 element ={\< About/>}等。
3. 新增多个 hook：useParams、useNavigate、useMatch 等。

### `<BrowserRouter>`

`<BrowserRouter> ` 用于包裹整个应用。

```js
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    {/* 整体结构（通常为App组件） */}
  </BrowserRouter>,root
);
```

### `<HashRouter>`

作用与 `<BrowserRouter>` 一样，但 `<HashRouter>` 修改的是地址栏的 hash 值。

### `<Routes/> 与 <Route/>`

v6 版本中移出了先前的 \< Switch >，引入了新的替代者：\< Routes >。

1. \< Routes > 和 \< Route > 要配合使用，且必须要用 \< Routes > 包裹 \< Route >。
2. \< Route > 相当于一个 if 语句，如果其路径与当前 URL 匹配，则呈现其对应的组件。
3. \< Route caseSensitive > 属性用于指定：匹配时是否区分大小写（默认为 false）。
4. 当 URL 发生变化时，\< Routes > 都会查看其所有子 \< Route > 元素以找到最佳匹配并呈现组件 。
5. \< Route > 也可以嵌套使用，且可配合 useRoutes()配置 “路由表” ，但需要通过 \< Outlet > 组件来渲染其子路由。

```js
<Routes>
    /*path属性用于定义路径，element属性用于定义当前路径所对应的组件*/
    <Route path="/login" element={<Login />}></Route>

	/*用于定义嵌套路由，home是一级路由，对应的路径/home*/
    <Route path="home" element={<Home />}>
    /*test1 和 test2 是二级路由,对应的路径是/home/test1 或 /home/test2*/
      <Route path="test1" element={<Test/>}></Route>
      <Route path="test2" element={<Test2/>}></Route>
 	</Route>
	
	//Route也可以不写element属性, 这时就是用于展示嵌套的路由 .所对应的路径是/users/xxx
    <Route path="users">
       <Route path="xxx" element={<Demo />} />
    </Route>
</Routes>
```

### `<Link>`

1. 作用: 修改 URL，且不发送网络请求（路由链接）。
2. 注意: 外侧需要用 `<BrowserRouter>` 或 `<HashRouter>` 包裹。

```js
import { Link } from "react-router-dom";

function Test() {
  return (
    <div>
    	<Link to="/路径">按钮</Link>
    </div>
  );
}
```

### `<NavLink>`

作用: 与 `<Link>` 组件类似，且可实现导航的“高亮”效果。

**注意：** 默认情况下，当 Home 的子组件匹配成功，Home 的导航也会高亮，当 NavLink 上添加了 end 属性后，若 Home 的子组件匹配成功，则 Home 的导航没有高亮效果。

```js
// 注意: NavLink默认类名是active，下面是指定自定义的className

//自定义样式
<NavLink
    to="login"
    className={({ isActive }) => {
        console.log('home', isActive)
        return isActive ? 'base one' : 'base'
    }}
>login</NavLink>

/*
	默认情况下，当Home的子组件匹配成功，Home的导航也会高亮，
	当NavLink上添加了end属性后，若Home的子组件匹配成功，则Home的导航没有高亮效果。
*/
<NavLink to="home" end >home</NavLink>
```

### `<Navigate>`

1. 作用：只要 `<Navigate>` 组件被渲染，就会修改路径，切换视图。
2. `replace` 属性用于控制跳转模式（push 或 replace，默认是 push）。

```js
import React,{useState} from 'react'
import {Navigate} from 'react-router-dom'

export default function Home() {
	const [sum,setSum] = useState(1)
	return (
		<div>
			<h3>我是Home的内容</h3>
			{/* 根据sum的值决定是否切换视图 */}
			{sum === 1 ? <h4>sum的值为{sum}</h4> : <Navigate to="/about" replace={true}/>}
			<button onClick={()=>setSum(2)}>点我将sum变为2</button>
		</div>
	)
}
```

### `<Outlet>`

当 `<Route>` 产生嵌套时，渲染其对应的后续子路由。

```js
//根据路由表生成对应的路由规则
const element = useRoutes([
  {
    path:'/about',
    element:<About/>
  },
  {
    path:'/home',
    element:<Home/>,
    children:[
      {
        path:'news',
        element:<News/>
      },
      {
        path:'message',
        element:<Message/>,
      }
    ]
  }
])

//Home.js
import React from 'react'
import {NavLink,Outlet} from 'react-router-dom'

export default function Home() {
	return (
		<div>
			<h2>Home组件内容</h2>
			<div>
				<ul className="nav nav-tabs">
					<li>
						<NavLink className="list-group-item" to="news">News</NavLink>
					</li>
					<li>
						<NavLink className="list-group-item" to="message">Message</NavLink>
					</li>
				</ul>
				{/* 指定路由组件呈现的位置 */}
				<Outlet />
			</div>
		</div>
	)
}
```

## Hooks

### `useRoutes()`

作用：根据 **路由表**，动态创建 `<Routes>` 和 `<Route>`。

```js
//路由表配置：src/routes/index.js
import About from '../pages/About'
import Home from '../pages/Home'
import {Navigate} from 'react-router-dom'

export default [
	{
		path:'/about',
		element:<About/>
		children：[    //子路由
    		{  
    		path:'news',
    		element:<News/>
    		}
		]
	},
	{
		path:'/home',
		element:<Home/>
	},
	{
		path:'/',
		element:<Navigate to="/about"/>
	}
]

//App.jsx
import React from 'react'
import {NavLink,useRoutes} from 'react-router-dom'
import routes from './routes'

export default function App() {
	//根据路由表生成对应的路由规则
	const element = useRoutes(routes)  //一级路由用useRoutes()和element定位，子路由用<outlet />定位
	return (
		<div>
			......
      {/* 注册路由 */}
      {element}
		  ......
		</div>
	)
}
```

**注意：** 一级路由（App.js 中）用 useRoutes()和 element 定位，子路由用 `<outlet />` 定位

### `useNavigate()`

作用：返回一个函数用来实现编程式导航。

```js
import React from 'react'
import {useNavigate} from 'react-router-dom'

export default function Demo() {
  const navigate = useNavigate()
  const handle = () => {
    //第一种使用方式：指定具体的路径
    navigate('/login', {
      replace: false,
      state: {a:1, b:2}
    }) 
    //第二种使用方式：传入数值进行前进或后退，类似于5.x中的 history.go()方法
    navigate(-1)
  }
  
  return (
    <div>
      <button onClick={handle}>按钮</button>
    </div>
  )
}
```

### `useParams()`

作用：回当前匹配路由的 `params` 参数，类似于 5.x 中的 `match.params`。

```js
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import User from './pages/User.jsx'

function ProfilePage() {
  // 获取URL中携带过来的params参数
  let { id } = useParams();
}

function App() {
  return (
    <Routes>
      <Route path="users/:id" element={<User />}/>
    </Routes>
  );
}
```

### `useSearchParams(search，setSearch)`

1. 作用：用于读取和修改当前位置的 URL 中的查询字符串。
2. 返回一个包含两个值的数组，内容分别为：当前的 seaech 参数、更新 search 的函数。

```js
import React from 'react'
import {useSearchParams} from 'react-router-dom'

export default function Detail() {
	const [search,setSearch] = useSearchParams()
	const id = search.get('id')
	const title = search.get('title')
	const content = search.get('content')
	return (
		<ul>
			<li>
				<button onClick={()=>setSearch('id=008&title=哈哈&content=嘻嘻')}>点我更新一下收到的search参数</button>
			</li>
			<li>消息编号：{id}</li>
			<li>消息标题：{title}</li>
			<li>消息内容：{content}</li>
		</ul>
	)
}
```

### `useLocation()`

作用：获取当前 location 信息，对标 5.x 中的路由组件的 `location` 属性。可以传递 state 参数

```js
import React from 'react'
import {useLocation} from 'react-router-dom'

export default function Detail() {
const {state:{id,title,content}} = useLocation()
	//const x = useLocation()
	//console.log('@',x)
  // x就是location对象: 
	/*
		{
      hash: "",
      key: "ah9nv6sz",
      pathname: "/login",
      search: "?name=zs&age=18",
      state: {a: 1, b: 2}
    }
	*/
	return (
		<ul>
			<li>消息编号：{id}</li>
			<li>消息标题：{title}</li>
			<li>消息内容：{content}</li>
		</ul>
	)
}
```

### `useMatch()`

作用：返回当前匹配信息，对标 5.x 中的路由组件的 `match` 属性。

```js
<Route path="/login/:page/:pageSize" element={<Login />}/>
<NavLink to="/login/1/10">登录</NavLink>

export default function Login() {
  const match = useMatch('/login/:x/:y')
  console.log(match) //输出match对象
  //match对象内容如下：
  /*
  	{
      params: {x: '1', y: '10'}
      pathname: "/LoGin/1/10"  
      pathnameBase: "/LoGin/1/10"
      pattern: {
      	path: '/login/:x/:y', 
      	caseSensitive: false, 
      	end: false
      }
    }
  */
  return (
  	<div>
      <h1>Login</h1>
    </div>
  )
}
```

### `useInRouterContext()`

作用：如果组件在 `<Router>` 的上下文中呈现，则 `useInRouterContext` 钩子返回 true，否则返回 false。

### `useNavigationType()`

1. 作用：返回当前的导航类型（用户是如何来到当前页面的）。
2. 返回值：`POP`、`PUSH`、`REPLACE`。
3. 备注：`POP` 是指在浏览器中直接打开了这个路由组件（刷新页面）。

### `useOutlet()`

作用：用来呈现当前组件中渲染的嵌套路由。

```js
const result = useOutlet()
console.log(result)
// 如果嵌套路由没有挂载,则result为null
// 如果嵌套路由已经挂载,则展示嵌套的路由对象
```

### `useResolvedPath()`

作用：给定一个 URL 值，解析其中的：path、search、hash 值。
