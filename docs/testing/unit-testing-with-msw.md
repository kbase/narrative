# Testing with Mock Service Worker (MSW)

Unit testing is challenging with components or widgets which depend upon integrated network api code which fetches data.

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

### Define mocks

Within a unit test file, typically named `X-spec.js`, service mocks are defined as plain functions which return an async function which itself invokes the mock service.

Below is an example (would not work as is, but close):

```javascript
function myServiceHandler() {
        // Note request may be async (does not need to be).
        // A handler will probably load data asynchronously, so this
        // usage will probably be the most common.
        return async (req) => {
            // The request has been processed 
            const method = req.body.method;
            const [params] = req.body.params;
            switch (method) {
                case 'MyModule.myFunc':
                    // Note usage of params -- this is the jsonrpc request params.
                    if (params.myParam === 'foo') {
                        // Will probably need to load some test data; e.g. using
                        // `require` to load json.
                        const data = await someLoadingFunction(params);
                        const result = { foo: data };
                        return {
                            // Always this value for JSON-RPC 1.1
                            version: '1.1',
                            // Note reflection of the request id in the response.
                            // To be fully compliant, this should be optional.
                            id: req.body.id,
                            // Note result wrapped in an array, to comply with KBase
                            // json-rpc usage.
                            result: [result],
                        };
                    } else {
                        // There may be myriad other error conditions, with specific
                        // codes.
                        return {
                            version: '1.1',
                            id: req.body.id,
                            error: {
                                code: 100,
                                message: 'I wanted a foo!',
                            },
                        };
                    }
                default:
                    // This is a standard error response for method not defined.
                    // We don't really want this triggered in tests, unless this
                    // is what we are testing.
                    return {
                        version: '1.1',
                        id: req.body.id,
                        error: {
                            code: -32601,
                            message: 'Method not found',
                        },
                    };
            }
        };
    }
```

### Use `beforeEach` and `afterEach` to control mock lifecycle

E.g., taken from working tests:

```javascript
        let mock = null;
        beforeEach(async () => {
            mock = new MockWorker();
            await mock.start();
            mock.useJSONResponder(WORKSPACE_URL, workspaceHandler());
            mock.useJSONResponder(SAMPLE_SERVICE_URL, sampleServiceHandler());
        });

        afterEach(() => {
            if (mock) {
                mock.stop();
            }
        });

```

Note that these are `each` test lifecycle hooks. This is because this this case we want the mocking machinery pristine for each test. We could also use beforeAll if we just need to set up the responders the same way for all tests, etc.

Note that the handlers are provided as defined above, and a url must also be provided. In this case, the urls are taken from the test configuration, so will match what the tests naturally use (as long as they also use the test configuration), and what nested code will use (code not controlled by the tests, which nevertheless uses the global config.)

```javascript
    const WORKSPACE_URL = Config.url('workspace'); // 'https://ci.kbase.us/services/ws';
    const SAMPLE_SERVICE_URL = Config.url('sample_service'); // 'https://ci.kbase.us/services/sampleservice';
```

### Use the APIs as normal

There are no other msw-specific tasks. You can simply use the apis that have been mocked, and they will just work, as long as the data used in tests matches the mocked data.

E.g. here is a very simple test which ensures that a call to a mocked workspace method works (basically):

```javascript
it('should be able to fetch a SampleSet object via the workspace client', async () => {
    const wsClient = new ServiceClient({
        url: WORKSPACE_URL,
        module: 'Workspace',
        token: 'token',
        timeout: 2000,
    });

    const objects = await wsClient.callFunc('get_objects2', {
        params: {
            objects: [
                {
                    ref: '53116/17/1',
                },
            ],
        },
    });

    expect(objects).toBeDefined();
});
```

Note that in this test, the workspace url is the same value used to set up the mocks, ensuring that the mock is invoked.

### Testing Scenarios

The usage examples above are cover normal usage with some error conditions. However, we can also exploit msw to simulate other api usage scenarios, including slow connections, timeouts, network failures, and a variety of server and json-rpc core errors. With help from utilities, we could make this type of testing fairly easy and reliable, which will help us make make our code more resiliant.

Test data is another concern. In my usage I've taken actual service responses from CI and canned them into JSON files located next to the tests. The service request handlers are responsible for loading this data on demand, based on the request parameters. This is fairly easy to do using `requirejs` support for loading json.

To support more advanced testing scenarios, involving authentication, search, etc., handlers and code handling would need to be more complex.

## Files involved

- test/unit/utils/mswUtils.js
- test/unit/karma.conf.js
- test/unit/test-main.js
- package.json
- package-lock.json
- scripts/install-npm.js
- scripts/install_narrative.sh

## Status

Usage of this library is very new. There are some rough edges. It isn't integrated into the documentation yet. There is one workaround in the `mswUtils.js` to patch over a bug (https://github.com/mswjs/msw/issues/694). `mswUtils.js` itself could use some work and documentation, and some of the utility functions are more general than msw usage and can moved elsewhere.

## TODO

- Write a guide to creating mocks and using them in `msw`.
- Make handler utils and wrapper for creating fully compliant JSON-RPC 1.1 and 2.0 handlers (they currently aren't).
- Make handler utils and wrapper for REST services.
- Create basic service handlers, at least as examples, if not re-usable, for all core services.
