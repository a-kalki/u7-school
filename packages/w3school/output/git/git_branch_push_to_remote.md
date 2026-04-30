# Git Push Branch to GitHub

* * *

## Push Branch to GitHub

This chapter explains how to push a branch from your local computer to GitHub.

* * *

## Push a Branch to GitHub

Let's create a new local branch, make a change, and push it to GitHub.

```javascript
git checkout -b update-readme
Switched to a new branch 'update-readme'
```

Edit a file, then check the status:

```javascript
git status
```

Add and commit your changes:

```javascript
git add README.md
git commit -m "Update readme for GitHub"
```

Push your branch to GitHub:

```javascript
git push origin update-readme
```

![GitHub New Branch](https://www.w3schools.com/git/img_git_push_branch_to_github.png)

* * *

* * *

## Push and Set Upstream

Use this if your branch doesn't exist on GitHub yet, and you want to track it:

```javascript
git push --set-upstream origin update-readme
```

* * *

## Force Push

**Warning:** This overwrites the branch on GitHub with your local changes. Only use if you understand the risks.

```javascript
git push --force origin update-readme
```

* * *

## Delete Remote Branch

Remove a branch from GitHub:

```javascript
git push origin --delete update-readme
```

* * *

## Push All Branches

Push all your local branches to GitHub:

```javascript
git push --all origin
```

* * *

## Push Tags

Push all your tags to GitHub:

```javascript
git push --tags
```

* * *

## Troubleshooting

*   **Rejected push (non-fast-forward):** Someone else pushed changes before you. Run `git pull --rebase` first, then try again.
*   **Authentication failed:** Make sure you are logged in and have permission to push to the repository.
*   **Remote branch not found:** Double-check the branch name and spelling.

* * *

* * *