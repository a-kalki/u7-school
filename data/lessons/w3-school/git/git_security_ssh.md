# Git Security SSH

* * *

## What is SSH?

**SSH** (Secure Shell) is a way to connect securely to remote computers and services, like Git repositories.

SSH uses a pair of keys (public and private) to make sure only you can access your code.

## Summary of SSH Concepts and Commands

*   **SSH key pair** - A public and private key for secure access
*   `ssh-keygen` - Generate a new SSH key pair
*   `ssh-add` - Add your private key to the SSH agent
*   `ssh -T git@github.com` - Test SSH connection
*   `ssh-add -l` - List loaded SSH keys
*   `ssh-add -d` - Remove a key from agent

* * *

## How SSH Keys Work

SSH keys come in pairs: a **public key** (like a lock) and a **private key** (like your own key).

You share the public key with the server (like GitHub or Bitbucket), but keep the private key safe on your computer.

Only someone with the private key can access what's locked by the public key.

* * *

## First-Time SSH Key Setup

If you've never used SSH keys before, follow this step to enable the SSH agent on your operating system:

```javascript
eval $(ssh-agent -s)
```

* * *

## Generating an SSH Key Pair

To create a new SSH key pair, use this command in the terminal (Linux, macOS, or Git Bash for Windows):

```javascript
ssh-keygen -t rsa -b 4096 -C "your@email.com"
```

Follow the prompts to choose a file location (press Enter to use the default) and set a passphrase (optional, but recommended for extra security).

* * *

## Adding Your Key to the SSH Agent

After creating your key, add it to the SSH agent so Git can use it:

```javascript
ssh-add ~/.ssh/id_rsa
```

* * *

* * *

## Copying Your Public Key

To use SSH with Git hosting services, you need to copy your public key and add it to your account settings on GitHub, GitLab, or Bitbucket.

*   On macOS: `pbcopy < ~/.ssh/id_rsa.pub`
*   On Windows (Git Bash): `clip < ~/.ssh/id_rsa.pub`
*   On Linux: `cat ~/.ssh/id_rsa.pub` (then copy manually)

* * *

## Listing and Removing SSH Keys

See which keys are loaded in your SSH agent:

```javascript
ssh-add -l
```

To remove a key from the agent:

```javascript
ssh-add -d ~/.ssh/id_rsa
```

* * *

## Troubleshooting SSH

*   If you get "Permission denied", make sure your public key is added to your Git host and your private key is loaded in the agent.
*   Check file permissions: private keys should be readable only by you (`chmod 600 ~/.ssh/id_rsa`).
*   Use `ssh -v` for verbose output to debug problems.
*   Make sure you're using the correct SSH URL for your remote (starts with `git@`).

**Tip:** Never share your private key with anyone. Use a passphrase for extra security.

If your private key is ever exposed, generate a new key pair and update your Git host immediately.

* * *

* * *