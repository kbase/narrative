## Narrative Development & Deployment HowTo


### Overview

1. Create a "development" image for CI.
1. Deploy image to CI.
1. Once tested in CI, create a single "production" image for appdev, next, & prod.
1. Tag the "production" image for deployment using the `deploy_tag.sh` script.
1. Deploy the "production" image in the relevant environments.

### CI

#### Create CI Image

1. Create a new temporary branch from the `develop` branch.
1. Add a _single_ bug fix or new feature to your temporary branch.
1. Create a new [pull request](https://github.com/kbase/narrative/compare) to merge your branch into `develop`.
1. Ensure the automated [build test](https://github.com/kbase/narrative/actions?query=workflow%3A%22Build+Test+Image%22) completes successfully.
1. Complete review and testing.
1. Merge pull request.

#### Deploy CI

Once a pull request is merged from a temporary branch to `develop` a new _development_ image will be available at:
`ghcr.io/kbase/narrative-develop:latest`

Simply upgrade the `narrative` container for CI in Rancher for the changes to take effect.

### Appdev, Next, & Prod

#### Create Image

1. Create a new [pull request](https://github.com/kbase/narrative/compare) to merge the `develop` branch into `master`.
1. Follow the same process outlined in the `Develop` section above.

Once a pull request is merged from `develop` to `master` a new _production_ image will be available at:
`docker.pkg.github.com/kbase/narrative/narrative:latest`.

In order to deploy the production `/kbase/narrative/narrative` image in appdev, next, or prod, follow the steps below.


#### Tag & Deploy Image

1. Ensure the [deploy_tag.sh](https://github.com/kbase/narrative-traefiker/blob/develop/.github/workflows/scripts/deploy_tag.sh) script is installed on either your local workstation, or under your home directory on a secured system, such as `install.kbase.lbl.gov`.
2. Create a GitHub [personal access token](https://github.com/settings/tokens) and set it as "$TOKEN" in your workstation/server shell environment.
3. Run the `deploy_tag.sh` with the following syntax:
`./deploy_tag.sh -o "kbase" -r "narrative" -t "latest" -e "appdev"`
```bash
  Where:
    -o ORG is the organization (`kbase`, `kbaseapps`, etc.)
    -r REPO is the repository (e.g. `narrative`)
    -t IMAGE_TAG is the *current* Docker image tag, typically `pr-#` or `latest`
    -e TARGET Sets target environment's tag. This is typically either:`appdev`, `next`, or `prod`.
```
4. Upgrade the `narrative` container for the desired environment (e.g. `next` ) in Rancher.


### Image URLs

| Evironment  | Image URL   |
| ----------- | ----------- |
| CI          | ghcr.io/kbase/narrative-develop:latest |
| Appdev      | ghcr.io/kbase/narrative:appdev         |
| Next        | ghcr.io/kbase/narrative:next           |
| Production  | ghcr.io/kbase/narrative:prod           |
