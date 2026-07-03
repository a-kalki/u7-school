# Git LFS

* * *

## What is Git LFS?

**Git LFS (Large File Storage)** is an extension for Git that helps you manage large files (like videos, images, or datasets) efficiently.

Instead of storing big files directly in your repository, LFS stores a small pointer file in your repo and keeps the real content on a separate LFS server.

This keeps your repository fast and small, even if you work with huge files.

Everyone who clones the repo gets the pointer, and Git LFS fetches the real file content as needed.

_For more about `.gitattributes`, see the [dedicated page](https://www.w3schools.com/git/git_gitattributes.asp)._

* * *

## When to Use Git LFS

*   When you need to version large files (media, datasets, binaries)
*   When your project exceeds the file size limits of standard Git hosting
*   When you want to keep your repository size manageable and fast

* * *

## Install Git LFS

*   Download and install Git LFS from [git-lfs.github.com](https://git-lfs.github.com/).
*   Initialize LFS in your repository:

```javascript
git lfs install
```

* * *

* * *

## Track Files with LFS

*   Tell Git LFS which files to manage by "tracking" them. For example, to track all Photoshop files:

```javascript
git lfs track "*.psd"
```

You can track any file type. Here are more examples:

```javascript
git lfs track "*.zip"
git lfs track "data/*.csv"
git lfs track "images/*.{png,jpg}"
```

* * *

## How LFS Works (.gitattributes & Pointers)

When you track a file type with LFS, Git adds a rule to the `.gitattributes` file. This tells Git to use LFS for those files.

```javascript
*.psd filter=lfs diff=lfs merge=lfs -text
```

When you add and commit a tracked file, Git stores a small "pointer" file in your repo. The real content is uploaded to the LFS server.

If you clone or pull a repo with LFS files, Git will download the real content from the LFS server (if you have LFS installed).

* * *

## Add, Commit, and Push LFS Files

*   Add files as usual: `git add largefile.psd`
*   Commit: `git commit -m "Add large file"`
*   Push: `git push origin main`

The actual file data is stored on the LFS server, while your repo contains a pointer file.

* * *

## Check LFS Status

See which files are managed by LFS in your repo:

```javascript
git lfs ls-files
```

* * *

## Untrack/Remove Files from LFS

*   Edit `.gitattributes` and remove or change the relevant line.
*   Run the untrack command:

```javascript
git lfs untrack "*.psd"
git add .gitattributes
```

Commit the change. The file will no longer be managed by LFS (but existing versions are still stored in LFS).

* * *

## Tips & Best Practices

*   Use LFS only for files that are too large or change too often for regular Git.
*   Check if your hosting provider supports LFS before using it (especially for private repos).
*   Monitor your LFS storage quota. Free plans are often limited.

* * *

## Troubleshooting

*   If you clone a repo and see pointer files instead of real content, make sure Git LFS is installed and run `git lfs pull`.
*   If you push to a remote that doesn't support LFS, you'll get an error.
*   Some files may not upload if you exceed your LFS quota.

* * *

## Warnings

*   Not all hosting providers support LFS. Check before using it.
*   LFS storage is often limited on free plans.

* * *

* * *