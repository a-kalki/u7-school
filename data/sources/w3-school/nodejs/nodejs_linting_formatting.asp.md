# Node.js Linting & Formatting

* * *

## Code Quality

Consistent code quality and style is important for Node.js projects, especially in team environments.

It helps with:

*   Readability and maintainability of code
*   Early bug detection and prevention
*   Consistent coding style across the team
*   Automated code reviews
*   Better developer experience

**Note:** This guide covers both JavaScript and TypeScript tooling, as they share similar linting and formatting ecosystems.

* * *

## ESLint: JavaScript/TypeScript Linting

ESLint is the most popular JavaScript/TypeScript linting tool that helps identify and report on patterns found in your code. It's highly configurable and supports:

*   Custom rules and configurations
*   TypeScript support through `@typescript-eslint/parser`
*   Plugin ecosystem for framework-specific rules
*   Automatic fixing of common issues

### Installation

```javascript
npm install --save-dev eslint
```

### Comprehensive ESLint Configuration

Here's a more complete `.eslintrc.json` configuration for a Node.js project with TypeScript support:

```javascript
{  "env": {    "node": true,    "es2021": true,    "browser": true  },  "extends": [    "eslint:recommended",    "plugin:@typescript-eslint/recommended"  ],  "parser": "@typescript-eslint/parser",  "parserOptions": {    "ecmaVersion": 12,    "sourceType": "module"  },  "plugins": ["@typescript-eslint"],  "rules": {    "semi": ["error", "always"],    "quotes": ["error", "single"],    "indent": ["error", 2],    "no-console": "warn",    "no-unused-vars": "warn"  }}
```

### Advanced ESLint Usage

Beyond basic linting, ESLint offers powerful features for maintaining code quality:

#### Common Commands

```javascript
# Lint all JavaScript/TypeScript filesnpx eslint .# Fix auto-fixable issuesnpx eslint --fix .# Lint specific filenpx eslint src/index.js
```

* * *

* * *

## Prettier: Code Formatter

Prettier is an opinionated code formatter that enforces a consistent style by parsing your code and re-printing it with its own rules. It supports:

*   JavaScript, TypeScript, JSX, CSS, SCSS, JSON, and more
*   Opinionated defaults with minimal configuration
*   Integration with ESLint and other tools
*   Support for editor integration

**Tip:** Use Prettier for formatting and ESLint for catching potential errors and enforcing code patterns.

### Installation

```javascript
npm install --save-dev --save-exact prettier
```

### Comprehensive Prettier Configuration

Here's a well-documented `.prettierrc` configuration with common options:

```javascript
{  "semi": true,  "singleQuote": true,  "tabWidth": 2,  "trailingComma": "es5",  "printWidth": 100,  "bracketSpacing": true,  "arrowParens": "avoid"}
```

### Advanced Prettier Usage

Prettier can be customized and integrated into your workflow in various ways:

#### Common Commands

```javascript
# Format all filesnpx prettier --write .# Check formatting without making changesnpx prettier --check .# Format specific filenpx prettier --write src/index.js
```

### Seamless ESLint + Prettier Integration

To avoid conflicts between ESLint and Prettier, set up proper integration:

**Important:** Always install and configure these packages to prevent rule conflicts:

