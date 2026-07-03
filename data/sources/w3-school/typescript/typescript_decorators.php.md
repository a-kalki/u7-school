# TypeScript Decorators

* * *

Decorators are a powerful TypeScript feature that allow you to add metadata and modify classes and their members at design time.

They are widely used in frameworks like Angular and NestJS for dependency injection, routing, and more.

* * *

## Enabling Decorators

To use decorators in TypeScript, you need to enable them in your `tsconfig.json`:

```javascript
{  "compilerOptions": {    "target": "ES2020",    "module": "commonjs",    "experimentalDecorators": true,    "emitDecoratorMetadata": true,    "strictPropertyInitialization": false  },  "include": ["src/**/*.ts"]}
```

**Note:** The `emitDecoratorMetadata` option enables experimental support for emitting type metadata for decorators, which is used by libraries like TypeORM and class-validator.

* * *

## Types of Decorators

TypeScript supports several types of decorators that can be applied to different declarations:

Decorator Type

Applies To

Signature

Class Decorator

Class declarations

`(constructor: Function) => void`

Method Decorator

Class methods

`(target: any, propertyKey: string, descriptor: PropertyDescriptor) => void`

Property Decorator

Class properties

`(target: any, propertyKey: string) => void`

Parameter Decorator

Method parameters

`(target: any, propertyKey: string, parameterIndex: number) => void`

* * *

## Class Decorators

Class decorators are applied to the constructor of a class and can be used to observe, modify, or replace a class definition.

They are called when the class is declared, not when instances are created.

### Basic Class Decorator

This simple decorator logs when a class is defined:

```javascript
// A simple class decorator that logs class definitionfunction logClass(constructor: Function) {  console.log(`Class ${constructor.name} was defined at ${new Date().toISOString()}`);}// Applying the decorator@logClassclass UserService {  getUsers() {    return ['Alice', 'Bob', 'Charlie'];  }}// Output when the file is loaded: "Class UserService was defined at [timestamp]"
```

* * *

* * *

```javascript
// A decorator that adds a version property and logs instantiationfunction versioned(version: string) {  return function (constructor: Function) {    // Add a static property    constructor.prototype.version = version;        // Store the original constructor    const original = constructor;    // Create a new constructor that wraps the original    const newConstructor: any = function (...args: any[]) {      console.log(`Creating instance of ${original.name} v${version}`);      return new original(...args);    };        // Copy prototype so instanceof works    newConstructor.prototype = original.prototype;    return newConstructor;  };}// Applying the decorator with a version@versioned('1.0.0')class ApiClient {  fetchData() {    console.log('Fetching data...');  }}const client = new ApiClient();console.log((client as any).version); // Outputs: 1.0.0client.fetchData();
```
```javascript
function sealed(constructor: Function) {  console.log(`Sealing ${constructor.name}...`);  Object.seal(constructor);  Object.seal(constructor.prototype);}@sealedclass Greeter {  greeting: string;  constructor(message: string) {    this.greeting = message;  }  greet() {    return `Hello, ${this.greeting}`;  }}// This will throw an error in strict mode// Greeter.prototype.newMethod = function() {}; // Error: Cannot add property newMethod
```

#### Key Points About Class Decorators

*   Class decorators are called when the class is declared, not when instances are created
*   They receive the class constructor as their only parameter
*   They can return a new constructor function to replace the original class
*   They are executed bottom-up (the innermost decorator runs first)
*   They can be used for logging, sealing, freezing, or adding metadata

* * *

## Method Decorators

Method decorators are applied to method definitions and can be used to observe, modify, or replace method definitions.

They receive three parameters:

1.  `target`: The prototype of the class (for instance methods) or the constructor function (for static methods)
2.  `propertyKey`: The name of the method
3.  `descriptor`: The property descriptor for the method

