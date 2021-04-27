define('testUtil', ['bluebird', 'json!/test/testConfig.json'], (Promise, TestConfig) => {
    'use strict';

    let token = null,
        userId = null;

    function make() {
        return initialize();
    }

    function getAuthToken() {
        return token;
    }

    function getUserId() {
        return userId;
    }

    /**
     * Runs the Jasmine pending() function if there's no Auth token available. This skips the
     * current test.
     */
    function pendingIfNoToken() {
        if (!token) {
            pending();
        }
    }

    function initialize() {
        if (TestConfig.token === undefined) {
            throw new Error(
                'Missing an auth token. Please enter one (or null to skip those tests) in test/unit/testConfig.json'
            );
        }
        if (TestConfig.token === null) {
            return new Promise.resolve(null);
        }
        userId = TestConfig.token.user;
        const tokenFile = TestConfig.token.file;
        return new Promise((resolve) => {
            require(['text!/' + tokenFile], (loadedToken) => {
                token = loadedToken.trim();
                console.warn('Loaded token file ' + tokenFile);
                resolve(token);
            }, () => {
                console.warn(
                    'Unable to load token file ' + tokenFile + '. Continuing without a token'
                );
                resolve(null);
            });
        });
    }

    function wait(timeMs) {
        return Promise.delay(timeMs);
    }

    /**
     * Wait for something to happen in the DOM underneath `documentElement`
     * @param {Object} args with keys
     *      {object}   config           configuration for the MutationObserver
     *      {string}   documentElement  DOM element to watch
     *      {function} domStateFunction function that returns true when the watched event happens
     *      {function} executeFirst     a function to execute after setting up the observer
     * @param {string} selector to identify the element being watched for
     * @returns {Promise} that resolves to produce the element
     */

    function waitFor(args) {
        const { documentElement, domStateFunction, executeFirst } = args;
        const config = args.config || { attributes: true, childList: true, subtree: true };

        if (!documentElement || !domStateFunction) {
            throw new Error('Please provide documentElement and domStateFunction to run waitFor');
        }

        return new Promise((resolve) => {
            if (domStateFunction()) {
                resolve();
            }

            const observer = new MutationObserver((mutations) => {
                if (domStateFunction(mutations)) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(documentElement, config);
            if (executeFirst) {
                executeFirst();
            }
        });
    }

    /**
     * Wait for an element to appear in the DOM underneath `documentElement`
     * @param {DOM element} documentElement to watch for the appearance of the element
     * @param {string} selector to identify the element being watched for
     * @param {function} doThisFirst (optional) function to execute before returning the Promise
     * @returns {Promise} that resolves when the element is seen
     */
    function waitForElement(documentElement, selector, doThisFirst) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            }

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(documentElement, { childList: true });
            if (doThisFirst) {
                doThisFirst();
            }
        });
    }

    /**
     * Wait for a certain DOM state
     * @param {DOM element} documentElement to watch for changes
     * @param {function} elementStateFunction function returning true when the state occurs
     * @param {function} doThisFirst (optional) function to execute before returning the Promise
     * @returns {Promise} that resolves when the DOM state is seen
     */
    function waitForElementState(documentElement, elementStateFunction, doThisFirst) {
        return new Promise((resolve) => {
            if (elementStateFunction()) {
                resolve();
            }
            const observer = new MutationObserver((mutations) => {
                if (elementStateFunction(mutations)) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
            if (doThisFirst) {
                doThisFirst();
            }
        });
    }

    /**
     * Wait for an element to change
     * @param {DOM element} documentElement to watch for changes
     * @param {function} doThisFirst (optional) function to execute before returning the Promise
     * @returns {Promise} that resolves when the element changes
     */
    function waitForElementChange(documentElement, doThisFirst) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                observer.disconnect();
                resolve();
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
            if (doThisFirst) {
                doThisFirst();
            }
        });
    }

    return {
        make,
        getAuthToken,
        pendingIfNoToken,
        getUserId,
        wait,
        waitFor,
        waitForElement,
        waitForElementState,
        waitForElementChange,
    };
});
