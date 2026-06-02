# Git Staging Environment

* * *

## What is the Staging Environment?

The **staging environment** (or **staging area**) is like a waiting room for your changes.

You use it to tell Git exactly which files you want to include in your next commit.

This gives you control over what goes into your project history.

Here are some key commands for staging:

*   `git add <file>` - Stage a file
*   `git add --all` or `git add -A` - Stage all changes
*   `git status` - See what is staged
*   `git restore --staged <file>` - Unstage a file

* * *

## Stage a File with `git add`

To add a file to the staging area, use `git add <file>`:

```javascript
git add index.html
```

Now `index.html` is staged. You can check what is staged with `git status`:

```javascript
git status
On branch master

No commits yet

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
    new file: index.html
```

* * *

* * *

## Stage Multiple Files (`git add --all`, `git add -A`)

You can stage all changes (new, modified, and deleted files) at once:

```javascript
git add --all
```

`git add -A` does the same thing as `git add --all`.

* * *

## Check Staged Files with `git status`

See which files are staged and ready to commit:

```javascript
git status
On branch master

No commits yet

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   README.md
        new file:   bluestyle.css
        new file:   index.html
```

* * *

## How to Unstage a File

If you staged a file by mistake, you can remove it from the staging area (unstage it) with:

```javascript
git restore --staged index.html
```

Now `index.html` is no longer staged. You can also use `git reset HEAD index.html` for the same effect.

* * *

## Troubleshooting

*   **Staged the wrong file?** Use `git restore --staged <file>` to unstage it.
*   **Forgot to stage a file?** Just run `git add <file>` again before you commit.
*   **Not sure what's staged?** Run `git status` to see what will be committed.

* * *

* * *