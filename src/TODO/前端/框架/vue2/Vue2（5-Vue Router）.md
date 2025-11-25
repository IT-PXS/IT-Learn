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

## 基本使用

1. 创建组件

首先引入 vue.js 和 vue-router.js：

```js
<script src="js/vue.js"></script>
<script src="js/vue-router.js"></script>
```

然后创建两个组件构造器 Home 和 About：

```js
var Home = Vue.extend({
	template: '<div><h1>Home</h1><p>{{msg}}</p></div>',
	data: function() {
		return {
			msg: 'Hello, vue router!'
		}
	}
})

var About = Vue.extend({
	template: '<div><h1>About</h1><p>This is the tutorial about vue-router.</p></div>'
})
```

2. 创建 Router

```js
var router = new VueRouter();
```

调用构造器 VueRouter，创建一个路由器实例 router。

3. 映射路由

```js
router.map({
	'/home': { component: Home },
	'/about': { component: About }
})
```

调用 router 的 map 方法映射路由，每条路由以 key-value 的形式存在，key 是路径，value 是组件。

例如：`'/home'` 是一条路由的 key，它表示路径；`{component: Home}` 则表示该条路由映射的组件。

4. 使用 v-link 指令

```js
<div class="list-group">
	<a class="list-group-item" v-link="{ path: '/home'}">Home</a>
	<a class="list-group-item" v-link="{ path: '/about'}">About</a>
</div>
```

在 a 元素上使用 `v-link` 指令跳转到指定路径。

5. 使用 \< router-view > 标签

```js
<router-view></router-view>
```

在页面上使用 `<router-view></router-view>` 标签，它用于渲染匹配的组件。

6. 启动路由

```js
var App = Vue.extend({})
router.start(App, '#app')
```

路由器的运行需要一个根组件，`router.start(App, '#app')` 表示 router 会创建一个 App 实例，并且挂载到#app 元素。

注意：使用 vue-router 的应用，不需要显式地创建 Vue 实例，而是调用 start 方法将根组件挂载到某个元素。

**v-link 指令**

`v-link` 是一个用来让用户在 vue-router 应用的不同路径间跳转的指令，该指令接受一个 JavaScript 表达式，并会在用户点击元素时用该表达式的值去调用 `router.go`。

```js
<!-- 字面量路径 -->
<a v-link="'home'">Home</a>

<!-- 效果同上 -->
<a v-link="{ path: 'home' }">Home</a>

<!-- 具名路径 -->
<a v-link="{ name: 'detail', params: {id: '01'} }">Home</a>
```

`v-link` 会自动设置 `<a>` 的 `href` 属性，你无需使用 `href` 来处理浏览器的调整，原因如下：

- 它在 HTML5 history 模式和 hash 模式下的工作方式相同，所以如果你决定改变模式，或者 IE9 浏览器退化为 hash 模式时，都不需要做任何改变。
- 在 HTML5 history 模式下，`v-link` 会监听点击事件，防止浏览器尝试重新加载页面。
- 在 HTML5 history 模式下使用 `root` 选项时，不需要在 `v-link` 的 URL 中包含 root 路径。

**\< router-link > 的 replace 属性**

作用：控制路由跳转时操作浏览器历史记录的模式

浏览器的历史记录有两种写入方式：分别为 push 和 replace，push 是追加历史记录，replace 是替换当前记录。路由跳转时候默认为 push

如何开启 replace 模式：<router-link replace .......> News \</router-link >

**使用案例**

1. 安装 vue-router，命令：`npm i vue-router`
2. 应用插件：`Vue.use(VueRouter)`
3. src/components/Home.vue

```html
<template>
  <h2>我是Home组件的内容</h2>
</template>

<script>
    export default {
        name:'Home'
    }
</script>
```

4. src/components/About.vue

```html
<template>
  <h2>我是About组件的内容</h2>
</template>

<script>
    export default {
        name:'About'
    }
</script>
```

5. src/router/index.js

```html
//该文件专门用于创建整个应用的路由器
import VueRouter from "vue-router";
//引入组件
import Home from '../components/Home'
import About from '../components/About'

//创建router实例对象，去管理一组一组的路由规则
const router = new VueRouter({
	routes:[
		{
			path:'/about',
			component:About
		},
		{
			path:'/home',
			component:Home
		}
	]
})

//暴露router
export default router
```

