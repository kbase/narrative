# Git branching workflow for narrative

This document describes the git workflow that *all* developers of the narrative code must follow. It contains the workflow guidelines we've developed for contributing code and setting up product releases. For more information about releasing new versions of the Narrative Interface, see [here](deploy_narrative.md).

- Last modified: Sep. 22, 2020

***Table of Contents***

- [Branches and Tags](#branches-and-tags)
- [Contributing](#contributing)
  - [Pull Requests](#pull-requests)
- [Release Flows](#release-flows)
  - [Development Releases](#development-releases)
  - [Production Releases](#production-releases)
  - [Hotfix Releases](#hotfix-releases)

## Branches and Tags

There are 3 branches:

- `develop` – Development branch. New features are added off this branch.
- `staging` – Staging or "release candidate" branch. The branch deployed `narrative-dev`.
- `master` – Production branch. The branch deployed on `narrative-next` and `narrative`. This branch is used for hotfixes.

Tags on master are used for indicating releases (see "Production releases", below).

## Contributing

To contribute to this repository create a pull request for a new feature or issue.

### Pull Requests

#### _Internal Developers_

To begin working on a feature or story, make sure you've assigned yourself to the story/issue in JIRA and marked it as "In Progress". If there isn't an story/issue yet for what you want to work on, please create one.

Create a new branch off `develop` using the naming convention:

`{JIRA #}-{summary}`

For example: `DATAUP-63-data_panel_button`

When your branch is ready for review, open a PR into develop. Address any lint errors or failing tests. Request reviews from relevant team members. Respond to PR feedback promptly, and request re-review once all issues have been resolved.

More detailed directions for the feature branch workflow are located on [Github](https://guides.github.com/introduction/flow/)

#### _External 3rd Party Developers_

External developers do not have write access to the repository. To create a pull request, fork the repository and submit a pull request from the fork. Instructions for how to fork a repository are located on [GitHub](https://guides.github.com/activities/forking/).


#### _Passing Flake8 and Black_

In order to pass the build, flake8 and black must be run on the code. In order to avoid having to do so manually, use [git pre-commit](README.md#git-pre-commit-installation).
