# Git Push to GitHub

* * *

## Git Push to GitHub

When we have made changes locally, we want to update our remote repository with the changes.

Transferring our local changes to our remote is done with a `push` command.

There are several commands we can use to push changes to GitHub.

* * *

## Key Push Commands

*   [Basic Push](git_push_to_remote.asp%3Fremote=github.html#basic-push)
*   [Force Push](git_push_to_remote.asp%3Fremote=github.html#force-push)
*   [Push Tags](git_push_to_remote.asp%3Fremote=github.html#push-tags)
*   [Troubleshooting](git_push_to_remote.asp%3Fremote=github.html#troubleshooting)

* * *

## Basic Push

This command pushes your current branch to the remote repository named `origin`:

```javascript
git push origin
```

This will upload your local commits to GitHub.

You must have already committed your changes with `git commit`.

* * *

* * *

## Force Push

If your push is rejected due to non-fast-forward updates (for example, after a rebase), you can force the push.

**Warning:** This can overwrite changes on the remote repository. Use with caution!

```javascript
git push --force origin feature-branch
```

Use `--force-with-lease` for a safer force push:

```javascript
git push --force-with-lease origin feature-branch
```

* * *

## Push Tags

To push all local tags to GitHub:

```javascript
git push --tags
```

To push a specific tag:

```javascript
git push origin v1.0
```

* * *

## Troubleshooting

*   **Non-fast-forward error:** Happens if someone else pushed to the branch. Run `git pull --rebase` before pushing again.
*   **Authentication failed:** Make sure you have access to the repository and your credentials are correct.

* * *

Go to GitHub, and confirm that the repository has a new commit:

![GitHub New Commit](https://www.w3schools.com/git/img_git_push_to_github.png)

Now, we are going to start working on branches on GitHub.

* * *

* * *