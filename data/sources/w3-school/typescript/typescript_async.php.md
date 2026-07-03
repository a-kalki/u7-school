# TypeScript Async Programming

* * *

TypeScript enhances JavaScript's asynchronous capabilities with static typing, making your async code more predictable and maintainable.

This guide covers everything from basic async/await to advanced patterns.

This tutorial assumes basic knowledge of JavaScript Promises and asynchronous programming.

If you're new to these concepts, check out our [JavaScript Async](https://www.w3schools.com/js/js_async.asp) tutorial first.

* * *

## Promises in TypeScript

TypeScript enhances JavaScript Promises with type safety through generics.

A `Promise<T>` represents an asynchronous operation that will complete with a value of type `T` or fail with a reason of type `any`.

**Key Points:**

*   `Promise<T>` - Generic type where `T` is the type of the resolved value
*   `Promise<void>` - For Promises that don't return a value
*   `Promise<never>` - For Promises that never resolve (rare)

```javascript
// Create a typed Promise that resolves to a stringconst fetchGreeting = (): Promise<string> => {  return new Promise((resolve, reject) => {    setTimeout(() => {      const success = Math.random() > 0.5;      if (success) {        resolve("Hello, TypeScript!");      } else {        reject(new Error("Failed to fetch greeting"));      }    }, 1000);  });};// Using the Promise with proper type inferencefetchGreeting()  .then((greeting) => {    // TypeScript knows 'greeting' is a string    console.log(greeting.toUpperCase());  })  .catch((error: Error) => {    console.error("Error:", error.message);  });
```

* * *

#### Promise States and Type Flow

**Promise State Flow:**  
pending → fulfilled (with value: T) // Success case  
pending → rejected (with reason: any) // Error case

TypeScript tracks these states through the type system, ensuring you handle both success and error cases properly.

The type parameter in `Promise<T>` tells TypeScript what type the Promise will resolve to, allowing for better type checking and IDE support.

* * *

## Async/Await with TypeScript

TypeScript's `async/await` syntax provides a cleaner way to work with Promises, making asynchronous code look and behave more like synchronous code while maintaining type safety.

#### Key Benefits of Async/Await

*   **Readability**: Sequential code that's easier to follow
*   **Error Handling**: Use try/catch for both sync and async errors
*   **Debugging**: Easier to debug with synchronous-like stack traces
*   **Type Safety**: Full TypeScript type inference and checking

```javascript
// Define types for our API responseinterface User {  id: number;  name: string;  email: string;  role: 'admin' | 'user' | 'guest';}// Function that returns a Promise of User arrayasync function fetchUsers(): Promise<User[]> {  console.log('Fetching users...');  // Simulate API call  await new Promise(resolve => setTimeout(resolve, 1000));  return [    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' }  ];}// Async function to process usersasync function processUsers() {  try {    // TypeScript knows users is User[]    const users = await fetchUsers();    console.log(`Fetched ${users.length} users`);    // Type-safe property access    const adminEmails = users      .filter(user => user.role === 'admin')      .map(user => user.email);    console.log('Admin emails:', adminEmails);    return users;  } catch (error) {    if (error instanceof Error) {      console.error('Failed to process users:', error.message);    } else {      console.error('An unknown error occurred');    }    throw error; // Re-throw to let caller handle  }}// Execute the async functionprocessUsers()  .then(users => console.log('Processing complete'))  .catch(err => console.error('Processing failed:', err));
```

#### Async Function Return Types

All async functions in TypeScript return a Promise.

The return type is automatically wrapped in a Promise:

async function getString(): string { } // Error: must return Promise  
async function getString(): Promise<string> { } // Correct

```javascript
interface Product {  id: number;  name: string;  price: number;}async function fetchProduct(id: number): Promise<Product> {  console.log(`Fetching product ${id}...`);  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));  return { id, name: `Product ${id}`, price: Math.floor(Math.random() * 100) };}async function fetchMultipleProducts() {  try {    // Start all fetches in parallel    const [product1, product2, product3] = await Promise.all([      fetchProduct(1),      fetchProduct(2),      fetchProduct(3)    ]);    const total = [product1, product2, product3]      .reduce((sum, product) => sum + product.price, 0);    console.log(`Total price: $${total.toFixed(2)}`);  } catch (error) {    console.error('Error fetching products:', error);  }}fetchMultipleProducts();
```

