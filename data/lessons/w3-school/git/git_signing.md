# Git Signing

* * *

## What is Commit Signing?

Signing a commit is like putting your personal signature on your work.

It proves that you really made the change, and helps others trust your code.

On platforms like GitHub or GitLab, signed commits often get a **Verified** badge.

* * *

## What is GPG?

GPG (GNU Privacy Guard) is a tool that lets you create a digital key, kind of like a secret password, to sign things.

Git uses GPG keys to sign commits and tags.

This helps prove your identity and ensures your code hasn't been tampered with.

* * *

## Why and When Should You Sign Commits?

*   To prove your commits really came from you
*   To help others trust your code (especially in open source projects)
*   Some companies or projects require signed commits for security
*   If you don't sign, your commits are still valid, just not verified

* * *

## How to Set Up Commit Signing

**Create a GPG key** (if you don't have one):

```javascript
gpg --full-generate-key
```

Follow the prompts to create your key.

**Find your key ID:**

```javascript
gpg --list-secret-keys --keyid-format=long
```

Look for a line like `sec rsa4096/1234ABCD5678EFGH`. The part after the slash is your key ID.

**Tell Git to use your key:**

```javascript
git config --global user.signingkey <your-key-id>
```

* * *

* * *

## How to Sign Commits and Tags

To sign a commit, use:

```shell
git commit -S -m "message"
```

To sign a tag, use:

```shell
git tag -s v1.0 -m "version 1.0"
```

* * *

## Sign All Commits Automatically

If you want Git to sign every commit by default, run:

```shell
git config --global commit.gpgSign true
```

* * *

## How to Check if a Commit is Signed

To check in Git, run:

```shell
git log --show-signature
```

On GitHub or GitLab, look for a **Verified** badge next to your commit or tag.

```javascript
commit 1234abcd5678efgh
gpg: Signature made ...
gpg: Good signature from "Your Name <you@email.com>"
Author: Your Name <you@email.com>
Date:   ...
```

* * *

## Troubleshooting Signed Commits

*   **GPG failed to sign the data:** Make sure your GPG agent is running and your key is loaded.
*   **Wrong key used:** Double-check the key ID you set in Git.
*   **Still stuck?** Try searching for the error message online or check your Git and GPG installation.

**Note:** Signed commits and tags help ensure your code hasn't been tampered with and confirm your identity as the author.

Some platforms may require additional setup to recognize your signature (for example, uploading your public key to GitHub or GitLab).

* * *

* * *