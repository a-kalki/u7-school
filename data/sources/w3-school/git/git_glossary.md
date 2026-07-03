# Git Glossary

* * *

## Git Glossary

This glossary covers common Git terms and concepts. Use it as a handy reference while learning and working with Git.

## Summary of Git Terms

*   [Branch](git_glossary.asp%3Fremote=github.html#branch)
*   [Checkout](git_glossary.asp%3Fremote=github.html#checkout)
*   [Clone](git_glossary.asp%3Fremote=github.html#clone)
*   [Commit](git_glossary.asp%3Fremote=github.html#commit)
*   [Conflict](git_glossary.asp%3Fremote=github.html#conflict)
*   [Fetch](git_glossary.asp%3Fremote=github.html#fetch)
*   [Fork](git_glossary.asp%3Fremote=github.html#fork)
*   [HEAD](git_glossary.asp%3Fremote=github.html#head)
*   [Index (Staging Area)](git_glossary.asp%3Fremote=github.html#index)
*   [Merge](git_glossary.asp%3Fremote=github.html#merge)
*   [Origin](git_glossary.asp%3Fremote=github.html#origin)
*   [Pull](git_glossary.asp%3Fremote=github.html#pull)
*   [Push](git_glossary.asp%3Fremote=github.html#push)
*   [Rebase](git_glossary.asp%3Fremote=github.html#rebase)
*   [Remote](git_glossary.asp%3Fremote=github.html#remote)
*   [Repository (Repo)](git_glossary.asp%3Fremote=github.html#repository)
*   [Stash](git_glossary.asp%3Fremote=github.html#stash)
*   [Tag](git_glossary.asp%3Fremote=github.html#tag)
*   [Upstream](git_glossary.asp%3Fremote=github.html#upstream)
*   [Working Directory](git_glossary.asp%3Fremote=github.html#working-directory)

* * *

## Branch

A branch is a parallel version of your repository. Used to develop features independently.

[Learn more on our Git Branch page](https://www.w3schools.com/git/git_branch.asp)

```javascript
git branch feature/login
```

* * *

## Checkout

Switch to a different branch or commit.

[Learn more on our Git Checkout page](https://www.w3schools.com/git/git_branch.asp)

```javascript
git checkout main
```

* * *

* * *

## Clone

Create a local copy of a remote repository.

[Learn more on our Git Clone page](https://www.w3schools.com/git/git_clone.asp)

```javascript
git clone https://github.com/user/repo.git
```

* * *

## Commit

A snapshot of your changes in the repository.

[Learn more on our Git Commit page](https://www.w3schools.com/git/git_commit.asp)

```javascript
git commit -m "Add login feature"
```

* * *

## Conflict

When Git can't automatically merge changes from different commits or branches. You must resolve the differences manually.

[Learn more on our Git Branch Merge page](https://www.w3schools.com/git/git_branch_merge.asp)

```javascript
# Example: Merge conflict message
# CONFLICT (content): Merge conflict in file.txt
```

* * *

## Fetch

Download changes from a remote repository without merging.

[Learn more on our Git Pull from Remote page](https://www.w3schools.com/git/git_pull_from_remote.asp)

```javascript
git fetch origin
```

* * *

## Fork

A personal copy of someone else's repository, usually on a platform like GitHub.

[Learn more on our Git Remote Fork page](https://www.w3schools.com/git/git_remote_fork.asp)

```javascript
# Use the GitHub interface to fork a repo
```

* * *

## Index (Staging Area)

The Index (also called the Staging Area) is where changes are prepared before committing.

[Learn more on our Git Staging Area page](https://www.w3schools.com/git/git_staging_area.asp)

```javascript
git add file.txt
```

* * *

## Merge

Combine changes from different branches.

[Learn more on our Git Merge page](https://www.w3schools.com/git/git_merge.asp)

```javascript
git merge feature/login
```

* * *

## Origin

The default name for your main remote repository. You can rename or have multiple remotes if needed.

[Learn more on our Git Remote page](https://www.w3schools.com/git/git_set_remote.asp)

```javascript
git remote add origin https://github.com/user/repo.git
```

* * *

## Pull

Fetch and merge changes from a remote repository.

[Learn more on our Git Pull from Remote page](https://www.w3schools.com/git/git_pull_from_remote.asp)

```javascript
git pull origin main
```

* * *

## Push

Upload your commits to a remote repository.

[Learn more on our Git Push to Remote page](https://www.w3schools.com/git/git_push_to_remote.asp)

```javascript
git push origin main
```

* * *

## Rebase

Move or combine a sequence of commits to a new base commit.

[Learn more on our Git Rebase page](https://www.w3schools.com/git/git_rebase.asp)

```javascript
git rebase main
```

* * *

## Remote

A version of your repository hosted on the internet or network.

[Learn more on our Git Set Remote page](https://www.w3schools.com/git/git_set_remote.asp)

```javascript
git remote -v
```

* * *

## Repository (Repo)

The database where your project's history is stored.

[Learn more on our Git Get Started page](https://www.w3schools.com/git/git_getstarted.asp)

```javascript
git init
```

* * *

## Stash

Temporarily save changes that aren't ready to commit.

[Learn more on our Git Stash page](https://www.w3schools.com/git/git_stash.asp)

```javascript
git stash
```

* * *

## Tag

Mark a specific commit as important, usually for releases.

[Learn more on our Git Tag page](https://www.w3schools.com/git/git_tagging.asp)

```javascript
git tag v1.0
```

* * *

**Note:** Refer to this glossary whenever you encounter an unfamiliar Git term!

* * *

## HEAD

HEAD is a reference to the current commit your working directory is based on. Usually points to the latest commit on your current branch.

```javascript
git log --oneline
# The top entry is HEAD
```

* * *

## Upstream

An "upstream" branch is the default branch that your branch tracks and pulls from, usually on a remote repository.

```javascript
git push --set-upstream origin main
```

* * *