define('testUtil', [
    'bluebird',
    'util/stagingFileCache',
    'common/jobCommMessages',
    'json!/test/testConfig.json',
], (Promise, StagingFileCache, jcm, TestConfig) => {
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

    function JSONcopy(...args) {
        return JSON.parse(JSON.stringify(...args));
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
            const element = documentElement.querySelector(selector);
            if (element) {
                resolve(element);
            }

            const observer = new MutationObserver(() => {
                const el = documentElement.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(documentElement, { childList: true, subtree: true });
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

    /**
     * Clears the global Runtime element and other KBase-used caches.
     */
    function clearRuntime() {
        if (window.kbaseRuntime) {
            if (window.kbaseRuntime.clock) {
                window.kbaseRuntime.clock.stop();
            }
            window.kbaseRuntime = null;
        }
        window.__kbase_semaphores__ = {};
        StagingFileCache.clearCache();
    }

    /**
     * send a jcm.MESSAGE_TYPE.INFO message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} bus
     *      {object} jobInfo
     */
    function send_INFO(ctx) {
        const { bus, jobInfo } = ctx;
        const jobId = jobInfo.job_id;
        sendBusMessage({
            bus,
            message: { ...jobInfo, [jcm.PARAM.JOB_ID]: jobId },
            channelType: jcm.CHANNEL.JOB,
            channelId: jobId,
            type: jcm.MESSAGE_TYPE.INFO,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.LOGS message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} bus
     *      {object} message - partial log message; missing keys will be filled in
     */
    function send_LOGS(ctx) {
        const { bus, message } = ctx;
        if (message.lines) {
            message.first = 0;
            message.max_lines = message.lines.length;
        }
        sendBusMessage({
            bus,
            message,
            channelType: jcm.CHANNEL.JOB,
            channelId: message[jcm.PARAM.JOB_ID],
            type: jcm.MESSAGE_TYPE.LOGS,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.RETRY message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} retryParent    - the parent of the retried job
     *      {object} retry          - the new job
     *      {object} bus            - the bus to send the message on
     */
    function send_RETRY(ctx) {
        const { bus, retryParent, retry } = ctx;
        // send the retry response and the update for the batch parent
        sendBusMessage({
            bus,
            message: {
                [jcm.PARAM.JOB_ID]: retryParent.job_id,
                job: {
                    [jcm.PARAM.JOB_ID]: retryParent.job_id,
                    jobState: retryParent,
                },
                retry_id: retry.job_id,
                retry: {
                    [jcm.PARAM.JOB_ID]: retry.job_id,
                    jobState: retry,
                },
            },
            channelType: jcm.CHANNEL.JOB,
            channelId: retryParent.job_id,
            type: jcm.MESSAGE_TYPE.RETRY,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.ERROR message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} jobId          - the job in question
     *      {object} error          - error object from the backend
     *      {object} bus            - the bus to send the message on
     */
    function send_ERROR(ctx) {
        const { bus, jobId, error } = ctx;
        sendBusMessage({
            bus,
            message: {
                [jcm.PARAM.JOB_ID]: jobId,
                error,
                request: error.source,
            },
            channelType: jcm.CHANNEL.JOB,
            channelId: jobId,
            type: jcm.MESSAGE_TYPE.ERROR,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.RUN_STATUS message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} runStatusArgs - object with keys for a valid run_status message
     *      {object} bus
     */
    function send_RUN_STATUS(ctx) {
        const { bus, runStatusArgs } = ctx;
        if (!runStatusArgs.cell_id) {
            throw new Error('No cell_id supplied for RUN_STATUS message');
        }
        sendBusMessage({
            bus,
            message: { event_at: 1234567890, ...runStatusArgs },
            channelType: [jcm.CHANNEL.CELL],
            channelId: runStatusArgs.cell_id,
            type: jcm.MESSAGE_TYPE.RUN_STATUS,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.STATUS message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} bus      - message bus
     *      {object} jobState - the jobState object to be sent
     */
    function send_STATUS(ctx) {
        const { bus, jobState } = ctx;
        const jobId = jobState.job_id;
        sendBusMessage({
            bus,
            message: {
                [jcm.PARAM.JOB_ID]: jobId,
                jobState,
            },
            channelType: jcm.CHANNEL.JOB,
            channelId: jobId,
            type: jcm.MESSAGE_TYPE.STATUS,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.<type> message over the bus
     *
     * @param {object} args with key value pairs:
     * @param {object} bus
     * @param {object} message
     * @param {string} channelType    - jcm.CHANNEL.<type>
     * @param {string} channelId      - ID for the channel
     * @param {string} type           - jcm.MESSAGE_TYPE.<type>
     */
    function sendBusMessage(args) {
        const keys = ['bus', 'message', 'channelType', 'channelId', 'type'].filter((key) => {
            return !args[key];
        });
        if (keys.length) {
            throw new Error('Missing required keys for sendBusMessage: ' + keys.join(', '));
        }

        const { bus, message, channelType, channelId, type } = args;

        bus.send(message, { channel: { [channelType]: channelId }, key: { type } });

        // bus.send({ [channelId]: message }, { channel: { [channelType]: channelId }, key: { type } });
    }

    return {
        make,
        getAuthToken,
        pendingIfNoToken,
        getUserId,
        JSONcopy,
        wait,
        waitFor,
        waitForElement,
        waitForElementState,
        waitForElementChange,
        send_ERROR,
        send_INFO,
        send_LOGS,
        send_RETRY,
        send_RUN_STATUS,
        send_STATUS,
        sendBusMessage,
        clearRuntime,
    };
});
