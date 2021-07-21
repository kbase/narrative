# Testing with Mock Service Worker (MSW)

Unit testing is challenging with components or widgets which depend upon integration network api code which fetches data.

One approach is api mocking, in which api code is temporarily supplanted with testing code which, rather than conduct the intended action, simply returns some canned set of data.

Another is to provide one or more http servers which mock service endpoints and proxy everything else.

Both of these approaches have their benefits and detractions.

But now there is a third way. A mock http service embedded as a service worker, and a monkeypatching of the DOM fetch api to forward mocked endpoints to it, while proxying other requests to their real destinations.

And its name is: Mock Service Worker

Or [msw](https://github.com/mswjs/msw), for short.

## But don't we already have http mocking?

The codebase does currently include Jasmine http mocking via `jasmine-ajax`. However, that support is limited to `XMLHttpRequest` and does not support fetch.

The SampleSet viewer uses a newer JSON-RPC 1.1 which uses the newer DOM standard `fetch` http api.

## How it works, briefly

To get a feel for how it works, let's review an overview of how I've used it in tests:

- a test file imports `mwsUtils` (a wrapper around msw)
- a test file defines "handlers" for kbase service endpoints; these are the "mocks".
    - unhandled requests are proxied to the actual endpoints
    - in our usage any service mocked must handle all jsonrpc methods invoked by the tests; this is not a requirement of `msw`
- the test suite (`describe`) installs mock handlers and starts the msw service
- tests run
- the test suite stops the mock service and removes the mock handlers


## Installation

`msw` consists of two parts - `msw.js`, the client loaded by tests, and `mockServiceWorker.js`, the mock server installed a browser service worker .

The msw library is provided as an npm package, and is installed as the normal course of action in running `npm install` in `install_narrative.sh`. There was no support for using npm packages in the Narrative runtime, so I added a simple script, `install-npm.js`, which is called after `npm install`. This script simply copies select files from within `npm_modules` into the `ext_modules` directory of the codebase, in `kbase-extension/static/ext_modules`. 

This directory is excluded from git checkin via `.gitignore`. It is only created and populated during Narrative installation.

> This is counter to the msw documentation, which suggests installing `mockServiceWorker.js` permanently into the static assets of a web app. But ... our build is different than a modern SPA.

The msw code is only available during the running of unit tests, via the karma configuration. It is not included in the Narrative runtime configuration via `narrative_paths.js`.

The `karma.conf.js` test configuration file provides a proxy mapping from `/mockServiceWorker.js` to the actual location of the file within the karma-hosted runtime. `msw.js` provides api and browser integration, and is loaded by requirejs. It is made available for amd-loading in `test-main.js`.

The reason to map `mockServiceWorker.js` is that `msw.js` will load and start the mock service worker, but needs to know where to find the file. It needs direct access to the file, since loading a service worker is separate from loading an amd module. The default location for the mock service worker is, you guessed it, `/mockServiceWorker.js`. `msw` accepts an option for the actual path to mockServiceWorker.js, but it seemed simpler to just use the default behavior and have karma proxy the request.

## Usage

A utility, `mswUtils.js`, provides tools to use `msw` within tests.

Support consists of  

## Files involved

- test/unit/util/mswUtils.js
- test/unit/karma.conf.js
- test/unit/test-main.js
- package.json
- package-lock.json
- scripts/install-npm.js
- scripts/install_narrative.sh

## Status

Usage of this library is very new. There are some rough edeges. It isn't integrated into the documentation yet. There is one workaround in the `mswUtils.js` to patch over a bug (https://github.com/mswjs/msw/issues/694). `mswUtils.js` itself could use some work and documentation, and some of the utility functions are enough and can moved elsewhere.

## TODO

- Write a guide to creating mocks and using them in `msw`.


