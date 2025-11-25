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

## ECMASript 7 新特性

### Array.prototype.includes

`includes` 方法用来检测数组中是否包含某个元素，返回布尔类型值。

### 指数运算符

在 ES7 中引入指数运算符 `**`，用来实现幂运算，功能与 `Math.pow(a, b)` 结果相同。

```javascript
2 ** 3 // 8
Math.pow(2, 3) // 8
```

## ECMAScript 8 新特性

### async 和 await

`async` 和 `await` 两种语法结合可以让异步代码像同步代码一样。（即：看起来是同步的，实质上是异步的。）

先从字面意思理解，`async` 意为异步，可以用于声明一个函数前，该函数是异步的。`await` 意为等待，即等待一个异步方法完成。

#### async

`async` 声明（`function`）的函数成为 async 函数，语法：

```javascript
async function funcName() {
    //statements 
}
```

`async` 内部可以使用 `await`，也可以不使用。 `async` 函数的返回值是一个 `Promise` 对象，因此执行这个函数时，可以使用 `then` 和 `catch` 方法。 根据 **函数体内部** 的返回值， `async` 函数返回值具体情况如下：

1. 函数体内不返回任何值，则 `async` 函数返回值为一个成功（`fulfilled`）的 `Promise` 对象，状态值为 `undefined`。

```javascript
let a = async function() {}
let res = a()
console.log(res)
// Promise{<fullfilled>: undefined}
```

2. 返回结果不是一个 `Promise`，则 `async` 函数返回值为一个成功（`fulfilled`）的 `Promise` 对象，状态值为这个内部返回值。

```javascript
let a = async function () {
	return 'hello'
}
let res = a()
console.log(res) 
// Promise{<fullfilled>: 'hello'}
```

3. 内部抛出错误，则 `async` 函数返回值为一个失败的 `Promise` 对象。

```javascript
let a = async function foo() {
	throw new Error('出错了')
}
a().catch(reason => {
	console.log(reason)
})
```

4. 若函数内部返回值是一个 `Promise` 对象，则 `async` 函数返回值的状态取决于这个 `Promise` 对象。

```javascript
let a = async function () {
	return new Promise((resolve, reject) => {
		resolve("成功")
	})
}
a().then(value => {
	console.log(value)
})
```

#### await

`await` 相当于一个运算符，右边接一个值。一般为一个 `Promise` 对象，也可以是一个非 `Promise` 类型。当右接一个非 `Promise` 类型，`await` 表达式返回的值就是这个值；当右接一个 `Promise` 对象，则 `await` 表达式会阻塞后面的代码，等待当前 `Promise` 对象 `resolve` 的值。

综合 `async` 和 `await` 而言。`await` 必须结合 `async` 使用，而 `async` 则不一定需要 `await`。 `async` 会将其后的函数的返回值封装成一个 `Promise` 对象，而 `await` 会等待这个 `Promise` 完成，然后返回 `resolve` 的结果。当这个 `Promise` 失败或者抛出异常时，需要时使用 `try-catch` 捕获处理。

`Promise` 使用链式调用解决了传统方式回调地狱的问题，而 `async-await` 又进一步优化了代码的可读性。

```javascript
const p = new Promise((resolve, reject)=>{
  resolve('成功')
})
async function main() {
  let res = await p
  console.log(res)
}
main()
// '成功'
const p = new Promise((resolve, reject)=>{
  reject('失败')
})
async function main() {
  try {
    let res = await p
    console.log(res)
  } catch(e) {
    console.log(e)
  }
}
main()
// '失败'
```

#### 综合应用-读取文件

需求：先读取用户数据 user，然后读取订单数据 order，最后读取商品数据 goods。

对于这种异步操作很容易想到使用 `Promise`，代码如下：

```javascript
const fs = require('fs')

let p = new Promise((resolve, reject) => {
  fs.readFile('./files/user.md', (err, data) => {
    if (err) reject(err)
    resolve(data)
  })
})

p.then(value => {
  return new Promise((resolve, rejecet) => {
    fs.readFile('./files/order.md', (err, data) => {
      if (err) rejecet(err)
      resolve([value, data])
    })
  })
}, reason => {
  console.log(reason)
}).then(value => {
  return new Promise((resolve, reject) => {
    fs.readFile('./files/goods.md', (err, data) => {
      if (err) reject(err)
      value.push(data)
      resolve(value)
    })
  })
}, reason => {
  console.log(reason)
}).then(value => {
  console.log(value.join('\n'))
}, reason => {
  console.log(reason)
})
```

但是，使用 `Promise` 链式调用虽然避免了回调地狱，但这种链式调用过多难免引起代码复杂，看起来不直观。可以使用 `async` 和 `await` 方法优化，代码如下：

```javascript
const fs = require('fs')

function readUser() {
  return new Promise((resolve, reject) => {
    fs.readFile('./files/user.md', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

function readOrder() {
  return new Promise((resolve, reject) => {
    fs.readFile('./files/order.md', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

function readGoods() {
  return new Promise((resolve, reject) => {
    fs.readFile('./files/goods.md', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

async function read() {
  let user = await readUser()
  let order = await readOrder()
  let goods = await readGoods()
  console.log([user, order, goods].join('\n'))
}

read()
```

