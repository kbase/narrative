# The KBase Narrative Interface

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kbase/narrative?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

| Branch | Status |
| :--- | :--- |
| master | [![Build Status](https://travis-ci.org/kbase/narrative.svg?branch=master)](https://travis-ci.org/kbase/narrative) [![Coverage Status](https://coveralls.io/repos/kbase/narrative/badge.svg?branch=master)](https://coveralls.io/r/kbase/narrative?branch=master) |
| develop | [![Build Status](https://travis-ci.org/kbase/narrative.svg?branch=develop)](https://travis-ci.org/kbase/narrative) [![Coverage Status](https://coveralls.io/repos/kbase/narrative/badge.svg?branch=develop)](https://coveralls.io/r/kbase/narrative?branch=develop)|

This is the repository for the KBase Narrative Interface.

## About

The KBase Narrative Interface builds on the [Jupyter Notebook](http://jupyter.org) and contains elements to interact with various KBase tools and data stores.

This document contains links to various documentation in the [docs](/docs) directory, with a brief description of each.

## Local Installation (for developers)
Short version:
Requires the following:
* Python 2.7+ (working on updating to Python 3...)
* Node.js v6 LTS (needed for npm)
* Bower

```
git clone https://github.com/kbase/narrative
cd narrative
./scripts/install_narrative.sh -v narr-venv
source narr-venv/bin/activate
kbase-narrative
```

Long version:

[Local Narrative setup/deployment](/docs/install/local_install.md)

## Server installation (for administrators)

If you want to set up your own Narrative server that uses the Docker framework, the below document will walk you through it. Once the server is set up, you only need to pull new code and build a new Docker image from it. You can also pull Narrative images directly from Dockerhub in the KBase namespace.

The document specifically describes how you would build the system on a [Vagrant](https://www.vagrantup.com) image, but is applicable to any Ubuntu-based system.

[Production Narrative setup/deployment](/docs/install/deployment.md)
[Dockerhub Narrative builds](/docs/install/dockerhub_builds.md)

## Architecture

### In progress!

The Narrative sits on top of the Jupyter Notebook, so most of its architecture is a mirror of that. However, the Narrative's interaction with other KBase elements - namely the data stores and job running services - merits its own description. This will be ongoing (and evolving!), but a brief description of how a job gets run and registered is available here:

[Narrative App/Method Running](/docs/developer/narrative_app_error_states.md)

When deployed in production, the Narrative Interface is compiled into a [Docker](https://www.docker.com) container. When a user logs in, they have their own instance provisioned for them through an [Nginx](http://nginx.org) proxy, which provides a temporary server-side Narrative environment only for that user. Any changes made to a Narrative get saved as part of KBase data stores, but any changes to the file system or the Narrative kernel (e.g. local variables) are lost when the user logs out and their Docker instance gets shut down.

## Testing

Testing is composed of three components:

- a `make test` directive that runs through a batch of unit-testing of the Narrative, both the front-end Javascript-based components, and the back-end IPython modifications
- a `travis.yml` file for Travis-CI testing
- a set of Selenium-based end-to-end tests that simulate browser interactions

Testing locally (i.e. not through Travis-CI) requires a local Narrative installation, with active virtualenv (if installed that way). Then just run `make test` or `make test-frontend-unit` or `make test-backend`. If you haven't changed any configuration, this will run unauthenticated tests and skip any tests that require authentication.

To run authenticated tests, you'll need to get an auth token from KBase servers, drop it in a file in the test directory (as the only line in that file), then modify two config files. These are `test/unit/testConfig.json` for frontend tests, and `src/biokbase/narrative/tests/test.cfg` for backend tests [TODO: merge those, or move them somewhere sensible]. The frontend test file should have the "token" block modified to include your username and the path to the token file. The backend test file should be updated so that the `test_user` and/or `private_user` keys in the `[users]` and `[token_files]` block are aligned (e.g. users.test_user is the user for the token in token_files.test_user).

Note: **DO NOT CHECK YOUR TOKEN FILE IN TO GITHUB**. You'll be shamed mercilessly.


## Submitting code

We currently use a modified version of the famous [Git flow](http://drewfradette.ca/a-simpler-successful-git-branching-model/) workflow, described below:

[Narrative Git Workflow](/docs/git-workflow.md)

The short version is this - all development work is done on the `develop` branch. After some stability occurs, this gets merged to `staging` for internal testing, then to `master` where it is tagged and released to production.

So when you want to submit code, please make a pull request against `develop`.
