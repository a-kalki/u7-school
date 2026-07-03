# TypeScript Best Practices

* * *

This guide covers essential TypeScript best practices to help you write clean, maintainable, and type-safe code. Following these practices will improve code quality and developer experience.

* * *

## Project Configuration

```javascript
// tsconfig.json{  "compilerOptions": {    /* Enable all strict type-checking options */    "strict": true,    /* Additional recommended settings */    "target": "ES2020",    "module": "commonjs",    "moduleResolution": "node",    "esModuleInterop": true,    "skipLibCheck": true,    "forceConsistentCasingInFileNames": true  }}
```
```javascript
{  "compilerOptions": {    /* Additional strict checks */    "noImplicitAny": true,    "strictNullChecks": true,    "strictFunctionTypes": true,    "strictBindCallApply": true,    "strictPropertyInitialization": true,    "noImplicitThis": true,    "alwaysStrict": true  }}
```

* * *

## Type System Best Practices

```javascript
// Bad: Redundant type annotationconst name: string = 'John';// Good: Let TypeScript infer the typeconst name = 'John';// Bad: Redundant return typefunction add(a: number, b: number): number {  return a + b;}// Good: Let TypeScript infer return typefunction add(a: number, b: number) {  return a + b;}
```
```javascript
// Bad: No type informationfunction processUser(user) {  return user.name.toUpperCase();}// Good: Explicit parameter and return typesinterface User {  id: number;  name: string;  email?: string; // Optional property}function processUser(user: User): string {  return user.name.toUpperCase();}
```
```javascript
// Use interface for object shapes that can be extended/implementedinterface User {  id: number;  name: string;}// Extending an interfaceinterface AdminUser extends User {  permissions: string[];}// Use type for unions, tuples, or mapped typestype UserRole = 'admin' | 'editor' | 'viewer';// Union typestype UserId = number | string;// Mapped typestype ReadonlyUser = Readonly<User>;// Tuple typestype Point = [number, number];
```
```javascript
// Bad: Loses type safetyfunction logValue(value: any) {  console.log(value.toUpperCase()); // No error until runtime}// Better: Use generic type parameterfunction logValue<T>(value: T) {  console.log(String(value)); // Safer, but still not ideal}// Best: Be specific about expected typesfunction logString(value: string) {  console.log(value.toUpperCase()); // Type-safe}// When you need to accept any value but still be type-safefunction logUnknown(value: unknown) {  if (typeof value === 'string') {    console.log(value.toUpperCase());  } else {    console.log(String(value));  }}
```

* * *

* * *

## Code Organization

```javascript
// user/user.model.tsexport interface User {  id: string;  name: string;  email: string;}// user/user.service.tsimport { User } from './user.model';export class UserService {  private users: User[] = [];  addUser(user: User) {    this.users.push(user);  }  getUser(id: string): User | undefined {    return this.users.find(user => user.id === id);  }}// user/index.ts (barrel file)export * from './user.model';export * from './user.service';
```
```javascript
// Gooduser.service.ts // Service classesuser.model.ts // Type definitionsuser.controller.ts // Controllersuser.component.ts // Componentsuser.utils.ts // Utility functionsuser.test.ts // Test files// BadUserService.ts // Avoid PascalCase for file namesuser_service.ts // Avoid snake_caseuserService.ts // Avoid camelCase for file names
```

* * *

## Best Practices

*   Document your types and interfaces.
*   Prefer composition over inheritance for types.
*   Keep `tsconfig.json` strict and up-to-date.
*   Refactor code to use more specific types as the codebase evolves.

* * *

## Functions and Methods

```javascript
// Bad: No type informationfunction process(user, notify) {  notify(user.name);}// Good: Explicit parameter and return typesfunction processUser(  user: User,  notify: (message: string) => void): void {  notify(`Processing user: ${user.name}`);}// Use default parameters instead of conditionalsfunction createUser(  name: string,  role: UserRole = 'viewer',  isActive: boolean = true): User {  return { name, role, isActive };}// Use rest parameters for variable argumentsfunction sum(...numbers: number[]): number {  return numbers.reduce((total, num) => total + num, 0);}
```
```javascript
// Bad: Too many responsibilitiesfunction processUserData(userData: any) {  // Validation  if (!userData || !userData.name) throw new Error('Invalid user data');  // Data transformation  const processedData = {    ...userData,    name: userData.name.trim(),    createdAt: new Date()  };  // Side effect  saveToDatabase(processedData);  // Notification  sendNotification(processedData.email, 'Profile updated');  return processedData;}// Better: Split into smaller, focused functionsfunction validateUserData(data: unknown): UserData {  if (!data || typeof data !== 'object') {    throw new Error('Invalid user data');  }  return data as UserData;}function processUserData(userData: UserData): ProcessedUserData {  return {    ...userData,    name: userData.name.trim(),    createdAt: new Date()  };}
```

