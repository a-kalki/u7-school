# TypeScript Tooling

* * *

## TypeScript Development Ecosystem

TypeScript's tooling ecosystem is one of its greatest strengths, providing developers with powerful tools for every stage of development:

### Code Quality

*   ESLint with TypeScript support
*   Type checking and linting
*   Code style enforcement

### Development

*   VS Code integration
*   Debugging tools
*   Hot Module Replacement (HMR)

### Build & Deploy

*   Bundlers (Vite, Webpack, Parcel)
*   Module bundling
*   Production optimization

* * *

## Linting with ESLint

### Installation

Install ESLint and the official TypeScript plugin/parser so ESLint can understand TypeScript syntax and rules.

```javascript
# Install ESLint with TypeScript supportnpm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Configuration

This configuration enables recommended ESLint rules for TypeScript, connects ESLint to your tsconfig for type-aware linting, and tweaks a few common rules.

```javascript
// .eslintrc.json{  "root": true,  "parser": "@typescript-eslint/parser",  "plugins": ["@typescript-eslint"],  "extends": [    "eslint:recommended",    "plugin:@typescript-eslint/recommended",    "plugin:@typescript-eslint/recommended-requiring-type-checking"  ],  "parserOptions": {    "project": "./tsconfig.json",    "ecmaVersion": 2020,    "sourceType": "module"  },  "rules": {    "@typescript-eslint/explicit-function-return-type": "warn",    "@typescript-eslint/no-explicit-any": "warn",    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]  }}
```

### NPM Scripts

Add scripts to run linting and a type-only check.

Use `lint:fix` to auto-fix simple issues.

```javascript
// package.json{  "scripts": {    "lint": "eslint . --ext .ts,.tsx",    "lint:fix": "eslint . --ext .ts,.tsx --fix",    "type-check": "tsc --noEmit"  }}
```

* * *

* * *

## Code Formatting with Prettier

Prettier enforces a consistent code style across your team.

Combine it with ESLint to avoid formatting-related lint errors.

### Installation

Install Prettier plus ESLint plugins that disable conflicting rules and surface formatting issues via ESLint.

```javascript
# Install Prettier and related packagesnpm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### Configuration

Define your Prettier preferences in `.prettierrc` and ignore generated folders in `.prettierignore`.

```javascript
// .prettierrc{  "semi": true,  "singleQuote": true,  "tabWidth": 2,  "printWidth": 100,  "trailingComma": "es5",  "bracketSpacing": true,  "arrowParens": "avoid"}// .prettierignorenode_modulesbuilddist.next.vscode
```

### Integrate with ESLint

Extend `plugin:prettier/recommended` so formatting problems are reported as ESLint issues.

```javascript
// .eslintrc.json{  "extends": [    // ... other configs    "plugin:prettier/recommended" // Must be last in the array  ]}
```
```javascript
npm install --save-dev eslint-config-prettier eslint-plugin-prettier# In your .eslintrc.js or .eslintrc.json, add:{  "extends": ["plugin:prettier/recommended"]}
```

* * *

## Modern Build Tools

Vite is the recommended choice for fast dev server and modern builds.

Webpack remains common and highly configurable.

### Vite (Recommended)

Create a new React + TypeScript project using Vite.

It starts a dev server with HMR for rapid feedback.

```javascript
# Create a new project with React + TypeScriptnpm create vite@latest my-app -- --template react-ts# Navigate to project directorycd my-app# Install dependenciesnpm install# Start development servernpm run dev
```

### Webpack Configuration

If you choose Webpack, this minimal setup transpiles TypeScript, handles CSS, and serves your app with `webpack-dev-server`.

```javascript
// webpack.config.jsconst path = require('path');const HtmlWebpackPlugin = require('html-webpack-plugin');module.exports = {  entry: './src/index.tsx',  module: {    rules: [      {        test: /\.(ts|tsx)$/,        use: 'ts-loader',        exclude: /node_modules/,      },      {        test: /\.css$/,        use: ['style-loader', 'css-loader'],      },    ],  },  resolve: {    extensions: ['.tsx', '.ts', '.js'],  },  output: {    filename: 'bundle.js',    path: path.resolve(__dirname, 'dist'),  },  plugins: [    new HtmlWebpackPlugin({      template: './public/index.html',    }),  ],  devServer: {    static: path.join(__dirname, 'dist'),    compress: true,    port: 3000,    hot: true,  },};
```

### TypeScript Configuration

A strict `tsconfig.json` that targets modern browsers.

The optional `baseUrl` and `paths` help with absolute imports like `@/components/Button`.

