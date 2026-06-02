# Git Reflog

* * *

## What is Git Reflog?

`git reflog` records updates to the tip of branches and HEAD.

It lets you see where your branch and HEAD have been, even changes you made by mistake.

This is useful for recovering lost commits or undoing a reset.

* * *

## When to Use Git Reflog

Use `git reflog` when you need to:

*   Recover lost commits or changes
*   Undo a reset or a merge
*   See the history of your branch and HEAD

* * *

## Show the Reflog

To see the history of where HEAD and branches have pointed, use:

```javascript
git reflog
e56ba1f (HEAD -> master) HEAD@{0}: commit: Revert "Just a regular update, definitely no accidents here..."
52418f7 HEAD@{1}: commit: Just a regular update, definitely no accidents here...
9a9add8 (origin/master) HEAD@{2}: commit: Added .gitignore
81912ba HEAD@{3}: commit: Corrected spelling error
3fdaa5b HEAD@{4}: merge: Merge pull request #1 from w3schools-test/update-readme
836e5bf HEAD@{5}: commit: Updated readme for GitHub Branches
...
```

This lists recent positions of HEAD, so you can see actions like commits, resets, merges, and checkouts.

* * *

* * *

## Find and Recover Lost Commits

If you accidentally reset or deleted commits, you can use the reflog to find the commit and restore it.

Each entry in the reflog has a reference like `HEAD@{2}`.

```javascript
git reflog
e56ba1f (HEAD -> master) HEAD@{0}: commit: Revert "Just a regular update, definitely no accidents here..."
52418f7 HEAD@{1}: commit: Just a regular update, definitely no accidents here...
9a9add8 (origin/master) HEAD@{2}: commit: Added .gitignore
81912ba HEAD@{3}: commit: Corrected spelling error
...
git reset --hard HEAD@{2}
HEAD is now at 9a9add8 Added .gitignore
```

This puts your branch back to the state it was in at that point.

* * *

## Clean Up the Reflog

The reflog is automatically cleaned by Git, but you can manually expire old entries if needed:

```javascript
git reflog expire --expire=30.days refs/heads/main
git gc --prune=now
Counting objects: 15, done.
Compressing objects: 100% (10/10), done.
Pruning objects
```

This removes reflog entries older than 30 days for the `main` branch and runs garbage collection.

* * *

## Tips & Best Practices

*   Use `git reflog` regularly to keep track of your changes
*   Use `git reflog` to recover lost commits or changes
*   Use `git reflog expire` to clean up old entries

* * *

## Troubleshooting

If you encounter issues with `git reflog`, try:

*   Checking the Git documentation for more information
*   Searching online for solutions to specific issues
*   Seeking help from a Git expert or community

* * *

## Warnings

Be careful when using `git reflog` to recover lost commits or changes, as it can overwrite existing changes.

* * *

* * *