* * *

## Async/Await Patterns

```javascript
// Bad: Not handling errorsasync function fetchData() {  const response = await fetch('/api/data');  return response.json();}// Good: Proper error handlingasync function fetchData<T>(url: string): Promise<T> {  try {    const response = await fetch(url);    if (!response.ok) {      throw new Error(`HTTP error! status: ${response.status}`);    }    return await response.json() as T;  } catch (error) {    console.error('Failed to fetch data:', error);    throw error; // Re-throw to allow caller to handle  }}// Better: Use Promise.all for parallel operationsasync function fetchMultipleData<T>(urls: string[]): Promise<T[]> {  try {    const promises = urls.map(url => fetchData<T>(url));    return await Promise.all(promises);  } catch (error) {    console.error('One or more requests failed:', error);    throw error;  }}// Example usageinterface User {  id: string;  name: string;  email: string;}// Fetch user data with proper typingasync function getUserData(userId: string): Promise<User> {  return fetchData<User>(`/api/users/${userId}`);}
```
```javascript
// Bad: Nested async/await (callback hell)async function processUser(userId: string) {  const user = await getUser(userId);  if (user) {    const orders = await getOrders(user.id);    if (orders.length > 0) {      const latestOrder = orders[0];      const items = await getOrderItems(latestOrder.id);      return { user, latestOrder, items };    }  }  return null;}// Better: Flatten the async/await chainasync function processUser(userId: string) {  const user = await getUser(userId);  if (!user) return null;  const orders = await getOrders(user.id);  if (orders.length === 0) return { user, latestOrder: null, items: [] };  const latestOrder = orders[0];  const items = await getOrderItems(latestOrder.id);  return { user, latestOrder, items };}// Best: Use Promise.all for independent async operationsasync function processUser(userId: string) {  const [user, orders] = await Promise.all([    getUser(userId),    getOrders(userId)  ]);  if (!user) return null;  if (orders.length === 0) return { user, latestOrder: null, items: [] };  const latestOrder = orders[0];  const items = await getOrderItems(latestOrder.id);  return { user, latestOrder, items };}
```

* * *

## Testing and Quality

```javascript
// Bad: Hard to test due to direct dependenciesclass PaymentProcessor {  async processPayment(amount: number) {    const paymentGateway = new PaymentGateway();    return paymentGateway.charge(amount);  }}// Better: Use dependency injectioninterface PaymentGateway {  charge(amount: number): Promise<boolean>;}class PaymentProcessor {  constructor(private paymentGateway: PaymentGateway) {}  async processPayment(amount: number): Promise<boolean> {    if (amount <= 0) {      throw new Error('Amount must be greater than zero');    }    return this.paymentGateway.charge(amount);  }}// Test example with Jestdescribe('PaymentProcessor', () => {  let processor: PaymentProcessor;  let mockGateway: jest.Mocked<PaymentGateway>;  beforeEach(() => {    mockGateway = {      charge: jest.fn()    };    processor = new PaymentProcessor(mockGateway);  });  it('should process a valid payment', async () => {    mockGateway.charge.mockResolvedValue(true);    const result = await processor.processPayment(100);    expect(result).toBe(true);    expect(mockGateway.charge).toHaveBeenCalledWith(100);  });  it('should throw for invalid amount', async () => {    await expect(processor.processPayment(-50))      .rejects      toThrow('Amount must be greater than zero');  });});
```
```javascript
// Using @ts-expect-error to test for type errors// @ts-expect-error - Should not allow negative valuesconst invalidUser: User = { id: -1, name: 'Test' };// Using type assertions in testsfunction assertIsString(value: unknown): asserts value is string {  if (typeof value !== 'string') {    throw new Error('Not a string');  }}// Using utility types for testingtype IsString<T> = T extends string ? true : false;type Test1 = IsString<string>; // truetype Test2 = IsString<number>; // false// Using tsd for type testing (install with: npm install --save-dev tsd)/*import { expectType } from 'tsd';const user = { id: 1, name: 'John' };expectType<{ id: number; name: string }>(user);expectType<string>(user.name);*/
```

