# Writing Narrative front end unit tests

***Table of Contents***
  - [Running tests](#running-tests)
  - [Unit test frameworks](#unit-test-frameworks)
    - [Jasmine](#jasmine)
    - [Karma](#karma)
    - [Configuration](#configuration)
  - [Writing test specs](#writing-test-specs)
    - [Getting started](#getting-started)
    - [Set up and tear down](#set-up-and-tear-down)
    - [Asynchrony](#asynchrony)
    - [Mocking and Spies](#mocking-and-spies)
    - [Testing modules that use the factory pattern](#testing-modules-that-use-the-factory-pattern)
  - [Narrative Mocks Library](#narrative-mocks-library)
    - [Loading and using the library](#loading-and-using-the-library)
  - [KBase Narrative Unit Test Best Practices](#kbase-narrative-unit-test-best-practices)

This document details how to write and run front end unit tests for the KBase Narrative. For information about integration tests look [here](integration-testing.md). For general test running, look [here](./testing.md).

This document assumes you have a working Narrative installation.

## Running tests
The simple way to run tests is by just running `make test-frontend-unit`. This handles marshalling everything, running the tests, and shutting it all back down again.

Doing it manually requires two phases.

In the first phase, a running Narrative instance must be set up on port 32323. The easiest way to do this is with the command `kbase-narrative --no-browser --port=32323`. This provides a working Narrative and makes the Jupyter Notebook code available on that port, which is configured into karma for its proxies.

The second phase is running the tests themselves. Just run `npm run test`, which will start Karma and run the test suite.


## Unit test frameworks
Narrative front end unit testing is done using the [Jasmine](https://jasmine.github.io/) test framework, and run using the [Karma](https://karma-runner.github.io/). These are configured to load and proxy the Jupyter notebook frontend as well as the KBase code extensions that make the Narrative work.

### Jasmine

Jasmine is a popular Javascript unit test framework. It makes use of common JS testing paradigms and can handle testing asynchronous code.

### Karma

Karma is a test runner that was primarily made to support the Angular framework, but works well outside of that. At its core, Karma starts a small HTTP server to serve the test module and provide proxy access to both KBase and Jupyter Javascript code modules.

### Configuration

Karma configuration is done under `test/unit/karma.conf.js`. As used for Narrative testing, this sets up the following:
* A set of browsers to test on.
* KBase module files to preprocess for coverage reporting.
* The set of files to load into the test runner server.
* What files to exclude from testing (mainly other test files that get downloaded from installed npm modules).
* Proxies for most other directories. These are set up as key-value pairs comprising the paths to proxy and the location that gets proxied to.
* The port to start the test runner server on.

For example, when some test references a file (whether it's a dependency to load or some other requirement), that might be under the `/narrative/nbextensions` directory. Karma will then proxy that to `http://localhost:32323/narrative/nbextensions` which is where the installed and running Narrative will be. A number of other proxies are here, too, all dependent on a running Narrative (and Jupyter notebook) server.

Because of how Karma is configured, it doesn't start running tests once the configuration loads. The last file that gets loaded by Karma is `test/unit/test-main.js`. This workaround loads up some extra requirejs configuration that's needed by the Narrative, Jupyter Notebook, and ultimately the test runner to make everything work. So the basic flow is like this:
1. Karma starts by loading the configuration file.
2. `test-main.js` loads with additional browser configuration.
3. Additional RequireJS configuration is done at this time.
4. Once RequireJS is configured, it starts the Karma-loaded test suite.

Individual test specs aren't necessarily run in the same order each time.


## Writing test specs
There should be one test module per Javascript module. These all use Jasmine testing idioms, mixed with RequireJS.

### Getting started
A very simple test module may look like this:

```Javascript
define([
    'narrativeConfig'
], (
    Config
) => {
    'use strict';

    describe('Test the Narrative Configuration module', () => {
        it('loaded the config module', () => {
            expect(Config).toBeDefined();
        });
    })
});
```
There's a few things to note here:
1. The entire module is wrapped in a `define` statement, same as all other RequireJS-based AMDs. And, like those, the first element is a list of imports, and the second is the function that gets run with those imports.
2. Jasmine tests are composed of a `describe` function with a series of calls to an `it` function. Think of `describe` as a container for your test specs, and `it` as an individual test spec.
3. Each test should have one or more `expect` statements in it. That's the actual test that runs. These get chained with "matcher" functions that take the value in `expect` and operate on it. In the example, the value of `Config` is passed to the `toBeDefined()` function, and if that returns `true`, it matches the expectation and the test passes.

[This part of the Jasmine docs](https://jasmine.github.io/tutorials/your_first_suite) is helpful reading at this point. And [this link](https://jasmine.github.io/api/3.6/matchers.html) gives a list of all matchers.

### Set up and tear down
Most tests that do anything useful will need some setup, some code execution, and possibly some tear down / resetting of resources that are common to all specs. This allows you to minimize code repetition, and is done through use of `beforeEach/All` and `afterEach/All`. These run before or after each `it` function gets run. Here's an example:

```Javascript
define([
    'myModule',
    'common/runtime'
], (MyModule, Runtime) => {
    describe('Test MyModule', () => {
        let runtime;
        beforeEach(() => {
            // set up the Runtime object that manages various state elements
            runtime = Runtime.make();
        });

        afterEach(() => {
            // The runtime also puts itself in the global space, so this
            // tears it back down
            window.kbaseRuntime = null;
        });

        it('should do things that need runtime', () => {
            let bus = runtime.bus();
            expect(MyModule.doThingsWithBus(bus)).toBeTruthy();
        });
    });
})
```
The above sets up and takes down the Runtime module, gets a message bus from it, and uses it for a test spec. Something more realistic would use the same Runtime in multiple specs. Note that `beforeEach` and `afterEach` (as well as `it`) can take `async` functions. More on that later.

This also makes use of a Javascript closure. The `runtime` variable is declared in the outer scope, it's set in `beforeEach`, then when each spec is called, it's ready to go.

### Asynchrony

The nature of modern Javascript is asynchronous code. Most of the interesting things will be interacting with either KBase services, or with the user, and so we don't want those to run synchronously and locking up the browser while processing.

Jasmine is capable of testing asynchronous code as well. There are 3 idioms that can be used.

***1. Async/Await***

If you're testing code that returns a Promise or uses the async/await idiom, this can be done as follows:

```Javascript
it('tests async functions', async () => {
    const result = await runAsyncFunction();
    expect(result).toBeTruthy();
});
```

Easy enough, just treat it as a common Promise function. This should work with any KBase code that returns a Promise.

***2. Return the Promise***

Another option when working with Promises or similar *thenable* code, is to just return the Promise from the spec and embed the `expect` function in a then block. Something like this:

```Javascript
it('returns a promise', () => {
    return codeThatMakesAPromise()
        .then((result) => {
            expect(result).toBeDefined();
        });
});
```
This is similar to the above, but it can also be useful for trapping errors that you want to see (in a `.catch` block instead of `.then`). Though that can also be done with `async/await` in a `try/catch`. 

***3. Backup option - `done` function***

As kind of a last resort, you can make use of the built in `done` function that Jasmine has. This isn't recommended as it's more flaky and can lead to code still running in the background or not completing when you expect. It's mostly useful for code that executes asynchronously but doesn't return a Promise, or code that relies on callback functions. It's highly recommended to write code that properly uses and returns Promises instead of depending on other techniques, but sometimes there's no other option. In that case, add the `done` variable to any test spec, and it becomes available as a function. Just run the `done()` function when your test is done running.

```Javascript
it('calls "done" when done', (done) => {
    const myCallback = (result) => {
        expect(result).toBeTruthy();
        done();
    };
    runCodeThatTakesACallback(myCallback);
});
```
In this test, `runCodeThatTakesACallback` does some kind of code execution, then calls the callback with the result. The only way we can test the result of that code is to write our own callback in the tester that then calls `done` when it's done running.

Examples of where this is needed are jQuery event listeners (e.g. `$x.trigger('someEvent', input)`) or the messages that use the `monoBus` (most messaging that goes through the app cell, input widgets, etc.).


### Mocking and Spies

In most cases, you'll want to focus your unit tests on the code you've written. Unit tests shouldn't try to capture flows through every module or KBase service, but should exercise your code's response to input. You're not testing the Workspace service, but whether your viewer can handle workspace data properly.

To that end, many external pieces of code can and should be mocked.

Most of the time, mocks can be made by just setting variables inside functions, or overwriting other functions.

Imagine we have a module like this:
```Javascript
define([], () => {
    function MyModule(dependency) => {
        function someFunction() => {
            return dependency.run();
        }

        return {
            someFunction: someFunction
        };
    }

    return MyModule;
}
```

In this example, the MyModule module has a single function `someFunction` that just returns the result of its dependency. It's dead simple and not very interesting. But it means we can do some dependency injection pretty easily and have a mocked dependency. Remember, when unit testing `MyModule`, we want to isolate and test the code in `MyModule`.


```Javascript
define([
    'myModule'
], (MyModule) => {
    const mockOutput = 'foo';
    const mockDependency = {
        run: () => mockOutput
    };

    describe('test my module', () => {
        it('should test my module', () => {
            const myModule = new MyModule(mockDependency);
            expect(myModule.someFunction()).toEqual(mockOutput);
        });
    });
});
```

This is all super contrived and not realistic, but it illustrates two points.
1. If you structure your code around dependencies with expected behavior, it gets pretty easy to understand.
2. Those structures become easier to mock, control, and unit test.

Another way of doing something similar is with `spies`. These are a fairly common frontend unit test concept where the test framework helps with mocking. Assuming the same `MyModule` setup, in Jasmine they look like this:

```Javascript
define([
    'myModule',
    'dependency'
], (MyModule, Dependency) => {
    describe('test my module', () => {
        it('should test my module', () => {
            const dep = new Dependency();
            spyOn(dep, 'run');
            const myModule = new MyModule();
            myModule.someFunction();
            expect(dep.run).toHaveBeenCalled();
        });
    });
});
```

In this version, we use the actual dependency, but replace the dependency's `run` function with a `Spy`. In this particular case, we don't care what the dependency does, only that it gets executed when expected (we aren't testing the dependency, just our module, right?).

There's other things that spies can do on setup, such as count how many times it's run, call through to the actual code, or just return dummy results. They do all require that you have access to the actual instance being run, which, frankly, can be hard with how much of the KBase code is structured. So, again, the above is just a fairly contrived example.

Before some real examples, here's one more tool: AJAX mocking. Jasmine provides tools to capture and return desired values for any network call that gets initialized. Let's modify `MyModule` to give it a network call.

```Javascript
define([], () => {
    function MyModule(dependency) => {
        function fetchData(url) => {
            return fetch(url)
                .then(res => res.json());
        }

        return {
            someFunction: someFunction
        };
    }

    return MyModule;
}
```
This is a pretty standard use of fetch here - the `fetchData` function takes a URL and returns Promise that should resolve into JSON with your requested data (actual KBase examples will follow). This might have a few problems.
1. **The URL you want to fetch data from in your tests needs to be hard-coded.** Not necessarily a problem, as long as the URL is stable.
2. **The data might be behind an authentication wall, so you need to make sure your tests are authenticated.** Also not a problem, and a fairly common case.
3. **The URL or service might be down.** If that's the case, then the test, and the test suite, will fail.
4. **The URL or service might be bogged or slow.** Jasmine tests will timeout if an async call doesn't return in 5 seconds (by default), so that can be a problem.

In general it's good practice to avoid having unit tests make calls across the network. You're testing whether your code responds as expected, not whether the network and the services are right. Those are *integration tests*, which are equally important, but not what we're doing here. Isolating your code therefore means either marshalling a local version of your service and connecting it to your tests, or mocking the call. Using a mock will let you:
1. Test that you send the network call you intend to send.
2. Test that you process the data you expect to get back as expected.

Jasmine lets you do these with the `jasmine-ajax` library. It needs to be installed and uninstalled, ideally before each spec, but certainly before changing around what calls you want to mock. Once that's done, you can use the `jasmine.Ajax.stubRequest` command. In general, it looks like this:

```Javascript
jasmine.Ajax.stubRequest(url, bodyMatcher)
    .andReturn(response);
```
`bodyMatcher` is optional. If you're doing a POST request and want the mock to handle only some specific data POSTed, you can put it there. That'll match either a complete body string, or you can pass a regex. This becomes useful when testing KBase service calls.

The `response` returned is the full HTTP response document, not just the data. Most KBase clients will expect something fully fleshed out. That would look like this:

```Javascript
jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws', /get_objects2/)
    .andReturn({
        status: 200,
        statusText: 'HTTP 1.1 OK',
        responseText: JSON.stringify({
            version: '1.1',
            id: '12345',
            result: [{
                data: [{
                    data: {} // expected workspace data,
                    info: [] // object info
                    ... etc
                }]
            }]
        })
    });
```
This will stub a request to the CI workspace endpoint (should actually be from the configuration, don't use a hardcoded URL!), which matches the term "get_objects2" in the body somewhere. The body will be a stringified JSON that looks like:
```json
{
    "version": "1.1",
    "id": "12345",
    "method": "Workspace.get_objects2",
    "params": [ ... get_objects2 params ...]
}
```
This isn't perfect, but since we're looking for that particular function to mock, it's effective enough. But you can get as specific or clever as you need to with a regex.

In practice, this would look like:
```Javascript
define([
    'kb_service/client/workspace',
    'narrativeConfig'
], (Workspace, Config) => {
    describe('run some tests', () => {
        beforeEach(() => {
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('does stuff against the workspace service', () => {
            const expectedData = {
                data: [{
                    data: {foo: 'bar'}
                }]
            };
            jasmine.Ajax.stubRequest(Config.url('workspace'), /get_objects2/)
                .andReturn({
                    status: 200,
                    statusText: 'HTTP 1.1 OK',
                    responseText: JSON.stringify({
                        version: '1.1',
                        id: '12345',
                        result: [expectedData]
                    })
                });
            const ws = new Workspace(Config.url('workspace'), {token: 'someToken'});
            return ws.get_objects2({objects: [{ref: '1/2/3'}]})
                .then((data) => {
                    expect(data).toEqual(expectedData)
                });
        });
    });
});
```
This test is, again, contrived. It just tests that we get back what we expect to see. But it illustrates how to use `jasmine.Ajax` to return an async, mocked network call. Make sure to uninstall `jasmine.Ajax` before you set up a separate mock, and that you only have one call to `jasmine.Ajax.install()` at a time.

Also, this might look like a lot of boilerplate that could be copied and pasted. It is. Fortunately, there's a `narrativeMocks` library available for use!

## Testing modules that use the factory pattern
There are a number of modules in the Narrative codebase, particularly in the app cell portion, that follow a the factory pattern. These modules generally only export a single `make` function which creates the object. The object, then, often only supports a few functions to have it "start" doing its work, and "stop" and shut itself down. It can be challenging to exercise these in a unit test framework while not relying in implementation details to write tests.

Most of these kinds of modules look something like this:
```Javascript
// GenericKBaseModule.js
define([], () => {
    function factory(args) {
        const config = args;

        function render(node) {
            node.innerHTML = 'some widget';
        }

        function start(arg) {
            return Promise.try(() => {
                return render(arg.node);
            });
        }

        function stop() {
            return Promise.try(() => {
                // do things to shut down,
                // remove events, clear DOM, call stop() on
                // sub-widgets, etc.
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (args) {
            return factory(args);
        },
    };
});
```

The above `GenericKBaseModule` would be normally invoked with the following:
```Javascript
define(['GenericKBaseModule'], (GenericModule) => {
    const myWidget = GenericModule.make();
    myWidget.start()
        .then(() => {
            // do other things after this officially starts
        });
});
```

Testing this can be tricky, as only a `start` and `stop` function are exported, and no other state seems available. Most widgets that follow this pattern also depend on one or more other elements, like a DOM node, that can be mocked or otherwise examined. The simple example above can be tested with:

```Javascript
define(['GenericKBaseModule'], (GenericModule) => {
    describe('Test the Generic Module', () => {
        it('should make a new module', () => {
            const myModule = GenericModule.make();
            ['start', 'stop'].forEach((fn) => {
                expect(myModule[fn]).toEqual(Jasmine.any(Function));
            });
        });

        it('should start and modify its DOM', async () => {
            const myModule = GenericModule.make();
            const node = document.createElement('div');
            document.body.appendChild(node);
            await myModule.start({node});
            expect(node.innerHTML).toContain('some widget');
        });
    });
});
```

Here, we create and start the module, and see if the node contains expected elements from the module's creation. We also test `make` to ensure that it creates an object that has expected functions - the `Jasmine.any(Function)` is a Jasmine idiom that basically says "return true if this is a function" without any judgment about what it does (see detail [here](https://jasmine.github.io/api/3.6/jasmine.html) under `any` - `Function` and `Object` are both helpful uses).

## Narrative Mocks Library
This library contains some accessory functions for mocking various things. It'll grow over time - if there's something you would find useful, feel free to add and make a PR! If it's helpful for you, it's almost definitely helpful to someone else. You can find it at `test/unit/mocks.js`. It's pretty decently commented, but the list of functions and usage are available in the [narrative mocks](./unit-test-mock-library.md) doc.

### Loading and using the library
This is included in the test harness's requirejs config. Just load with `narrativeMocks`, like this:
```Javascript
define(['narrativeMocks'], (Mocks) => {
    Mocks.setAuthToken('fake_token');
});
```
and go on from there.

See [unit-test-mock-library.md](./unit-test-mock-library.md) for all the detail you can handle.

## KBase Narrative Unit Test Best Practices.
This final section includes a list of some best practices that'll help write some useful unit tests and keep them working stably.

**1. Focus on your code**

Unit tests should be isolated to your own code that's running. If you're making 20 network calls and exercising several different data objects, you should consider how to mock them.

**2. Test in units**

Cramming a hundred different cases in for different tasks is good for unit tests. You should try to break your code in various interesting ways. But don't put all of your module's code into a single test spec.
```Javascript
it('test all the things', () => {
    const myModule = new MyModule();
    expect(myModule.func()).toBeTruthy();
    expect(myModule.anotherFunc()).toBeTruthy();
    expect(myModule.yetAnotherFunc()).toBeTruthy();
});
```
Is less useful than
```Javascript
it('test one thing', () => {
    const myModule = new MyModule();
    expect(myModule.func()).toBeTruthy();
});

it('test another thing', () => {
    const myModule = new MyModule();
    expect(myModule.anotherFunc()).toBeTruthy();
});
```

Also, building up sets of inputs to examine is helpful. You can loop over them in the `describe` function and build specs for each case. This is much preferred over a series of copy-pasted specs that only differ in their input.
```Javascript
const passingCases = ['input1', 'input2', 'input3'];
passingCases.forEach((input) => {
    it(`should pass for ${input}`, () => {
        const myModule = new MyModule();
        expect(myModule.someFunc(input)).toBeTruthy();
    });
});
```

**3. Test async by returning Promises or async/await**

It's best to use the `done` idiom that Jasmine provides only as a last resort. Using `async/await` or just returning a Promise allows Jasmine/Karma to consume the test properly. Forcing the harness to wait on the `done` function to execute is, even according to the Jasmine docs, somewhat brittle and flaky. That said, there are plenty of cases where it can't be avoided, especially when testing code that uses a message bus, or fires jQuery events, or other things that work asynchronously, but don't return Promises. If you can't refactor your code to cough up a promise, then you're kinda stuck with `done`.

**4. Try to be focused if stuck with using `done`**

If you have a case that necessitates using `done` to finish an async test, be very clear on what you're testing. Here's a slightly modified example from the BootstrapSearch module:
```Javascript
it('Should fire an input function when triggered by input', (done) => {
    const bsSearch = new BootstrapSearch($targetElem, {
        inputFunction: (e) => {
            expect(e).toEqual(Jasmine.any(Object));
            done();
        }
    });
    bsSearch.val('stuff');
});
```
This creates a new BootstrapSearch widget (`$targetElem` is set elsewhere) where its input function just returns done. This gets called by changing the input value to that search widget. We know the test passes if that gets invoked, so nothing else is needed. Then we trigger it by programmatically setting the value. That's it. No other code runs, no async searching calls, nothing else. Just validate that the given input function gets executed with some input. A better test would examine that the input is correct with more detail (in this case, it's the input event triggered from the element).

Because of the async setup of this (there's no guarantee that `inputFunction` will get called immediately, that's up to the implementation), a simple spy won't work - how long should we wait to test whether it was invoked? It doesn't deal with Promises at all, so there's no thennable to handle or return. The best way to test this is with `done`.

**5. Avoid using `setTimeout` if you can**

It's an easy way to think of things - if you don't have access to a Promise, and code doesn't run in a way that you can link `done` to an event that gets fired, it would be straight forward to just run your code, then fire a timeout that runs `done` after some arbitrary time.

The problem here is finding how long your timeout should be, and balancing that against the timeouts that Jasmine/Karma uses. These can then leave your module and other assorted variables in browser memory and scope a lot longer than other tests might expect! The timeout function can continue to linger after an `afterEach` function gets called, then when the timeout's up and your function gets run, some expected elements or variables might have been deleted. Worse, the test runner can move on at that point, and you'll see an error that looks like `"an error was thrown in afterAll!"`.

It's best practice to try to refactor your code so it can be run as expected, and tested as such.

That said, it's possible that you can't do so. Just try other things first.

An option if you go this path is to add an additional test timeout to the spec - this would be in the form of a third variable to the `it` function, so that would look like:
```Javascript
it('runs a test', () => {
    // test code here
}, 50000);
```
To give it an extra long 50,000 ms timeout.

But, again, think of this as a last resort.

**6. Don't be shy with mocking!**
There are a lot of moving pieces in the Narrative. Most of these were written in a long ago time without thought to testability and isolation. Quite a few modules, including Jupyter and Runtime, make use of the global space. The nature of Jasmine tests can keep those items in scope at the end of running a set of test specs in a single module, and can bleed into other tests.

If you explore the test codebase, you'll see a few common mock items that are reusable.
1. Mocking the Jupyter, Notebook, and Narrative objects.
2. Mock auth tokens.
3. Mock KBase service calls.

Many of these are also supplied in the [Unit Test Mock Library](./unit-test-mock-library.md), so be sure and give that a glance for helpful tools.

Generally, for unit tests, KBase service and other AJAX calls should be mostly mocked, unless there's a very good reason not to.
