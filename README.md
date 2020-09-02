# The KBase Narrative Interface

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kbase/narrative?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

| Branch | Status |
| :--- | :--- |
| master | [![Build Status](https://travis-ci.org/kbase/narrative.svg?branch=master)](https://travis-ci.org/kbase/narrative) [![Coverage Status](https://coveralls.io/repos/kbase/narrative/badge.svg?branch=master)](https://coveralls.io/r/kbase/narrative?branch=master) |
| develop | [![Build Status](https://travis-ci.org/kbase/narrative.svg?branch=develop)](https://travis-ci.org/kbase/narrative) [![Coverage Status](https://coveralls.io/repos/kbase/narrative/badge.svg?branch=develop)](https://coveralls.io/r/kbase/narrative?branch=develop)|

***Table of Contents***

-   [About](#branches-tags)

- [Installation](#local-installation-for-developers)

  - [Local Installation for Developers](#pull-requests)

    - [Using a Conda Environment](#using-a-conda-environment)

    - [Without Conda](#without-conda)

- [Architecture](#realease-flow)

- [Testing](#testing)

  - [Manual Testing](#manual-testing)

- [Production Releases](#production-releases)

  - [Submitting Code](#submitting-code)

## About

This is the repository for the KBase Narrative Interface.
. The KBase Narrative Interface builds on the [Jupyter Notebook](http://jupyter.org) and contains elements to interact with various KBase tools and data stores.

This document contains links to various documentation in the [docs](docs) directory, with a brief description of each.

## Installation

If you want to use the KBase Narrative Interface, just point your browser at https://narrative.kbase.us, make a free account, and jump in. This repo is only for people who wish to contribute to the development of the interface.

### Local Installation for Developers

Short version:
Requires the following:

- Python 3.6+
- Anaconda/Miniconda as an environment manager (<https://www.anaconda.com/>)
- Node.js (latest LTS recommended)
- Bower 1.8.8+

### *Using a Conda Environment*

This is the recommended method of installation!

```
git clone https://github.com/kbase/narrative
cd narrative
conda create -n my_narrative_environment
conda activate my_narrative_environment
./scripts/install_narrative.sh
kbase-narrative
```

If the previous instructions do not work, try

```
# source ~/anaconda3/bin/activate or wherever you have python installed
conda create -n my_narrative_environment
conda activate my_narrative_environment
sh scripts/install_narrative.sh
# scripts/install_narrative.sh
kbase-narrative
```

### *Without conda*

This process installs lots of requirements of specific versions and may clobber things on your PYTHONPATH.

```
git clone https://github.com/kbase/narrative
cd narrative
./scripts/install_narrative.sh
kbase-narrative
```

Long version: [Local Narrative setup](docs/install/local_install.md)

## Architecture

***In progress!***

The Narrative sits on top of the Jupyter Notebook, so most of its architecture is a mirror of that. However, the Narrative's interaction with other KBase elements - namely the data stores and job running services - merits its own description. This will be ongoing (and evolving!), but a brief description of how a job gets run and registered is available here:

[Narrative App/Method Running](docs/developer/narrative_app_error_states.md)

When deployed in production, the Narrative Interface is compiled into a [Docker](https://www.docker.com) container. When a user logs in, they have their own instance provisioned for them through an [Nginx](http://nginx.org) proxy, which provides a temporary server-side Narrative environment only for that user. Any changes made to a Narrative get saved as part of KBase data stores, but any changes to the file system or the Narrative kernel (e.g. local variables) are lost when the user logs out and their Docker instance gets shut down.

## Testing

Testing is composed of three components:

- a `make test` directive that runs through a batch of unit-testing of the Narrative, both the front-end Javascript-based components, and the back-end IPython modifications
- a `travis.yml` file for Travis-CI testing
- a set of Selenium-based end-to-end tests that simulate browser interactions

Testing locally (i.e. not through Travis-CI) requires a local Narrative installation, with active virtualenv (if installed that way). Then just run `make test` or `make test-frontend-unit` or `make test-backend`. If you haven't changed any configuration, this will run unauthenticated tests and skip any tests that require authentication.

To run authenticated tests, you'll need to get an auth token from KBase servers, drop it in a file in the test directory (as the only line in that file), then modify two config files. These are `test/unit/testConfig.json` for frontend tests, and `src/biokbase/narrative/tests/test.cfg` for backend tests [TODO: merge those, or move them somewhere sensible]. The frontend test file should have the "token" block modified to include your username and the path to the token file. The backend test file should be updated so that the `test_user` and/or `private_user` keys in the `[users]` and `[token_files]` block are aligned (e.g. users.test_user is the user for the token in token_files.test_user).

Note: **DO NOT CHECK YOUR TOKEN FILE IN TO GITHUB**. You'll be shamed without mercy.

### Manual Testing

- It can be useful to immediately see your changes in the narrative. For javascript changes, you will just have to reload the page. You can print messages to the console with `console.log`

- For python changes, it will require shutting down the notebook, running `scripts/install_narrative.sh -u` and then starting the notebook server up again with `kbase-narrative`. You can print messages to the terminal using

```
log = logging.getLogger("tornado.application")
log.info("Your Logs Go Here")
```

## Submitting code

Follow the gitflow directions located at [docs/git-workflow.md](docs/git-workflow.md) to submit code to this repository.