* * *

## Performance Considerations

```javascript
// Bad: Imports both type and valueimport { User, fetchUser } from './api';// Good: Separate type and value importsimport type { User } from './api';import { fetchUser } from './api';// Even better: Use type-only imports when possibleimport type { User, UserSettings } from './types';// Type-only exportexport type { User };// Runtime exportexport { fetchUser };// In tsconfig.json, enable "isolatedModules": true// to ensure type-only imports are properly handled
```
```javascript
// Bad: Deeply nested mapped types can be slowtype DeepPartial<T> = {  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];};// Better: Use built-in utility types when possibletype User = {  id: string;  profile: {    name: string;    email: string;  };  preferences?: {    notifications: boolean;  };};// Instead of DeepPartial<User>, use Partial with type assertionsconst updateUser = (updates: Partial<User>) => {  // Implementation};// For complex types, consider using interfacesinterface UserProfile {  name: string;  email: string;}interface UserPreferences {  notifications: boolean;}interface User {  id: string;  profile: UserProfile;  preferences?: UserPreferences;}
```
```javascript
// Without const assertion (wider type)const colors = ['red', 'green', 'blue'];// Type: string[]// With const assertion (narrower, more precise type)const colors = ['red', 'green', 'blue'] as const;// Type: readonly ["red", "green", "blue"]// Extract union type from const arraytype Color = typeof colors[number]; // "red" | "green" | "blue"// Objects with const assertionsconst config = {  apiUrl: 'https://api.example.com',  timeout: 5000,  features: ['auth', 'notifications'],} as const;// Type is:// {// readonly apiUrl: "https://api.example.com";// readonly timeout: 5000;// readonly features: readonly ["auth", "notifications"];// }
```

* * *

## Common Mistakes to Avoid

```javascript
// Bad: Loses all type safetyfunction process(data: any) {  return data.map(item => item.name);}// Better: Use generics for type safetyfunction process<T extends { name: string }>(items: T[]) {  return items.map(item => item.name);}// Best: Use specific types when possibleinterface User {  name: string;  age: number;}function processUsers(users: User[]) {  return users.map(user => user.name);}
```
```javascript
// tsconfig.json{  "compilerOptions": {    "strict": true,    /* Additional strictness flags */    "noImplicitAny": true,    "strictNullChecks": true,    "strictFunctionTypes": true,    "strictBindCallApply": true,    "strictPropertyInitialization": true,    "noImplicitThis": true,    "alwaysStrict": true  }}
```
```javascript
// Redundant type annotationconst name: string = 'John';// Let TypeScript infer the typeconst name = 'John'; // TypeScript knows it's a string// Redundant return typefunction add(a: number, b: number): number {  return a + b;}// Let TypeScript infer the return typefunction add(a: number, b: number) {  return a + b; // TypeScript infers number}
```
```javascript
// Without type guardfunction process(input: string | number) {  return input.toUpperCase(); // Error: toUpperCase doesn't exist on number}// With type guardfunction isString(value: unknown): value is string {  return typeof value === 'string';}function process(input: string | number) {  if (isString(input)) {    return input.toUpperCase(); // TypeScript knows input is string here  } else {    return input.toFixed(2); // TypeScript knows input is number here  }}// Built-in type guardsif (typeof value === 'string') { /* value is string */ }if (value instanceof Date) { /* value is Date */ }if ('id' in user) { /* user has id property */ }
```
```javascript
// Bad: Potential runtime errorfunction getLength(str: string | null) {  return str.length; // Error: Object is possibly 'null'}// Good: Null checkfunction getLength(str: string | null) {  if (str === null) return 0;  return str.length;}// Better: Use optional chaining and nullish coalescingfunction getLength(str: string | null) {  return str?.length ?? 0;}// For arraysconst names: string[] | undefined = [];const count = names?.length ?? 0; // Safely handle undefined// For object propertiesinterface User {  profile?: {    name?: string;  };}const user: User = {};const name = user.profile?.name ?? 'Anonymous';
```

* * *

* * *