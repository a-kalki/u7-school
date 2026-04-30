# TypeScript with React

* * *

## Why Use TypeScript with React?

TypeScript enhances React with:

*   Type safety for props, state, and context
*   Better IDE autocompletion and refactoring
*   Early error detection during development

**Note:** This tutorial assumes basic knowledge of React.

If you're new to React, consider checking out our [React Tutorial](https://www.w3schools.com/react/react_intro.asp) first.

* * *

## Getting Started

Create a new React + TypeScript app with Vite:

```javascript
npm create vite@latest my-app -- --template react-tscd my-appnpm installnpm run dev
```

Your `tsconfig.json` should include these recommended compiler options:

```javascript
{  "compilerOptions": {    "target": "ES2020",    "lib": ["ES2020", "DOM", "DOM.Iterable"],    "module": "ESNext",    "moduleResolution": "Node",    "jsx": "react-jsx",    "strict": true,    "skipLibCheck": true,    "noEmit": true,    "resolveJsonModule": true,    "allowSyntheticDefaultImports": true,    "esModuleInterop": true,    "forceConsistentCasingInFileNames": true  },  "include": ["src"]}
```

**Note:** Keep `strict` enabled for best type safety.

The shown options work well with Vite and Create React App.

* * *

## Component Typing

Define props with TypeScript and use them in a functional component:

```javascript
// Greeting.tsxtype GreetingProps = {  name: string;  age?: number;};export function Greeting({ name, age }: GreetingProps) {  return (    <div>      <h2>Hello, {name}!</h2>      {age !== undefined && <p>You are {age} years old</p>}    </div>  );}
```

* * *

* * *

## Common Patterns

### Type-Safe Events

Type event handlers for inputs and buttons:

```javascript
// Input changefunction NameInput() {  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {    console.log(e.target.value);  }  return <input onChange={handleChange} />;}// Button clickfunction SaveButton() {  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {    e.preventDefault();  }  return <button onClick={handleClick}>Save</button>;}
```

### Typing State with useState

Use explicit types for numbers, unions, and nullable values:

```javascript
const [count, setCount] = React.useState<number>(0);const [status, setStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');type User = { id: string; name: string };const [user, setUser] = React.useState<User | null>(null);
```

### useRef with DOM Elements

Type refs to DOM nodes to access properties safely:

```javascript
function FocusInput() {  const inputRef = React.useRef<HTMLInputElement>(null);  return <input ref={inputRef} onFocus={() => inputRef.current?.select()} />;}
```

### Children Typing

Accept children with the `React.ReactNode` type:

```javascript
type CardProps = { title: string; children?: React.ReactNode };function Card({ title, children }: CardProps) {  return (    <div>      <h2>{title}</h2>      {children}    </div>  );}
```

### Fetch Helpers with Generics

Use generics to type API responses:

```javascript
async function fetchJson<T>(url: string): Promise<T> {  const res = await fetch(url);  if (!res.ok) throw new Error('Network error');  return res.json() as Promise<T>;}// Usage inside an async function/component effectasync function loadPosts() {  type Post = { id: number; title: string };  const posts = await fetchJson<Post[]>("/api/posts");  console.log(posts);}
```

### Minimal Context and Custom Hook

Provide a small, typed context and a helper hook:

```javascript
type Theme = 'light' | 'dark';const ThemeContext = React.createContext<{ theme: Theme; toggle(): void } | null>(null);function ThemeProvider({ children }: { children: React.ReactNode }) {  const [theme, setTheme] = React.useState<Theme>('light');  const value = { theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) };  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;}function useTheme() {  const ctx = React.useContext(ThemeContext);  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');  return ctx;}
```

**Vite TypeScript types:** Add Vite's ambient types to avoid missing definitions.

```javascript
// src/vite-env.d.ts/// <reference types="vite/client" />
```

Alternatively, add to `tsconfig.json`:

```javascript
{  "compilerOptions": {    "types": ["vite/client"]  }}
```

**About React.FC:** Prefer directly typed function components.

`React.FC` is optional; it implicitly adds `children` but isn't required.

**Optional `baseUrl` and `paths`:** These can simplify imports if supported by your bundler.

```javascript
{  "compilerOptions": {    "baseUrl": ".",    "paths": {      "@/*": ["src/*"]    }  }}
```

Configure only if your tooling (e.g., Vite, tsconfig-paths) is set up for path aliases.

* * *