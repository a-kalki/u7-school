# Git Cherry-pick & Patch

* * *

## What is Cherry-pick?

**Cherry-pick** lets you copy a single commit from one branch to another. It's useful when you want just one (or a few) changes, not everything from another branch.

* * *

## What is a Patch?

A **patch** is a file with changes from one or more commits. You can share a patch or apply it to another repository, even if it's unrelated to your own.

* * *

## When to Use Each

*   Use **cherry-pick** to copy a commit between branches in the same repository.
*   Use **patches** to share changes as files, or when working across different repositories.

* * *

## How to Cherry-pick a Commit

Copy a specific commit from another branch to your current branch:

```javascript
git cherry-pick abc1234
```

This creates a new commit on your branch with the same changes.

* * *

* * *

## Edit the Commit Message

Use `--edit` to change the commit message while cherry-picking:

```javascript
git cherry-pick abc1234 --edit
```

* * *

## Apply Without Committing

Use `--no-commit` (or `-n`) to apply the changes, but not create a commit yet. This lets you make more changes before committing:

```javascript
git cherry-pick abc1234 --no-commit
```

* * *

## Add Commit Origin

Use `-x` to add a line to the commit message showing where the commit came from:

```javascript
git cherry-pick abc1234 -x
```

* * *

## Handling Conflicts

If there are conflicts, Git will pause and ask you to fix them. After fixing, run:

```javascript
git add .
git cherry-pick --continue
```

To cancel the cherry-pick, use:

```javascript
git cherry-pick --abort
```

* * *

## How to Create a Patch

Make a patch file from a commit:

```javascript
git format-patch -1 abc1234
```

For multiple commits:

```javascript
git format-patch HEAD~3
```

* * *

## How to Apply a Patch

Apply a patch file to your current branch:

```javascript
git apply 0001-some-change.patch
```

* * *

## Apply a Patch and Keep Metadata

Use `git am` to apply a patch and keep the original author and message:

```javascript
git am 0001-some-change.patch
```

* * *

## Reverse a Patch

Undo the changes in a patch file:

```javascript
git apply -R 0001-some-change.patch
```

**Tip:** Use **cherry-pick** for copying a single commit in the same repository.

Use **patches** to share changes as files or work across repositories.

If you want to keep commit history and authors, use `git am` instead of `git apply`.

* * *

## Troubleshooting & Best Practices

*   **Cherry-pick conflicts:** If you get conflicts, fix them, then run `git cherry-pick --continue`.  
    Abort with `git cherry-pick --abort` if needed.
*   **Patch doesn't apply cleanly:** Make sure the patch matches your codebase. Sometimes you may need to adjust manually.
*   **Keep your branches up to date:** Before cherry-picking or applying patches, pull the latest changes.

* * *

* * *