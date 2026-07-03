# Git Getting Started

* * *

## Get Started with Git

Now that Git is installed, and it knows who you are, you can start using Git.

Lets create our first repository

## Key Steps to Get Started

*   Create a project folder
*   Navigate to the folder
*   Initialize a Git repository

* * *

## Creating Git Folder

Start by creating a new folder for our project:

```javascript
mkdir myproject
cd myproject
```

`mkdir` creates a new directory.

`cd` changes our working directory.

Now we are in the correct directory and can initialize Git!

**Note:** Open Git Bash Here (Windows)

If you're using Windows, you can open Git Bash directly in your project folder:

*   Right-click the folder in File Explorer
*   Select **Git Bash Here**

This opens a terminal window in the correct location.

* * *

* * *

## Initialize Git

Now that we are in the correct folder, we can initialize Git on that folder:

```javascript
git init 
Initialized empty Git repository in /Users/user/myproject/.git/
```

You just created your first Git Repository!

* * *

## What is a Repository?

A Git **repository** is a folder that Git tracks for changes.

The repository stores all your project's history and versions.

* * *

## What Happens When You Run `git init`?

Git creates a hidden folder called `.git` inside your project.

This is where Git stores all the information it needs to track your files and history.

```javascript
ls -a
.  ..  .git
```

* * *

## Troubleshooting

*   **git: command not found**  
    _Solution:_ Make sure Git is installed and added to your PATH. Restart your terminal if needed.
*   **Permission denied**  
    _Solution:_ Try running your terminal as administrator (Windows) or use `sudo` (macOS/Linux) if needed.

* * *

* * *