6. src/main.js

```html
import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import router from './router'

Vue.config.productionTip = false
Vue.use(VueRouter)

new Vue({
    el:"#app",
    render: h => h(App),
    router
})
```

7. src/App.vue

```html
<template>
	<div>
		<div class="row">
			<div class="col-xs-offset-2 col-xs-8">
				<div class="page-header"><h2>Vue Router Demo</h2></div>
			</div>
		</div>
		<div class="row">
			<div class="col-xs-2 col-xs-offset-2">
				<div class="list-group">
					<!-- 原始html中我们使用a标签实现页面跳转 -->
					<!-- <a class="list-group-item active" href="./about.html">About</a>
					<a class="list-group-item" href="./home.html">Home</a> -->
					
					<!-- Vue中借助router-link标签实现路由的切换 -->
					<router-link class="list-group-item" active-class="active" to="/about"> 							About
    				</router-link>
					<router-link class="list-group-item" active-class="active" to="/home">
                        Home
    				</router-link>
				</div>
			</div>
			<div class="col-xs-6">
				<div class="panel">
					<div class="panel-body">
						<!-- 指定组件的呈现位置 -->
						<router-view></router-view>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name:'App',
	}
</script>
```

**注意点**

1. 路由组件通常存放在 `pages` 文件夹，一般组件通常存放在 `components` 文件夹。
2. 通过切换，“隐藏”了的路由组件，默认是被销毁掉的，需要的时候再去挂载。
3. 每个组件都有自己的 `$route` 属性，里面存储着自己的路由信息。
4. 整个应用只有一个 router，可以通过组件的 `$router` 属性获取到。

## 重定向

应用在首次运行时右侧是一片空白，应用通常都会有一个首页，例如：Home 页。

使用 `router.redirect` 方法将根路径重定向到/home 路径：

```
router.redirect({
	'/': '/home'
})
```

`router.redirect` 方法用于为路由器定义全局的重定向规则，全局的重定向会在匹配当前路径之前执行。

```html
//重定向
}
  path: '/goLogin',
  redirect: '/login'
},
//登录页
{
  path: '/login',
  component: Login
},
```

## 404 配置

```html
const router = new VueRouter({
  routes: [
    { path: '/', redirect: '/home'},
    { path: '/home', component: Home },
    { path: '/search/:words?', component: Search },
    { path: '*', component: NotFound }//配置在最后一条
  ]
})
```

## 路由对象

在使用了 vue-router 的应用中，路由对象会被注入每个组件中，赋值为 `this.$route` ，并且当路由切换时，路由对象会被更新。

路由对象暴露了以下属性：

1. $route.path：字符串，等于当前路由对象的路径，会被解析为绝对路径，如 `"/home/news "` 。
2. $route.params：对象，包含路由中的动态片段和全匹配片段的键值对
3. $route.query：对象，包含路由中查询参数的键值对。例如，对于 `/home/news/detail/01?favorite=yes` ，会得到 `$ route.query.favorite == 'yes'` 。
4. $route.router：路由规则所属的路由器（以及其所属的组件）。
5. $route.matched：数组，包含当前匹配的路径中所包含的所有片段所对应的配置参数对象。
6. $route.name：当前路径的名字，如果没有使用具名路径，则名字为空。

在页面上添加以下代码，可以显示这些路由对象的属性：

```html
<div>
	<p>当前路径：{{$route.path}}</p>
	<p>当前参数：{{$route.params | json}}</p>
	<p>路由名称：{{$route.name}}</p>
	<p>路由查询参数：{{$route.query | json}}</p>
	<p>路由匹配项：{{$route.matched | json}}</p>
</div>
```

`$router.matched` 属性，它是一个包含性的匹配，它会将嵌套它的父路由都匹配出来。

例如，`/home/news/detail/:id` 这条路径，它包含 3 条匹配的路由：

1. /home/news/detail/: id
2. /home/news
3. /home

另外，带有 `v-link` 指令的元素，如果 `v-link` 对应的 URL 匹配当前的路径，该元素会被添加特定的 class，该 class 的默认名称为 `v-link-active`。例如，当我们访问 `/home/news/detail/03` 这个 URL 时，根据匹配规则，会有 3 个链接被添加 `v-link-active`。

