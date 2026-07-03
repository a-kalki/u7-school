# Git GitHub Flow

* * *

## What is the GitHub Flow?

The GitHub Flow is a simple, effective workflow for collaborating on code using Git and GitHub.

It helps teams work together smoothly, experiment safely, and deliver new features or fixes quickly.

Here's how the GitHub Flow works, step by step:

*   **Create a Branch**: Start new work without affecting the main code.
*   **Make Commits**: Save progress as you make changes.
*   **Open a Pull Request**: Ask others to review your work.
*   **Review**: Discuss and improve the changes together.
*   **Deploy**: Test your changes before merging.
*   **Merge**: Add your finished work to the main branch.

This workflow is designed to be easy for beginners and powerful for teams of any size.

* * *

## Create a New Branch

Branching is the key concept in Git. And it works around the rule that the master branch is ALWAYS deployable.

That means, if you want to try something new or experiment, you create a new branch!

Branching gives you an environment where you can make changes without affecting the main branch.

When your new branch is ready, it can be reviewed, discussed, and merged with the main branch when ready.

When you make a new branch, you will (almost always) want to make it from the master branch.

**Note:** Keep in mind that you are working with others.

Using descriptive names for new branches, so everyone can understand what is happening.

* * *

## Make Changes and Add Commits

After the new branch is created, it is time to get to work.

Make changes by adding, editing and deleting files.

Whenever you reach a small milestone, add the changes to your branch by commit.

Adding commits keeps track of your work.

Each commit should have a message explaining what has changed and why.

Each commit becomes a part of the history of the branch, and a point you can revert back to if you need to.

**Note:** commit messages are very important! Let everyone know what has changed and why.

Messages and comments make it so much easier for yourself and other people to keep track of changes.

* * *

* * *

## Open a Pull Request

Pull requests are a key part of GitHub.

A Pull Request notifies people you have changes ready for them to consider or review.

You can ask others to review your changes or pull your contribution and merge it into their branch.

* * *

## Review

When a Pull Request is made, it can be reviewed by whoever has the proper access to the branch.

This is where good discussions and review of the changes happen.

Pull Requests are designed to allow people to work together easily and produce better results together!

If you receive feedback and continue to improve your changes, you can push your changes with new commits, making further reviews possible.

**Note:** GitHub shows new commit and feedback in the "unified Pull Request view".

* * *

## Deploy

When the pull request has been reviewed and everything looks good, it is time for the final testing.

GitHub allows you to deploy from a branch for final testing in production before merging with the master branch.

If any issues arise, you can undo the changes by deploying the master branch into production again!

**Note:** Teams often have dedicated testing environments used for deploying branches.

* * *

## Merge

After exhaustive testing, you can merge the code into the master branch!

Pull Requests keep records of changes to your code, and if you commented and named changes well, you can go back and understand why changes and decisions were made.

**Note:** You can add keywords to your pull request for easier searching!