**Note:** All async functions in TypeScript return a Promise.

The type parameter of the Promise corresponds to the return type you declare after the Promise keyword.

* * *

* * *

## Typing Callbacks for Async Operations

For traditional callback-based asynchronous code, TypeScript helps ensure proper typing of the callback parameters:

```javascript
// Define a type for the callbacktype FetchCallback = (error: Error | null, data?: string) => void;// Function that takes a typed callbackfunction fetchDataWithCallback(url: string, callback: FetchCallback): void {  // Simulate async operation  setTimeout(() => {    try {      // Simulate successful response      callback(null, "Response data");    } catch (error) {      callback(error instanceof Error ? error : new Error('Unknown error'));    }  }, 1000);}// Using the callback functionfetchDataWithCallback('https://api.example.com', (error, data) => {  if (error) {    console.error('Error:', error.message);    return;  }    // TypeScript knows data is a string (or undefined)  if (data) {    console.log(data.toUpperCase());  }});
```

* * *

## Promise Combinations

TypeScript provides powerful utility types and methods for working with multiple Promises.

These methods help you manage concurrent operations and handle their results in a type-safe way.

#### Promise Combination Methods

*   `Promise.all()` - Waits for all promises to resolve
*   `Promise.race()` - Returns the first settled promise
*   `Promise.allSettled()` - Waits for all to settle (success or failure)
*   `Promise.any()` - Returns the first fulfilled promise

```javascript
// Different types of promisesconst fetchUser = (id: number): Promise<{ id: number; name: string }> =>  Promise.resolve({ id, name: `User ${id}` });const fetchPosts = (userId: number): Promise<Array<{ id: number; title: string }>> =>  Promise.resolve([     { id: 1, title: 'Post 1' },    { id: 2, title: 'Post 2' }  ]);const fetchStats = (userId: number): Promise<{ views: number; likes: number }> =>  Promise.resolve({ views: 100, likes: 25 });// Run all in parallelasync function loadUserDashboard(userId: number) {  try {    const [user, posts, stats] = await Promise.all([      fetchUser(userId),      fetchPosts(userId),      fetchStats(userId)    ]);    // TypeScript knows the types of user, posts, and stats    console.log(`User: ${user.name}`);    console.log(`Posts: ${posts.length}`);    console.log(`Likes: ${stats.likes}`);        return { user, posts, stats };  } catch (error) {    console.error('Failed to load dashboard:', error);    throw error;  }}// Execute with a user IDloadUserDashboard(1);
```
```javascript
// Helper function for timeoutconst timeout = (ms: number): Promise<never> =>  new Promise((_, reject) =>    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)  );// Simulate API call with timeoutasync function fetchWithTimeout<T>(  promise: Promise<T>,  timeoutMs: number = 5000): Promise<T> {  return Promise.race([    promise,    timeout(timeoutMs).then(() => {      throw new Error(`Request timed out after ${timeoutMs}ms`);    }),  ]);}// Usage exampleasync function fetchUserData() {  try {    const response = await fetchWithTimeout(      fetch('https://api.example.com/user/1'),      3000 // 3 second timeout    );    const data = await response.json();    return data;  } catch (error) {    console.error('Error:', (error as Error).message);    throw error;  }}
```
```javascript
// Simulate multiple API calls with different outcomesconst fetchData = async (id: number) => {  // Randomly fail some requests  if (Math.random() > 0.7) {    throw new Error(`Failed to fetch data for ID ${id}`);  }  return { id, data: `Data for ${id}` };};// Process multiple items with individual error handlingasync function processBatch(ids: number[]) {  const promises = ids.map(id =>    fetchData(id)      .then(value => ({ status: 'fulfilled' as const, value }))      .catch(reason => ({ status: 'rejected' as const, reason }))  );  // Wait for all to complete  const results = await Promise.allSettled(promises);  // Process results  const successful = results    .filter((result): result is PromiseFulfilledResult<{ status: 'fulfilled', value: any }> =>      result.status === 'fulfilled' &&      result.value.status === 'fulfilled'    )    .map(r => r.value.value);  const failed = results    .filter((result): result is PromiseRejectedResult |      PromiseFulfilledResult<{ status: 'rejected', reason: any }> => {      if (result.status === 'rejected') return true;      return result.value.status === 'rejected';    });  console.log(`Successfully processed: ${successful.length}`);  console.log(`Failed: ${failed.length}`);  return { successful, failed };}// Process a batch of IDsprocessBatch([1, 2, 3, 4, 5]);
```

