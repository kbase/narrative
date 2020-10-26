## New PR & Testing Process Proposal


### Goals

Design a development process and write related automation that:

1. Allows for rapid parallel development
1. Prevents cross-developer collisions
1. Creates a full audit trail of all changes, tests, and deployments
1. Tests small changes (features and bug fixes) individually
1. Can be enabled on most repos with little to no modification
1. Provides multiple test/check points througout the development process including:
    - Build tests that are created at the beginning of the code review (PR) process _pre_-merge
    - Images that can be tested both before and after merges to the `develop` branch
    - Release candidate images that can be tested prior to production releases (aka merges to `master`)
1. Reduces excessive or redundant build testing through the use of Draft/WIP pull requests
1. Enables manual build triggering as needed through the Draft/WIP vs. "Ready for Review" pull requests
1. Allows for easy ad-hoc deployment of images to any environment (assuming above safeguards are in place)
1. Provides a basis for potential future continuous deployment

### Process

(Will start at the end of the cycle, as it oddly makes things more clear)

#### Release Cycle Pt. 1:

- An official "release" (version bump) is merged from develop to master.
- The production Docker image `<appname>:latest` is then updated and pushed to GitHub Packages.
- After this release update is complete, a new Draft/WIP PR for the next release is created (again a merge from develop to master). 

#### Development Cycle:

- Once development on a new release begins, developers create their short-lived feature branches off of develop.
- Once their feature is complete, they create a new PR to merge from their feature branch to develop.
- When the PR is created, an `<appname>:pr#` image is autodamically built uploaded to GitHub Packages.
    - Note that this image is intentionally separate from the prod `<appname>` image.
- (Optional) - After the `<appname>-develop:pr#` image build & upload is complete, some process (PR labeling or a PR comment) "enables" this image to be tested in appdev, ci, and/or next.
- Through some process, we test the image in these environments.
    - Note that if we simply use the `<appname>-develop:pr#` nomenclature, the above "test environment enabling" may not be needed. 
    - Simply specifying which PR# tag you want to pull in each environment would suffice.
- Once all testing is complete, the code is merged to develop.

#### Release Cycle Pt. 2

- Once all development for a release is complete, the aforementioned "Release PR" (aka the long-running Draft/WIP PR that will merge from develop to master) is taken out of WIP/Draft mode.
- Taking the Release PR out of Draft/WIP will trigger one final build test from the develop branch.
- Once this image has passed the initial build test, the repo owner can merge the Release PR to master.
- Once merged, the final build image will be uploaded to the prod `<appname>:latest` image.
- Process starts again by creating a new Draft/WIP Release PR for the next release.

### Discussion

#### Process Advantages

- Using the `<appname>-develop:pr#` naming scheme allows us to test multiple feature improvements at will, allowing for higher velocity development.
- Separating features in this way allows us to run build tests on smaller changes, reducing errors.
- The final Release PR build ensures that the final production image still builds correctly without error.
- Keeping separate prod & `-develop` images allows us to pull development, pre-release (release candidate), and production images at will.
- Note that although the `-develop` image will have a fair number of tags (one per PR), it's extremely easy to pull the correct test image by simply specifying the `:pr-#` tag.


#### Image Naming


| Environment      | Image  | Contains | Note      |
| ----------- | ----------- |----------- |----------- |
| Dev      | _appname_-develop:pr-## | Pre-merge dev PR build| \*See `Improvements` section|
| Pre-Stage   | _appname_-develop:latest | Latest post-mere dev PR build | |
| Stage      | _appname_:pr-##       | Pre-merge dev -> master release candidate | |
| Prod   | _appname_:latest        | Production (post-merge master) build | |

#### Deployment

Our current process of deploying to active environmets (appdev, ci, next, & prod) utilizes Docker image tags.

To implement this tagging in the new process, a workflow script is being developed to trigger retags of the above images (typically just the `:latest` test and prod images) manually via an web hook. This hook can be triggered by an internal (behind the firewall):

- CI tool like Jenkins
- Chatops bot connected to Slack
- Other tool such as Postman

#### Improvements

This builds on the Deployment section above...

- \*Currently pulling a specific `development` build (pre-merge) woul require going into the Rancher UI and updating the `_appname_-develop:pr-##` number to reflect the PR you wish to test.
  - This is fine as an MVP, given the core devs have access to our Appdev Rancher cluster.
  - For future Rancher environments, it is possible that fewer devs will have direct access, neccessitating some improvements to the process.
- A potential improvement might be to implement a bit of "chat-ops":
  - When a new PR build completes, a notification is posted in the related Slack channel (e.g. \#narrative-build).
  - _Only_ devs who can update the dev enviroment are members of this locked channel.
  - Once a PR build notification is posted, one of the devs/devops members can deploy with something like `.appdev deploy pr-##`.
  - A chat bot in _our_ infrastructure would listen for these chatops commands and use Rancher's API to update the image url (`_appname_-develop:pr-##`) and reload the service in question.
- Depending on the difficulty of deploying multiple frontends (in the case of `narrative`) to connect to the same appdev backend, it could be possible to test multiple PRs simultaneously, using URLs like `pr##.appdev.kbase.us`. :shrug:
