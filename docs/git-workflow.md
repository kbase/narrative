# Git branching workflow for narrative

This document describes the git workflow that *all* developers of the narrative code must follow. It also describes the release procedure, which only an unlucky few should have to worry about.

- Last modified: Aug. 31, 2020

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

## Release Flows

There are three main workflows: development, production releases, and hotfixes.

### Development Releases

Development "releases" to narrative-dev are done as follows:

- Merge `develop` into `staging`

        git pull origin develop staging
        git checkout staging; git merge develop

- Deploy new `staging` on narrative-dev

Because features should only be merged into develop after testing, and changes should not, in this mode, be made directly on `staging`, this can eventually be automated (e.g., run once per hour out of cron).

Bumping the version number can be done by providing it as an argument to the biokbase.narrative package's `__init__.py` (where the version number lives):

    # bump to version of the beast
    python src/biokbase/narrative/__init__.py 6.6.6

### Production releases

If the development mode is automated, turn off the automatic "merge", since you may be making changes directly to the `staging` branch.

Perform the final round of testing on `narrative-dev`:

- Work in the `staging` branch, making bugfixes directly on this branch

        git checkout staging
        # bugfixes and testing

- Test it.
- Seriously, test it. This includes "stress" and "acceptance" tests.

Once you are satisfied that the `staging` branch is fit for production, you should commit any changes you made:

    git commit -a # .. or whatever
    git push

Now you will create the new release in `master`.

- Merge the staging branch into the master branch.

        git checkout master; git merge staging

- Tag the master branch (using current version number).

        ver=`python -m biokbase.narrative.__init__`
        git tag -a "v$ver" -m "release version $ver"

- Push the `master` branch, with tags, up to github

        git push origin "v$ver"

- Switch to the production host. Deploy on `narrative` using the newly created tag.

        git checkout master
        # .. deploy ..

### Hotfix Releases

Just in case something goes wrong, even after all that testing you did (cough!),
here is how you "hotfix" the production release.

- Create a hotfix branch based on the `master` branch
- Commit your changes to the hotfix branch as necessary.
- Merge the hotfix branch back into the master branch.
- Create a new tag on the master branch. We use letters to signify a hotfix.
- Build the production environment again with new hotfix tag.
- Merge the master branch back into the develop branch.