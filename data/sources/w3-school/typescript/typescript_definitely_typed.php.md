# TypeScript Definitely Typed

* * *

NPM packages in the broad JavaScript ecosystem don't always have types available.

Sometimes the projects are no longer maintained, and other times they aren't interested in, agree with, or have time to use TypeScript.

* * *

## Using non-typed NPM packages in TypeScript

Using untyped NPM packages with TypeScript is not type-safe because types are missing.

To help TypeScript developers use such packages, there is a community-maintained project called [Definitely Typed](http://definitelytyped.org/).

Definitely Typed is a project that provides a central repository of TypeScript definitions for NPM packages which do not have types.

```javascript
npm install --save-dev @types/jquery
```

* * *

* * *

Usually, no other steps are needed after installing the declaration package.

TypeScript will automatically pick up the types when you use the package.

Editors such as Visual Studio Code will often suggest installing packages like these when types are missing.

* * *

* * *