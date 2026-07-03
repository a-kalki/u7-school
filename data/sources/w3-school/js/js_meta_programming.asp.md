# JavaScript Meta Programming

## Metaprogramming

Metaprogramming refers to a number of ways a **program can manipulate itself**:

*   Modify objects at runtime
*   Inspect objects at runtime
*   Control objects at runtime
*   Intercept running operations
*   Modify functions, and classes
*   Generate dynamic code

## The Easy Explanation

Normally, **code handles data**.

With metaprogramming, **code handles code**.

* * *

## Inspecting Objects

With the method `Object.keys()` you can **inspect object properties**.

Using `Object.keys()` is a simple example of metaprogramming.

```javascript
// Create an Objectconst user = {name: "Jan", age: 40};// Fill Array with Object keysconst myArr = Object.keys(user);
```

* * *

## Modify Objects

I typical metaprogramming task is to **modify object behaviour**:

```javascript
// Create an Objectconst person = {name: "John", age: 41};// Define "name" to return "secret"Object.defineProperty(person, "name", {  get() { return "secret"; }});let name = person.name;
```

* * *

* * *

## Generate Dynamic Code

Metaprogramming involves dynamic code generation.

JavaScript can **generate functions** at runtime:

```javascript
const fn = new Function("a", "b", "return a + b");
```

* * *

## Metaprogramming Examples

Consept

Description

Validation

Restrict the values that can be set to a property

Logging

Display property changes using a Proxy

Debugging

Intercept an operation using a Proxy

Frameworks

Vue, MobX, and Svelte use metaprogramming to detect state changes

ORM / database mapping

Wrap objects and creates fields based on database schema

Dynamic APIs

Create functions or object structures at runtime

* * *

## Proxy Metaprogramming

The two objects **Proxy** and **Reflect** allow for programming at the meta level in JavaScript.

**Proxy** can be used to **intercept property operations** like reading or writing.

In the example below:

*   A user object is **wrapped in a Proxy**
*   The Proxy uses a **set() trap** to log whenever a property is set

```javascript
// Create an Objectconst user = {name: "Jan", age: 40};// Wrap the Object in a Proxyconst proxy = new Proxy(user, {  // Use a set trap  set(target, property, value) {    // Log changes    log(property + "; " + value);    return target[property];  }});// Change Propertiesproxy.name = "John";proxy.age = 45;proxy.name = "Paul";
```

* * *

## Proxy with Reflect

Reflect makes Proxy behavior match normal object behavior

In the example below:

*   A user object is **wrapped in a Proxy**
*   The Proxy uses a **set() trap** to log when a property is set
*   The set trap uses **Reflect.set()** for safe forwarding

```javascript
// Create an Objectconst user = {name: "Jan", age: 40};// Wrap the Object in a Proxyconst proxy = new Proxy(user, {  // Use a set trap  set(target, property, value) {    // Log changes    log(property + ": " + value);    // Safe forwarding with Reflect    return Reflect.set(target, property, value);  }});
```

## Learn More

[JavaScript Reflect Tutorial](js_meta_reflect.asp.html)

[JavaScript Proxy Tutorial](js_meta_proxy.asp.html)

[JavaScript Meta Reference](js_meta_reference.asp.html)