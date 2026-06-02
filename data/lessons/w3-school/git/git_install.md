# Git Install

* * *

## How to Install Git

You can download Git for free from [git-scm.com](https://git-scm.com/).

*   **Windows:** Download and run the installer.  
    Click "Next" to accept the recommended settings.  
    This will install Git and Git Bash.
*   **macOS:** If you use Homebrew, open Terminal and type `brew install git`.  
    Or, download the .dmg file and drag Git to your Applications folder.
*   **Linux:** Open your terminal and use your package manager.  
    For example, on Ubuntu: `sudo apt-get install git`

After installation, you will be able to use Git from your terminal or command prompt.

**Tip for Beginners:** Installing Git is safe and you can always uninstall it later if you want.

* * *

## Git Bash

Git Bash is a terminal for Windows that lets you use Git commands.

Look at our [Bash Tutorial](https://www.w3schools.com/bash/index.php) to learn more about Bash.

After installing Git, you can find Git Bash in your Start menu.

You can use Git Bash just like the Command Prompt, but with extra Unix commands (like `ls` and `pwd`).

### Example: Open Git Bash

![Git Bash](img_git_bash.png)

Click Start, type "Git Bash", and open the app.

```javascript
ls
Desktop  Documents  Downloads  Pictures
```

* * *

* * *

## Verifying Your Installation

After installing, check that Git works by opening your terminal (or Git Bash on Windows) and running:

```javascript
git --version
git version 2.43.0.windows.1
```

If Git is installed, you will see something like `git version X.Y.Z`

If you see an error, try closing and reopening your terminal, or check that Git is in your PATH.

* * *

## Default Editor

During installation, Git asks you to pick a default text editor.

This is the program that will open when you need to write messages (like for commits).

```javascript
git config --global core.editor "code --wait"
```

If you're not sure, just pick the default (Notepad on Windows). You can always change this later.

```javascript
git config --global core.editor "notepad"
```

* * *

## PATH Environment

Choosing to add Git to your PATH means you can use Git commands in any terminal window.

This is highly recommended for most users to do this during installation.

If you skip this, you'll only be able to use Git in Git Bash (on Windows) or Terminal (on macOS and Linux).

```javascript
git --version
git version 2.43.0.windows.1
```

If you see an error, you need to add Git to your PATH.

* * *

## How to Add Git to PATH after Installation

*   **Windows:**  
    1.  If you missed the option during installation, search for "Environment Variables" in the Start menu and open it.
    2.  Click "Environment Variables..." and find the "Path" variable under "System variables".
    3.  Click "Edit", then "New", and add the path to your Git `bin` and `cmd` folders  
        (e.g., `C:\Program Files\Git\bin` and `C:\Program Files\Git\cmd`).
    4.  Click OK to save. Restart your terminal.
*   **macOS:**  
    1.  If you installed with Homebrew, your PATH is usually set automatically.
    2.  If not, open Terminal and add this line to your `~/.zshrc` or `~/.bash_profile`:
    3.  ```shell
        export PATH="/usr/local/bin:$PATH"
        ```
        
    4.  Save the file and run `source ~/.zshrc` or `source ~/.bash_profile`.
*   **Linux:**  
    1.  Most package managers add Git to PATH automatically.
    2.  If not, add this line to your `~/.bashrc` or `~/.profile`:
    3.  ```shell
        export PATH="/usr/bin:$PATH"
        ```
        
    4.  Save the file and run `source ~/.bashrc` or `source ~/.profile`.

After adding Git to your PATH, open a new terminal window and run `git --version` to check that it works everywhere.

* * *

## Line Endings

Git can convert line endings in text files.

On Windows, it's usually best to select "Checkout Windows-style, commit Unix-style line endings".

This helps prevent problems when you share code with people using different operating systems.

* * *

## Updating or Uninstalling Git

*   **Update:** Download and run the latest installer, or use your package manager  
    (e.g., `brew upgrade git` or `sudo apt-get upgrade git`).  
    It's a good idea to keep Git up to date for the latest features and security fixes.
*   **Uninstall:** Use "Add or Remove Programs" on Windows, or your package manager on Mac/Linux.

* * *

## Troubleshooting Git Installation

If you run into problems installing or running Git, don't worry!

Here are solutions to some of the most common issues.

**Tip:** If something doesn't work right away, try closing and reopening your terminal, or restarting your computer.

### Common Installation Issues

*   **"git is not recognized as an internal or external command"**  
    _Solution:_ Git is not in your system's PATH. Make sure you installed Git and restart your terminal.  
    If needed, add Git's `bin` folder (usually `C:\Program Files\Git\bin`) to your PATH.  
    If it still doesn't work, try restarting your computer.
*   **Permission errors ("Permission denied")**  
    _Solution:_ On Windows, run Git Bash or your terminal as administrator.  
    On macOS/Linux, use `sudo` if necessary.
*   **SSL or HTTPS errors when cloning/pushing**  
    _Solution:_ Check your internet connection.  
    Make sure your Git version is up to date.
*   **Wrong version of Git**  
    _Solution:_ Check your installed version with `git --version`.  
    Download the latest version from [git-scm.com](https://git-scm.com/) if needed.

* * *

* * *