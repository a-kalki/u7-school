# Git Branch Merge

* * *

## What is Merging in Git?

Merging in Git means combining the changes from one branch into another.

This is how you bring your work together after working separately on different features or bug fixes.

## Common `git merge` Options

*   [git merge](git_branch_merge.asp%3Fremote=github.html#merge) - Merge a branch into your current branch
*   [git merge --no-ff](git_branch_merge.asp%3Fremote=github.html#no-ff) - Always create a merge commit
*   [git merge --squash](git_branch_merge.asp%3Fremote=github.html#squash) - Combine changes into a single commit
*   [git merge --abort](git_branch_merge.asp%3Fremote=github.html#abort) - Abort a merge in progress

* * *

## Merging Branches (`git merge`)

To combine the changes from one branch into another, use `git merge`.

Usually, you first switch to the branch you want to merge _into_ (often `main` or `master`), then run the merge command with the branch name you want to combine in.

First, we need to change to the master branch:

```javascript
git checkout master
Switched to branch 'master'
```

Now we merge the current branch (master) with emergency-fix:

```javascript
git merge emergency-fix
Updating 09f4acd..dfa79db
Fast-forward
 index.html | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Since the emergency-fix branch came directly from master, and no other changes had been made to master while we were working, Git sees this as a continuation of master.

So it can "Fast-forward", just pointing both master and emergency-fix to the same commit.

## Best Practices for Merging Branches

*   Always commit or stash your changes before starting a merge.
*   Regularly merge from the main branch into your feature branch to minimize conflicts.
*   Read and resolve conflicts carefully-don't just accept all changes blindly.
*   Write clear and descriptive merge commit messages.

* * *

## Practical Examples

*   **Abort a merge:** `git merge --abort`
*   **Check status during a merge:** `git status`
*   **Resolve a conflict and complete the merge:** Edit the conflicted file(s), then `git add file` and `git commit`
*   **Fast-forward merge:** Happens when no new commits diverged-Git just moves the branch pointer forward.
*   **No-fast-forward merge:** Use `git merge --no-ff branch` to always create a merge commit, preserving branch history.

* * *

As master and emergency-fix are essentially the same now, we can delete emergency-fix, as it is no longer needed:

```javascript
git branch -d emergency-fix
Deleted branch emergency-fix (was dfa79db).
```

* * *

* * *

## Non-Fast-Forward Merge (`git merge --no-ff`)

By default, if your branch can be merged with a fast-forward (no new commits on the base), Git just moves the branch pointer forward.

If you want to always create a merge commit (to keep history clearer), use `git merge --no-ff branchname`.

```javascript
git merge --no-ff feature-branch
Merge made by the 'recursive' strategy.
 index.html | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

* * *

## Squash Merge (`git merge --squash`)

If you want to combine all the changes from a branch into a single commit (instead of keeping every commit), use `git merge --squash branchname`.

This is useful for cleaning up commit history before merging.

```javascript
git merge --squash feature-branch
Squash commit -- not updating HEAD
Automatic merge went well; stopped before committing as requested
```

* * *

## Aborting a Merge (`git merge --abort`)

If you run into trouble during a merge (like a conflict you don't want to resolve), you can cancel the merge and go back to how things were before with `git merge --abort`.

```javascript
git merge --abort
```

* * *

## What is a Merge Conflict?

A **merge conflict** happens when changes in two branches touch the same part of a file and Git doesn't know which version to keep.

Think of it like two people editing the same sentence in a document in different ways-Git needs your help to decide which version to use.

* * *

## How to Resolve a Merge Conflict

Git will mark the conflict in your file.

You need to open the file, look for lines like `<<<<<<< HEAD` and `=======`, and decide what the final version should be.

Then, stage and commit your changes.

* * *

## Troubleshooting & Tips

*   If you want to cancel a merge, use `git merge --abort`.
*   Always commit or stash your changes before starting a merge.
*   Read the conflict markers carefully and remove them after you've resolved the issue.
*   Use `git status` to see what files need your attention.
*   If you're unsure, ask a teammate or look up the error message.

* * *

## Merge Conflict Example

Now we can move over to hello-world-images from last chapter, and keep working.

Add another image file (img\_hello\_git.jpg) and change index.html, so it shows it:

```javascript
git checkout hello-world-images
Switched to branch 'hello-world-images'
```
```javascript
<!DOCTYPE html><html><head><title>Hello World!</title><link rel="stylesheet" href="bluestyle.css"></head><body><h1>Hello world!</h1><div><img src="img_hello_world.jpg" alt="Hello World from Space" style="width:100%;max-width:960px"></div><p>This is the first file in my new Git Repo.</p><p>A new line in our file!</p><div><img src="img_hello_git.jpg" alt="Hello Git" style="width:100%;max-width:640px"></div></body></html>
```

Now, we are done with our work here and can stage and commit for this branch:

```javascript
git add --all
git commit -m "added new image"
[hello-world-images 1f1584e] added new image
 2 files changed, 1 insertion(+)
 create mode 100644 img_hello_git.jpg
```

We see that index.html has been changed in both branches.

Now we are ready to merge hello-world-images into master.

But what will happen to the changes we recently made in master?

```javascript
git checkout master
git merge hello-world-images
Auto-merging index.html
CONFLICT (content): Merge conflict in index.html
Automatic merge failed; fix conflicts and then commit the result.
```

The merge failed, as there is conflict between the versions for index.html.

Let us check the status:

```javascript
git status
On branch master
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Changes to be committed:
        new file:   img_hello_git.jpg
        new file:   img_hello_world.jpg

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   index.html
```

This confirms there is a conflict in index.html, but the image files are ready and staged to be committed.

So we need to fix that conflict. Open the file in our editor:

```javascript
<!DOCTYPE html><html><head><title>Hello World!</title><link rel="stylesheet" href="bluestyle.css"></head><body><h1>Hello world!</h1><div><img src="img_hello_world.jpg" alt="Hello World from Space" style="width:100%;max-width:960px"></div><p>This is the first file in my new Git Repo.</p><<<<<<< HEAD<p>This line is here to show how merging works.</p>=======<p>A new line in our file!</p><div><img src="img_hello_git.jpg" alt="Hello Git" style="width:100%;max-width:640px"></div>>>>>>>> hello-world-images</body></html>
```

We can see the differences between the versions and edit it like we want:

```javascript
<!DOCTYPE html><html><head><title>Hello World!</title><link rel="stylesheet" href="bluestyle.css"></head><body><h1>Hello world!</h1><div><img src="img_hello_world.jpg" alt="Hello World from Space" style="width:100%;max-width:960px"></div><p>This is the first file in my new Git Repo.</p><p>This line is here to show how merging works.</p><div><img src="img_hello_git.jpg" alt="Hello Git" style="width:100%;max-width:640px"></div></body></html>
```

Now we can stage index.html and check the status:

```javascript
git add index.html
git status
On branch master
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
        new file:   img_hello_git.jpg
        new file:   img_hello_world.jpg
        modified:   index.html
```

The conflict has been fixed, and we can use commit to conclude the merge:

```javascript
git commit -m "merged with hello-world-images after fixing conflicts"
[master e0b6038] merged with hello-world-images after fixing conflicts
```

And delete the hello-world-images branch:

```javascript
git branch -d hello-world-images
Deleted branch hello-world-images (was 1f1584e).
```

Now you have a better understanding of how branches and merging works.

Time to start working with a remote repository!

* * *

* * *