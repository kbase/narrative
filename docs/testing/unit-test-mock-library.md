# Unit Test Mock Library

***Table of Contents***

  - [Introduction](#introduction)
  - [General Usage](#general-usage)  
  - Functions
    - [buildMockCell](#buildmockcell)
    - [buildMockNotebook](#buildmocknotebook)
    - [mockServiceWizardLookup](#mockservicewizardlookup)
    - [mockJsonRpc1Call](#mockjsonrpc1call)
    - [mockAuthRequest](#mockauthrequest)
    - [setAuthToken](#setauthtoken)
    - [clearAuthToken](#clearauthtoken)

## Introduction
The Narrative Mocks library is a tool for mocking various components of the Narrative interface while testing. It's mostly helpful for reducing boilerplate needed for testing Jupyter notebook cell extensions, and mocking KBase service calls.

Below is a list of all currently available functions with examples.

## General Usage
```Javascript
define([
    'narrativeMocks'
], (Mocks) => {
    'use strict';
    // all the mock functions are now available under the Mocks object.
});
```

## buildMockCell
`buildMockCell(cellType, kbaseCellType, data)`  
This function builds a mock Jupyter notebook cell, given a Jupyter notebook cell type and an optional KBase cell type. It includes the full structure needed to portray a cell, including DOM elements.

**parameters**
* `cellType` - string - the type of cell it should be, one of "code", "markdown", "raw". For mocking KBase cell types, this should be "code"
* `kbaseCellType` - optional string - if present, mock up an extended cell by adding some base metadata. One of "app", "app-bulk-import", "codeWithUserSettings", "code". If more needed, please add them to the `buildMockExtensionCellMetadata` function that isn't exported.
* `data` - object - if present, will populate the cell's metadata.

**example**
```Javascript
define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'narrativeMocks'
], (BulkImportCell, Mocks) => {
    describe('Make a dummy cell for testing', () => {
        it('should make a bulk import cell', () => {
            // make just a mocked code cell
            const cell = Mocks.buildMockCell('code');
            // pass it to the BulkImportCell constructor
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true
            });
            // expect various metadata to have been set
            expect(cell.metadata.kbase).toBeDefined();
            expect(cell.metadata.kbase.type).toBe('app-bulk-import');
        })
    });

    // mock an entire bulk import cell
    const mockCell = Mocks.buildMockCell('code', 'app-bulk-import');
});
```

## buildMockNotebook
`buildMockNotebook(options)`  
Builds a mock Jupyter notebook object with a few attributes, but mostly an empty object for modification for whatever testing purposes. One simple way to use this is to set it to the `Jupyter.notebook` global object for further usage. Be sure to clear it when you're done!

**parameters**  
There's a single `options` parameter here, which is an object with several possible attributes:
* `deleteCallback` - function - called when `delete_cell` is called
* `fullyLoaded` - boolean - if true, treat the notebook as fully loaded
* `cells` - Array - an array of mocked cells (see [buildMockCell](#buildmockcell))
* `readOnly` - boolean - set true if the Narrative should be read-only

**example**  
Example taken from the bulk import cell tests.

```Javascript
define([
    'jquery',
    '../../../../../../narrative/nbextensions/bulkImportCell/main',
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'narrativeMocks',
], ($, Main, BulkImportCell, Jupyter, Mocks) => {
    describe('a bulk import cell startup test', () => {
        afterEach(() => {
            // always clean this up when done
            Jupyter.notebook = null;
        });

        it('should instantiate a bulk import cell', (done) => {
            // mock the notebook for the main module
            const cell = Mocks.buildMockCell('code');
            // now there's a mocked notebook with a single code cell
            Jupyter.notebook = Mocks.buildMockNotebook({
                cells: [cell],
                fullyLoaded: true
            });

            Main.load_ipython_extension()
                .then(() => {
                    // this takes a little implementation detail knowledge, but ok.
                    $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                        type: 'code',
                        index: 1,
                        cell: newCell,
                        data: {}
                    })
                });
            // there's no other triggers except to wait a moment
            // for the cell to get turned into a bulk import cell.
            setTimeout(() => {
                expect(BulkImportCell.isBulkImportCell(newCell)).toBeTruthy();
                done();
            }, 100);
        });
    });
});
```
## mockServiceWizardLookup
`mockServiceWizardLookup(args)`  
There are a number of KBase dynamic services that get used in the Narrative (NarrativeService comes to mind as an obvious one, also several data providers). These work by having a generic Service Wizard client first query for the service's URL, then make the call to it. Which means that the service wizard needs its own special mocking function to be called first.

This uses jasmine.Ajax to mock a request to the service wizard. It will return the proper dynamic service URL that will be requested by the client when the call is made. If it's to be mocked, be sure to have a mock for that endpoint as well.

The basic usage is that you'll need to provide the service wizard's URL, as well as the URL you want it to return - this can be dummy as long as you use the same dummy URL when you mock the final service call. See the example below for a walkthrough.

Note that this requires running `jasmine.Ajax.install()` first.

**parameters**  
There's only a single parameter, `args`, that is an object. Its expected attributes are below:
* `module` - string - the module to mock. This should be its registered name, e.g. `NarrativeService`
* `url` - string - the fake url to return. Requests to this should be mocked, too!
* `statusCode` - int, optional, default 200 - the HTTP status to return. Set to something in the 400 range to mock a user error, and in the 500 range to mock a service error.
* `statusText` - optional, default 'OK' - a status text to return, if you're changing the mocked status from 200, this should get changed, too.

**example**  
This is a partial test set taken from the App Panel tests.

```Javascript
define(['narrativeMocks', 'narrativeConfig'], (Mocks, Config) => {
    describe('service wizard mockery', () => {
        // a fake url that gets returned
        const NS_URL = 'https://fake_narrative_service.kbase.us';
        const APP_INFO = { }; // a set of all app info to be returned;
        beforeEach(() => {
            jasmine.Ajax.install();
            // mock any service wizard call that looks up info about the NarrativeService
            Mocks.mockServiceWizardLookup({
                module: 'NarrativeService',
                url: NS_URL
            });
            // mock the call to get_all_app_info and have it always return APP_INFO
            Mocks.mockJsonRpc1Call({
                url: NS_URL,
                body: /get_all_app_info/,
                response: APP_INFO
            });
        });
    });
});
```
## mockJsonRpc1Call  
`mockJsonRpc1Call(args)`  
This mocks a KBase-style JSON-RPC 1.1 request, which is most KBase service calls. They're not exactly the JSON-RPC spec, but this sticks to what KBase does. Here are some simple usages:
* **simple happy response:**
```Javascript
mockJsonRpc1Call({
    url: Config.url('workspace'),
    body: 'get_objects2',
    response: { data: [{data: {some block of expected workspace data}}]}
});
```
* A fail response:
```Javascript
mockJsonRpc1Call({
    url: Config.url('workspace'),
    body: 'get_objects2',
    statusCode: 500,
    statusText: 'HTTP/1.1 500 Internal Service Error',
    response: {error: 'something bad happened'}
});
```

Note that this requires `jasmine.Ajax.install()` to be run first.

**parameters**  
This takes a single object as a parameter. The allowed attributes are below:
* `url` - string - the url endpoint to mock
* `body` - optional - string or regex, default = empty string - something from the body to identify the request, either a string or regex. For a KBase service call, this can be a function method, for example.
* `statusCode` - optional - int, default = 200 - the HTTP status code your request should return
* `statusText` - string, default = "HTTP/1.1 200 OK" - a status string your request will return
* `response` - object - the data your request should return as an object.


**example**
```Javascript
    describe('Run a test with the workspace', () => {
        const fakeGetObjects2Data = {
            data: [{
                data: 'foo'
            }]
        };
        beforeEach(() => {
            // always do this first! And only once per test spec!
            // beforeEach is usually a good spot.
            jasmine.Ajax.install();
            // any call to get_objects2 will always return the same data here
            Mocks.mockJsonRpc1Call({
                url: Config.url('workspace'),
                body: /get_objects2/,
                response: fakeGetObjects2Data
            });
        });

        afterEach(() => {
            // do this after you use your mocks to clear them
            jasmine.Ajax.uninstall();
        });

        it('should make a workspace call', async () => {
            // This example builds a workspace client. A Real Case would have
            // the code you're testing build the client. It doesn't matter where it
            // gets run, the mock still intercepts the AJAX request.
            const ws = new Workspace(Config.url('workspace'), {token: 'fake'});
            const data = await ws.get_objects2({objects: [{ref: '1/2/3'}]});
            expect(data).toEqual(fakeGetObjects2Data);
            // Another helpful tool is the most recent request inspection, to ensure
            // that your code is sending the expected information
            const req = jasmine.Ajax.requests.mostRecent();
            expect(req.method).toBe('POST');
            expect(req.body).toContain('get_objects2');
        });
    });
});
```
## mockAuthRequest
`mockAuthRequest(path, response, statusCode)`  
A simple auth request mocker. This takes a path to the auth REST service, a response to return, and the status code, and builds a mock that satisfies all of that.

Requires that `jasmine.Ajax.install()` has been run first.

**parameters**
* `path` - string - the path to request from the Auth2 service. See the Auth2 docs for details, but likely one of `token`, `me`
* `reponse` - object - the response object that the test expects to see
* `statusCode` - int - the HTTP status code to return

**example**  
This is an example from the Narrative Auth API tests, slightly tweaked.

```Javascript
define([
    'narrativeMocks',
    'narrativeConfig',
    'api/auth'
], (Mocks, Config, Auth) => {
    describe('A basic auth token test', () => {
        it('should get token info', async () => {
            jasmine.Ajax.install();
            // set up some dummy data
            const FAKE_TOKEN = 'SomeFakeAuthToken';
            const tokenInfo = { ... see Auth2 for details ... };
            // mock the auth request
            Mocks.mockAuthRequest('token', tokenInfo, 200);
            // make the API call, which should in turn make the request
            const response = await authClient.getTokenInfo(FAKE_TOKEN);
            // introspect and compare the results
            Object.keys(tokenInfo).forEach(tokenKey => {
                expect(response[tokenKey]).toEqual(tokenInfo[tokenKey]);
            });
            // introspect the request to make sure the token was actually set properly
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
        });
    });
});

```
## setAuthToken  
`setAuthToken(token)`  
Sets an arbitrary string in the test browser's auth token cookie. From the tests' points of view, this appears to be a real auth token. Helpful for the cases where you want to appear logged in.

**parameters**  
* `token` - string - the dummy auth token string to set.

**example**  
```Javascript
// This example goes through an exercise with using an auth client, mocking an auth call,
// and making sure the request sent was correct.
define([
    'narrativeMocks', 
    'api/auth', 
    'narrativeConfig'
], (Mocks, Auth, Config) => {
    describe('Some auth-mocking tests', () => {
        it('does an auth-requiring test', async () => {
            const FAKE_TOKEN = 'SomeVeryFakeAuthToken';
            jasmine.Ajax.install();
            // Another test would expect a failure if this isn't set.
            Mocks.setAuthToken(FAKE_TOKEN);
            // A more realistic test would have a fully formed profile.
            Mocks.mockAuthRequest('me', {user: 'some_user', email: 'someuser@kbase.us'}, 200);
            // create an auth client
            authClient = Auth.make({
                url: Config.url('auth'),
            });
            // actually execute the profile fetching call we want
            const profile = await authClient.getUserProfile();
            expect(response).toEqual(USER_PROFILE);
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.requestHeaders.Authorization).toEqual(FAKE_TOKEN);
            expect(request.url).toEqual(Config.url('auth') + '/me');
            // ...etc
        });
    });
});
```

## clearAuthToken  
`clearAuthToken()`  
Clears any set auth token cookie.

**parameters**  
None  
**example**  
```Javascript
define(['narrativeMocks'], (Mocks) => {
    describe('Some auth-mocking tests', () => {
        beforeEach(() => Mocks.setAuthToken('foo'));
        afterEach(() => Mocks.clearAuthToken());
    });
});
```




