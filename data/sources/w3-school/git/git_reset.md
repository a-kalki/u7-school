# Git Reset

* * *

## What Does Git Reset Do?

The `git reset` command moves your current branch (HEAD) to a different commit.

Depending on the option, it can also change which changes are staged or even delete changes from your working directory.

Use it to undo commits, unstage files, or clean up your history.

* * *

## Summary of Git Reset Commands and Options

*   `git reset --soft <commit>` - Move HEAD to commit, keep changes staged
*   `git reset --mixed <commit>` - Move HEAD to commit, unstage changes (default)
*   `git reset --hard <commit>` - Move HEAD to commit, discard all changes
*   `git reset <file>` - Unstage a file
*   `git log --oneline` - Show commit history

* * *

## How to Find the Commit to Reset To

First, you need to find the commit you want to go back to.

Use `git log --oneline` to see a summary of your commit history:

![Git Reset Step 1](img_reset_part1.gif)

Step 2: Move the repository back to that step:

![Git Reset Step 2](img_reset_part2.gif)

After the previous chapter, we have a part in our `commit` history we could go back to.

Let's try and do that with `reset`.

* * *

## Git Reset Find Commit in Log

First thing, we need to find the point we want to return to.

To do that, we need to go through the `log`.

To avoid the very long `log` list, we are going to use the `--oneline` option, which gives just one line per `commit` showing:

*   The first seven characters of the `commit hash` - this is what we need to refer to in our reset command.
*   the `commit message`

So let's find the point we want to `reset` to:

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

We want to return to the `commit`: `9a9add8 (origin/master) Added .gitignore`, the last one before we started to mess with things.

* * *

* * *

## Git Reset --soft

`git reset --soft <commit>` moves HEAD to the specified commit, but keeps all your changes staged (in the index).

This is useful if you want to combine several commits into one, or just want to rewrite history but keep your work ready to commit.

```javascript
git reset --soft 9a9add8
```

All changes after `9a9add8` are now staged, ready for a new commit.

* * *

## Git Reset --mixed (default)

`git reset --mixed <commit>` (or just `git reset <commit>`) moves HEAD to the specified commit and unstages any changes, but keeps them in your working directory.

This is the default option and is useful if you want to "undo" a commit but keep your changes for editing or recommitting.

```javascript
git reset --mixed 9a9add8
```

All changes after `9a9add8` are now unstaged, but still in your files.

* * *

## Review Changes

After running Git Reset, review your changes to make sure everything is as expected.

* * *

## Tips & Best Practices

Use Git Reset with caution, as it can rewrite your commit history.

Make sure to communicate with your team before making changes to the remote repository.

* * *

## Troubleshooting

If you encounter issues with Git Reset, try using `git status` to see the current state of your repository.

* * *

## Warnings

Be careful when using Git Reset, as it can delete changes and rewrite your commit history.

Make sure to use it only when necessary.

* * *

* * *