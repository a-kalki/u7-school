# Git Ignore and .gitignore

* * *

## What is .gitignore?

The `.gitignore` file tells Git which files and folders to ignore (not track).

This is useful for keeping log files, temporary files, build artifacts, or personal files out of your repository.

*   Examples of files to ignore: log files, temporary files, hidden files, personal files, OS/editor files, etc.

The `.gitignore` file itself **is** tracked by Git, so everyone using the repository ignores the same files.

* * *

## When to Use .gitignore

*   When you want to keep sensitive, local, or unnecessary files out of your repository
*   When sharing a project with others and want to avoid cluttering Git history
*   When working with build tools or editors that create extra files

* * *

## Create a .gitignore File

1.  Go to the root of your local Git repository.
2.  Create a file named `.gitignore`:

```javascript
touch .gitignore
```

* * *

## Ignoring Folders

To ignore a folder and everything inside it, use a trailing slash:

```javascript
temp/
```

This ignores any folder named `temp` anywhere in your project.

* * *

* * *

## Wildcards & Patterns

Wildcards let you match many files or folders at once:

*   `*` matches any number of characters
*   `?` matches a single character
*   `[abc]` matches any character in the set
*   `[!abc]` matches any character **not** in the set

```javascript
*.tmp      # all .tmp files
my?ile.txt # matches my1ile.txt, myAile.txt, etc.
log[0-9].txt # log1.txt, log2.txt, ... log9.txt
```

* * *

## Negation (!)

Use `!` to **not** ignore something that would otherwise be ignored. This is called an exception:

```javascript
*.log
!important.log
```

This ignores all `.log` files except `important.log`.

* * *

## Comments and Blank Lines

Lines starting with `#` are comments and are ignored by Git. Blank lines are also ignored. Use comments to explain your rules:

```javascript
# Ignore log files
*.log

# Ignore temp folders
temp/
```

* * *

## Local & Personal Ignore Rules

If you want to ignore files only for yourself (not for everyone who uses the repository), add them to `.git/info/exclude`. This works just like `.gitignore` but is not shared.

* * *

## Global .gitignore (User Level)

You can set up a global `.gitignore` file for all your projects. This is great for ignoring OS or editor files everywhere (like `.DS_Store` or `Thumbs.db`):

```javascript
git config --global core.excludesfile ~/.gitignore_global
```

Then add your patterns to `~/.gitignore_global`.

* * *

## How to Stop Tracking a File

If you add a file to `.gitignore` but Git is still tracking it, you need to tell Git to stop:

```javascript
git rm --cached filename.txt
```

This removes the file from the repository but keeps it on your computer. Next time you commit, Git will ignore it.

* * *

## Tips & Troubleshooting

*   Check for typos-`.gitignore` is case-sensitive!
*   If a file is already tracked, use `git rm --cached` to stop tracking it.
*   Use comments (`#`) to explain tricky rules for your teammates.
*   Use `git status` to see if your ignored files are being tracked.
*   Remember: `.gitignore` only affects files that are **not** already tracked by Git.

* * *

## Pattern Syntax

Here are some common patterns and how they match:

Pattern

Explanation/Matches

Examples

 

Blank lines are ignored

 

\# _text comment_

Lines starting with # are ignored

 

_name_

All _name_ files, _name_ folders, and files and folders in any _name_ folder

/name.log  
/name/file.txt  
/lib/name.log

_name_/

Ending with / specifies the pattern is for a folder. Matches all files and folders in any _name_ folder

/name/file.txt  
/name/log/name.log  
  
**no match:**  
/name.log

_name_._file_

All files with the _name.file_

/name.file  
/lib/name.file

_/name_._file_

Starting with / specifies the pattern matches only files in the root folder

/name.file  
  
**no match:**  
/lib/name.file

_lib/name_._file_

Patterns specifiing files in specific folders are always realative to root (even if you do not start with / )

/lib/name.file  
  
**no match:**  
name.file  
/test/lib/name.file

\*\*_/lib/name.file_

Starting with \*\* before / specifies that it matches any folder in the repository. Not just on root.

/lib/name.file  
/test/lib/name.file

\*\*_/name_

All _name_ folders, and files and folders in any _name_ folder

/name/log.file  
/lib/name/log.file  
/name/lib/log.file

/lib/\*\*_/name_

All _name_ folders, and files and folders in any _name_ folder within the lib folder.

/lib/name/log.file  
/lib/test/name/log.file  
/lib/test/ver1/name/log.file  
  
**no match:**  
/name/log.file

\*._file_

All files withe _.file_ extention

/name.file  
/lib/name.file

\*_name_/

All folders ending with _name_

/lastname/log.file  
/firstname/log.file

_name_?._file_

? matches a **single** non-specific character

/names.file  
/name1.file  
  
**no match:**  
/names1.file

_name_\[a-z\]._file_

\[_range_\] matches a **single** character in the specified range (in this case a character in the range of a-z, and also be numberic.)

/names.file  
/nameb.file  
  
**no match:**  
/name1.file

_name_\[abc\]._file_

\[_set_\] matches a **single** character in the specified set of characters (in this case either a, b, or c)

/namea.file  
/nameb.file  
  
**no match:**  
/names.file

_name_\[!abc\]._file_

\[!_set_\] matches a **single** character, **except** the ones spesified in the set of characters (in this case a, b, or c)

/names.file  
/namex.file  
  
**no match:**  
/namesb.file

\*._file_

All files withe _.file_ extention

/name.file  
/lib/name.file

_name_/  
!_name_/secret.log

! specifies a negation or exception. Matches all files and folders in any _name_ folder, except name/secret.log

/name/file.txt  
/name/log/name.log  
  
**no match:**  
/name/secret.log

\*._file  
_!_name_.file

! specifies a negation or exception. All files withe _.file_ extention, except name.file

/log.file  
/lastname.file  
  
**no match:**  
/name.file

\*._file  
_!_name_/\*_.file_  
junk.\*

Adding new patterns after a negation will re-ignore a previous negated file  
All files withe _.file_ extention, except the ones in _name_ folder. Unless the file name is junk

/log.file  
/name/log.file  
  
**no match:**  
/name/junk.file

* * *

* * *