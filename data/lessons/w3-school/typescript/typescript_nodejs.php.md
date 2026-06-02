# TypeScript with Node.js

* * *

## Why Use TypeScript with Node.js?

TypeScript brings static typing to Node.js development, providing better tooling, improved code quality, and enhanced developer experience.

Key benefits include:

*   Type safety for JavaScript code
*   Better IDE support with autocompletion
*   Early error detection during development
*   Improved code maintainability and documentation
*   Easier refactoring

**Prerequisites:** Install a recent Node.js LTS (v18+ recommended) and npm.

Verify with `node -v` and `npm -v`.

* * *

## Setting Up a TypeScript Node.js Project

This section walks through creating a new Node.js project configured for TypeScript.

**Note:** You write TypeScript (`.ts`) during development and compile it to JavaScript (`.js`) for Node.js to run in production.

### 1\. Initialize a New Project

```javascript
mkdir my-ts-node-appcd my-ts-node-appnpm init -ynpm install typescript @types/node --save-devnpx tsc --init
```

**What these do:**

*   `typescript` adds the TypeScript compiler (`tsc`)
*   `@types/node` provides Node.js type definitions
*   `npx tsc --init` creates a `tsconfig.json` config file

### 2\. Create a Source Folder

Keep source code in `src/` and compiled output in `dist/`.

```javascript
mkdir src# later add files like: src/server.ts, src/middleware/auth.ts
```

### 3\. Configure TypeScript

Edit the generated `tsconfig.json`:

```javascript
{    "compilerOptions": {    "target": "ES2020",    "module": "commonjs",    "outDir": "./dist",    "rootDir": "./src",    "strict": true,    "esModuleInterop": true,    "skipLibCheck": true,    "forceConsistentCasingInFileNames": true,    "moduleResolution": "node",    "resolveJsonModule": true,    "sourceMap": true  },  "include": ["src/**/*"],  "exclude": ["node_modules"]}
```

**Option highlights:**

*   `rootDir`/`outDir`: keeps source (`src`) separate from build output (`dist`).
*   `strict`: enables the safest type checking.
*   `esModuleInterop`: smoother interop with CommonJS/ES modules.
*   `sourceMap`: generate maps for debugging compiled code.

**CommonJS vs ESM:** This guide uses `module: "commonjs"`.

If you use ESM (`type: "module"` in `package.json`), set `module: "nodenext"` or `node16`, and use `import`/`export` consistently.

### 4\. Install Runtime and Dev Dependencies

Install Express for HTTP handling and helpful dev tools:

```javascript
npm install express body-parsernpm install --save-dev ts-node nodemon @types/express
```

**Warning:** Use `ts-node` and `nodemon` only for development.

For production, compile with `tsc` and run Node on the JS output.

### Project Structure

Keep your project organized:

```javascript
my-ts-node-app/  src/    server.ts    middleware/      auth.ts    entity/      User.ts    config/      database.ts  dist/  node_modules/  package.json  tsconfig.json
```

* * *

* * *

## Basic TypeScript Server Example

This example shows a minimal Express server written in TypeScript, including a typed `User` model and a few routes.