## 多级路由

1. 配置路由规则，使用 children 配置项：

```js
routes:[
	{
		path:'/about',
		component:About,
	},
	{
		path:'/home',
		component:Home,
		children:[ //通过 children 配置子级路由
			{
				path:'news', //此处一定不要写：/news
				component:News
			},
			{
				path:'message',//此处一定不要写：/message
				component:Message
			}
		]
	}
]
```

2. 跳转（要写完整路径）：

```js
<router-link to="/home/news">News</router-link>
```

3. 指定展示位置

```js
<router-view></router-view>
```

## 命名路由

作用：可以简化路由的跳转。

1. 给路由命名：

```js
{
	path:'/demo',
	component:Demo,
	children:[
		{
			path:'test',
			component:Test,
			children:[
				{
                    name:'hello' //给路由命名
					path:'welcome',
					component:Hello,
				}
			]
		}
	]
}
```

2. 简化跳转：

```js
<!--简化前，需要写完整的路径 -->
<router-link to="/demo/test/welcome">跳转</router-link>

<!--简化后，直接通过名字跳转 -->
<router-link :to="{name:'hello'}">跳转</router-link>

<!--简化写法配合传递参数 -->
<router-link 
	:to="{
		name:'hello',
		query:{
		   id:666,
           title:'你好'
		}
	}"
>跳转</router-link>
```

## 路由的 query 参数

1. 传递参数

```js
<!-- 跳转并携带query参数，to的字符串写法 -->
<router-link :to="/home/message/detail?id=666&title=你好">跳转</router-link>
				
<!-- 跳转并携带query参数，to的对象写法 -->
<router-link 
	:to="{
		path:'/home/message/detail',
		query:{
		   id:666,
           title:'你好'
		}
	}"
>跳转</router-link>
```

2. 接收参数

```js
$route.query.id
$route.query.title
```

## 路由的 params 参数

1. 配置路由，声明接收 params 参数

```js
{
	path:'/home',
	component:Home,
	children:[
		{
			path:'news',
			component:News
		},
		{
			component:Message,
			children:[
				{
					name:'xiangqing',
					path:'detail/:id/:title', //使用占位符声明接收 params 参数
					component:Detail
				}
			]
		}
	]
}
```

```html
const router = new VueRouter({
  routes: [
    { path: '/search/:words', component: Search }
  ]
})
```

注意事项：/search/: words 表示，必须要传参数。如果不传参数，也希望匹配，可以加个可选符 "?"，例如以下

```html
{ path: '/search/:words?', component: Search }
```

2. 传递参数

```js
<!-- 跳转并携带params参数，to的字符串写法 -->
<router-link :to="/home/message/detail/666/你好">跳转</router-link>
				
<!-- 跳转并携带params参数，to的对象写法 -->
<router-link 
	:to="{
		name:'xiangqing',
		params:{
		   id:666,
           title:'你好'
		}
	}"
>跳转</router-link>
```

特别注意：路由携带 params 参数时，若使用 to 的对象写法，则不能使用 path 配置项，必须使用 name 配置！

3. 接收参数：

```js
$route.params.id
$route.params.title
```

## 路由的 props 配置

作用：让路由组件更方便的收到参数

```js
{
	name:'xiangqing',
	path:'detail/:id',
	component:Detail,

	//第一种写法：props 值为对象，该对象中所有的 key-value 的组合最终都会通过 props 传给 Detail 组件
	// props:{a: 900}

	//第二种写法：props 值为布尔值，布尔值为 true，则把路由收到的所有 params 参数通过 props 传给 Detail 组件
	// props: true
	
	//第三种写法：props 值为函数，该函数返回的对象中每一组 key-value 都会通过 props 传给 Detail 组件
	props($route) {
		return {
            id: $route.query.id,
            title:$route.query.title,
            a: 1,
            b: 'hello'
		}
	}
}
```

跳转去组件的具体代码

```html
<template>
  <ul>
      <h1>Detail</h1>
      <li>消息编号：{{id}}</li>
      <li>消息标题：{{title}}</li>
      <li>a:{{a}}</li>
      <li>b:{{b}}</li>
  </ul>
</template>

<script>
export default {
    name: 'Detail',
    props: ['id', 'title', 'a', 'b'],
    mounted () {
        console.log(this.$route);
    }
}
</script>

<style>

</style>
```

