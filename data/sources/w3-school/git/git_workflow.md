# Git Workflow

* * *

## Git Workflow Commands Overview

*   [Working Directory](git_workflow.asp%3Fremote=github.html#working-directory) - Where you make changes
*   [git add](git_workflow.asp%3Fremote=github.html#git-add) - Stage changes
*   [git commit](git_workflow.asp%3Fremote=github.html#git-commit) - Save changes to your repository
*   [git push](git_workflow.asp%3Fremote=github.html#git-push) - Share changes with others
*   [git status](git_workflow.asp%3Fremote=github.html#git-status) - Check what's going on
*   [Undo/Amend](git_workflow.asp%3Fremote=github.html#undo) - Fix mistakes (`git restore`, `git reset`, `git commit --amend`)

**See Also:** [GitHub Flow](https://www.w3schools.com/git/git_github_flow.asp) is a popular collaborative workflow for teams using GitHub.

If you work with GitLab or Bitbucket, those platforms have their own workflows too. [Learn more about GitHub Flow »](https://www.w3schools.com/git/git_github_flow.asp)

* * *

## Understanding the Git Workflow

Git uses a distributed workflow that allows you to work on your code, stage changes, and commit them to your local repository before sharing with others.

Understanding this workflow is essential for effective version control.

### The Three Areas of Git

*   **Working Directory**: Where you make changes to your files.
*   **Staging Area (Index)**: Where you prepare changes before committing.
*   **Repository**: Where your committed history is stored.

```javascript
[Working Directory] --git add--> [Staging Area] --git commit--> [Repository]
```

* * *

## Best Practices for Git Workflow

*   Commit frequently with clear, meaningful messages.
*   Check your status often with `git status` to avoid surprises.
*   Stage only what you intend to commit. Use `git add <file>` for precision.
*   Push regularly to back up your work and share with others.
*   Review your changes with `git diff` before committing.

* * *

* * *

## Working Directory

This is where you make changes to your files.

Think of it as your workspace or desk.

Files here can be new, modified, or deleted, but Git won't save these changes until you stage and commit them.

* * *

## Staging Changes (`git add`)

When you are happy with your changes, you "stage" them with `git add`.

This puts your changes in the Staging Area, like putting your finished letter in an envelope.

```javascript
git add index.html
```

To stage all changes (new, modified, and deleted files):

```javascript
git add .
```

* * *

## Committing Changes (`git commit`)

Committing saves your staged changes to your local repository.

It's like mailing your letter-you can't change it after it's sent!

```javascript
git commit -m "Describe your changes"
```

You can also use `git commit -a -m "message"` to stage and commit all modified and deleted files in one step (but not new files).

* * *

## Pushing Changes (`git push`)

After you commit, your changes are only in your local repository.

Use `git push` to send your commits to a remote repository (like GitHub or Bitbucket) so others can see them.

```javascript
git push
```

* * *

## Checking Status (`git status`)

Use `git status` to see which files are staged, unstaged, or untracked.

This helps you keep track of what you still need to add or commit.

```javascript
git status
```

* * *

## Undoing and Amending Changes

Made a mistake? Git lets you fix things before you push!

*   `git restore <file>` - Undo changes in your working directory (before staging).
*   `git restore --staged <file>` - Unstage a file (move it out of the Staging Area).
*   `git reset HEAD~` - Undo your last commit (keeps changes in your working directory).
*   `git commit --amend` - Change the last commit message or add files to your last commit.

```javascript
git restore --staged index.html
```

* * *

## Tips & Troubleshooting

*   Use `git status` often to see what's going on.
*   If you commit the wrong thing, use `git reset` or `git commit --amend` before pushing.
*   Stage only what you want to commit-use `git add <filename>` for specific files.
*   Don't forget to push after committing, or your changes won't show up for others.
*   If you're not sure, ask for help or look up the error message-everyone makes mistakes!

* * *

* * *