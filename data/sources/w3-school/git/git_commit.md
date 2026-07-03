# Git Commit

* * *

## What is a Commit?

A **commit** is like a save point in your project.

It records a snapshot of your files at a certain time, with a message describing what changed.

You can always go back to a previous commit if you need to.

Here are some key commands for commits:

*   `git commit -m "message"` - Commit staged changes with a message
*   `git commit -a -m "message"` - Commit all tracked changes (skip staging)
*   `git log` - See commit history

* * *

## How to Commit with a Message (`-m`)

To save your staged changes, use `git commit -m "your message"`:

```javascript
git commit -m "First release of Hello World!"
[master (root-commit) 221ec6e] First release of Hello World!
 3 files changed, 26 insertions(+)
 create mode 100644 README.md
 create mode 100644 bluestyle.css
 create mode 100644 index.html
```

Always write a clear message so you and others can understand what changed.

* * *

* * *

## Commit All Changes Without Staging (`-a`)

You can skip the staging step for **already tracked files** with `git commit -a -m "message"`.

This commits all modified and deleted files, **but not new/untracked files**.

```javascript
git commit -a -m "Quick update to README"
[master 123abcd] Quick update to README
 1 file changed, 2 insertions(+)
```

**Warning:** Skipping the staging step can make you include unwanted changes. Use with care.

**Note:** `git commit -a` does not work for new/untracked files. You must use `git add <file>` first for new files.

```javascript
$ git commit -a -m "Try to commit new file"
On branch master

No commits yet

Untracked files:
  (use "git add ..." to include in what will be committed)
        index.html

nothing added to commit but untracked files present (use "git add" to track)
```

* * *

## Write Multi-line Commit Messages

If you just type `git commit` (no `-m`), your default editor will open so you can write a detailed, multi-line message:

```javascript
git commit
```

Write a short summary on the first line, leave a blank line, then add more details below.

* * *

## Commit Message Best Practices:

*   Keep the first line short (50 characters or less).
*   Use the imperative mood (e.g., "Add feature" not "Added feature").
*   Leave a blank line after the summary, then add more details if needed.
*   Describe _why_ the change was made, not just what changed.

* * *

## Other Useful Commit Options

*   **Create an empty commit:**  
    `git commit --allow-empty -m "Start project"`
*   **Use previous commit message (no editor):**  
    `git commit --no-edit`
*   **Quickly add staged changes to last commit, keep message:**  
    `git commit --amend --no-edit`

* * *

**Troubleshooting Common Commit Mistakes**

*   **Forgot to stage a file?**  
    If you run `git commit -m "message"` but forgot to `git add` a file, just add it and commit again. Or use `git commit --amend` to add it to your last commit.
*   **Typo in your commit message?**  
    Use `git commit --amend -m "Corrected message"` to fix the last commit message.
*   **Accidentally committed the wrong files?**  
    You can use `git reset --soft HEAD~1` to undo the last commit and keep your changes staged.

* * *

## View Commit History (`git log`)

To view the history of commits for a repository, you can use the `git log` command:

```javascript
git log
commit 09f4acd3f8836b7f6fc44ad9e012f82faf861803 (HEAD -> master)
Author: w3schools-test <test@w3schools.com>
Date:   Fri Mar 26 09:35:54 2021 +0100

    Updated index.html with a new line

commit 221ec6e10aeedbfd02b85264087cd9adc18e4b26
Author: w3schools-test <test@w3schools.com>
Date:   Fri Mar 26 09:13:07 2021 +0100

    First release of Hello World!
```

For a shorter view, use `git log --oneline`:

```javascript
git log --oneline
09f4acd Updated index.html with a new line
221ec6e First release of Hello World!
```

To see which files changed in each commit, use `git log --stat`:

```javascript
git log --stat
```

* * *

* * *