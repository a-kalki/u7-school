# Git Stash

* * *

## Key Commands for Stashing

*   `git stash` - Stash your changes
*   `git stash push -m "message"` - Stash with a message
*   `git stash list` - List all stashes
*   `git stash branch <branchname>` - Create a branch from a stash

* * *

## What is Git Stash? Why Use It?

Sometimes you need to quickly switch tasks or fix a bug, but you're not ready to commit your work.

`git stash` lets you save your uncommitted changes and return to a clean working directory.

You can come back and restore your changes later.

Here are some common use cases:

*   **Switch branches safely:** Save your work before changing branches.
*   **Handle emergencies:** Stash your work to fix something urgent, then restore it.
*   **Keep your work-in-progress safe:** Avoid messy commits or losing changes.

* * *

## Stash Your Changes (`git stash`)

Save your current changes (both staged and unstaged tracked files) with:

**What gets stashed?**  

*   **Tracked files** (both staged and unstaged) are stashed by default.
*   **Untracked files** (new files not yet added to Git) are not stashed by default.
*   To stash untracked files too, use `git stash -u` (or `--include-untracked`).

```javascript
git stash
Saved working directory and index state WIP on main: 1234567 Add new feature
```

This command saves your changes and cleans your working directory so you can safely switch tasks or branches.

Your changes are now saved in a stack.

**What is a stash stack?**

Each time you run `git stash`, your changes are saved on top of a "stack".

The most recent stash is on top, and you can apply or drop stashes from the top down, or pick a specific one from the list.

Your working directory is clean, and you can switch branches or pull updates safely.

* * *

## Stash with a Message (`git stash push -m`)

Add a message to remember what you stashed:

```javascript
git stash push -m "WIP: homepage redesign"
Saved working directory and index state On main: WIP: homepage redesign
```

This command lets you add a descriptive message to your stash so you can remember what you were working on.

* * *

* * *

## List All Stashes (`git stash list`)

See all your saved stashes:

```javascript
git stash list
stash@{0}: On main: WIP: homepage redesign
stash@{1}: WIP on main: 1234567 Add new feature
```

This command shows all the stashes you have saved so far, with their names and messages.

* * *

## Show Stash Details (`git stash show`)

See what was changed in the latest stash:

```javascript
git stash show
 src/index.html | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

This command gives a summary of what files and changes are in your most recent stash.

To see a full diff:

```javascript
git stash show -p
diff --git a/src/index.html b/src/index.html
index 1234567..89abcde 100644
--- a/src/index.html
+++ b/src/index.html
@@ ...
```

This command shows the exact lines that were changed in your most recent stash.

* * *

## Apply the Latest Stash (`git stash apply`)

Restore your most recent stashed changes (keeps the stash in the stack):

```javascript
git stash apply
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
    modified:   src/index.html
```

This command restores your most recent stashed changes, but keeps the stash in the list so you can use it again if needed.

* * *

## Apply a Specific Stash (`git stash apply stash@{n}`)

Restore a specific stash from the list:

```javascript
git stash apply stash@{1}
On branch main
Changes not staged for commit:
    modified:   src/index.html
```

This command lets you restore a specific stash from your list, not just the most recent one.

* * *

## Pop the Stash (`git stash pop`)

Apply the latest stash **and remove it from the stack**:

```javascript
git stash pop
On branch main
Changes not staged for commit:
    modified:   src/index.html
Dropped refs/stash@{0} (abc1234d5678)
```

This command restores your most recent stash and removes it from the list at the same time.

* * *

## Drop a Stash (`git stash drop`)

Delete a specific stash when you no longer need it:

```javascript
git stash drop stash@{0}
Dropped stash@{0} (abc1234d5678)
```

This command deletes a specific stash from your list when you no longer need it.

* * *

## Clear All Stashes (`git stash clear`)

Delete all your stashes at once:

```javascript
git stash clear
```

This command deletes all your stashes at once. Be careful! This cannot be undone!

* * *

## Branch from a Stash (`git stash branch`)

Create a new branch and apply a stash to it.

Useful if your stashed work should become its own feature branch:

```javascript
git stash branch new-feature stash@{0}
Switched to a new branch 'new-feature'
On branch new-feature
Changes not staged for commit:
    modified:   src/index.html
Dropped stash@{0} (abc1234d5678)
```

This command creates a new branch and applies your stashed changes to it.

This is useful if you decide your work should become its own feature branch.

* * *

## Best Practices for Stashing

*   Use clear messages when stashing: `git stash push -m "WIP: feature name"`
*   Don't use stashes as long-term storage-commit your work when possible.
*   Check your stash list regularly and clean up old stashes you no longer need.

* * *

## Troubleshooting

*   **Did you lose your changes?** Try `git stash list` and `git stash apply` to recover stashed work.
*   **Stash didn't apply cleanly?** You may need to resolve conflicts, just like a merge.  
    Git will mark the conflicts in your files for you to resolve.
*   **Untracked files missing?** By default, untracked files are not stashed.  
    If you need to stash them, use `git stash -u` next time.
*   **Accidentally cleared all stashes?** Unfortunately, `git stash clear` is permanent.  
    Always double-check before running it!

* * *

**Note:** Stashes are useful for temporary work, but are not a replacement for commits!

* * *

* * *