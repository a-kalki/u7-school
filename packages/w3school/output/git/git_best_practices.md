# Git Best Practices

* * *

## Summary of Git Best Practices

*   Commit Often
*   Write Clear Commit Messages
*   Use Branches
*   Pull Before You Push
*   Review Changes Before Committing
*   Keep Repositories Small
*   Use .gitignore
*   Tag Releases

* * *

## Commit Often

Make small, frequent commits to capture your progress.

This makes it easier to track changes and find bugs.

```javascript
git add .
git commit -m "Add user authentication logic"
```

* * *

## Write Clear Commit Messages

Use descriptive messages that explain _why_ a change was made, not just what changed.

Good commit messages help you and your team understand the history of the project.

*   **Be specific:** Say what and why, not just "Update" or "Fix".
*   **Use the imperative mood:** For example, "Add login validation" instead of "Added login validation".

```javascript
git commit -m "Fix bug in user login validation"
```

* * *

* * *

## Use Branches

Create branches for features, fixes, and experiments to keep your main branch stable.

This way, you can work on new ideas without affecting the main codebase.

*   **Why?** Branches let you test and develop independently, and make collaboration safer.
*   **Name branches clearly:** For example, `feature/login-form` or `bugfix/user-auth`.

```javascript
git checkout -b feature/login-form
```

* * *

## Pull Before You Push

Always `git pull` before pushing.

This updates your local branch with changes from others, helps you avoid conflicts, and ensures your push will succeed.

**Why?** If someone else has pushed changes since your last pull, your push may be rejected or cause conflicts.

Pulling first lets you fix any issues locally.

```javascript
git pull origin main
git push origin main
```

* * *

## Review Changes Before Committing

Use `git status` and `git diff` to review your changes before you commit.

This helps you catch mistakes early.

```javascript
git status
git diff
```

* * *

## Keep Repositories Small

Avoid adding large files or unnecessary dependencies.

This keeps your repository fast and easy to clone.

*   **Tip:** For large files (like videos or datasets), use [Git LFS](git_lfs.asp%3Fremote=github.html) (Large File Storage) instead of adding them directly to your repo.

* * *

## Use .gitignore

Exclude files that shouldn't be tracked (like build artifacts, log files, or secrets) by adding them to a `.gitignore` file.

**Note:** `.gitignore` only prevents new files from being tracked.

Files already tracked by Git will remain in the repository until you remove them with `git rm --cached <file>`.

```javascript
# .gitignore
node_modules/
*.log
.env
```

* * *

## Tag Releases

Use tags to mark release points (like `v1.0`) so you can easily find and reference important versions.

This helps you keep track of your project's history and make it easier to roll back to previous versions if needed.

```javascript
git tag v1.0
git push origin v1.0
```

* * *

**Note:** Good Git habits make it easier for your team (and your future self) to understand and build on your work.

* * *

* * *