```javascript
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

Then update your ESLint config:

```javascript
{  "extends": [    "eslint:recommended",    "plugin:@typescript-eslint/recommended",    "plugin:prettier/recommended"  ]}
```

* * *

## Advanced Editor Integration

**Pro Tip:** Set up your editor to automatically fix and format code on save for maximum productivity.

### VS Code: Ultimate Setup

For the best development experience in VS Code, follow these steps:

1.  Install the following extensions:
    *   ESLint
    *   Prettier - Code formatter
    *   EditorConfig for VS Code
    *   Error Lens (for inline error highlighting)
2.  Configure your VS Code settings.json:

1.  Install the ESLint and Prettier extensions
2.  Add these settings to your VS Code settings.json:

```javascript
{  "editor.formatOnSave": true,  "editor.codeActionsOnSave": {    "source.fixAll.eslint": true  },  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],  "prettier.requireConfig": true,  "editor.defaultFormatter": "esbenp.prettier-vscode"}
```

### Other Editor Setups

Here are setup instructions for other popular editors:

*   **WebStorm/IntelliJ**: Built-in support for ESLint and Prettier
*   **Atom**: Install linter-eslint and prettier-atom packages
*   **Sublime Text**: Install SublimeLinter and SublimeLinter-eslint

* * *

## Git Hooks with Husky & lint-staged

Prevent bad code from being committed by setting up pre-commit hooks that automatically format and lint your code:

**Why use pre-commit hooks?** They ensure consistent code quality across your team by automatically fixing style issues before code is committed.

Ensure code quality before commits with pre-commit hooks:

### Installation

```javascript
npm install --save-dev husky lint-staged
```

### Configuration (package.json)

```javascript
{  "husky": {    "hooks": {      "pre-commit": "lint-staged"    }  }  "lint-staged": {    "*.{js,jsx,ts,tsx}": [      "eslint --fix",      "prettier --write"    ],    "*.{json,md,yml}": [      "prettier --write"    ]  }}
```

* * *

## Advanced Best Practices

### 1\. Monorepo Setup

For projects using a monorepo structure:

```javascript
// In your root package.json{  "workspaces": ["packages/*"],  "scripts": {    "lint": "yarn workspaces run lint",    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\""  },  "devDependencies": {    "@typescript-eslint/eslint-plugin": "^5.0.0",    "@typescript-eslint/parser": "^5.0.0",    "eslint": "^8.0.0",    "eslint-config-prettier": "^8.3.0",    "eslint-plugin-prettier": "^4.0.0",    "husky": "^7.0.4",    "lint-staged": "^12.0.0",    "prettier": "^2.5.0",    "typescript": "^4.5.0"  },  "lint-staged": {    "*.{js,jsx,ts,tsx}": [      "eslint --fix",      "prettier --write"    ],    "*.{json,md,yml,yaml}": [      "prettier --write"    ]  }}
```

### 2\. Performance Optimization

For large projects, optimize ESLint performance:

```javascript
// .eslintrc.jsmodule.exports = {  cache: true, // Enable caching  cacheLocation: '.eslintcache', // Cache file location  ignorePatterns: ['**/node_modules/**', '**/dist/**'], // Ignore patterns  parserOptions: {    project: './tsconfig.json', // Only for TypeScript    projectFolderIgnoreList: ['**/node_modules/**']  }};
```

### 3\. EditorConfig for Cross-Editor Consistency

Add a `.editorconfig` file to maintain consistent coding styles across different editors and IDEs:

```javascript
# EditorConfig is awesome: https://EditorConfig.orgroot = true[*]charset = utf-8end_of_line = lfindent_size = 2indent_style = spaceinsert_final_newline = truetrim_trailing_whitespace = true[*.md]trim_trailing_whitespace = false[*.{json,yml}]indent_style = spaceindent_size = 2[*.{cmd,sh}]indent_style = tab
```

### 4\. CI/CD Integration

Add linting and formatting checks to your CI/CD pipeline:

```javascript
# .github/workflows/ci.ymlname: CIon: [push, pull_request]jobs:  lint:    runs-on: ubuntu-latest    steps:      - uses: actions/checkout@v2      - uses: actions/setup-node@v2        with:          node-version: '16'      - run: npm ci      - run: npm run lint      - run: npm run format:check
```

### Linting Best Practices

*   Start with a base config (like `eslint:recommended`) and extend as needed
*   Be consistent with rule severity levels (error, warn, off)
*   Document rule exceptions with comments when necessary
*   Regularly update your ESLint and plugin versions
*   Use TypeScript-specific rules when working with TypeScript

### Formatting Best Practices

*   Keep line lengths reasonable (80-120 characters)
*   Use consistent quote style (single or double quotes)
*   Be consistent with semicolon usage
*   Use trailing commas in objects and arrays for cleaner diffs
*   Configure your editor to format on save

### Team Workflow

*   Share ESLint and Prettier configs across the team
*   Include linting and formatting in CI/CD pipelines
*   Use pre-commit hooks to catch issues early
*   Document your code style decisions
*   Regularly review and update your code style guide

* * *

* * *