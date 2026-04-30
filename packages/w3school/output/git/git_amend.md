# Git Amend

* * *

## What is Git Amend?

Git Amend is a command that allows you to modify the most recent commit.

You can use it to fix typos, add or remove files, or change the commit message.

* * *

## When to Use Git Amend

Use Git Amend when you need to make small changes to your last commit.

It's perfect for fixing mistakes, adding forgotten files, or updating the commit message.

* * *

## Fix Last Commit Message

To change the last commit message, follow these steps:

1.  Open your terminal and navigate to your repository.
2.  Type `git commit --amend -m "New message"` to change the commit message.
3.  Press Enter to save the changes.

```javascript
git commit --amend -m "Corrected commit message"
```

* * *

## Add Files to Last Commit

To add files to the last commit, follow these steps:

1.  Open your terminal and navigate to your repository.
2.  Type `git add <file>` to add the file to the staging area.
3.  Type `git commit --amend` to add the file to the last commit.
4.  Press Enter to save the changes.

```javascript
git add forgotten.txt
git commit --amend
```

* * *

* * *

## Remove Files from Last Commit

To remove files from the last commit, follow these steps:

1.  Open your terminal and navigate to your repository.
2.  Type `git reset HEAD^ -- <file>` to remove the file from the staging area.
3.  Type `git commit --amend` to remove the file from the last commit.
4.  Press Enter to save the changes.

```javascript
git reset HEAD^ -- unwanted.txt
git commit --amend
 1 file changed, 3 insertions(+), 1 deletion(-)
```

Now let's check the `log`:

```javascript
git log --oneline
07c5bc5 (HEAD -> master) Adding plines to reddme
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

Oh no! the `commit` message is full of spelling errors.

Embarrassing. Let's `amend` that:

```javascript
git commit --amend -m "Added lines to README.md"
[master eaa69ce] Added lines to README.md
 Date: Thu Apr 22 12:18:52 2021 +0200
 1 file changed, 3 insertions(+), 1 deletion(-))
```

And re-check the `log`:

```javascript
git log --oneline
eaa69ce (HEAD -> master) Added lines to README.md
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

We see the previous `commit` is replaced with our amended one!

**Warning:** Messing with the `commit` history of a repository can be dangerous.

It is usually ok to make these kinds of changes to your own local repository.

However, you should avoid making changes that rewrite history to `remote` repositories, especially if others are working with them.

* * *

## Git Amend Files

Adding files with `--amend` works the same way as above.

Just add them to the `staging environment` before committing.

* * *

* * *