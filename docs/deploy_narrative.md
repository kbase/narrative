## Narrative Development & Deployment HowTo

This document describes how to release and deploy the Narrative Interface app onto the different KBase environments. It's intended for KBase developers and operators.

- Last modified: Sep. 22, 2020

**_Table of Contents_**

-   [Deployment flow overview](#deployment-flow-overview)
-   [Deploying CI](#deploying-ci)
    -   [Create CI Image](#create-ci-image)
    -   [Release CI](#release-ci)
-   [Stage a Final Release](#stage-a-final-release)
-   [Deploying Next, Appdev, and Prod](#deploying-next,-appdev-&-prod)
    -   [Create Release Image](#create-release-image)
    -   [Tag & Deploy Image](#tag-&-deploy-image)
-   [Image URLs](#image-urls)

### Deployment Flow Overview

1.  Create a "development" image for CI.
2.  Deploy image to CI.
3.  Once tested in CI, draft a release by bumping the version and creating a Github release tag.
4.  Create a single production image for appdev, next, & prod.
5.  Tag the production image for deployment using the `deploy_tag.sh` script.
6.  Deploy the production image in the relevant environments.

### Deploying CI

The Continuous Integration environment - <https://ci.kbase.us> - is intended for testing and demoing of new features that may not always work right. It's also intended to be continuously upgraded and redeployed, so this process is designed to be as easy as possible.

#### Create CI Image

1.  Create a new temporary branch from the `develop` branch.
2.  Add a _single_ bug fix or new feature to your temporary branch.
3.  Create a new [pull request](https://github.com/kbase/narrative/compare) to merge your branch into `develop`.
4.  Ensure the automated [build test](https://github.com/kbase/narrative/actions?query=workflow%3A%22Build+Test+Image%22) completes successfully.
5.  Complete review and testing.
6.  Merge pull request.

#### Release CI

Once a pull request is merged from a temporary branch to `develop` a new _development_ image will be available at:
`docker.pkg.github.com/kbase/narrative/narrative-develop:latest`

Simply restart the `narrative` container for CI in Rancher. No other action is needed.

### Stage a Final Release

1.  Update versions following (roughly) [semantic versioning](https://semver.org). The files to be updated are:
    -   `package.json`, `package-lock.json`, `bower.json`, `src/config.json`, `src/config.json.templ`, `src/biokbase/narrative/\_\_init\_\_.py`
    -   Major - backward incompatible changes, like the move from Python 2 -> Python 3, or Narrative typed object changes. These are generally considered to be changes that have a strong impact on the Narrative Interface and are hard or impossible to move backward from.
    -   Minor - new features that don't affect compatibility.
    -   Patch - adjustments to existing features, bug fixes.  

2.  Add release notes in `RELEASE_NOTES.md`
    -   Add a new heading with the updated version.
    -   Add a list of changes with some reasonable detail. You don't need to add the name of every module changed, just the overall feature affected. Include JIRA ticket numbers where appropriate.

3.  PR these changes to the develop branch.
    -   Ensure that tests pass.

4.  PR the develop branch to the master branch.
    -   Deploy on the next environment.
    -   Ensure that things work as expected.

5.  Create a new release in the narrative repo.
    -   tag it with the new version, prefixed with v (e.g. v4.2.1).

### Deploying Next, Appdev, & Prod

These environments: <https://next.kbase.us>, <https://appdev.kbase.us>, and <https://narrative.kbase.us> are all deployed using a production image. They're used for slightly different purposes:

-   **next** is used for final internal testing before being promoted to the public-facing environments - appdev and production. Most services should be up to date here, and this is used for final integration and acceptance testing.
-   **appdev** is used primarily for KBase app development using the [KBase SDK](https://kbase.github.io/kb_sdk_docs/). This environment mirrors the production environment, but allows for finding and running apps in "dev" mode.
-   **prod** (or narrative.kbase.us) is the main production environment. This is the place where most users will use KBase and run apps that have either been entirely released or have been made available for beta testing.

#### Create Release Image

1.  Create a new [pull request](https://github.com/kbase/narrative/compare) to merge the `develop` branch into `master`.
2.  Follow the same process outlined in the `Develop` section above.

Once a pull request is merged from `develop` to `master` a new _production_ image will be available at:
`docker.pkg.github.com/kbase/narrative/narrative:latest`.

#### Tag & Deploy Image

1.  Ensure the [deploy_tag.sh](https://github.com/kbase/narrative-traefiker/blob/develop/.github/workflows/scripts/deploy_tag.sh) script is installed on either your local workstation, or under your home directory on a secured system, such as `install.kbase.lbl.gov`.
2.  Create a GitHub [personal access token](https://github.com/settings/tokens) and set it as "$TOKEN" in your workstation/server shell environment.
3.  Run the `deploy_tag.sh` with the following syntax: `./deploy_tag.sh -o "kbase" -r "narrative" -t "latest" -e "appdev"` (In practice, for this repo, you'll only be changing the `-e` flag value)

```bash
  Where:
    -o ORG is the organization (`kbase`, `kbaseapps`, etc.)
    -r REPO is the repository (e.g. `narrative`)
    -t IMAGE_TAG is the *current* Docker image tag, typically `pr-#` or `latest`
    -e TARGET Sets target environment's tag. This is typically either:`next`, `appdev`, or `prod`.
```

4.  Restart the `narrative` container for the desired environment (e.g. `appdev`) in Rancher. The `next`, `appdev`, and `prod` Rancher environments all have their access limited to the KBase devops staff, so ask them (on the #sysadmin channel) for help.

### Image URLs

| Evironment | Image URL                                                      |
| ---------- | -------------------------------------------------------------- |
| CI         | docker.pkg.github.com/kbase/narrative/narrative-develop:latest |
| Appdev     | docker.pkg.github.com/kbase/narrative/narrative:appdev         |
| Next       | docker.pkg.github.com/kbase/narrative/narrative:next           |
| Production | docker.pkg.github.com/kbase/narrative/narrative:prod           |