这样，代码看起来很直观，就好像是同步代码一样，实际上是异步操作。

#### 综合应用-封装 ajax

```javascript
function sendAjax(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.send()
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.response))
        }
        reject(xhr.status)
      }
    }
  })
}

async function main() {
  let res = await sendAjax('http://poetry.apiopen.top/sentences')
  let poem = res.result.name + '——' + res.result.from
  document.body.innerText = poem
}

main()
```

这里封装的 ajax 还不能体现 `async-await` 的作用所在，因为没有出现多个 ajax 请求。在又多个 ajax 请求并且后续的请求依赖于前一个请求的结果的时候，`async-await` 的优点就体现出来了。

### Object.values 和 Object.entries

1. `Object.values()` 方法返回一个给定对象的所有可枚举属性值的数组，类似于 `Object.keys()`，只是前者返回属性值，后者返回键值组合的数组。

```javascript
let obj = {
  a: 1,
  b: {1:2},
  c: [1,2,3]
}
  console.log(Object.values(obj))
  // [1, {1: 2}, [1,2,3]]
  console.log(Object.keys(obj))
  // ['a', 'b', 'c']
```

2. `Object.entries()` 方法返回一个给定对象自身可遍历属性 `[key,value]` 的数组（数组元素也是一个个的数组的数组）

```javascript
const obj = {a: 1, b: 2, c: 3};
console.log(Object.entries(obj))
// [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]
```

返回的是一个数组，这样就可以使用 `for...of` 遍历了。

```javascript
const obj = { a: 1, b: 2, c: 3 };
  for (let [k, v] of Object.entries(obj)) {
    console.log(k, v)
}
```

## ECMAScript 10 新特性

### Object.fromEntries

Object.fromEntries() 方法把可迭代对象的键值对列表转换为一个对象。 语法：

```javascript
Object.fromEntries(iterable)
```

- `iterable`：类似 Array 、 Map 或者其它实现了可迭代协议的可迭代对象。
- 返回值：一个由该迭代对象条目提供对应属性的新对象。
- 相当于 `Object.entries` （ES8）的逆运算。

```javascript
const mp = new Map([
  [1, 2],
  [3, 4]
])
const obj = Object.fromEntries(mp)
console.log(obj)
// { '1': 2, '3': 4 }
const arr = [[1, 2]]
console.log(Object.fromEntries(arr))
// {'1': 2}
```

### trimStart() 和 trimEnd()

1. `trimStart()` 去除字符串开头连续的空格（`trimLeft` 是此方法的别名）
2. `trimEnd()` 去除字符串末尾连续的空格（`trimRight` 是此方法的别名）

### Array.prototype.flat 和 Array.prototype.flatMap

1. `Array.prototype.flat(i)`：展平一个多维数，`i` 为要展开的层数，默认为 1，即展开一层。

```javascript
let arr1 = [1, [2, 3], [4, 5]]
console.log(arr1.flat(1)) 
// [1,2,3,4,5]
let arr2 = [1, [2, 3, [4, 5]]]
console.log(arr2.flat(2))
// [1,2,3,4,5]
```

使用 `Infinity` 作为深度，展开任意深度的嵌套数组

```javascript
[1, [2, 3, [4, 5]]].flat(Infinity)
// [1, 2, 3, 4, 5, 6]
```

也可以使用 `flat` 来去除数组空项

```javascript
let arr = [1,2,3,,4]
arr.flat() // [1,2,3,4]
```

2. `Array.prototype.flatMap`：相当于 `map` 和 `flat` 的结合，方法首先使用映射函数映射每个元素，然后将结果压缩成一个新数组。

```javascript
let arr = [1,2,3,4]
let res1 = arr.map(x => [x ** 2])
console.log(res1)
// [[1],[4],[9],[16]]
let res2 = arr.flatMap(x => [x ** 2])
console.log(res2)
// [1,4,9,16]
```

### Symbol.prototype.description

使用 `Symbol()` 创建的 `Symbol` 字面量，可以直接使用 `description` 获取该字面量的描述。

```javascript
let sym = Symbol('hello')
console.log(sym.description)
// hello
```

## ECMAScript 11 新特性

### 类的私有属性

ES11 提供了类的私有属性，在类的外部无法访问该属性。只有在类的内部能访问。

```javascript
class Person{
  //公有属性
  name;
  //私有属性
  #age;
  #weight;
  //构造方法
  constructor(name, age, weight){
    this.name = name;
    this.#age = age;
    this.#weight = weight;
  }

  intro(){
    console.log(this.name);
    console.log(this.#age);
    console.log(this.#weight);
  }
}

//实例化
const girl = new Person('晓红', 18, '45kg');

// 外部无法直接访问
// console.log(girl.name);
// console.log(girl.#age);
// console.log(girl.#weight);

girl.intro();
```

### allSettled

