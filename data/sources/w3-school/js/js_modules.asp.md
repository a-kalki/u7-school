# JavaScript Modules

## What are Modules?

Modules are **code blocks** that can **export** and/or **import** functions and values.

```javascript
// Export an "add" functionexport function add(a, b) {  return a + b;}
```

Modules let you to break up code into **separate files**.

Modules is a fundamental feature in **modern JavaScript**.

## Module Files

A JavaScript module is **usually a file**, but it can also be **an HTML script**.

**A module file** is a .js file using import / export.

**A module script** is an HTML script using import / export.

* * *

## How to Use Modules

Modules use `export` and `import` to interchange functionalities between modules.

An HTML script using `type="module"` is treated as a module:

```javascript
// Export an "add" functionexport function add(a, b) {  return a + b;}
```

* * *

* * *

Module files must be **stored on a server**.

Modules only work with the **HTTP(s) protocol**.

A web-page opened via the file:// protocol cannot use import / export.

```javascript
// Export name and ageexport const name = "Jesse";export const age = 40;
```

* * *

## Modules Can Export

*   Variables
*   Functions
*   Objects
*   Classes

```javascript
const message = () => {  const name = "Jesse";  const age = 40;  return name + ' is ' + age + 'years old.';};export default message;
```

* * *

Modules operate in **strict mode** by default.

* * *

## Why Modules?

*   Modules help **organizing code**.
    
    Modules let you break down large codebases into small self-contained files, each focused on a specific task. Modules are essential for large and complex applications.
    
*   Modules **prevent naming conflicts**.
    
    Before modules, developers had only the global scope, which can lead to "namespace pollution" where unrelated code can accidentally overwrite other global variables. Modules has a private scope. Variables and functions are not exposed globally, unless explicitly exported.
    
*   Modules have **better readability**
    
    Modules improves code organization, making it easier to navigate, understand, and manage, especially in larger projects or team environments.
    
*   Modules are **easily reused** across different parts of an application and in entirely new projects.
    
    Modules promote reusability by enabling the export of functions, variables, or objects from one file and their import into other files or projects. This eliminates redundant code and fosters a more efficient development process.
    
    A module can be easily reused across different parts of a project or in entirely new projects. This promotes the "Don't Repeat Yourself" (DRY) principle, reducing code duplication and saving time.
    
*   Modules are **easier to maintain and debug**.
    
    By dividing code into distinct modules, modifications or bug fixes in one part of the application can be isolated to a specific module, minimizing the impact on other parts of the system. this makes the codebase easier to maintain and scale as the project grows.
    
    Modules allow multiple developers to work on different parts of the codebase simultaneously with less risk of conflicts. Clear module boundaries enhance communication and make it easier to add new features with minimal impact on existing code.
    
*   Modules have **better encapsulation and isolation**
    
    Variables and functions defined within a module are private by default, only becoming accessible to other modules when explicitly exported. This enhances code isolation, reduces the risk of unintended side effects, and makes code easier to reason about.
    
*   Modules have **better dependency management**.
    
    Modules use explicit import and export statements to manage dependencies. This makes it easier to understand the relationships between different parts of the application and to manage external libraries or components.
    
    Modules are much more reliable than the older, manual process of ensuring scripts were loaded in the correct order.
    

* * *

* * *