# Git CI/CD

* * *

## What is CI/CD?

**CI/CD** stands for **Continuous Integration** and **Continuous Deployment/Delivery**.

It means your code is automatically tested and deployed every time you push.

This helps you catch bugs early and deliver features faster, with less manual work.

* * *

## Why Use CI/CD?

CI/CD automates the process of testing and deploying your code. This means:

*   Find bugs before they reach users
*   Deploy changes faster and more safely
*   Reduce manual steps and mistakes
*   Get quick feedback on every push

* * *

## How Does CI/CD Work with Git?

Every time you push code to your Git repository:

*   The CI/CD service (like GitHub Actions or GitLab CI) detects the change
*   It runs tests, builds your project, and can deploy automatically
*   If something fails, you get notified right away

```javascript
[Developer] --push--> [Git Repository] --triggers--> [CI/CD Pipeline: Test, Build, Deploy]
```

* * *

## Popular CI/CD Services

*   **GitHub Actions:** Built into GitHub, uses YAML files in `.github/workflows/`
*   **GitLab CI/CD:** Built into GitLab, uses `.gitlab-ci.yml`
*   **CircleCI:** Works with GitHub/GitLab, easy setup for many languages
*   **Travis CI:** Popular for open-source, uses `.travis.yml`
*   **Azure Pipelines:** Works with Azure DevOps and GitHub, supports many platforms

* * *

## Key CI/CD Concepts

Here are some important terms:

*   **Workflow:** A series of jobs that run together
*   **Job:** A group of steps that run together
*   **Step:** A single task, like checking out code or running tests
*   **Runner:** The computer/server that runs your jobs
*   **Trigger:** Decides when your workflow runs
*   **Environment Variables:** Settings for your workflow
*   **Secrets:** Passwords or API keys

* * *

## Jobs

A **job** is a group of steps that run together. Each job runs on a runner (a server).

```javascript
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # steps go here
```

* * *

* * *

## Steps

Each **step** is a single task, like checking out code or running tests.

```javascript
steps:
  - uses: actions/checkout@v3
  - name: Run tests
    run: npm test
```

* * *

## Runners

A **runner** is the computer/server that runs your jobs.

You can use the service's runners or set up your own for more control.

```javascript
runs-on: ubuntu-latest
```

* * *

## Triggers

A **trigger** decides when your workflow runs.

Common triggers are `push` (every push) and `pull_request` (when a pull request is opened or updated).

```javascript
on:
  push:
  pull_request:
```

* * *

## Environment Variables & Secrets

Use **environment variables** for settings, and **secrets** for passwords or API keys.

Never hardcode secrets in your code!

```javascript
env:
  NODE_ENV: production
  API_KEY: ${{ secrets.API_KEY }}
```

* * *

## Build Logs

CI/CD tools show logs for every job and step. Check logs to see what happened or to debug failures.

In GitHub Actions, click on a workflow run and see logs for each job/step.

* * *

## Skipping CI

You can skip CI/CD for a commit by adding `[skip ci]` to your commit message.

This is useful for documentation or minor changes.

```javascript
git commit -m "Update docs [skip ci]"
```

* * *

## Badges

Add a badge to your README to show CI/CD status.

This lets others see if your latest build passed.

```javascript
![CI](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)
```

* * *

## Example: GitHub Actions Workflow File (Explained)

```javascript
# .github/workflows/ci.yml
# This file tells GitHub Actions how to run CI for your project

name: CI                 # The name of the workflow (shows up in GitHub)
on: [push]               # Trigger: run this workflow on every push
jobs:
  build:                 # Job name (can be anything)
    runs-on: ubuntu-latest   # Runner: use the latest Ubuntu server
    steps:
      - uses: actions/checkout@v3  # Step: check out your code from the repo
      - name: Run tests            # Step: give this step a name
        run: npm test              # Step: run your project's tests
```

*   **name:** Sets the workflow's display name in GitHub.
*   **on:** Decides when the workflow runs (here: every push).
*   **jobs:** Groups together steps that run on a runner.
*   **build:** The name of this job (can be anything).
*   **runs-on:** Picks the type of server (here: Ubuntu Linux).
*   **steps:** Each step does one thing, like checking out code or running tests.
*   **uses:** Uses a pre-made GitHub Action (here: checks out your code).
*   **name:** (under steps) Gives a step a label.
*   **run:** Runs a shell command (here: `npm test` to run tests).

* * *

## Troubleshooting & Best Practices

*   If a build fails, check the logs for error messages.
*   Make sure your secrets and environment variables are set correctly.
*   You can rerun failed jobs from the CI/CD dashboard.
*   Check the documentation for your CI/CD service for more help.
*   Start small: automate tests first, then add deployment when ready.
*   Keep secrets out of your code and never commit API keys.
*   Use badges to show your build status in the README.

**Note:** CI/CD helps catch bugs early and speeds up delivery. Even small projects can benefit from automation!

* * *

* * *