**Warning:** When using `Promise.all` with an array of promises that have different types, TypeScript will infer the result type as an array of the union of all possible types.

For more precise typing, you may need to use type assertions or define the expected structure.

* * *

## Error Handling in Async Code

TypeScript provides powerful tools for type-safe error handling in asynchronous code.

Let's explore different patterns and best practices.

#### Error Handling Strategies

*   **Try/Catch Blocks**: For handling errors in async/await
*   **Error Boundaries**: For React components
*   **Result Types**: Functional approach with success/failure
*   **Error Subclassing**: For domain-specific errors

```javascript
// Base error class for our applicationclass AppError extends Error {  constructor(    message: string,    public readonly code: string,    public readonly details?: unknown  ) {    super(message);    this.name = this.constructor.name;    Error.captureStackTrace?.(this, this.constructor);  }}// Specific error typesclass NetworkError extends AppError {  constructor(message: string, details?: unknown) {    super(message, 'NETWORK_ERROR', details);  }}class ValidationError extends AppError {  constructor(    public readonly field: string,    message: string  ) {    super(message, 'VALIDATION_ERROR', { field });  }}class NotFoundError extends AppError {  constructor(resource: string, id: string | number) {    super(      `${resource} with ID ${id} not found`,      'NOT_FOUND',      { resource, id }    );  }}// Usage exampleasync function fetchUserData(userId: string): Promise<{ id: string; name: string }> {  try {    // Simulate API call    const response = await fetch(`/api/users/${userId}`);        if (!response.ok) {      if (response.status === 404) {        throw new NotFoundError('User', userId);       } else if (response.status >= 500) {        throw new NetworkError('Server error', { status: response.status });       } else {        throw new Error(`HTTP error! status: ${response.status}`);       }    }        const data = await response.json();        // Validate response data    if (!data.name) {      throw new ValidationError('name', 'Name is required');    }        return data;  } catch (error) {    if (error instanceof AppError) {      // Already one of our custom errors      throw error;    }    // Wrap unexpected errors    throw new AppError(      'Failed to fetch user data',      'UNEXPECTED_ERROR',      { cause: error }    );  }}// Error handling in the applicationasync function displayUserProfile(userId: string) {  try {    const user = await fetchUserData(userId);    console.log('User profile:', user);  } catch (error) {    if (error instanceof NetworkError) {      console.error('Network issue:', error.message);      // Show retry UI    } else if (error instanceof ValidationError) {      console.error('Validation failed:', error.message);      // Highlight the invalid field    } else if (error instanceof NotFoundError) {      console.error('Not found:', error.message);      // Show 404 page    } else {      console.error('Unexpected error:', error);      // Show generic error message    }  }}// Execute with example datadisplayUserProfile('123');
```

#### Error Handling Patterns

Consider these patterns for robust error handling:

1.  **Error Boundaries** in React for component-level error handling
2.  **Result Objects** instead of throwing exceptions for expected cases
3.  **Global Error Handler** for uncaught exceptions
4.  **Error Logging** to capture and report errors

* * *

## Async Iteration with TypeScript

TypeScript supports async iterators and async generators with proper typing:

```javascript
// Async generator functionasync function* generateNumbers(): AsyncGenerator<number, void, unknown> {  let i = 0;  while (i < 5) {    // Simulate async operation    await new Promise(resolve => setTimeout(resolve, 1000));    yield i++;  }}// Using the async generatorasync function consumeNumbers() {  for await (const num of generateNumbers()) {    // TypeScript knows num is a number    console.log(num * 2);  }}
```

* * *