# Git Hooks

* * *

## What are Git Hooks?

**Git hooks** are scripts that run automatically when certain Git events happen, like making a commit or pushing code.

* * *

## Why Use Hooks?

Hooks help you automate repetitive tasks, enforce coding standards, and catch problems early.

For example, you can:

*   Run tests before every commit or push
*   Check code style automatically
*   Block bad commit messages
*   Enforce rules for everyone on your team

* * *

## Where Do Hooks Live?

Hooks are stored in `.git/hooks` inside your repository.

By default, you'll see sample scripts ending with `.sample`.

```javascript
ls .git/hooks
```

* * *

## How to Enable a Hook

To enable a hook, remove the `.sample` extension and make the script executable.

For example, to enable `pre-commit`:

```javascript
mv .git/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

On Windows, just rename the file to `pre-commit` and make sure it can be run by your shell (e.g. use `.bat` or `.ps1` if needed).

* * *

* * *

## Types of Hooks

There are many types of hooks, but the most common are:

*   `pre-commit`
*   `commit-msg`
*   `pre-push`
*   `pre-receive`
*   `post-receive`

* * *

## pre-commit Hook

The `pre-commit` hook runs before you make a commit.

You can use it to check code style, run tests, or stop a commit if something is wrong.

```javascript
#!/bin/sh
# Stop commit if any .js file has "console.log"
grep -r 'console.log' *.js && {
  echo "Remove console.log before committing!"
  exit 1
}
```

* * *

## commit-msg Hook

The `commit-msg` hook checks or edits the commit message.

For example, it can block commits without a ticket number.

```javascript
#!/bin/sh
# Block commit if message does not contain a ticket number
if ! grep -qE 'JIRA-[0-9]+' "$1"; then
  echo "Commit message must have a ticket number (e.g. JIRA-123)"
  exit 1
fi
```

* * *

## pre-push Hook

The `pre-push` hook runs before you push code to a remote.

You can use it to run tests or checks before sharing code.

```javascript
#!/bin/sh
npm test || exit 1
```

* * *

## Server-side Hooks

Some hooks (like `pre-receive`) run on the Git server, not your computer.

These can enforce rules for everyone who pushes to the repository.

```javascript
#!/bin/sh
# Block pushes to main branch
grep refs/heads/main || exit 1
```

* * *

## Custom Hooks

You can write any custom script as a hook.

Just put it in `.git/hooks` and make it executable.

```javascript
#!/bin/sh
echo "Hello from my custom hook!"
```

* * *

## Debugging and Best Practices

*   Make sure your hook script is executable (`chmod +x scriptname`).
*   Add `echo` statements to see what your script is doing.
*   Check the exit code: `exit 0` means success, `exit 1` means fail.
*   On Windows, use `.bat` or `.ps1` scripts if needed.
*   Keep hooks simple and fast-slow hooks slow down your workflow.
*   Share useful hooks with your team (but remember: hooks are not versioned by default).

**Note:** Hooks are powerful for automating checks (like linting or tests) and enforcing team standards. Client-side hooks run on your computer. Server-side hooks run on the Git server.

* * *

* * *