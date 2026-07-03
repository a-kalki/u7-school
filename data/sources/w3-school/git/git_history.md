# Git History

* * *

## What is Git History? Why Use It?

Git keeps a detailed record of every change made to your project.

You can use history commands to see what changed, when, and who made the change.

This is useful for tracking progress, finding bugs, and understanding your project's evolution.

* * *

## Key Commands for Viewing History

*   `git log` - Show full commit history
*   `git log --oneline` - Show a summary of commits
*   `git show <commit>` - Show details of a specific commit
*   `git diff` - See unstaged changes
*   `git diff --staged` - See staged changes

* * *

## Best Practices for Viewing History

*   Make frequent, meaningful commits to keep your history clear.
*   Write clear commit messages so you and your team can understand changes later.
*   Use `git log --oneline` for a quick overview of your commit history.
*   Use `git diff` before committing to review your work.

* * *

## See Commit History (`git log`)

Show a detailed list of all commits in your repository:

```javascript
git log
commit 09f4acd3f8836b7f6fc44ad9e012f82faf861803 (HEAD -> master)
Author: w3schools-test 
Date:   Fri Mar 26 09:35:54 2021 +0100

    Updated index.html with a new line
```

This command shows all commits, including author, date, and message.

Use the arrow keys to scroll, and press `q` to quit.

**Tip:** While viewing the log, you can search for a word by typing `/` followed by your search term  
(for example, `/fix`), then press `n` to jump to the next match.

Press `q` at any time to quit.

* * *

## Show Commit Details (`git show <commit>`)

See all the details and changes for a specific commit:

```javascript
git show 09f4acd
commit 09f4acd3f8836b7f6fc44ad9e012f82faf861803 (HEAD -> master)
Author: w3schools-test 
Date:   Fri Mar 26 09:35:54 2021 +0100

    Updated index.html with a new line

diff --git a/index.html b/index.html
index 1234567..89abcde 100644
--- a/index.html
+++ b/index.html
@@ ...
+New Title
```

This command shows everything about a commit: who made it, when, the message, and the exact changes.

* * *

* * *

## Compare Changes (`git diff`)

See what is different between your working directory and the last commit (unstaged changes):

```javascript
git diff
diff --git a/index.html b/index.html
index 1234567..89abcde 100644
--- a/index.html
+++ b/index.html
@@ ...
-Old Title
+New Title
```

This command shows changes you have made but not yet staged for commit.

* * *

## Compare Staged Changes (`git diff --staged`)

See what is different between your staged files and the last commit:

```javascript
git diff --staged
diff --git a/index.html b/index.html
index 1234567..89abcde 100644
--- a/index.html
+++ b/index.html
@@ ...
-Old Title
+New Title
```

This command shows changes that are staged and ready to be committed.

* * *

## Compare Two Commits (`git diff <commit1> <commit2>`)

See what changed between any two commits:

```javascript
git diff 1234567 89abcde
diff --git a/index.html b/index.html
index 1234567..89abcde 100644
--- a/index.html
+++ b/index.html
@@ ...
-Old Title
+New Title
```

This command shows the differences between two specific commits.

* * *

## Show a Summary of Commits (`git log --oneline`)

Show a short summary of each commit (great for a quick overview):

```javascript
git log --oneline
09f4acd Updated index.html with a new line
8e7b2c1 Add about page
1a2b3c4 Initial commit
```

This command shows each commit on a single line for easy reading.

* * *

## Show Commits by Author (`git log --author="Alice"`)

See only the commits made by a specific author:

```javascript
git log --author="Alice"
commit 1a2b3c4d5e6f7g8h9i0j
Author: Alice 
Date:   Mon Mar 22 10:12:34 2021 +0100

    Add about page
```

This command filters the log to show only commits by the author you specify.

* * *

## Show Recent Commits (`git log --since="2 weeks ago"`)

See only commits made in the last two weeks:

```javascript
git log --since="2 weeks ago"
commit 09f4acd3f8836b7f6fc44ad9e012f82faf861803
Author: w3schools-test 
Date:   Fri Mar 26 09:35:54 2021 +0100

    Updated index.html with a new line
```

This command shows only the commits made in a recent time frame.

* * *

## Show Files Changed Per Commit (`git log --stat`)

See which files were changed in each commit and how many lines were added or removed:

```javascript
git log --stat
commit 09f4acd3f8836b7f6fc44ad9e012f82faf861803
Author: w3schools-test 
Date:   Fri Mar 26 09:35:54 2021 +0100

    Updated index.html with a new line

index.html | 2 +-
1 file changed, 1 insertion(+), 1 deletion(-)
```

This command adds a summary of file changes to each commit in the log.

* * *

## Show a Branch Graph (`git log --graph`)

See a simple ASCII graph of your branch history (great for visualizing merges):

```javascript
git log --graph --oneline
* 09f4acd Updated index.html with a new line
* 8e7b2c1 Add about page
|\
| * aabbccd Merge branch 'feature-x'
|/
```

This command shows a simple graph of your branch and merge history.

* * *

## Troubleshooting

*   **Can't see your changes?** Make sure you have committed your work. Uncommitted changes won't appear in the history.
*   **Log is too long?** Use `git log --oneline` or `git log --since` to make it easier to read.
*   **How do I quit the log view?** Press q to exit the log or diff view.

* * *

**Note:** Exploring your history helps you understand what changed, when, and why.

* * *

* * *