```javascript
import express, { Request, Response, NextFunction } from 'express';import { json } from 'body-parser';interface User {  id: number;  username: string;  email: string;}// Initialize Express appconst app = express();const PORT = process.env.PORT || 3000;// Middlewareapp.use(json());// In-memory databaseconst users: User[] = [  { id: 1, username: 'user1', email: 'user1@example.com' },  { id: 2, username: 'user2', email: 'user2@example.com' }];// Routesapp.get('/api/users', (req: Request, res: Response) => {  res.json(users);});app.get('/api/users/:id', (req: Request, res: Response) => {  const user = users.find(u => u.id === parseInt(req.params.id));  if (!user) return res.status(404).json({ message: 'User not found' });  res.json(user);});app.post('/api/users', (req: Request, res: Response) => {  const { username, email } = req.body;   if (!username || !email) {    return res.status(400).json({ message: 'Username and email are required' });  }   const newUser: User = {    id: users.length + 1,    username,    email  };   users.push(newUser);  res.status(201).json(newUser);});// Error handling middlewareapp.use((err: Error, req: Request, res: Response, next: NextFunction) => {  console.error(err.stack);  res.status(500).json({ message: 'Something went wrong!' });});// Start serverapp.listen(PORT, () => {  console.log(`Server is running on http://localhost:${PORT}`);});
```

**What TypeScript adds here:**

*   Typed `Request`, `Response`, and `NextFunction` for Express handlers.
*   A `User` interface to guarantee the shape of user data.
*   Safer refactoring and better autocompletion with typed route params and bodies.

* * *

## Using TypeScript with Express Middleware

Middleware can be strongly typed.

You can also extend Express types via declaration merging to store authenticated user data on the request.

```javascript
import { Request, Response, NextFunction } from 'express';// Extend the Express Request type to include custom propertiesdeclare global {  namespace Express {    interface Request {      user?: { id: number; role: string };    }  }}export const authenticate = (req: Request, res: Response, next: NextFunction) => {  const token = req.header('Authorization')?.replace('Bearer ', '');   if (!token) {    return res.status(401).json({ message: 'No token provided' });  }   try {    // In a real app, verify the JWT token here    const decoded = { id: 1, role: 'admin' }; // Mock decoded token    req.user = decoded;    next();  } catch (error) {    res.status(401).json({ message: 'Invalid token' });  }};export const authorize = (roles: string[]) => {  return (req: Request, res: Response, next: NextFunction) => {    if (!req.user) {      return res.status(401).json({ message: 'Not authenticated' });    }       if (!roles.includes(req.user.role)) {      return res.status(403).json({ message: 'Not authorized' });    }       next();  };};
```
```javascript
// src/server.tsimport { authenticate, authorize } from './middleware/auth';app.get('/api/admin', authenticate, authorize(['admin']), (req, res) => {  res.json({ message: `Hello admin ${req.user?.id}` });});
```

* * *

## TypeScript with Database (TypeORM Example)

You can use ORMs like TypeORM with TypeScript decorators to map classes to tables.

**Before you start:**

*   Install packages: `npm install typeorm reflect-metadata pg` (use `pg` for PostgreSQL).
*   Enable in `tsconfig.json` when using decorators:  
    { "compilerOptions": { "experimentalDecorators": true, "emitDecoratorMetadata": true } }
*   Import `reflect-metadata` once at app startup.

```javascript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';@Entity('users')export class User {  @PrimaryGeneratedColumn()  id: number;  @Column({ unique: true })  username: string;  @Column({ unique: true })  email: string;  @Column({ select: false })  password: string;  @Column({ default: 'user' })  role: string;  @CreateDateColumn()  createdAt: Date;  @UpdateDateColumn()  updatedAt: Date;}
```
```javascript
import 'reflect-metadata';import { DataSource } from 'typeorm';import { User } from '../entity/User';export const AppDataSource = new DataSource({  type: 'postgres',  host: process.env.DB_HOST || 'localhost',  port: parseInt(process.env.DB_PORT || '5432'),  username: process.env.DB_USERNAME || 'postgres',  password: process.env.DB_PASSWORD || 'postgres',  database: process.env.DB_NAME || 'mydb',  synchronize: process.env.NODE_ENV !== 'production',  logging: false,  entities: [User],  migrations: [],  subscribers: [],});
```
```javascript
// src/server.tsimport { AppDataSource } from './config/database';AppDataSource.initialize()  .then(() => {   app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));  })  .catch((err) => {   console.error('DB init error', err);   process.exit(1);  });
```

* * *

## Development Workflow

### 1\. Add scripts to package.json

```javascript
{  "scripts": {    "build": "tsc",    "start": "node dist/server.js",    "dev": "nodemon --exec ts-node src/server.ts",    "watch": "tsc -w",    "test": "jest --config jest.config.js"  }}
```

**Note:** The `test` script is optional and assumes Jest is set up.

If you are not using Jest, you can omit it.

### 2\. Run in development mode

```javascript
npm run dev
```

### 3\. Build for production

```javascript
npm run buildnpm start
```

### Debugging with Source Maps

With `sourceMap` enabled in `tsconfig.json`, you can debug compiled code and map back to your `.ts` files.

```javascript
node --enable-source-maps dist/server.js
```

**Tip:** Most IDEs (including VS Code) support TypeScript debugging with breakpoints when source maps are enabled.

* * *

## Best Practices

*   Always define types for function parameters and return values
*   Use interfaces for object shapes
*   Enable strict mode in tsconfig.json
*   Use type guards for runtime type checking
*   Leverage TypeScript's utility types (Partial, Pick, Omit, etc.)
*   Keep your type definitions in .d.ts files
*   Use enums or const assertions for fixed sets of values
*   Document complex types with JSDoc comments
*   Prefer environment variables for secrets and config; validate them at startup.
*   Use `ts-node`/`nodemon` only in dev; compile for prod.
*   Consider ESLint + Prettier with `@typescript-eslint` for consistent code quality.

* * *

* * *