# Git .gitattributes

* * *

## What is `.gitattributes`?

The `.gitattributes` file is a special file that tells Git how to handle specific files in your repository.

It controls things like line endings, file types, merge behavior, custom diff tools, and more.

**Everyone on your team gets the same settings** because this file is versioned with your project.

_For more about Git LFS, see the [dedicated page](https://www.w3schools.com/git/git_lfs.asp)._

* * *

## When to Use `.gitattributes`

*   To enforce consistent line endings across different operating systems
*   To mark files as binary (so Git doesn't try to merge or change them)
*   To enable Git LFS for large files
*   To set up custom diff or merge tools for special file types
*   To control how files are exported in archives

* * *

## Create or Edit `.gitattributes`

1.  Go to the root of your repository (or a subfolder for local rules).
2.  Create or edit the `.gitattributes` file.
3.  Add rules, one per line, for how Git should treat files.

```javascript
*.txt text eol=lf
```

* * *

* * *

## Handle Line Endings

Standardize line endings to avoid merge conflicts and broken files across different OSes.

```javascript
*.sh text eol=lf
```

* * *

## Mark Files as Binary

Tell Git which files are binary (not text).

This prevents Git from trying to merge or change line endings for these files.

```javascript
*.png binary
```

* * *

## Enable LFS for File Types

Use Git LFS for large files like images or datasets.

This tells Git to use LFS for these files:

```javascript
*.psd filter=lfs diff=lfs merge=lfs -text
```

* * *

## Custom Diff Settings

Tell Git to use a special tool to compare certain file types (like Markdown or Jupyter notebooks):

```javascript
*.md diff=markdown
```

* * *

## Check Attributes

See what attributes are set for a file:

```javascript
git check-attr --all README.md
```

* * *

## Advanced Usage

*   **Merge Strategies:** Set custom merge drivers for tricky files (like lock files or notebooks).
*   **Export-ignore:** Exclude files from tar/zip archives created by `git archive`:

```javascript
docs/* export-ignore
```

* * *

## Tips & Best Practices

*   Patterns work like `.gitignore` (wildcards, etc).
*   Put `.gitattributes` in subfolders for rules that only apply there.
*   Changing `.gitattributes` won't retroactively fix files already committed-re-add files to update them.
*   Use `git check-attr` to debug attribute issues.

* * *

**Note:** `.gitattributes` is versioned with your project, so everyone on your team gets the same settings.

* * *

* * *