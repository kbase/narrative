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
     * Wait for an element to appear in the DOM underneath `documentElement`
     * @param {DOM element} documentElement to watch for the appearance of the element
     * @param {string} selector to identify the element being watched for
     * @returns {Promise} that resolves to produce the element
     */
    function waitForElement(documentElement, selector) {
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
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
        });
    }

    /**
     * Wait for a certain DOM state
     * @param {DOM element} documentElement to watch for changes
     * @param {function} elementStateFunction function returning true when the state occurs
     * @returns {Promise} that resolves when the DOM state is seen
     */
    function waitForElementState(documentElement, elementStateFunction) {
        return new Promise((resolve) => {
            if (elementStateFunction()) {
                resolve();
            }
            const observer = new MutationObserver(() => {
                if (elementStateFunction()) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
        });
    }

    /**
     * Wait for an element to change
     * @param {DOM element} documentElement to watch for changes
     * @returns {Promise} that resolves when the element changes
     */
    function waitForElementChange(documentElement) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                observer.disconnect();
                resolve();
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
        });
    }

    return {
        make,
        getAuthToken,
        pendingIfNoToken,
        getUserId,
        wait,
        waitForElement,
        waitForElementState,
        waitForElementChange,
    };
});
