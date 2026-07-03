# Git Rebase

* * *

## What is Git Rebase?

**Rebasing** moves or combines a sequence of commits to a new base commit.

It is often used to keep a clean, linear project history.

Rebasing can make your commit history easier to read by avoiding unnecessary merge commits.

* * *

## When to Use Git Rebase

Use Git Rebase to:

*   Keep a clean, linear project history
*   Avoid unnecessary merge commits
*   Combine multiple commits into one
*   Edit or reorder commits

* * *

## Basic Rebase

To move your current branch on top of another branch (e.g., update your feature branch with latest main):

```javascript
git checkout feature-branch
git rebase main
```

This reapplies your feature branch changes on top of the latest `main` branch.

* * *

* * *

## Interactive Rebase

`git rebase -i <base>` lets you edit, reorder, squash, or fix up commits before a certain point.

This is useful for cleaning up your commit history before sharing it with others.

```javascript
git rebase -i HEAD~3
```

This opens an editor where you can:

*   **pick**: keep the commit as is
*   **squash**: combine commits together
*   **edit**: pause to change a commit
*   **reword**: change just the commit message

Follow these steps:

1.  Edit the commit message or choose an action (pick, squash, edit, reword)
2.  Save and close the editor
3.  Git will apply the changes and let you review the results

* * *

## Continue, Abort, or Skip

If you hit a conflict or need to finish editing a commit, use `git rebase --continue` after resolving the issue.

This tells Git to keep going with the rebase process.

```javascript
git add fixed_file.txt
git rebase --continue
```

If something goes wrong or you want to stop the rebase, use `git rebase --abort`.

This will put your branch back to how it was before you started rebasing.

```javascript
git rebase --abort
```

If you can't fix a commit during a rebase (for example, if a conflict can't be resolved), you can skip it with `git rebase --skip`.

Git will leave out that commit and move on to the next one.

```javascript
git rebase --skip
```

* * *

## Review Changes

After completing the rebase, review your changes to ensure everything is correct.

* * *

## Tips & Best Practices

Rebasing rewrites commit history.

Avoid rebasing commits that you have already pushed to a shared repository.

Use `git rebase -i` to edit, reorder, squash, or fix up commits before a certain point.

Use `git rebase --continue` to continue a rebase after resolving conflicts.

Use `git rebase --abort` to cancel a rebase in progress.

* * *

## Troubleshooting

If you encounter conflicts during a rebase, resolve them and then use `git rebase --continue` to continue the rebase process.

If you can't fix a commit during a rebase, use `git rebase --skip` to skip it.

* * *

**Note:** Rebasing rewrites commit history.

Avoid rebasing commits that you have already pushed to a shared repository.

* * *

* * *