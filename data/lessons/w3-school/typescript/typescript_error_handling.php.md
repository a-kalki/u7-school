# TypeScript Error Handling

* * *

Robust error handling is crucial for building reliable TypeScript applications.

This guide covers everything from basic try/catch to advanced error handling patterns.

* * *

## Basic Error Handling

```javascript
function divide(a: number, b: number): number {  if (b === 0) {    throw new Error('Division by zero');  }  return a / b;}try {  const result = divide(10, 0);  console.log(result);} catch (error) {  console.error('An error occurred:', error.message);}
```

#### TypeScript 4.0+ Note

In TypeScript 4.0 and later, the `unknown` type is the default type for catch variables. Always narrow the type before accessing properties.

* * *

## Custom Error Classes

```javascript
class ValidationError extends Error {  constructor(message: string, public field?: string) {    super(message);    this.name = 'ValidationError';    // Restore prototype chain    Object.setPrototypeOf(this, ValidationError.prototype);  }}class DatabaseError extends Error {  constructor(message: string, public code: number) {    super(message);    this.name = 'DatabaseError';    Object.setPrototypeOf(this, DatabaseError.prototype);  }}// Usagefunction validateUser(user: any) {  if (!user.name) {    throw new ValidationError('Name is required', 'name');  }  if (!user.email.includes('@')) {    throw new ValidationError('Invalid email format', 'email');  }}
```

* * *

* * *

## Type Guards for Errors

```javascript
// Type guardsfunction isErrorWithMessage(error: unknown): error is { message: string } {  return (    typeof error === 'object' &&    error !== null &&    'message' in error &&    typeof (error as Record).message === 'string'  );}function isValidationError(error: unknown): error is ValidationError {  return error instanceof ValidationError;}// Usage in catch blocktry {  validateUser({});} catch (error: unknown) {  if (isValidationError(error)) {    console.error(`Validation error in ${error.field}: ${error.message}`);  } else if (isErrorWithMessage(error)) {    console.error('An error occurred:', error.message);  } else {    console.error('An unknown error occurred');  }}
```
```javascript
function assertIsError(error: unknown): asserts error is Error {  if (!(error instanceof Error)) {    throw new Error('Caught value is not an Error instance');  }}try {  // ...} catch (error) {  assertIsError(error);  console.error((error as Error).message); // TypeScript now knows error is Error}
```

* * *

## Async Error Handling

```javascript
interface User {  id: number;  name: string;  email: string;}// Using async/await with try/catchasync function fetchUser(userId: number): Promise {  try {    const response = await fetch(`/api/users/${userId}`);    if (!response.ok) {      throw new Error(`HTTP error! status: ${response.status}`);    }    return await response.json() as User;  } catch (error) {    if (error instanceof Error) {      console.error('Failed to fetch user:', error.message);    }    throw error; // Re-throw to allow caller to handle  }}// Using Promise.catch() for error handlingfunction fetchUserPosts(userId: number): Promise {  return fetch(`/api/users/${userId}/posts`)    .then(response => {      if (!response.ok) {        throw new Error(`HTTP error! status: ${response.status}`);      }      return response.json();    })    .catch(error => {      console.error('Failed to fetch posts:', error);      return []; // Return empty array as fallback    });}
```
```javascript
// Bad: Unhandled promise rejectionfetchData().then(data => console.log(data));// Good: Handle both success and error casesfetchData()  .then(data => console.log('Success:', data))  .catch(error => console.error('Error:', error));// Or use void for intentionally ignored errorsvoid fetchData().catch(console.error);
```

* * *

## Error Boundaries in React

```javascript
import React, { Component, ErrorInfo, ReactNode } from 'react';interface ErrorBoundaryProps {  children: ReactNode;  fallback?: ReactNode;}interface ErrorBoundaryState {  hasError: boolean;  error?: Error;}class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {  public state: ErrorBoundaryState = {    hasError: false  };  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {    return { hasError: true, error };  }  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {    console.error('Uncaught error:', error, errorInfo);    // Log to error reporting service  }  public render() {    if (this.state.hasError) {      return this.props.fallback || (        <div className="error-boundary">          <h2>Something went wrong</h2>          <p>{this.state.error?.message}</p>          <button onClick={() => this.setState({ hasError: false })}>            Try again          </button>        </div>      );    }    return this.props.children;  }}// Usagefunction App() {  return (    <ErrorBoundary fallback={<div>Oops! Something broke.</div>}>      <MyComponent />    </ErrorBoundary>  );}
```

* * *

## Best Practices

### Always Handle Errors

Never leave catch blocks empty.

At minimum, log the error:

```javascript
// Bad: Silent failuretry { /* ... */ } catch { /* empty */ }// Good: At least log the errortry { /* ... */ } catch (error) {  console.error('Operation failed:', error);}
```

### Use Specific Error Types

Create custom error classes for different error scenarios:

```javascript
class NetworkError extends Error {  constructor(public status: number, message: string) {    super(message);    this.name = 'NetworkError';  }}class ValidationError extends Error {  constructor(public field: string, message: string) {    super(message);    this.name = 'ValidationError';  }}
```

### Handle Errors at the Right Level

Handle errors where you have enough context to recover or provide a good user experience:

```javascript
// In a data access layerasync function getUser(id: string): Promise {  const response = await fetch(`/api/users/${id}`);  if (!response.ok) {    throw new NetworkError(response.status, 'Failed to fetch user');  }  return response.json();}// In a UI componentasync function loadUser() {  try {    const user = await getUser('123');    setUser(user);  } catch (error) {    if (error instanceof NetworkError) {      if (error.status === 404) {        showError('User not found');      } else {        showError('Network error. Please try again later.');      }    } else {      showError('An unexpected error occurred');    }  }}
```

* * *

## Common Pitfalls

#### Not Handling Promise Rejections

Always handle promise rejections to prevent unhandled promise rejection warnings:

// Bad: Unhandled promise rejection  
fetchData();  
  
// Good: Handle the rejection  
fetchData().catch(console.error);  

#### Catching Without Proper Type Narrowing

In TypeScript 4.0+, caught errors are of type `unknown`:

// Bad: Error is of type 'unknown'  
try { /\* ... \*/ } catch (error) {  
  console.log(error.message); // Error: Property 'message' does not exist on type 'unknown'  
}  
  
// Good: Narrow the type  
try { /\* ... \*/ } catch (error) {  
  if (error instanceof Error) {  
    console.log(error.message); // OK  
  }  
}  

#### Swallowing Errors

Avoid silently catching and ignoring errors without proper handling:

// Bad: Error is silently ignored  
function saveData(data: Data) {  
  try {  
    database.save(data);  
  } catch {  
    // Ignore  
  }  
}  
  
// Better: Log the error and/or notify the user  
function saveData(data: Data) {  
  try {  
    database.save(data);  
  } catch (error) {  
    console.error('Failed to save data:', error);  
    showError('Failed to save data. Please try again.');  
  }  
}  

### Summary

Effective error handling in TypeScript involves:

*   Using `try/catch` blocks for synchronous code
*   Handling promise rejections with `.catch()` or `try/catch` with `async/await`
*   Creating custom error classes for domain-specific errors
*   Using type guards to safely work with error objects
*   Handling errors at the appropriate level in your application
*   Providing meaningful error messages to users

By following these practices, you can build more robust and maintainable TypeScript applications.

* * *

* * *