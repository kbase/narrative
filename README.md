# The KBase Narrative Interface

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kbase/narrative?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is the repository for the KBase Narrative Interface.

## About

The KBase Narrative Interface builds on the [IPython Notebook](http://ipython.org) and contains elements to interact with various KBase tools and data stores.

This document contains links to various documentation in the [docs](/docs) directory, with a brief description of each.

## Architecture

### In progress!

The Narrative sits on top of the IPython Notebook, so most of its architecture is a mirror of that. However, the Narrative's interaction with other KBase elements - namely the data stores and job running services - merits its own description. This will be ongoing (and evolving!), but a brief description of how a job gets run and registered is available here:

[Narrative App/Method Running](/docs/narrative_app_error_states.md)

When deployed in production, the Narrative Interface is compiled into a [Docker](https://www.docker.com) container. When a user logs in, they have their own instance provisioned for them through an [Nginx](http://nginx.org) proxy, which provides a temporary server-side Narrative environment only for that user. Any changes made to a Narrative get saved as part of KBase data stores, but any changes to the file system or the Narrative kernel (e.g. local variables) are lost when the user logs out and their Docker instance gets shut down.

## Local installation (for developers)

Developing in the Narrative is easiest to do on either your local system or a local VM environment, not a fully deployed server. Instructions for setting up a local development environment are available here:

[Local Narrative setup/deployment](/docs/developer.md)

## Server installation (for administrators)

If you want to set up your own Narrative server that uses the Docker framework, the below document will walk you through it. Once the server is set up, you only need to pull new code and build a new Docker image from it.

The document specifically describes how you would build the system on a [Vagrant](https://www.vagrantup.com) image, but is applicable to any Ubuntu-based system.

[Production Narrative setup/deployment](/docs/deployment.md)

## Testing

### In progress!

Testing will be composed of three components:

- a ```make test``` directive that runs through a batch of unit-testing of the Narrative, both the front-end Javascript-based components, and the back-end IPython modifications
- a ```travis.yaml``` file for Travis-CI testing
- a set of Selenium-based end-to-end tests that simulate browser interactions

## Submitting code

We currently use a modified version of the famous [Git flow](http://drewfradette.ca/a-simpler-successful-git-branching-model/) workflow, described below:

[Narrative Git Workflow](/docs/git-workflow.md)

The short version is this - all development work is done on the ```develop``` branch. After some stability occurs, this gets merged to ```staging``` for internal testing, then to ```master``` where it is tagged and released to production.

So when you want to submit code, please make a pull request against ```develop```.