```javascript
// Method decorator to measure execution timefunction measureTime(  target: any,  propertyKey: string,  descriptor: PropertyDescriptor) {  const originalMethod = descriptor.value;  descriptor.value = function (...args: any[]) {    const start = performance.now();    const result = originalMethod.apply(this, args);    const end = performance.now();    console.log(`${propertyKey} executed in ${(end - start).toFixed(2)}ms`);    return result;  };  return descriptor;}// Using the decoratorclass DataProcessor {  @measureTime  processData(data: number[]): number[] {    // Simulate processing time    for (let i = 0; i < 100000000; i++) { /* processing */ }    return data.map(x => x * 2);  }}// When called, it will log the execution timeconst processor = new DataProcessor();processor.processData([1, 2, 3, 4, 5]);
```
```javascript
// User rolestype UserRole = 'admin' | 'editor' | 'viewer';// Current user context (simplified)const currentUser = {  id: 1,  name: 'John Doe',  roles: ['viewer'] as UserRole[]};// Decorator factory for role-based access controlfunction AllowedRoles(...allowedRoles: UserRole[]) {  return function (    target: any,    propertyKey: string,    descriptor: PropertyDescriptor  ) {    const originalMethod = descriptor.value;    descriptor.value = function (...args: any[]) {      const hasPermission = allowedRoles.some(role =>        currentUser.roles.includes(role)      );      if (!hasPermission) {        throw new Error(          `User ${currentUser.name} is not authorized to call ${propertyKey}`        );      }      return originalMethod.apply(this, args);    };    return descriptor;  };}// Using the decoratorclass DocumentService {  @AllowedRoles('admin', 'editor')  deleteDocument(id: string) {    console.log(`Document ${id} deleted`);  }  @AllowedRoles('admin', 'editor', 'viewer')  viewDocument(id: string) {    console.log(`Viewing document ${id}`);  }}// Usageconst docService = new DocumentService();try {  docService.viewDocument('doc123'); // Works - viewer role is allowed  docService.deleteDocument('doc123'); // Throws error - viewer cannot delete} catch (error) {  console.error(error.message);}// Change user role to admincurrentUser.roles = ['admin'];docService.deleteDocument('doc123'); // Now works - admin can delete
```
```javascript
function deprecated(message: string) {  return function (    target: any,    propertyKey: string,    descriptor: PropertyDescriptor  ) {    const originalMethod = descriptor.value;    descriptor.value = function (...args: any[]) {      console.warn(`Warning: ${propertyKey} is deprecated. ${message}`);      return originalMethod.apply(this, args);    };    return descriptor;  };}class PaymentService {  @deprecated('Use processPaymentV2 instead')  processPayment(amount: number, currency: string) {    console.log(`Processing payment of ${amount} ${currency}`);  }  processPaymentV2(amount: number, currency: string) {    console.log(`Processing payment v2 of ${amount} ${currency}`);  } }const payment = new PaymentService();payment.processPayment(100, 'USD'); // Shows deprecation warningpayment.processPaymentV2(100, 'USD'); // No warning
```

#### Key Points About Method Decorators

*   Method decorators are called when the method is defined, not when it's called
*   They can modify the method's behavior by wrapping it with additional logic
*   They can be used for cross-cutting concerns like logging, validation, and authorization
*   They receive the method's property descriptor which allows modifying the method's behavior
*   They must return a property descriptor or undefined (if not modifying the descriptor)

* * *

## Property Decorators

Property decorators are applied to property declarations and can be used to observe, modify, or replace property definitions.

They receive two parameters:

1.  `target`: The prototype of the class (for instance properties) or the constructor function (for static properties)
2.  `propertyKey`: The name of the property

