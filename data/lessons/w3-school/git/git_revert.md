# Git Revert

* * *

## What Does Git Revert Do?

The `git revert` command undoes a previous commit by creating a new commit that reverses the changes.

This keeps your commit history intact and is the safest way to undo changes in a shared repository.

* * *

## Summary of Git Revert Commands and Options

*   `git revert HEAD` - Revert the latest commit
*   `git revert <commit>` - Revert a specific commit
*   `git revert HEAD~2` - Revert a commit further back in history
*   `git revert --no-edit` - Skip commit message editor
*   `git log --oneline` - Show commit history

* * *

## How to Find the Commit to Revert

First, you need to find the commit you want to undo.

Use `git log --oneline` to see a summary of your commit history:

```javascript
git log --oneline
52418f7 (HEAD -> master) Just a regular update, definitely no accidents here...
9a9add8 (origin/master) Added .gitignore
81912ba Corrected spelling error
3fdaa5b Merge pull request #1 from w3schools-test/update-readme
836e5bf (origin/update-readme, update-readme) Updated readme for GitHub Branches
daf4f7c (origin/html-skeleton, html-skeleton) Updated index.html with basic meta
facaeae (gh-page/master) Merge branch 'master' of https://github.com/w3schools-test/hello-world
e7de78f Updated index.html. Resized image
5a04b6f Updated README.md with a line about focus
d29d69f Updated README.md with a line about GitHub
e0b6038 merged with hello-world-images after fixing conflicts
1f1584e added new image
dfa79db updated index.html with emergency fix
0312c55 Added image to Hello World
09f4acd Updated index.html with a new line
221ec6e First release of Hello World!
```

* * *

* * *

## Run Git Revert

Once you've found the commit you want to undo, use `git revert` to create a new commit that reverses the changes:

```javascript
git revert HEAD --no-edit
[master e56ba1f] Revert "Just a regular update, definitely no accidents here..."
 Date: Thu Apr 22 10:50:13 2021 +0200
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 img_hello_git.jpg
```

* * *

## Review Changes After Git Revert

After running `git revert`, review the changes to make sure everything is as expected:

```javascript
git log --oneline
e56ba1f (HEAD -> master) Revert "Just a regular update, definitely no accidents here..."
52418f7 Just a regular update, definitely no accidents here...
9a9add8 (origin/master) Added .gitignore
81912ba Corrected spelling error
3fdaa5b Merge pull request #1 from w3schools-test/update-readme
836e5bf (origin/update-readme, update-readme) Updated readme for GitHub Branches
daf4f7c (origin/html-skeleton, html-skeleton) Updated index.html with basic meta
facaeae (gh-page/master) Merge branch 'master' of https://github.com/w3schools-test/hello-world
e7de78f Updated index.html. Resized image
5a04b6f Updated README.md with a line about focus
d29d69f Updated README.md with a line about GitHub
e0b6038 merged with hello-world-images after fixing conflicts
1f1584e added new image
dfa79db updated index.html with emergency fix
0312c55 Added image to Hello World
09f4acd Updated index.html with a new line
221ec6e First release of Hello World!
```

* * *

## Tips & Best Practices

Here are some tips and best practices to keep in mind when using Git Revert:

*   Use `git revert` instead of `git reset` when you want to undo a previous commit, but still keep the commit history intact.
*   Use `git log --oneline` to find the commit you want to undo.
*   Use `git revert HEAD --no-edit` to create a new commit that reverses the changes.

* * *

## Troubleshooting

Here are some common issues you may encounter when using Git Revert:

*   If you get an error message saying "error: could not revert...", try using `git revert --abort` to abort the revert process.
*   If you get an error message saying "error: could not apply...", try using `git revert --continue` to continue the revert process.

* * *

* * *