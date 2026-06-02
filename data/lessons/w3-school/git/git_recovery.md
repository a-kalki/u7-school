# Git Recovery

* * *

## What is Git Recovery?

Git recovery means getting back lost commits, branches, or files.

Git keeps a record of recent changes so you can undo mistakes-even after a reset or delete.

* * *

## When to Use Git Recovery

Use Git recovery when you:

*   Accidentally delete a branch or file
*   Reset your branch to a previous commit and lose changes
*   Need to recover lost commits or changes

* * *

## Recover Lost Commits with `git reflog`

`git reflog` records changes to the tip of branches and lets you find lost commits.

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

Find the commit hash you want to recover from the list.

* * *

## Restore a Deleted Branch

If you deleted a branch but the commits are still in reflog, you can recreate it:

```javascript
git checkout -b branch-name <commit-hash>
Switched to a new branch 'branch-name'
```

This brings back the branch at the commit you specify.

* * *

* * *

## Recover a Deleted or Changed File

If you deleted or changed a file and want to get it back, use `git restore`:

```javascript
git restore filename.txt
```

This brings back the file from the latest commit.

* * *

## Recover from a Hard Reset

If you used `git reset --hard` and lost commits, you can use the reflog to find and restore them:

```javascript
git reflog
e56ba1f (HEAD -> master) HEAD@{0}: commit: Revert "Just a regular update, definitely no accidents here..."
52418f7 HEAD@{1}: commit: Just a regular update, definitely no accidents here...
9a9add8 (origin/master) HEAD@{2}: commit: Added .gitignore
81912ba HEAD@{3}: commit: Corrected spelling error
3fdaa5b HEAD@{4}: merge: Merge pull request #1 from w3schools-test/update-readme
836e5bf HEAD@{5}: commit: Updated readme for GitHub Branches
...
git reset --hard HEAD@{2}
HEAD is now at 9a9add8 Added .gitignore
```

This puts your branch back to the state it was in at that point.

* * *

## Tips & Best Practices

*   Regularly commit your changes to avoid losing work
*   Use `git reflog` to find lost commits
*   Use `git restore` to recover deleted or changed files

* * *

* * *