该 `Promise.allSettled()` 方法返回一个在所有给定的 `promise` 都已经 `fulfilled` 或 `rejected` 后的 `promise`，并带有一个对象数组，每个对象表示对应的 `promise` 结果。`allSettled` 方法返回的 `Promise` 对象始终是成功（`fulfilled`）的。 

使用场景：

1. 有多个彼此不依赖的异步任务成功完成时使用。
2. 想得到每个 `promise` 的结果时使用。

对比于 `Promise.all()`，`all()` 也接受一个 `Promise` 对象数组参数，只要有一个失败（`rejected`），那么返回的 `Promise` 对象就是失败（`rejected`）的。 使用场景：

- 传进去的 `Promise` 对象彼此依赖，且需要在其中任何一个失败的时候停止。

两个 `Promise` 都是成功的情况：

```javascript
let p1 = new Promise((resolve, reject) => {
  resolve('用户数据-1')
})

let p2 = new Promise((resolve, reject) => {
  resolve('订单数据-2')
})

let res1 = Promise.allSettled([p1, p2])
let res2 = Promise.all([p1, p2])
console.log(res1)
console.log(res2)
```

输出结果：

![](ECMAScript（语法）/2.png)

一个成功，一个失败：

```javascript
let p1 = new Promise((resolve, reject) => {
  resolve('用户数据-1')
})

let p2 = new Promise((resolve, reject) => {
  reject('失败了')
})

let res1 = Promise.allSettled([p1, p2])
let res2 = Promise.all([p1, p2])
console.log(res1)
console.log(res2)
```

打印结果：

![](ECMAScript（语法）/3.png)

### matchAll

`matchAll()` 方法返回一个包含所有匹配正则表达式的结果及分组捕获组的迭代器。

```javascript
const regexp = /t(e)(st(\d?))/g;
const str = 'test1test2';

const array = [...str.matchAll(regexp)];

console.log(array[0]);
// expected output: Array ["test1", "e", "st1", "1"]

console.log(array[1]);
// expected output: Array ["test2", "e", "st2", "2"]
```

### 可选链

#### 定义

可选链 `?.` 是一种访问嵌套对象属性的安全的方式。即使中间的属性不存在，也不会出现错误。 原则：如果可选链 `?.` 前面的部分是 `undefined` 或者 `null`，它会停止运算并返回该部分。

```javascript
let user = {
  address: {
  }
}
console.log( user?.address?.street ); // undefined（不报错）
```

#### 短路效应

短路效应：正如前面所说的，如果 `?.` 左边部分不存在，就会立即停止运算（“短路效应”）。所以，如果后面有任何函数调用或者副作用，它们均不会执行。 这有和 `&&` 的作用类似，但上述改用 `&&` 会显得代码冗余度高：

```javascript
console.log(user && user.address && user.address.street)
```

#### 其它变体：?.()，?.[]

可选链 `?.` 不是一个运算符，而是一个特殊的语法结构。它还 **可以与函数和方括号一起使用**。 例如，将 `?.()` 用于调用一个可能不存在的函数（即使不存在也不报错）。

```javascript
function foo() {
  console.log('hello')
}
foo?.()
// hello
```

`?.[]` 允许从一个可能不存在的对象上安全地读取属性。（即使不存在也不报错）。

```javascript
let obj = {
  key: 123
}
console.log(obj?.['key'])
// 123
```

### 动态 import 导入

```javascript
const btn = document.getElementById('btn');

btn.onclick = function(){
  import('./hello.js').then(module => {
    module.hello();
}
```

### BigInt

`BigInt` 是一种特殊的数字类型，它提供了对任意长度整数的支持。

创建 `bigint` 的方式有两种：在一个整数字面量后面加 `n` 或者调用 `BigInt` 函数，该函数从字符串、数字等中生成 `bigint`。

```javascript
let n1 = 123n
let n2 = 456n
let n3 = BigInt(789)
console.log(typeof n1) // bigint
console.log(n1+n2) // 579n
console.log(n2+n3) // 1245n
```

比较运算符：

- 例如 `<` 和 `>`，使用它们来对 `bigint` 和 `number` 类型的数字进行比较没有问题：

```javascript
alert( 2n > 1n ); // true
alert( 2n > 1 ); // true
```

- 但是请注意，由于 `number` 和 `bigint` 属于不同类型，它们可能在进行 `==` 比较时相等，但在进行 `===`（严格相等）比较时不相等：

```javascript
alert( 1 == 1n ); // true
alert( 1 === 1n ); // false
```

### globalThis

全局对象提供可在任何地方使用的变量和函数。默认情况下，这些全局变量内置于语言或环境中。 在浏览器中，它的名字是 `window`，对 Node.js 而言，它的名字是 `global`，其它环境可能用的是别的名字。 ES11 中 `globalThis` 被作为全局对象的标准名称加入到了 JavaScript 中，所有环境都应该支持该名称。所有主流浏览器都支持它。 使用场景： 假设我们的环境是浏览器，我们将使用 `window`。如果你的脚本可能会用来在其他环境中运行，则最好使用 `globalThis`。