```javascript
// Property decorator to format a string propertyfunction format(formatString: string) {  return function (target: any, propertyKey: string) {    let value: string;    const getter = () => value;    const setter = (newVal: string) => {      value = formatString.replace('{}', newVal);    };    Object.defineProperty(target, propertyKey, {      get: getter,      set: setter,      enumerable: true,      configurable: true    });  };}class Greeter {  @format('Hello, {}!')  greeting: string;}const greeter = new Greeter();greeter.greeting = 'World';console.log(greeter.greeting); // Outputs: Hello, World!
```
```javascript
function logProperty(target: any, propertyKey: string) {  let value: any;  const getter = function() {    console.log(`Getting ${propertyKey}: ${value}`);    return value;  };  const setter = function(newVal: any) {    console.log(`Setting ${propertyKey} from ${value} to ${newVal}`);    value = newVal;  };  Object.defineProperty(target, propertyKey, {    get: getter,    set: setter,    enumerable: true,    configurable: true  });}class Product {  @logProperty  name: string;  @logProperty  price: number;  constructor(name: string, price: number) {    this.name = name;    this.price = price;  }}const product = new Product('Laptop', 999.99);product.price = 899.99; // Logs: Setting price from 999.99 to 899.99console.log(product.name); // Logs: Getting name: Laptop
```
```javascript
function required(target: any, propertyKey: string) {  let value: any;  const getter = function() {    if (value === undefined) {      throw new Error(`Property ${propertyKey} is required`);    }    return value;  };  const setter = function(newVal: any) {    value = newVal;  };  Object.defineProperty(target, propertyKey, {    get: getter,    set: setter,    enumerable: true,    configurable: true  });}class User {  @required  username: string;  @required  email: string;  age?: number;  constructor(username: string, email: string) {    this.username = username;    this.email = email;  }}const user1 = new User('johndoe', 'john@example.com'); // Works// const user2 = new User(undefined, 'test@example.com'); // Throws error: Property username is required// const user2 = new User('johndoe', undefined); // Throws error: Property email is required
```

#### Key Points About Property Decorators

*   Property decorators are called when the property is defined, not when it's accessed
*   They don't receive a property descriptor like method decorators do
*   To modify property behavior, you need to use `Object.defineProperty`
*   They're often used for metadata reflection or to modify property access
*   They can be combined with other decorators for more complex behaviors

* * *

## Parameter Decorators

Parameter decorators are applied to parameter declarations in a constructor or method.

They receive three parameters:

1.  `target`: The prototype of the class (for instance methods) or the constructor function (for static methods)
2.  `propertyKey`: The name of the method (or undefined for constructor parameters)
3.  `parameterIndex`: The ordinal index of the parameter in the function's parameter list

```javascript
function validateParam(type: 'string' | 'number' | 'boolean') {  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {    const existingValidations: any[] = Reflect.getOwnMetadata('validations', target, propertyKey) || [];    existingValidations.push({ index: parameterIndex, type });    Reflect.defineMetadata('validations', existingValidations, target, propertyKey);  };}function validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {  const originalMethod = descriptor.value;  descriptor.value = function (...args: any[]) {    const validations: Array<{index: number, type: string}> =      Reflect.getOwnMetadata('validations', target, propertyKey) || [];    for (const validation of validations) {      const { index, type } = validation;      const param = args[index];      let isValid = false;      switch (type) {        case 'string':          isValid = typeof param === 'string' && param.length > 0;          break;        case 'number':          isValid = typeof param === 'number' && !isNaN(param);          break;        case 'boolean':          isValid = typeof param === 'boolean';      }      if (!isValid) {        throw new Error(`Parameter at index ${index} failed ${type} validation`);      }    }    return originalMethod.apply(this, args);  };  return descriptor;}class UserService {  @validate  createUser(    @validateParam('string') name: string,    @validateParam('number') age: number,    @validateParam('boolean') isActive: boolean  ) {    console.log(`Creating user: ${name}, ${age}, ${isActive}`);  }}const service = new UserService();service.createUser('John', 30, true); // Works// service.createUser('', 30, true); // Throws error: Parameter at index 0 failed string validation// service.createUser('John', 'thirty', true); // Throws error: Parameter at index 1 failed number validation
```

#### Key Points About Parameter Decorators

*   Parameter decorators are called when the method is defined, not when it's called
*   They're often used with method decorators to implement cross-cutting concerns
*   They can be used with the `reflect-metadata` library to store and retrieve metadata
*   They're commonly used in dependency injection frameworks
*   They receive the parameter index, which can be used to access the parameter value at runtime

* * *

## Decorator Factories

Decorator factories are functions that return a decorator function.

They allow you to configure decorators by passing parameters.

This makes your decorators more flexible and reusable.