## 编程式路由导航

作用：不借助 `<router-link> ` 实现路由跳转，让路由跳转更加灵活

```js
//$router 的两个 API
this.$router.push({
	name:'xiangqing',
		params:{
			id:xxx,
			title:xxx
		}
})

this.$router.replace({
	name:'xiangqing',
		params:{
			id:xxx,
			title:xxx
		}
})
this.$router.forward() //前进
this.$router.back() //后退
this.$router.go() //可前进也可后退
```

## 缓存路由组件

keep-alive：Vue 的内置组件，包裹动态时，可以缓存

作用：让不展示的路由组件保持挂载，不被销毁。

优点：组件切换时，把切换出去的组件保留在内存中（提升性能）

keep-alive 的三个属性（了解）

1. include：组件名数组，只有匹配的组件会被缓存
2. exclude：组件名数组，任何匹配的组件都不会被缓存
3. max：最多可以缓存多少组件实例

```html
<template>
  <div class="h5-wrapper">
    <keep-alive :include="['组件名']">
      <router-view></router-view>
    </keep-alive>
  </div>
</template>
```

keep-alive 的使用触发两个生命周期函数

1. activated 当组件被激活（使用）的时候触发 → 进入页面触发
2. deactivated 当组件不被使用的时候触发 → 离开页面触发

```html
// 这个 include 指的是组件名
<keep-alive include="News"> 
    <router-view></router-view>
</keep-alive>
```

## 两个新的生命周期

作用：路由组件所独有的两个钩子，用于捕获路由组件的激活状态。

具体名字：

- `activated` 路由组件被激活时触发。
- `deactivated` 路由组件失活时触发。

这两个生命周期钩子需要配合前面的缓存路由组件使用（没有缓存路由组件不起效果）

## 路由守卫

作用：对路由进行权限控制

分类：全局守卫、独享守卫、组件内守卫

1. 全局守卫

```js
//全局前置守卫：初始化时执行、每次路由切换前执行
router.beforeEach((to,from,next)=>{
	console.log('beforeEach',to,from)
	if(to.meta.isAuth){ //判断当前路由是否需要进行权限控制
		if(localStorage.getItem('school') === 'zhejiang'){ //权限控制的具体规则
			next() //放行
		}else{
			alert('暂无权限查看')
			// next({name:'guanyu'})
		}
	}else{
		next() //放行
	}
})

//全局后置守卫：初始化时执行、每次路由切换后执行
router.afterEach((to,from)=>{
	console.log('afterEach',to,from)
	if(to.meta.title){ 
		document.title = to.meta.title //修改网页的 title
	}else{
		document.title = 'vue_test'
	}
})
```

```js
// 这个文件专门用于创建整个应用的路由器
import VueRouter from 'vue-router'
// 引入组件
import About from '../pages/About.vue'
import Home from '../pages/Home.vue'
import Message from '../pages/Message.vue'
import News from '../pages/News.vue'
import Detail from '../pages/Detail.vue'
// 创建并暴露一个路由器
const router = new VueRouter({
    routes: [
        {
            path: '/home',
            component: Home,
            meta:{title:'主页'},
            children: [
                {
                    path: 'news',
                    component: News,
                    meta:{isAuth:true,title:'新闻'}
                },
                {
                    path: 'message',
                    name: 'mess',
                    component: Message,
                    meta:{isAuth:true,title:'消息'},
                    children: [
                        {
                            path: 'detail/:id/:title',
                            name: 'xiangqing',
                            component: Detail,
                            meta:{isAuth:true,title:'详情'},
                            props($route) {
                                return {
                                    id: $route.query.id,
                                    title:$route.query.title,
									a: 1,
									b: 'hello'
                                }
                            }
                        }
                    ]
                }
            ]
        },
        {
            path: '/about',
            component: About,
            meta:{ title: '关于' }
        }
    ]
})

// 全局前置路由守卫————初始化的时候被调用、每次路由切换之前被调用
router.beforeEach((to, from, next) => {
    console.log('前置路由守卫', to, from);
    if(to.meta.isAuth) {
        if(localStorage.getItem('school') === 'zhejiang') {
            // 放行
            next()
        } else {
            alert('学校名不对，无权查看')
        }
    } else {
        next()
    }
})

// 全局后置路由守卫————初始化的时候被调用、每次路由切换之后被调用
router.afterEach((to, from) => {
    console.log('后置路由守卫', to, from)
    document.title = to.meta.title || '我的系统'
})

export default router
```

