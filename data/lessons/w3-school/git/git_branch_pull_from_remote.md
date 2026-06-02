# Git Pull Branch from GitHub

* * *

## Pulling a Branch from GitHub

Now continue working on our new `branch` in our local Git.

Lets `pull` from our GitHub repository again so that our code is up-to-date:

```javascript
git pull
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 2), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (3/3), 851 bytes | 9.00 KiB/s, done.
From https://github.com/w3schools-test/hello-world
 * [new branch]      html-skeleton -> origin/html-skeleton
Already up to date.
```

Now our main `branch` is up todate. And we can see that there is a new `branch` available on GitHub.

Do a quick `status` check:

```javascript
git status
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean
```

And confirm which branches we have, and where we are working at the moment:

```javascript
git branch
* master
```

So, we do not have the new `branch` on our local Git. But we know it is available on GitHub. So we can use the `-a` option to see all local and remote branches:

```javascript
git branch -a
* master
  remotes/origin/html-skeleton
  remotes/origin/master
```

**Note:** `branch -r` is for remote branches only.

We see that the branch `html-skeleton` is available remotely, but not on our local git. Lets check it out:

```javascript
git checkout html-skeleton
Switched to a new branch 'html-skeleton'
Branch 'html-skeleton' set up to track remote branch 'html-skeleton' from 'origin'.
```

And check if it is all up to date:

```javascript
git pull
Already up to date.
```

Which branches do we have now, and where are we working from?

```javascript
git branch
* html-skeleton
  master
```

Now, open your favourite editor and confirm that the changes from the GitHub branch carried over.

That is how you pull a GitHub branch to your local Git.

* * *

* * *

* * *