```javascript
// Decorator factory that accepts configurationfunction logWithConfig(config: { level: 'log' | 'warn' | 'error', message?: string }) {  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {    const originalMethod = descriptor.value;    descriptor.value = function (...args: any[]) {      const { level = 'log', message = 'Executing method' } = config;      console[level](`${message}: ${propertyKey}`, { arguments: args });      const result = originalMethod.apply(this, args);      console[level](`${propertyKey} completed`);      return result;    };    return descriptor;  };}class PaymentService {  @logWithConfig({ level: 'log', message: 'Processing payment' })  processPayment(amount: number) {    console.log(`Processing payment of $${amount}`);  }}
```
```javascript
function first() {  console.log('first(): factory evaluated');  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {    console.log('first(): called');  };}function second() {  console.log('second(): factory evaluated');  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {    console.log('second(): called');  };}class ExampleClass {  @first()  @second()  method() {}}// Output:// second(): factory evaluated// first(): factory evaluated// first(): called// second(): called
```

* * *

## Real-World Examples

```javascript
// Simple decorator implementations (simplified for example)const ROUTES: any[] = [];function Controller(prefix: string = '') {  return function (constructor: Function) {    constructor.prototype.prefix = prefix;  };}function Get(path: string = '') {  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {    ROUTES.push({      method: 'get',      path,      handler: descriptor.value,      target: target.constructor    });  };}// Using the decorators@Controller('/users')class UserController {  @Get('/')  getAllUsers() {    return { users: [{ id: 1, name: 'John' }] };  }  @Get('/:id')  getUserById(id: string) {    return { id, name: 'John' };  }}// Simulate route registrationfunction registerRoutes() {  ROUTES.forEach(route => {    const prefix = route.target.prototype.prefix || '';    console.log(`Registered ${route.method.toUpperCase()} ${prefix}${route.path}`);  });}registerRoutes();// Output:// Registered GET /users// Registered GET /users/:id
```

* * *

## Best Practices

#### Decorator Best Practices

Follow these best practices when working with decorators:

1.  **Keep decorators focused**: Each decorator should have a single responsibility.
2.  **Document behavior**: Clearly document what your decorators do and any side effects they might have.
3.  **Use decorator factories**: Make decorators configurable using factories for better reusability.
4.  **Consider performance**: Be mindful of performance implications, especially with decorators that add runtime overhead.
5.  **Type safety**: Use TypeScript's type system to make decorators type-safe when possible.
6.  **Error handling**: Implement proper error handling within decorators.
7.  **Testing**: Write unit tests for your decorators to ensure they work as expected.
8.  **Metadata**: Use `reflect-metadata` for more advanced scenarios requiring runtime type information.

* * *

## Common Pitfalls

#### Common Decorator Pitfalls

Avoid these common mistakes when working with decorators:

*   **Forgetting to enable decorators**: Ensure `experimentalDecorators` is enabled in `tsconfig.json`.
*   **Incorrect decorator signature**: Each decorator type has a specific signature. Using the wrong parameters can lead to runtime errors.
*   **Decorator evaluation order**: Decorators are evaluated from bottom to top for each declaration.
*   **Property initialization**: Property decorators run before instance properties are initialized.
*   **Metadata reflection**: Forgetting to import `reflect-metadata` when using decorator metadata.
*   **Performance overhead**: Be cautious with decorators that add significant runtime overhead in performance-critical code.
*   **Browser compatibility**: Decorators are a stage 3 proposal and may require transpilation for older browsers.

```javascript
function readonly(target: any, propertyKey: string) {  Object.defineProperty(target, propertyKey, {    writable: false  });}class Person {  @readonly  name = "John";}
```
```javascript
function logParameter(target: any, propertyKey: string, parameterIndex: number) {  console.log(`Parameter in ${propertyKey} at index ${parameterIndex}`);}class Demo {  greet(@logParameter message: string) {    return message;  }}
```

Enable decorators by adding this to your `tsconfig.json`:

```javascript
{  "compilerOptions": {    "experimentalDecorators": true  }}
```

**Where are decorators used?**

*   **Angular:** For components, services, modules, etc.
*   **NestJS:** For controllers, providers, routes, etc.

* * *

* * *