2. 独享守卫

就是在 routes 子路由内写守卫

```js
beforeEnter(to,from,next){
	console.log('beforeEnter',to,from)
	if(to.meta.isAuth){ //判断当前路由是否需要进行权限控制
		if(localStorage.getItem('school') === 'atguigu'){
			next()
		}else{
			alert('暂无权限查看')
			// next({name:'guanyu'})
		}
	}else{
		next()
	}
}
```

3. 组件内守卫

在具体组件内写守卫

```js
//进入守卫：通过路由规则，进入该组件时被调用
beforeRouteEnter (to, from, next) {
},
//离开守卫：通过路由规则，离开该组件时被调用
beforeRouteLeave (to, from, next) {
}
```

```html
// 两个钩子函数,类似过滤器或拦截器的环绕
beforeRouteEnter: (to, from, next) => {
    console.log('进入路由之前...');
    next() // 必写
},
beforeRouteLeave: (to, from, next) => {
    console.log('离开路由之前...')
    next() // 必写
}
```

## 路由器的两种工作模式

对于一个 url 来说，什么是 hash 值？—— #及其后面的内容就是 hash 值。

hash 值不会包含在 HTTP 请求中，即：hash 值不会带给服务器。

1. hash 模式：

* 地址中永远带着#号，不美观 。
* 若以后将地址通过第三方手机 app 分享，若 app 校验严格，则地址会被标记为不合法。
* 兼容性较好。

2. history 模式：

* 地址干净，美观 。
* 兼容性和 hash 模式相比略差。
* 应用部署上线时需要后端人员支持，解决刷新页面服务端 404 的问题。

```html
const router = new VueRouter({
  mode:'history',
})
```

## 声明式导航

router-link 自动给当前导航栏添加了两个高亮类名

1. **router-link-active** 模糊匹配（用的多）

```html
to = "/my" 可以匹配	"/my"	"/my/a"		"/my/b"		...
```

2. **router-link-exact-active** 精确匹配

```html
to = "\my" 仅可以匹配 "/my" 
```

自定义 router-link 的两个高亮类名：

```html
const router = new VueRouter({
  routes: [
    { path: '/find', component: Find },
    { path: '/my', component: My },
    { path: '/friend', component: Friend },
  ],
  linkActiveClass:'active',
  linkExactActiveClass:'exact-active'
})
```

## 钩子函数

路由的切换过程，本质上是执行一系列路由钩子函数，钩子函数总体上分为两大类：

- 全局的钩子函数
- 组件的钩子函数

全局的钩子函数定义在全局的路由对象中，组件的钩子函数则定义在组件的 `route` 选项中。

**全局钩子函数**

全局钩子函数有 2 个：

- `beforeEach`：在路由切换开始时调用
- `afterEach`：在每次路由切换成功进入激活阶段时被调用

**组件的钩子函数**

组件的钩子函数一共 6 个：

- data：可以设置组件的 data
- activate：激活组件
- deactivate：禁用组件
- canActivate：组件是否可以被激活
- canDeactivate：组件是否可以被禁用
- canReuse：组件是否可以被重用

**切换对象**

每个切换钩子函数都会接受一个 `transition` 对象作为参数。这个切换对象包含以下函数和方法：

- transition.to：表示将要切换到的路径的路由对象。
- transition.from：代表当前路径的路由对象。
- transition.next()：调用此函数处理切换过程的下一步。
- transition.abort([reason])：调用此函数来终止或者拒绝此次切换。
- transition.redirect(path)：取消当前切换并重定向到另一个路由。

**钩子函数的执行顺序**

## 路由懒加载

**什么是懒加载？**

当打包构建应用时，JavaScript 包会变得非常大，影响页面加载。

如果我们能吧不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应组件，这样就更加高效了。

```html
// import Home from '../components/Home'
// import About from '../components/About'
// import User from '../components/User'
 
// 懒加载方式
const Home = () => import('../components/Home')
const About = () => import('../components/About')
const User = () => import('../components/User')
```