```javascript
// tsconfig.json{  "compilerOptions": {    "target": "es2020",    "module": "esnext",    "lib": ["dom", "dom.iterable", "esnext"],    "allowJs": true,    "skipLibCheck": true,    "esModuleInterop": true,    "allowSyntheticDefaultImports": true,    "strict": true,    "forceConsistentCasingInFileNames": true,    "moduleResolution": "node",    "resolveJsonModule": true,    "isolatedModules": true,    "noEmit": true,    "jsx": "react-jsx",    "baseUrl": ".",    "paths": {      "@/*": ["src/*"]    }  },  "include": ["src"],  "exclude": ["node_modules"]}
```

* * *

## Development Environment Setup

Configure your editor to surface lint errors, format on save, and debug efficiently.

### VS Code Extensions

Recommended extensions for VS Code:

*   **TypeScript + Webpack Problem Matchers** - For better error reporting
*   **ESLint** - Integrates ESLint into VS Code
*   **Prettier - Code formatter** - For consistent code formatting
*   **Path IntelliSense** - Autocomplete filenames
*   **Error Lens** - Show errors inline

### VS Code Settings

Use Prettier as the default formatter, fix ESLint issues on save, and prefer non-relative import paths.

```javascript
// .vscode/settings.json{  "editor.defaultFormatter": "esbenp.prettier-vscode",  "editor.formatOnSave": true,  "editor.codeActionsOnSave": {    "source.fixAll.eslint": true,    "source.organizeImports": true  },  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],  "typescript.tsdk": "node_modules/typescript/lib",  "typescript.preferences.importModuleSpecifier": "non-relative"}
```

### Debugging Configuration

Launch Chrome against your dev server and run Node-based test debugging directly from VS Code.

```javascript
// .vscode/launch.json{  "version": "0.2.0",  "configurations": [    {      "type": "chrome",      "request": "launch",      "name": "Launch Chrome against localhost",      "url": "http://localhost:3000",      "webRoot": "${workspaceFolder}",      "sourceMaps": true,      "sourceMapPathOverrides": {        "webpack:///./~/*": "${workspaceFolder}/node_modules/*",        "webpack:///./*": "${workspaceFolder}/src/*"      }    },    {      "type": "node",      "request": "launch",      "name": "Debug Tests",      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/jest",      "args": ["--runInBand", "--watchAll=false"],      "console": "integratedTerminal",      "internalConsoleOptions": "neverOpen",      "sourceMaps": true    }  ]}
```

* * *

## Testing Setup

Jest with Testing Library is a popular setup for testing React + TypeScript apps.

### Jest + Testing Library

Install Jest, TypeScript support, and React Testing Library utilities for DOM assertions and user interactions.

```javascript
# Install testing dependenciesnpm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Jest Configuration

Configure Jest to use `ts-jest`, map CSS modules, and resolve alias paths like `@/`.

```javascript
// jest.config.jsmodule.exports = {  preset: 'ts-jest',  testEnvironment: 'jsdom',  setupFilesAfterEnv: ['@testing-library/jest-dom'],  moduleNameMapper: {    '^@/(.*)$': '/src/$1',    '\\\.(css|less|scss|sass)$': 'identity-obj-proxy',  },  transform: {    '^.+\\\.tsx?$': 'ts-jest',  },  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],};
```

### Example Test

A simple component test that verifies rendering and click behavior using Testing Library.

```javascript
// src/__tests__/Button.test.tsximport React from 'react';import { render, screen, fireEvent } from '@testing-library/react';import '@testing-library/jest-dom';import Button from '../components/Button';describe('Button', () => {  it('renders button with correct text', () => {    render(<Button>Click me</Button>);    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();  });  it('calls onClick when clicked', () => {    const handleClick = jest.fn();    render(<Button onClick={handleClick}>Click me</Button>);        fireEvent.click(screen.getByRole('button'));    expect(handleClick).toHaveBeenCalledTimes(1);  });});
```

* * *

## Best Practices

### Development Workflow

*   Use `npm run dev` for development with hot reloading
*   Run `npm run type-check` to verify TypeScript types
*   Use `npm run lint` to check for linting errors
*   Run `npm run build` to create production build

### Performance Optimization

*   Use code splitting with dynamic imports
*   Enable tree-shaking in production builds
*   Use `React.memo` and `useMemo` for expensive computations
*   Lazy load non-critical components

* * *

## Common Pitfalls

*   **TypeScript configuration:** Ensure `strict` mode is enabled
*   **ESLint + Prettier conflicts:** Use `eslint-config-prettier` to disable conflicting rules
*   **Slow builds:** Consider using Vite or esbuild for faster development
*   **Missing type definitions:** Install `@types` packages for all dependencies
*   **Debugging issues:** Ensure source maps are properly configured

* * *

## Recommended Tools

*   **Bundlers:** Vite, Webpack, Parcel
*   **Testing:** Jest, React Testing Library, Cypress
*   **Linting/Formatting:** ESLint, Prettier, Stylelint
*   **Documentation:** TypeDoc, Storybook
*   **Performance:** Web Vitals, Lighthouse

* * *

* * *