# Git New Files

* * *

## What is a New File?

A **new file** is a file that you have created or copied into your project folder, but haven't told Git to watch.

Here are the key things to know:

*   Create a new file (with a text editor)
*   `ls` - List files in the folder
*   `git status` - Check which files are tracked
*   Understand **untracked** and **tracked** files

* * *

## Create a New File

Your new Git repository is empty.

Let's add a file using your favorite text editor, and save it in your project folder.

If you need help creating a file, see our [HTML Editors](https://www.w3schools.com/html/html_editors.asp) page.

For this example, we'll use a simple HTML file:

```javascript
<!DOCTYPE html><html><head><title>Hello World!</title></head><body><h1>Hello world!</h1><p>This is the first file in my new Git Repo.</p></body></html>
```

Save this as `index.html` in your project folder.

* * *

* * *

## List Files in the Directory

To see which files are in your project folder, use the `ls` command:

```javascript
ls
index.html
```

`ls` lists all files in the current folder.

You should see `index.html` in the output.

* * *

## Check File Status with `git status`

Now check if Git is tracking your new file:

```javascript
git status
On branch master

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
    index.html

nothing added to commit but untracked files present (use "git add" to track)
```

Git sees `index.html`, but it is **untracked** (not yet added to the repository).

* * *

## What is an Untracked File?

An **untracked file** is any file in your project folder that Git is not yet tracking.

These are files you've created or copied into the folder, but haven't told Git to watch.

* * *

## What is a Tracked File?

A **tracked file** is a file that Git is watching for changes.

To make a file tracked, you need to add it to the staging area (covered in the next chapter).

* * *

## Troubleshooting

*   **File not showing up with** `ls`: Make sure you saved it in the correct folder.  
    Use `pwd` to check your current directory.
*   **File not listed in** `git status`: Make sure you are in the correct folder and that you saved the file.

* * *

* * *