# Git Submodules

* * *

## What Are Git Submodules?

**Git submodules** let you include one Git repository inside another as a subdirectory.

This is useful for adding libraries or dependencies managed in separate repositories, while keeping their commit history separate.

* * *

## Why Use Submodules?

Submodules are helpful when you want to:

*   Reuse code from another project
*   Track a library or dependency at a specific commit
*   Keep histories of projects separate

* * *

## How to Add a Submodule

To add a submodule to your project, use:

```javascript
git submodule add https://github.com/example/library.git libs/library
```

This creates a subdirectory `libs/library` and updates `.gitmodules` with the submodule info.

* * *

## How to Clone a Repo with Submodules

When you clone a repository with submodules, you need to fetch their contents separately:

```javascript
git submodule init
git submodule update
```

Or do it all at once when cloning:

```javascript
git clone --recurse-submodules https://github.com/user/repo.git
```

* * *

* * *

## How to Check Submodule Status

To see the current commit and state of your submodules, use:

```javascript
git submodule status
```

* * *

## How to Run Commands in All Submodules

You can run a command in every submodule. For example, to check their status:

```javascript
git submodule foreach git status
```

* * *

## How to Update Submodules

To update submodules to the latest commit from their remote repository:

```javascript
git submodule update --remote
```

* * *

## How to Remove a Submodule

To remove a submodule:

*   Delete the relevant section from `.gitmodules`
*   Remove the submodule directory from your working tree
*   Run `git rm --cached path/to/submodule`

* * *

## About .gitmodules

The `.gitmodules` file keeps track of all submodules and their paths. Edit this file if you move or remove submodules.

```javascript
[submodule "libs/library"]
  path = libs/library
  url = https://github.com/example/library.git
```

* * *

## Troubleshooting and Best Practices

*   If submodules are empty after cloning, run `git submodule update --init --recursive`.
*   If you change a submodule's URL, update both `.gitmodules` and `.git/config`.
*   Submodules always point to a specific commit, not always the latest-remember to update if you want new changes.
*   Keep submodules for external projects you want to track at a fixed version. For simpler needs, consider alternatives like Git subtree or copying files.

**Note:** Submodules are powerful, but can be tricky to manage.

Only use them if you really need to track another project at a specific commit.

* * *

* * *