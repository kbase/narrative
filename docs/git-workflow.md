# Git branching workflow for narrative

- Based on: http://drewfradette.ca/a-simpler-successful-git-branching-model/
- Last modified: Dec. 11, 2014

This document describes the git workflow that *all* developers of the narrative code must follow. It also describes the release procedure, which only an unlucky few should have to worry about.

## Branches and Tags

There are 3 branches:

* `develop` – Development branch. New features are added off this branch.
* `staging` – Staging or "release candidate" branch. The branch deployed `narrative-dev`.
* `master` – Production branch. The branch deployed on `narrative-next` and `narrative`. This branch is used for hotfixes.

Tags on master are used for indicating releases (see "Production releases", below).

## Workflow

There are three main workflows: development, production releases, and hotfixes.

### Development

To add a feature or fix a bug in development, work from the develop branch, i.e. create a new branch off develop and do a pull request when done (or directly push it back).

Development "releases" to narrative-dev are done as follows:

* Merge `develop` into `staging`

        git pull origin develop staging
        git checkout staging; git merge develop
        
* Deploy new `staging` on narrative-dev

Because features should only be merged into develop after testing, and changes should not, in this mode, be made directly on `staging`, this can eventually be automated (e.g., run once per hour out of cron).

Bumping the version number can be done by providing it as an argument to the biokbase.narrative package's `__init__.py` (where the version number lives):

    # bump to number of the beast
    python src/biokbase/narrative/__init__.py 6.6.6

### Production releases

If the development mode is automated, turn off the automatic "merge", since you may be making changes directly to the `staging` branch.

Perform the final round of testing on `narrative-dev`:

* Work in the `staging` branch, making bugfixes directly on this branch

        git checkout staging
        # bugfixes and testing

* Test it.
* Seriously, test it. This includes "stress" and "acceptance" tests.
 
Once you are satisfied that the `staging` branch is fit for production, you should commit any 
changes you made:

    git commit -a # .. or whatever
    git push

Now you will create the new release in `master`.

* Merge the staging branch into the master branch.

        git checkout master; git merge staging

* Tag the master branch (using current version number).

        ver=`python -m biokbase.narrative.__init__`
        git tag -a "v$ver" -m "release version $ver"

* Push the `master` branch, with tags, up to github

        git push origin "v$ver"

* Switch to the production host. Deploy on `narrative` using the newly created tag.

        git checkout master
        # .. deploy ..

### Hotfixes

Just in case something goes wrong, even after all that testing you did (cough!),
here is how you "hotfix" the production release.

* Create a hotfix branch based on the `master` branch
* Commit your changes to the hotfix branch as necessary.
* Merge the hotfix branch back into the master branch.
* Create a new tag on the master branch. We use letters to signify a hotfix.
* Build the production environment again with new hotfix tag.
* Merge the master branch back into the develop branch.
